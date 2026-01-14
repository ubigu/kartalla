import {
  ensureAdminAccess,
  ensureAuthenticated,
  ensureSuperUserAccess,
} from '@src/auth';
import { ForbiddenError } from '@src/error';
import { isSuperUser } from '@src/user';
import {
  addUserGroup,
  deleteUserGroup,
  getAllUserGroups,
  getUserGroup,
  getUserGroups,
} from '@src/userGroup';
import { validateRequest } from '@src/utils';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { param } from 'express-validator';

const router = Router();

/** Get all user groups for an organization from the database. */
router.get(
  '/',
  ensureAuthenticated(),
  asyncHandler(async (req, res) => {
    const userGroups = await getUserGroups(req.user.organizations[0].id);
    res.json(userGroups);
  }),
);

/** Get all user groups from every organization from the database. */
router.get(
  '/all',
  ensureAuthenticated(),
  ensureSuperUserAccess(),
  asyncHandler(async (_req, res) => {
    const userGroups = await getAllUserGroups();
    res.json(userGroups);
  }),
);

/** Add a user group to the database. */
router.post(
  '/',
  ensureAuthenticated(),
  ensureAdminAccess(),
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    const userGroup = await addUserGroup(req.user.organizations[0].id, name);
    res.status(201).json(userGroup);
  }),
);

/** Delete a user group from the database */
router.delete(
  '/:id',
  ensureAuthenticated(),
  ensureAdminAccess(),
  validateRequest([
    param('id').isString().withMessage('Invalid or missing group ID'),
  ]),
  asyncHandler(async (req, res) => {
    const userGroup = await getUserGroup(req.params.id);
    if (!userGroup) {
      res.status(404).json({ message: 'User group not found' });
      return;
    }

    if (
      userGroup.organization !== req.user.organizations[0].id &&
      !isSuperUser(req.user)
    ) {
      throw new ForbiddenError();
    }
    const { id } = req.params;
    await deleteUserGroup(id);
    res.status(204).end();
  }),
);

export default router;
