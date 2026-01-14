import {
  addGeneralNotification,
  deleteGeneralNotification,
  GENERAL_NOTIFICATION_TIMEOUT_DAYS,
  getGeneralNotification,
  getGeneralNotifications,
  getRecentGeneralNotificationCount,
  updateGeneralNotification,
} from '@src/application/generalNotification';
import { ensureAuthenticated, ensureSuperUserAccess } from '@src/auth';
import logger from '@src/logger';
import { validateRequest } from '@src/utils';
import EventEmitter from 'events';
import { Response, Router } from 'express';
import asyncHandler from 'express-async-handler';
import { param } from 'express-validator';

const router = Router();
const eventEmitter = new EventEmitter({ captureRejections: true });
eventEmitter.on('error', (err) => {
  logger.error(`EventEmitter error: ${err}`);
  sseClients.forEach((client) => {
    client.write('Server error in the general notification stream');
    client.end();
  });
});
eventEmitter.on('deletedGeneralNotification', async () => {
  sseClients.forEach((client) => {
    client.write(
      `data: ${JSON.stringify({ deletedGeneralNotification: true })}\n\n`,
    );
    // Without flush compress waits the response to end
    client.flush();
  });
});
eventEmitter.on('newGeneralNotification', async () => {
  sseClients.forEach((client) => {
    client.write(
      `data: ${JSON.stringify({ newGeneralNotifications: true })}\n\n`,
    );
    // Without flush compress waits the response to end
    client.flush();
    setTimeout(
      () => {
        client.write(
          `data: ${JSON.stringify({ newGeneralNotifications: false })}\n\n`,
        );
        client.flush();
      },
      GENERAL_NOTIFICATION_TIMEOUT_DAYS * 24 * 60 * 60 * 1000,
    );
  });
});

const sseClients = new Set<Response>();

router.get(
  '/events',
  ensureAuthenticated(),
  asyncHandler(async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.flush(); // Flush to enable 'onopen' event

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
      res.end();
    });
  }),
);

router.get(
  '/',
  ensureAuthenticated(),
  asyncHandler(async (_req, res) => {
    const response = await getGeneralNotifications();
    if (!response) {
      res.status(404).send('Not found');
    } else {
      res.json(response);
    }
  }),
);

router.get(
  '/recent-count',
  ensureAuthenticated(),
  asyncHandler(async (_req, res) => {
    const response = await getRecentGeneralNotificationCount();
    if (!response) {
      res.status(404).send('Not found');
    } else {
      res.json(response);
    }
  }),
);

router.get(
  '/:id',
  ensureAuthenticated(),
  validateRequest([param('id').isString().withMessage('Id must be a string')]),
  asyncHandler(async (req, res) => {
    const response = await getGeneralNotification(req.params.id);
    if (!response) {
      res.status(404).send('Not found');
    }
    res.json(response);
  }),
);

router.post(
  '/',
  ensureAuthenticated(),
  ensureSuperUserAccess(),
  asyncHandler(async (req, res) => {
    try {
      await addGeneralNotification({
        ...req.body,
        publisher: req.user.id,
      });
      eventEmitter.emit('newGeneralNotification');
      res.status(201).send('Created');
    } catch (e) {
      res.status(400).send(`Bad request: ${e}`);
    }
  }),
);

router.put(
  '/:id',
  ensureAuthenticated(),
  ensureSuperUserAccess(),
  validateRequest([param('id').isString().withMessage('Id must be a string')]),
  asyncHandler(async (req, res) => {
    try {
      await updateGeneralNotification(req.params.id, {
        ...req.body,
        publisher: req.user.id,
      });
      eventEmitter.emit('newGeneralNotification');
      res
        .status(200)
        .send(`General notification with id ${req.params.id} updated`);
    } catch (e) {
      res.status(400).send(`Bad request: ${e}`);
    }
  }),
);

router.delete(
  '/:id',
  ensureAuthenticated(),
  ensureSuperUserAccess(),
  validateRequest([param('id').isString().withMessage('Id must be a string')]),
  asyncHandler(async (req, res) => {
    try {
      const deletedId = await deleteGeneralNotification(req.params.id);
      if (!deletedId) {
        res.status(404).send('Not found');
      }
      eventEmitter.emit('deletedGeneralNotification');
      res
        .status(200)
        .send(`General notification with id ${req.params.id} deleted`);
    } catch (e) {
      res.status(400).send(`Bad request: ${e}`);
    }
  }),
);

export default router;
