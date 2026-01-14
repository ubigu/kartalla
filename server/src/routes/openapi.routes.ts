import { ensureAuthenticated } from '@src/auth';
import logger from '@src/logger';
import { Router } from 'express';
import fs from 'fs';
import jsYaml from 'js-yaml';

const router = Router();

/** Endpoint for OpenAPI description */
router.get('/', ensureAuthenticated(), (_req, res) => {
  const pathName = __dirname + '/../openapi/openapi.yaml';
  fs.readFile(pathName, { encoding: 'utf-8' }, (err, data) => {
    if (err) {
      logger.error(`Error reading OpenAPI file at path ${pathName}`);
      logger.error(JSON.stringify(err));
      return res
        .status(500)
        .json({ message: `Error reading OpenAPI file at path ${pathName}` });
    }

    res.status(200).json(jsYaml.load(data));
  });
});

export default router;
