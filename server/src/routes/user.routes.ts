import {
  ensureAdminAccess,
  ensureAuthenticated,
  ensureSuperUserAccess,
} from '@src/auth';
import { sendMail } from '@src/email/email';
import logger from '@src/logger';
import { addPendingUserRequest, getUsers } from '@src/user';
import { validateRequest } from '@src/utils';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { body, query } from 'express-validator';

const router = Router();

/**
 * Get all users from the requesting users organizations from database
 */
router.get(
  '/',

  ensureAuthenticated(),
  validateRequest([
    query('includePending')
      .optional()
      .isBoolean()
      .withMessage('Include pending must be a boolean'),
  ]),
  asyncHandler(async (req, res) => {
    const users = await getUsers(
      req.user.organizations.map((o) => o.id),
      req.query.includePending === 'true',
    );
    res.json(users);
  }),
);

/** Get all users from all organizations. Only available for super user. */
router.get(
  '/all',
  ensureAuthenticated(),
  ensureSuperUserAccess(),
  validateRequest([
    query('includePending')
      .optional()
      .isBoolean()
      .withMessage('Include pending must be a boolean'),
  ]),
  asyncHandler(async (req, res) => {
    const users = await getUsers([], req.query.includePending === 'true');
    res.json(users);
  }),
);

/**
 * Get currently logged in user
 */
router.get('/me', ensureAuthenticated(), (req, res) => {
  res.json(req.user);
});

/**
 * Get all other users than the currently logged in user
 */
router.get(
  '/others',
  ensureAuthenticated(),
  validateRequest([
    query('includePending')
      .optional()
      .isBoolean()
      .withMessage('Include pending must be a boolean'),
  ]),
  asyncHandler(async (req, res) => {
    // Exclude logged in user from response
    const users = await getUsers(
      req.user.organizations.map((o) => o.id),
      req.query.includePending === 'true',
      [req.user.id],
    );
    res.json(users);
  }),
);

/** Add new user request to the database */
router.post(
  '/',
  validateRequest([
    body('name').isString().withMessage('Name must be a string'),
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('role').isString().withMessage('Role must be a string'),
  ]),
  ensureAuthenticated(),
  ensureAdminAccess(),
  asyncHandler(async (req, res) => {
    const newUser = {
      fullName: req.body.name,
      email: req.body.email,
      roles: [req.body.role],
      organizations: req.user.organizations.map((o) => o.id),
    };
    const user = await addPendingUserRequest(newUser);

    res.json(user);
  }),
);

export default router;
