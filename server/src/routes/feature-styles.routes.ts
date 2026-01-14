import { MapMarkerIcon, MapStrokeColor } from '@interfaces/survey';
import { ensureAuthenticated } from '@src/auth';
import { getDb } from '@src/database';
import { NotFoundError } from '@src/error';
import { iconCacher } from '@src/middleware';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import NodeCache from 'node-cache';

const iconCache = new NodeCache({
  stdTTL: 86400, // ttl for generated cache items
  checkperiod: 3600, // interval of automatic cache cleaning checks
});

const router = Router();

router.get(
  '/marker-icons',
  ensureAuthenticated(),
  asyncHandler(async (_req, res) => {
    const icons = await getDb().manyOrNone<MapMarkerIcon>(
      `SELECT id, name, svg FROM application.map_marker_icon ORDER BY idx ASC`,
    );
    res.json(icons);
  }),
);

router.get(
  '/stroke-colors',
  ensureAuthenticated(),
  asyncHandler(async (_req, res) => {
    const colors = await getDb().manyOrNone<MapStrokeColor>(
      `SELECT name, value FROM application.map_stroke_color ORDER BY idx ASC`,
    );
    res.json(colors);
  }),
);

router.get(
  '/icons/:name',
  iconCacher(iconCache),
  asyncHandler(async (req, res) => {
    const name = req.params.name;
    const icon = await getDb().oneOrNone<{
      id: string;
      name: string;
      svg: Buffer;
    }>('SELECT name, svg FROM application.static_icons WHERE name=$(name)', {
      name,
    });
    if (!icon) {
      throw new NotFoundError(`Icon with name ${name} not found`);
    }

    res.type('image/svg+xml');
    res.status(200).send(icon.svg);
  }),
);

export default router;
