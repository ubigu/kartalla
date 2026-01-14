import { getAllSurveyThemes } from '@src/application/theme';
import { ensureAuthenticated } from '@src/auth';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';

const router = Router();

/**
 * Get all available themes (to be listed in admin)
 */
router.get(
  '/',
  ensureAuthenticated(),
  asyncHandler(async (_req, res) => {
    const themes = await getAllSurveyThemes();
    res.json(themes);
  }),
);

export default router;
