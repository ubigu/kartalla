import { User as ApplicationUser, Organization } from '@interfaces/user';
import { getDb, encryptionKey } from './database';
import { BadRequestError, InternalServerError } from './error';
import { sendMail } from './email/email';
import logger from './logger';
import useTranslations from './translations/useTranslations';

/**
 * Define user type inside Express types to make it globally accessible via req.user
 */
declare global {
  namespace Express {
    interface User extends ApplicationUser {}
  }
}

interface DbUser {
  id: string;
  full_name: string;
  email: string;
  organizations: string[];
  roles: string[];
  isPending?: boolean;
}

export function dbOrganizationIdToOrganization(
  organizationId: string,
): Organization {
  const userGroupNameMapping = JSON.parse(process.env.USER_GROUP_NAME_MAPPING);
  return {
    id: organizationId,
    name: userGroupNameMapping[organizationId] ?? organizationId,
  };
}

export function getOrganizationIdWithName(organizationName: string) {
  const userGroupNameMapping = JSON.parse(process.env.USER_GROUP_NAME_MAPPING);
  return Object.keys(userGroupNameMapping).find(
    (key) => userGroupNameMapping[key] === organizationName,
  );
}

/**
 * Converts a DB user into user
 * @param dbUser DB user
 * @returns User
 */
function dbUserToUser(dbUser: DbUser): Express.User {
  return !dbUser
    ? null
    : {
        id: dbUser.id,
        fullName: dbUser.full_name,
        email: dbUser.email,
        organizations: dbUser.organizations.map((id: string) =>
          dbOrganizationIdToOrganization(id),
        ),
        roles: dbUser.roles,
        ...(dbUser.isPending && { isPending: dbUser.isPending }),
      };
}

/** Check if user has admin rights */
export function isAdmin(user?: Express.User) {
  return user?.roles.includes('organization_admin') ?? false;
}

/** Check if user has super user rights */
export function isSuperUser(user?: Express.User) {
  return user?.roles.includes('super_user') ?? false;
}

/** Add pending user request */
export async function addPendingUserRequest(
  user: Omit<ApplicationUser, 'id' | 'organizations'> & {
    organizations: string[];
  },
) {
  const tr = useTranslations('fi');
  const existingUser = await getDb().oneOrNone<DbUser>(
    `
    WITH users AS (
      SELECT id FROM application.user WHERE pgp_sym_decrypt(email, $(encryptionKey)) = $(email)
        UNION
      SELECT id::text FROM application.pending_user_requests WHERE pgp_sym_decrypt(email, $(encryptionKey)) = $(email)
    ) SELECT id FROM users`,
    { email: user.email, encryptionKey },
  );

  if (existingUser) {
    throw new BadRequestError(
      'User with this email already exists',
      'user_exists',
    );
  }

  const userId = getDb().one<DbUser>(
    `INSERT INTO application.pending_user_requests (full_name, email, organizations, roles) 
     VALUES (
       pgp_sym_encrypt($(fullName), $(encryptionKey)), 
       pgp_sym_encrypt($(email), $(encryptionKey)), 
       $(organizations), 
       $(roles)
     ) 
     RETURNING id 
     `,
    {
      ...user,
      encryptionKey,
    },
  );

  if (userId) {
    try {
      await sendMail({
        message: {
          to: process.env.USER_GENERATION_REQUEST_EMAIL,
        },
        template: 'new-user',
        locals: {
          name: user.fullName,
          email: user.email,
          role: user.roles.join(', '),
          organizations: user.organizations.join(', '),
          subject: tr.newUserRequest,
          noReply: tr.noReply,
        },
      });
    } catch (error) {
      logger.error(`Error sending new user request mail: ${error}`);
      throw new InternalServerError('Failed while sending new user request');
    }
  }
  return userId;
}

/**
 * Updates (if exists) or inserts (if new) user into the database.
 * @param user User
 * @returns User
 */
export async function upsertUser(user: Express.User) {
  const newUser = await getDb().tx(async (t) => {
    await t.none(
      `DELETE FROM application.pending_user_requests WHERE pgp_sym_decrypt(email, $(encryptionKey)) = $(email)`,
      { email: user.email, encryptionKey },
    );
    return t.one<DbUser>(
      `
      INSERT INTO "user" (id, full_name, email, organizations, roles)
      VALUES (
        $(id),
        pgp_sym_encrypt($(fullName), $(encryptionKey)),
        pgp_sym_encrypt($(email), $(encryptionKey)),
        $(organizations),
        $(roles)
      )
      ON CONFLICT (id) DO UPDATE
        SET
          full_name = pgp_sym_encrypt($(fullName), $(encryptionKey)),
          email = pgp_sym_encrypt($(email), $(encryptionKey)),
          organizations = $(organizations),
          roles = $(roles)
      RETURNING
        id,
        pgp_sym_decrypt(full_name, $(encryptionKey)),
        pgp_sym_decrypt(email, $(encryptionKey)),
        organizations,
        roles
    `,
      {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        organizations: user.organizations.map((org) => org.id),
        roles: user.roles,
        encryptionKey,
      },
    );
  });

  return dbUserToUser(newUser);
}

/**
 * Get user with given ID
 * @param id ID
 */
export async function getUser(id: string) {
  const user = await getDb().oneOrNone<DbUser>(
    `SELECT
      id,
      pgp_sym_decrypt(full_name, $2) as full_name,
      pgp_sym_decrypt(email, $2) as email,
      organizations,
      roles
    FROM "user" WHERE id = $1`,
    [id, encryptionKey],
  );
  return dbUserToUser(user);
}

/**
 * Gets all users from database
 * @param excludeIds User IDs to exclude
 * @returns Users
 */
export async function getUsers(
  userOrganizations: string[],
  includePending: boolean = false,
  excludeIds = [],
) {
  const dbUsers = await getDb().manyOrNone<DbUser>(
    `SELECT
      id,
      pgp_sym_decrypt(full_name, $3::text) as full_name,
      pgp_sym_decrypt(email, $3::text) as email,
      organizations,
      roles
    FROM "user"
    WHERE NOT (id = ANY ($2)) ${userOrganizations.length > 0 ? 'AND organizations && $1' : ''}
    ORDER BY organizations[1], pgp_sym_decrypt(full_name, $3::text), roles[1]`,
    [userOrganizations, excludeIds, encryptionKey],
  );
  if (includePending) {
    const pendingUsers = await getPendingUserRequests();
    return [...dbUsers, ...pendingUsers].map(dbUserToUser);
  }
  return dbUsers.map(dbUserToUser);
}

/**
 * Get pending user requests
 */

async function getPendingUserRequests() {
  return getDb().manyOrNone<DbUser>(
    `SELECT
      id,
      pgp_sym_decrypt(full_name, $1) as full_name,
      pgp_sym_decrypt(email, $1) as email,
      organizations,
      roles,
      true as "isPending"
    FROM application.pending_user_requests
    ORDER BY organizations[1], pgp_sym_decrypt(full_name, $1::text), roles[1]`,
    [encryptionKey],
  );
}
