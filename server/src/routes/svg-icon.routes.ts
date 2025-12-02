import {
  deleteSvgIcon,
  getSvgIcons,
  uploadSvgIcon,
} from '@src/application/svg-icon';
import { ensureAuthenticated, ensureFileGroupAccess } from '@src/auth';
import { BadRequestError, ForbiddenError } from '@src/error';
import { fileTypeRegex, validateTextFile } from '@src/fileValidation';
import { validateRequest } from '@src/utils';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { body, param } from 'express-validator';
import multer, { FileFilterCallback } from 'multer';

const router = Router();

type FileType = keyof typeof fileTypeRegex;

function validateText(
  fileType: FileType,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) {
  validateTextFile(
    fileType,
    { originalname: file.originalname, mimetype: file.mimetype },
    () => cb(new BadRequestError('Invalid file type')),
    () => cb(null, true),
  );
}

function upload(fileType: FileType) {
  const multerUpload = multer({
    limits: { fileSize: 10 * 1000 * 1000 },
    fileFilter: (_req, file, cb) => validateText(fileType, file, cb),
  });

  return {
    single: (fieldName: string) => multerUpload.single(fieldName),
  };
}

/**
 * Upload a new SVG icon
 */
router.post(
  '/',
  upload('media').single('file'),
  ensureAuthenticated(),
  ensureFileGroupAccess(),
  validateRequest([
    body('originalFilename')
      .optional()
      .isString()
      .withMessage('originalFilename must be a string'),
  ]),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new BadRequestError('No file provided');
    }

    const organizations = res.locals.fileOrganizations;
    if (!organizations || organizations.length === 0) {
      throw new ForbiddenError('Unauthorized organization');
    }

    const { buffer } = req.file;
    const svgContent = buffer.toString('utf-8');
    const { originalFilename } = req.body;
    const organizationId = organizations[0];

    const icon = await uploadSvgIcon(
      organizationId,
      svgContent,
      originalFilename || req.file.originalname,
    );

    res.status(200).json(icon);
  }),
);

/**
 * Get all SVG icons for user's organization
 */
router.get(
  '/',
  ensureAuthenticated(),
  ensureFileGroupAccess(),
  asyncHandler(async (req, res) => {
    const organizations = res.locals.fileOrganizations;
    if (!organizations || organizations.length === 0) {
      throw new ForbiddenError('Unauthorized organization');
    }

    const organizationId = organizations[0];
    const icons = await getSvgIcons(organizationId);

    res.status(200).json(icons);
  }),
);

/**
 * Delete an SVG icon
 */
router.delete(
  '/:iconId',
  ensureAuthenticated(),
  ensureFileGroupAccess(),
  validateRequest([
    param('iconId')
      .isInt({ min: 1 })
      .toInt()
      .withMessage('iconId must be a positive integer'),
  ]),
  asyncHandler(async (req, res) => {
    const organizations = res.locals.fileOrganizations;
    if (!organizations || organizations.length === 0) {
      throw new ForbiddenError('Unauthorized organization');
    }

    const iconId = req.params.iconId as number;
    const organizationId = organizations[0];

    await deleteSvgIcon(iconId, organizationId);

    res.status(200).json({ message: 'SVG icon deleted successfully' });
  }),
);

export default router;
