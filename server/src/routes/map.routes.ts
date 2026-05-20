import { ensureAuthenticated } from '@src/auth';
import { validateRequest } from '@src/utils';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { query } from 'express-validator';
import {
  getAvailableOskariMapLayers,
  getOlMapLayers,
} from '../application/map';

const router = Router();

router.get(
  '/ol-layers',
  asyncHandler(async (_req, res) => {
    const layers = await getOlMapLayers();
    res.json(layers);
  }),
);

router.get(
  '/available-layers',
  ensureAuthenticated(),
  validateRequest([query('url').isString()]),
  asyncHandler(async (req, res) => {
    const mapUrl = decodeURIComponent(req.query.url.toString());
    const layers = await getAvailableOskariMapLayers(mapUrl);
    res.json(layers);
  }),
);

export default router;
