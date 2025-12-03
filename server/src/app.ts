import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import morgan, { compile } from 'morgan';
import * as path from 'path';
import { initializePuppeteerCluster } from './application/screenshot';
import { configureAuth, configureMockAuth, ensureAuthenticated } from './auth';
import { initializeDatabase, migrateUp } from './database';
import { HttpResponseError } from './error';
import { initSecrets, secrets } from './keyVaultSecrets';
import logger from './logger';
import rootRouter from './routes';

async function start() {
  const app = express();
  await initSecrets();

  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store, max-age=0');
    next();
  });

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return helmet({
        contentSecurityPolicy: {
          useDefaults: false,
          directives: {
            'default-src': "'none'",
            'frame-ancestors': "'none'",
          },
        },
      })(req, res, next);
    } else {
      return helmet({
        contentSecurityPolicy: {
          directives: {
            'connect-src': [
              "'self'",
              'https://gist.githubusercontent.com/zit0un/3ac0575eb0f3aabdc645c3faad47ab4a/raw/8db5e3ab89418def3a15474979e494c92b69592e/GeoJSON-OAS3.yaml',
              'https://cdn.jsdelivr.net',
            ], // References in openapi.yaml
            'worker-src': 'blob:', // For openAPI docs to work
            'frame-src': secrets.allowedFrameSources ?? "'self'",
          },
        },
      })(req, res, next);
    }
  });

  const port = Number(process.env.PORT ?? 3000);
  // Database initialization and connection test
  try {
    await initializeDatabase();
  } catch (error) {
    logger.error('Error initializing database:', error);
    process.exit(1);
  }

  // Execute migrations
  await migrateUp();

  // Start up Puppeteer cluster for taking screenshots
  await initializePuppeteerCluster();

  // Add compression
  app.use(compression());

  // For body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (process.env.AUTH_ENABLED === 'true') {
    configureAuth(app);
    logger.info('Authentication configured');
  } else {
    await configureMockAuth(app);
    logger.info('Authentication not enabled, using a mock user');
  }

  // Use logging middleware for HTTP requests
  app.use(
    morgan(
      // Use morgan's 'dev' format function as base here and modify it to include user ID
      function developmentFormatLine(tokens, req, res) {
        function headersSent(res) {
          return typeof res.headersSent !== 'boolean'
            ? Boolean(res._header)
            : res.headersSent;
        }

        // get the status code if response written
        const status = headersSent(res) ? res.statusCode : undefined;

        // get status color
        const color =
          status >= 500
            ? 31 // red
            : status >= 400
              ? 33 // yellow
              : status >= 300
                ? 36 // cyan
                : status >= 200
                  ? 32 // green
                  : 0; // no color

        const formatLineFunctions = [];
        // get colored function
        let fn = formatLineFunctions[color];
        const userId = req.user?.id ?? '-';

        if (!fn) {
          // compile and color userId in development as magenta (35m)
          fn = formatLineFunctions[color] = compile(
            `\x1b[0m:method :url \x1b[${color}m:status\x1b[35m user: ${userId}\x1b[0m :response-time ms - :res[content-length]\x1b[0m`,
          );
        }

        return fn(tokens, req, res);
      },
      {
        stream: {
          write: (message: string) => {
            // Skip health check logging
            if (message.includes('/api/health')) {
              return;
            }
            // Message ends with an unnecessary newline - remove it from logs.
            logger.info(message.split('\n')[0]);
          },
        },
      },
    ),
  );

  // Serve static frontend files in production
  app.use(
    '/admin',
    ensureAuthenticated({
      redirectToLogin: true,
    }),
    express.static('static/admin'),
  );
  app.use('/', express.static('static'));

  // Root router for the API
  app.use('/api', rootRouter);

  // Serve admin frontend from remaining admin URLs
  app.get(
    '/admin/*',
    ensureAuthenticated({
      redirectToLogin: true,
    }),
    (req, res) => {
      res.removeHeader('Clear-Site-Data');
      res.sendFile(path.join(__dirname, '../static/admin/index.html'));
    },
  );

  app.get('/logout-success', (req, res) => {
    res.set('Clear-Site-Data', '"cache", "cookies", "storage"');
    res.redirect('/');
  });

  // Serve frontend files from remaining URLs
  app.get('/*', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../static/index.html'));
  });

  // Default error handler
  app.use((error: HttpResponseError, req, res, next) => {
    logger.error(`Request error: ${error.message}`);
    console.error(error);
    res.status(error.status || 500);
    res.json({
      message: error.message,
      ...(error.info && { info: error.info }),
    });
  });

  app.listen(port, () => {
    logger.info(`Server listening to port ${port}`);
  });
}

start();
