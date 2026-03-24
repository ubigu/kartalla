import { ensureAdminAccess, ensureAuthenticated } from '@src/auth';
import { ForbiddenError } from '@src/error';
import { isSuperUser } from '@src/user';
import {
  addMapPublication,
  deleteMapPublication,
  getMapPublication,
  getMapPublications,
} from '@src/application/mapPublications';
import { validateRequest } from '@src/utils';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { body, param } from 'express-validator';

const router = Router();

/** Get all map publications for the user's organization. */
router.get(
  '/',
  ensureAuthenticated(),
  asyncHandler(async (req, res) => {
    const publications = await getMapPublications(req.user.organizations[0].id);
    res.json(publications);
  }),
);

/** Add a map publication for the user's organization. */
router.post(
  '/',
  ensureAuthenticated(),
  ensureAdminAccess(),
  validateRequest([
    body('name').isString().notEmpty().withMessage('Invalid or missing name'),
    body('url').isString().notEmpty().withMessage('Invalid or missing url'),
  ]),
  asyncHandler(async (req, res) => {
    const { name, url } = req.body;
    const publication = await addMapPublication(
      { name, url },
      req.user.organizations[0].id,
    );
    res.status(201).json(publication);
  }),
);

/** Delete a map publication. */
router.delete(
  '/:id',
  ensureAuthenticated(),
  ensureAdminAccess(),
  validateRequest([
    param('id').isUUID().withMessage('Invalid or missing publication ID'),
  ]),
  asyncHandler(async (req, res) => {
    const publication = await getMapPublication(req.params.id);
    if (!publication) {
      res.status(404).json({ message: 'Map publication not found' });
      return;
    }

    if (
      publication.organization !== req.user.organizations[0].id &&
      !isSuperUser(req.user)
    ) {
      throw new ForbiddenError();
    }

    await deleteMapPublication(req.params.id);
    res.status(204).end();
  }),
);

export default router;
