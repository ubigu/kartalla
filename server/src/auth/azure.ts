import { Express } from 'express';
import passport from 'passport';
import { OIDCStrategy } from 'passport-azure-ad';
import { decrypt } from '../crypto';
import {
  dbOrganizationIdToOrganization,
  getUserGroupsForUser,
  upsertUser,
} from '../user';

/**
 * Configures authentication for given Express application.
 * Initializes express-session and passport middleware to use Azure AD for
 * authentication & authorization to all routes.
 * @param app Express application
 */
export function configureAzureAuth(app: Express) {
  // Use OpenID Connect strategy for Azure AD authentication
  passport.use(
    new OIDCStrategy(
      {
        identityMetadata: process.env.AUTH_IDENTITY_METADATA,
        responseMode: 'form_post',
        responseType: 'code id_token',
        clientID: process.env.AUTH_CLIENT_ID,
        clientSecret: process.env.AUTH_CLIENT_SECRET,
        redirectUrl: process.env.AUTH_REDIRECT_URL,
        allowHttpForRedirectUrl:
          process.env.AUTH_REDIRECT_URL_INSECURE === 'true',
        passReqToCallback: false,
      },
      (profile, done) => {
        if (!profile.oid) {
          return done(new Error('No oid found'), null);
        } else if (!profile._json.groups || profile._json.groups.length === 0) {
          return done(new Error('No groups found'), null);
        } else if (!profile._json.roles || profile._json.roles.length === 0) {
          return done(new Error('No roles found'), null);
        }

        process.nextTick(async function () {
          const user = await upsertUser({
            id: profile.oid,
            fullName: profile.displayName,
            email: profile._json.email,
            organizations: JSON.parse(profile._json.groups).map((o) =>
              dbOrganizationIdToOrganization(o),
            ), // Parse groups to trim extra characters
            roles: JSON.parse(profile._json.roles), // Parse roles to trim extra characters
          });
          const userGroups = await getUserGroupsForUser(user.id);
          return done(null, {
            ...user,
            groups: [...(user.groups ?? []), ...userGroups.map((g) => g.id)], // Merges possible pending user groups and actual user groups
          });
        });
      },
    ),
  );

  // Login route
  app.get('/login/v1', (req, res, next) => {
    return passport.authenticate('azuread-openidconnect', {
      successRedirect: '/',
      failureRedirect: '/',
      customState: req.query.redirect,
    } as any)(req, res, next);
  });

  // Callback route for authentication
  app.post(
    '/.auth/login/aad/callback',
    passport.authenticate('azuread-openidconnect', {
      failureRedirect: '/login?error=auth_failed',
    }),
    (req, res) => {
      // Redirect to original request URL
      const redirectUrl = decrypt(req.body.state) ?? '/admin';
      res.redirect(redirectUrl);
    },
  );
}
