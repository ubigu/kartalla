import { decrypt } from '@src/crypto';
import logger from '@src/logger';
import { Express } from 'express';
import { discovery } from 'openid-client';
import { Strategy, VerifyFunction } from 'openid-client/passport';
import passport from 'passport';
import {
  dbOrganizationIdToOrganization,
  getUserGroupsForUser,
  upsertUser,
} from '../user';

/**
 * Configures authentication for given Express application.
 * Initializes express-session and passport middleware to use Azure AD (via
 * openid) for authentication & authorization to all routes.
 * @param app Express application
 */
export async function configureAzureAuth(app: Express) {
  try {
    const oidcDiscoveryOptions = {
      server: new URL(process.env.AUTH_IDENTITY_METADATA),
      clientId: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET,
      redirectUrl: process.env.AUTH_REDIRECT_URL,
    };

    const config = await discovery(
      oidcDiscoveryOptions.server,
      oidcDiscoveryOptions.clientId,
      oidcDiscoveryOptions.clientSecret,
    );

    const verify: VerifyFunction = async (tokenset, done) => {
      try {
        const claims = tokenset.claims();

        if (!claims.oid) {
          return done(new Error('No oid found'));
        }

        const groups = claims.groups as string[] | undefined;
        if (!groups || groups.length === 0) {
          return done(new Error('No groups found'));
        }

        const roles = claims.roles as string[] | undefined;
        if (!roles || roles.length === 0) {
          return done(new Error('No roles found'));
        }

        const user = await upsertUser({
          id: claims.oid as string,
          fullName: claims.name as string,
          email: (claims.email ?? claims.preferred_username) as string,
          organizations: groups.map((o) => dbOrganizationIdToOrganization(o)),
          roles,
        });
        const userGroups = await getUserGroupsForUser(user.id);

        return done(null, {
          ...user,
          groups: [...(user.groups ?? []), ...userGroups.map((g) => g.id)],
        });
      } catch (err) {
        return done(err as Error);
      }
    };

    passport.use(
      'openid',
      new Strategy(
        {
          config,
          scope: 'openid profile email',
          callbackURL: oidcDiscoveryOptions.redirectUrl,
        },
        verify,
      ),
    );

    // Login route
    app.get('/login', (req, res, next) => {
      req.session.redirectUrl = decrypt(req.query.redirect as string);
      req.session.save(() => {
        passport.authenticate('openid', {
          successRedirect: '/',
          failureRedirect: '/',
        })(req, res, next);
      });
    });

    // Callback route for authentication
    app.get(
      '/.auth/login/aad/callback',
      passport.authenticate('openid', {
        failureRedirect: '/',
        keepSessionInfo: true, // To keep the redirectUrl
      }),
      (req, res) => {
        const redirectUrl = req.session.redirectUrl ?? '/admin';
        res.redirect(redirectUrl);
      },
    );
  } catch (error) {
    logger.info(`Error configuring Azure auth: ${error.message}`);
  }
}
