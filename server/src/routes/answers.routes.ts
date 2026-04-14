import { LanguageCode } from '@interfaces/survey';
import {
  getAnswerCounts,
  getAttachments,
  getCSVFile,
  getExcelFile,
  getGeoPackageFile,
} from '@src/application/answer';
import { userCanViewSurvey } from '@src/application/survey';
import { ensureAuthenticated, ensureSurveyGroupAccess } from '@src/auth';
import { BadRequestError, ForbiddenError } from '@src/error';
import useTranslations, {
  isLanguageCode,
} from '@src/translations/useTranslations';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { param, query } from 'express-validator';
import { validateRequest } from '../utils';

const router = Router();

/**
 * Endpoint for checking if the give survey has answers
 */
router.get(
  '/:id/answer-counts',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
  ]),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);
    const permissionsOk = await userCanViewSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError(
        'User not author, editor nor viewer of the survey',
      );
    }

    try {
      const answerCounts = await getAnswerCounts(surveyId);
      res.status(200).json(answerCounts);
    } catch (error) {
      res.status(500).json({
        message: `Error getting answer counts: ${JSON.stringify(error)}`,
      });
    }
  }),
);

/**
 * Endpoint for downloading survey answers as CSV or Excel
 */
router.get(
  '/:id/file-export',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
    query('fileType')
      .isIn(['csv', 'excel'])
      .withMessage('fileType must be csv or excel'),
    query('lang')
      .optional()
      .custom(isLanguageCode)
      .withMessage('lang must be a valid language code'),
    query('withPersonalInfo')
      .optional()
      .isBoolean()
      .withMessage('withPersonalInfo must be a boolean'),
  ]),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);
    const permissionsOk = await userCanViewSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError(
        'User not author, editor nor viewer of the survey',
      );
    }

    const lang = req.query.lang as LanguageCode;
    const withPersonalInfo = req.query.withPersonalInfo === 'true';

    const fileName = `${useTranslations(lang).sheetName}.xlsx`;
    if (req.query.fileType === 'csv') {
      const csv = await getCSVFile(surveyId, withPersonalInfo, lang);
      if (!csv) {
        res.status(404).json({ message: 'No answers found' });
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${fileName}"`,
        );
        res.status(200).send(csv);
      }
    } else {
      const buffer = await getExcelFile(surveyId, withPersonalInfo, lang);
      if (!buffer) {
        res.status(404).json({ message: 'No answers found' });
      } else {
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${fileName}"`,
        );
        res.status(200).send(buffer);
      }
    }
  }),
);

/**
 * Endpoint for getting answer entry files for the given survey
 */
router.get(
  '/:id/file-export/geopackage',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
  ]),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);
    const permissionsOk = await userCanViewSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError(
        'User not author, editor nor viewer of the survey',
      );
    }

    const geopackageBuffer = await getGeoPackageFile(surveyId);
    if (!geopackageBuffer) {
      throw new BadRequestError('No answers available');
    } else {
      res.status(200);
      res.end(geopackageBuffer);
    }
  }),
);

/**
 * Endpoint for getting answer attachments for given survey
 */
router.get(
  '/:id/file-export/attachments',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
  ]),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);
    const permissionsOk = await userCanViewSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError(
        'User not author, editor nor viewer of the survey',
      );
    }

    const attachments = await getAttachments(surveyId);

    if (!attachments) {
      throw new BadRequestError('No attachments available');
    } else {
      res.status(200).json(attachments);
    }
  }),
);

export default router;
