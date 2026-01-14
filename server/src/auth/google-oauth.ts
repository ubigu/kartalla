import { decrypt } from '@src/crypto';
import { Express } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { upsertUser } from '../user';

// Extend the Express session type to contain custom data
declare module 'express-session' {
  interface SessionData {
    redirectUrl?: string;
  }
}

// Whitelist with email addresses
const emailWhiteList = (process.env.AUTH_EMAIL_WHITELIST ?? '')
  .toLocaleLowerCase()
  .split(/[\s,]+/g)
  .filter((email) => Boolean(email) && email.length > 0);

/**
 * Configures authentication for given Express application.
 * Initializes express-session and passport middleware to use Google OAuth for
 * authentication & authorization to all routes.
 * @param app Express application
 */
export function configureGoogleOAuth(app: Express) {
  // User serialization
  passport.serializeUser((user: Express.User & { id: string }, done) => {
    done(null, user.id);
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.AUTH_CLIENT_ID,
        clientSecret: process.env.AUTH_CLIENT_SECRET,
        callbackURL: process.env.AUTH_REDIRECT_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        // Return error if the user is not whitelisted
        if (!emailWhiteList.includes(profile._json.email.toLocaleLowerCase())) {
          return done(null, null);
        }
        // Insert/update user to database & assign it to the session
        const user = await upsertUser({
          id: profile.id,
          fullName: profile.displayName,
          email: profile._json.email,
          organizations: [],
          roles: [],
        });
        return done(null, user);
      },
    ),
  );

  // Login endpoint
  app.get(
    '/login',
    (req, _res, next) => {
      // Store redirect URL into session for redirecting after successful login
      req.session.redirectUrl = decrypt(String(req.query.redirect)) ?? '/admin';
      next();
    },
    passport.authenticate('google', { scope: ['profile', 'email'] }),
  );

  // OAuth callback endpoint
  app.get(
    '/auth/callback',
    passport.authenticate('google', {
      failureRedirect: '/admin',
      failureMessage: true,
    }),
    (req, res) => {
      // Get original request URL from session
      const redirectUrl = req.session.redirectUrl ?? '/admin';
      res.redirect(redirectUrl);
    },
  );
}
