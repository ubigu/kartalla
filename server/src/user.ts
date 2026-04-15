import { User as ApplicationUser, Organization } from '@interfaces/user';
import {
  getDb,
  encryptionKey,
  getColumnSet,
  getMultiInsertQuery,
} from './database';
import { BadRequestError, InternalServerError } from './error';
import { sendMail } from './email/email';
import logger from './logger';
import useTranslations, {
  isLanguageCode,
} from './translations/useTranslations';
import { UserGroup } from '@interfaces/userGroup';
import { secrets } from './keyVaultSecrets';

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
  groups?: string[];
  default_language?: string;
}

interface DBUserGroupMember {
  id?: string;
  user_id: string;
  group_id: string;
}

interface DBPendingUserGroupMember {
  id?: string;
  pending_user_id: string;
  group_id: string;
}

/**
 * Helper function for creating user group column set
 */
const userGroupMemberColumnSet = () =>
  getColumnSet<DBUserGroupMember>(
    'user_group_member',
    ['user_id', 'group_id'],
    'application',
  );

const pendingUserGroupMemberColumnSet = () =>
  getColumnSet<DBPendingUserGroupMember>(
    'pending_user_group_member',
    ['pending_user_id', 'group_id'],
    'application',
  );

function userGroupsToDBUserGroupMemberRows(
  userId: string,
  groupIds: string[],
): DBUserGroupMember[] {
  return groupIds.map((groupId) => ({
    user_id: userId,
    group_id: groupId,
  }));
}

function userGroupToDBPendingUserGroupMemberRows(
  pendingUserId: string,
  groupIds: string[],
): DBPendingUserGroupMember[] {
  return groupIds.map((groupId) => ({
    pending_user_id: pendingUserId,
    group_id: groupId,
  }));
}

export function dbOrganizationIdToOrganization(
  organizationId: string,
): Organization {
  const userGroupNameMapping = JSON.parse(
    secrets.userGroupNameMapping ?? process.env.USER_GROUP_NAME_MAPPING,
  );
  return {
    id: organizationId,
    name: userGroupNameMapping[organizationId] ?? organizationId,
  };
}

export function getOrganizationIdWithName(organizationName: string) {
  const userGroupNameMapping = JSON.parse(
    secrets.userGroupNameMapping ?? process.env.USER_GROUP_NAME_MAPPING,
  );
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
        ...(dbUser.groups && { groups: dbUser.groups }),
        ...(isLanguageCode(dbUser.default_language) && {
          defaultLanguage: dbUser.default_language,
        }),
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
    const pendingUserGroups = await t.manyOrNone<{ group_id: number }>(
      `SELECT group_id FROM application.pending_user_group_member pugm
      INNER JOIN application.pending_user_requests pur ON pugm.pending_user_id = pur.id
      WHERE pgp_sym_decrypt(pur.email, $(encryptionKey)) = $(email) `,
      { email: user.email, encryptionKey },
    );

    await t.none(
      `DELETE FROM application.pending_user_requests WHERE pgp_sym_decrypt(email, $(encryptionKey)) = $(email)`,
      { email: user.email, encryptionKey },
    );

    const newUser = await t.one<DbUser>(
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
        groups: pendingUserGroups.map((group) => group.group_id),
      },
    );

    if (pendingUserGroups.length > 0) {
      await t.none(
        getMultiInsertQuery(
          userGroupsToDBUserGroupMemberRows(
            newUser.id,
            pendingUserGroups.map((group) => String(group.group_id)),
          ),
          userGroupMemberColumnSet(),
        ),
      );
    }

    return newUser;
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
      usr.id,
      pgp_sym_decrypt(full_name, $2) as full_name,
      pgp_sym_decrypt(email, $2) as email,
      organizations,
      roles,
      default_language,
      COALESCE(array_agg(ugm.group_id) FILTER (WHERE ugm.group_id IS NOT NULL), '{}') as groups
    FROM application.user usr
    LEFT JOIN application.user_group_member ugm ON usr.id = ugm.user_id
    GROUP BY usr.id
    HAVING usr.id = $1`,
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
      usr.id,
      pgp_sym_decrypt(full_name, $3::text) as full_name,
      pgp_sym_decrypt(email, $3::text) as email,
      organizations,
      roles,
      COALESCE(array_agg(ugm.group_id) FILTER (WHERE ugm.group_id IS NOT NULL), '{}') as groups
    FROM application.user usr
    LEFT JOIN application.user_group_member ugm ON usr.id = ugm.user_id
    GROUP BY usr.id
    HAVING NOT (usr.id = ANY ($2)) ${userOrganizations.length > 0 ? 'AND organizations && $1' : ''}
    ORDER BY organizations[1], pgp_sym_decrypt(full_name, $3::text), roles[1], id`,
    [userOrganizations, excludeIds, encryptionKey],
  );
  if (includePending) {
    const pendingUsers = await getPendingUserRequests(userOrganizations);
    return [...dbUsers, ...pendingUsers].map(dbUserToUser);
  }

  return dbUsers.map(dbUserToUser);
}

/**
 * Get pending user requests
 */

async function getPendingUserRequests(userOrganizations: string[] = []) {
  return getDb().manyOrNone<DbUser>(
    `SELECT
      pur.id,
      pgp_sym_decrypt(full_name, $1) as full_name,
      pgp_sym_decrypt(email, $1) as email,
      organizations,
      roles,
      true as "isPending",
      COALESCE(array_agg(ugm.group_id) FILTER (WHERE ugm.group_id IS NOT NULL), '{}') as groups
    FROM application.pending_user_requests pur
    LEFT JOIN application.pending_user_group_member ugm ON pur.id = ugm.pending_user_id
    GROUP BY pur.id
    ${userOrganizations.length > 0 ? 'HAVING organizations && $2' : ''}
    ORDER BY organizations[1], pgp_sym_decrypt(full_name, $1::text), roles[1], id`,
    [encryptionKey, userOrganizations],
  );
}

export async function updateUserGroupMembership(
  userId: string,
  groupIds: string[],
) {
  return getDb().tx(async (t) => {
    await t.none(
      `DELETE FROM application.user_group_member WHERE user_id = $1`,
      [userId],
    );
    if (groupIds.length === 0) {
      return;
    }
    await t.none(
      getMultiInsertQuery(
        userGroupsToDBUserGroupMemberRows(userId, groupIds),
        userGroupMemberColumnSet(),
      ),
      {},
    );
  });
}

export async function updatePendingUserGroupMembership(
  pendingUserId: string,
  groupIds: string[],
) {
  return getDb().tx(async (t) => {
    await t.none(
      `DELETE FROM application.pending_user_group_member WHERE pending_user_id = $1`,
      [pendingUserId],
    );
    if (groupIds.length === 0) {
      return;
    }
    await t.none(
      getMultiInsertQuery(
        userGroupToDBPendingUserGroupMemberRows(pendingUserId, groupIds),
        pendingUserGroupMemberColumnSet(),
      ),
      {},
    );
  });
}

export async function updateUserDefaultLanguage(
  userId: string,
  language: string,
) {
  await getDb().none(
    `UPDATE application.user SET default_language = $1 WHERE id = $2`,
    [language, userId],
  );
}

export async function getUserGroupsForUser(userId: string) {
  return getDb().manyOrNone<UserGroup>(
    `
    SELECT ug.id, ug.name, ug.organization
    FROM application.user_group ug, application.user_group_member ugm
	  WHERE ugm.user_id = $1 AND ug.id = ugm.group_id;
    `,
    [userId],
  );
}
