import { getSurveyOrganization } from '@src/application/survey';
import logger from '@src/logger';
import { getUser, isSuperUser, upsertUser } from '@src/user';
import ConnectPgSimple from 'connect-pg-simple';
import { Express, NextFunction, Request, Response } from 'express';
import expressSession from 'express-session';
import passport from 'passport';
import { encrypt } from '../crypto';
import { getDb } from '../database';
import { configureAzureAuth } from './azure';
import { configureGoogleOAuth } from './google-oauth';

/**
 * Configures authentication for given Express application.
 * @param app Express application
 */
export function configureAuth(app: Express) {
  // User serialization
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  // User deserialization
  passport.deserializeUser(async (id, done) => {
    const user = await getUser(String(id));
    // If user doesn't exist, set user as null - will be redirected to /login
    done(null, user ?? null);
  });

  // Initialize Express session middleware
  app.use(
    expressSession({
      secret: process.env.SESSION_SECRET,
      cookie: {
        // 30 days
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
      resave: false,
      saveUninitialized: false,
      store: new (ConnectPgSimple(expressSession))({
        pgPromise: getDb(),
        schemaName: 'application',
      }),
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  // Logout route
  app.get('/logout', (req, res) => {
    res.clearCookie('connect.sid');
    req.logout((err) => {
      if (err) {
        return req.next(err);
      }
      req.session.destroy((err) => {
        res.redirect(process.env.AUTH_LOGOUT_URL);
      });
    });
  });

  logger.info(
    `Configuring authentication with method "${process.env.AUTH_METHOD}"...`,
  );

  // Configure auth method specific authentications
  switch (process.env.AUTH_METHOD) {
    case 'azure':
      configureAzureAuth(app);
      break;
    case 'google-oauth':
      configureGoogleOAuth(app);
      break;
    default:
      throw new Error(
        !process.env.AUTH_METHOD
          ? `Environment variable AUTH_METHOD required`
          : `Unsupported auth method "${process.env.AUTH_METHOD}"`,
      );
  }
}

/**
 * Injects mock user to request when actual auth is not enabled
 */
export function configureMockAuth(app: Express) {
  // Create a mock user & persist it in the database
  const mockUser: Express.User = {
    id: '12345-67890-abcde-fghij1',
    fullName: 'toinen Testaaja',
    email: 'toinen.testaaja@testi.com',
    organizations: ['test-group-id-1'],
    roles: ['organization_user', 'organization_admin', 'super_user'],
  };
  upsertUser(mockUser);

  // Inject the mock user to each request
  app.use((req, _res, next) => {
    req.user = mockUser;
    return next();
  });
}

/**
 * Middleware function to protect routes that require authentication
 * @param redirectToLogin Should the response redirect the user to login when not authenticated? If false, 401 is returned.
 * @returns Request middleware
 */
export function ensureAuthenticated(options?: { redirectToLogin?: boolean }) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (
      process.env['AUTH_ENABLED'] !== 'true' ||
      req.path === '/login' ||
      req.isAuthenticated()
    ) {
      return next();
    }

    const fail = () => {
      if (options?.redirectToLogin) {
        // Provide original request URL for redirection after authentication.
        // Encryption required to avoid "open redirector" security threat:
        // https://datatracker.ietf.org/doc/html/rfc6819#section-4.2.4
        res.redirect(`/login?redirect=${encrypt(req.originalUrl)}`);
      } else {
        res.status(401).send('Unauthorized');
      }
    };

    if (req.session) {
      res.clearCookie('connect.sid');
      req.logout((err) => {
        if (err) {
          return req.next(err);
        }
        req.session.destroy((err) => {
          fail();
        });
      });
    } else {
      fail();
    }
  };
}

export function ensureSuperUserAccess() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isSuperUser(req.user)) {
      return next();
    }
    res.status(403).send('Forbidden, super user access required');
  };
}

export function ensureSurveyGroupAccess(id: string = 'id') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (isSuperUser(req.user)) {
      return next();
    }
    const surveyOrganization = req.params[id]
      ? await getSurveyOrganization(Number(req.params[id]))
      : null;
    if (
      typeof surveyOrganization === 'string' &&
      !req.user.organizations.includes(surveyOrganization)
    ) {
      res.status(403).send('Forbidden');
    } else {
      return next();
    }
  };
}

export function ensureFileGroupAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Super user access to files for a survey with a different organization than the super users own organization
    if (isSuperUser(req.user) && req.headers['organization']) {
      res.locals.fileOrganizations = [req.headers['organization']];
      return next();
    }
    const surveyOrganizations = req.headers['organization']
      ? (req.headers['organization'] as string)
      : req.user.organizations;

    const fileOrganization = req.user.organizations.filter((organization) =>
      (surveyOrganizations as string[]).includes(organization),
    );

    if (fileOrganization.length === 0) {
      res.status(403).send('Forbidden');
    } else {
      res.locals.fileOrganizations = fileOrganization;
      return next();
    }
  };
}
