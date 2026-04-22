import {
  ensureAdminAccess,
  ensureAuthenticated,
  ensureSuperUserAccess,
} from '@src/auth';
import {
  addPendingUserRequest,
  getUsers,
  updatePendingUserGroupMembership,
  updateUserDefaultLanguage,
  updateUserGroupMembership,
} from '@src/user';
import {
  isLanguageCode,
  LANGUAGE_CODES,
} from '@src/translations/useTranslations';
import { validateRequest } from '@src/utils';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { body, param, query } from 'express-validator';

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

/** Update the current user's default language */
router.patch(
  '/me/default-language',
  ensureAuthenticated(),
  validateRequest([
    body('language')
      .isString()
      .custom(isLanguageCode)
      .withMessage(`Language must be one of: ${LANGUAGE_CODES.join(', ')}`),
  ]),
  asyncHandler(async (req, res) => {
    await updateUserDefaultLanguage(req.user.id, req.body.language);
    res.status(204).end();
  }),
);

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

/** Update user's group assignment */
router.post(
  '/:id/groups',
  ensureAuthenticated(),
  ensureAdminAccess(),
  validateRequest([
    param('id').isString().withMessage('Invalid or missing user ID'),
    body('groups')
      .isArray()
      .withMessage('Groups must be an array of group IDs'),
  ]),
  asyncHandler(async (req, res) => {
    await updateUserGroupMembership(req.params.id, req.body.groups);
    res.status(201).end();
  }),
);

/** Update pending user's group assignment */
router.post(
  '/:id/pending-groups',
  ensureAuthenticated(),
  ensureAdminAccess(),
  validateRequest([
    param('id').isString().withMessage('Invalid or missing user ID'),
    body('groups')
      .isArray()
      .withMessage('Groups must be an array of group IDs'),
  ]),
  asyncHandler(async (req, res) => {
    await updatePendingUserGroupMembership(req.params.id, req.body.groups);
    res.status(201).end();
  }),
);

export default router;
