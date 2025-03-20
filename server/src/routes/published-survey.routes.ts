import { AnswerEntry, SubmissionInfo } from '@interfaces/survey';
import { generatePdf } from '@src/application/pdf-generator';
import {
  createSurveySubmission,
  getSurveyAnswerLanguage,
  getUnfinishedAnswerEntries,
} from '@src/application/submission';
import { getPublishedSurvey, getSurvey } from '@src/application/survey';
import { sendSubmissionReport } from '@src/email/submission-report';
import { sendUnfinishedSubmissionLink } from '@src/email/unfinished-submission';
import { ForbiddenError, NotFoundError } from '@src/error';
import logger from '@src/logger';
import { getOrganizationIdWithName } from '@src/user';
import { validateRequest } from '@src/utils';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { body, query, param } from 'express-validator';

const router = Router();

/**
 * Endpoint for getting a published survey
 */
router.get(
  '/:organization/:name',
  validateRequest([
    param('organization').isString(),
    param('name').isString(),
    query('test').optional().isString(),
  ]),
  asyncHandler(async (req, res) => {
    const test = req.query.test === 'true';
    const organizationId = getOrganizationIdWithName(req.params.organization);

    if (!organizationId) {
      throw new NotFoundError(
        `Organization with name ${req.params.organization} not found`,
      );
    }
    logger.info(
      `Getting survey ${req.params.name} for organization ${organizationId}: ${req.params.organization}`,
    );
    const survey = await getPublishedSurvey({
      name: req.params.name,
      organizationId: organizationId,
      organizationName: req.params.organization,
    });

    if ((!test && !survey.isPublished) || (test && !survey.allowTestSurvey)) {
      // In case the survey shouldn't be published (or test survey not allowed if requested), throw the same not found error
      throw new ForbiddenError(`Survey with name ${req.params.name} not found`);
    }
    res.json(survey);
  }),
);

/**
 * Endpoint for creating a submission under the survey
 */
router.post(
  '/:organization/:name/submission',
  validateRequest([
    body('entries').isArray().withMessage('Entries must be an array'),
    body('entries.*.sectionId')
      .isNumeric()
      .withMessage('Section id must be an integer'),
    body('entries.*.type')
      .isString()
      .withMessage('Section type must be a string'),
    body('entries.*.value')
      .exists()
      .withMessage('Entry values must be provided'),
    body('info.email')
      .optional({ nullable: true })
      .isEmail()
      .withMessage('Email must be valid'),
    body('language').isString().withMessage('Language must be a string'),
    param('organization').isString(),
    param('name').isString(),
    query('token').optional().isString().withMessage('Token must be a string'),
  ]),
  asyncHandler(async (req, res) => {
    const organizationId = getOrganizationIdWithName(req.params.organization);

    if (!organizationId) {
      throw new NotFoundError(
        `Organization with name ${req.params.organization} not found`,
      );
    }

    const survey = await getSurvey({
      name: req.params.name,
      organization: organizationId,
    });
    if (!survey.isPublished) {
      // In case the survey shouldn't be published, throw the same not found error
      throw new NotFoundError(`Survey with name ${req.params.name} not found`);
    }
    const answerEntries: AnswerEntry[] = req.body.entries;
    logger.info(JSON.stringify(answerEntries));
    const answerLanguage = req.body.language;
    const unfinishedToken = req.query.token ? String(req.query.token) : null;
    const { id: submissionId, timestamp } = await createSurveySubmission(
      survey.id,
      answerEntries,
      unfinishedToken,
      false,
      answerLanguage,
    );
    // We are done with this request - start sending the emails in the background
    res.status(201).send();

    // Return if email is not enabled for this survey
    if (!survey.email.enabled) {
      return;
    }

    // Generate the PDF
    const pdfFile = await generatePdf(
      survey,
      { id: submissionId, timestamp },
      survey.email.includePersonalInfo
        ? answerEntries
        : answerEntries.filter(
            (entry: AnswerEntry) => entry.type !== 'personal-info',
          ),
      answerLanguage,
    );

    // Send the report to the submitter, if they provided their email address
    const submissionInfo: SubmissionInfo = req.body.info;
    if (submissionInfo?.email) {
      sendSubmissionReport({
        to: submissionInfo.email,
        language: answerLanguage,
        survey,
        pdfFile,
        submissionId,
        answerEntries,
        includeAttachments: false,
      });
    }

    // Send the report to all auto send recipients
    (survey.email?.autoSendTo ?? []).map((email) => {
      sendSubmissionReport({
        to: email,
        language: answerLanguage,
        survey,
        pdfFile,
        submissionId,
        answerEntries,
        includeAttachments: true,
      });
    });
  }),
);

/**
 * Endpoint for saving an unfinished submission
 */
router.post(
  '/:organization/:name/unfinished-submission',
  validateRequest([
    body('entries').isArray().withMessage('Entries must be an array'),
    body('entries.*.sectionId')
      .isNumeric()
      .withMessage('Section id must be an integer'),
    body('entries.*.type')
      .isString()
      .withMessage('Section type must be a string'),
    body('entries.*.value')
      .exists()
      .withMessage('Entry values must be provided'),
    body('email').isEmail().withMessage('Email must be valid'),
    body('language').isString().withMessage('Language must be a string'),
    param('organization').isString(),
    param('name').isString(),
    query('token').optional().isString().withMessage('Token must be a string'),
  ]),
  asyncHandler(async (req, res) => {
    const organizationId = getOrganizationIdWithName(req.params.organization);
    if (!organizationId) {
      throw new NotFoundError(
        `Organization with name ${req.params.organization} not found`,
      );
    }

    const survey = await getSurvey({
      name: req.params.name,
      organization: organizationId,
    });
    if (!survey.isPublished) {
      // In case the survey shouldn't be published, throw the same not found error
      throw new NotFoundError(`Survey with name ${req.params.name} not found`);
    }
    const answerEntries: AnswerEntry[] = req.body.entries;
    const language = req.body.language;
    const unfinishedToken = req.query.token ? String(req.query.token) : null;
    const { unfinishedToken: newToken } = await createSurveySubmission(
      survey.id,
      answerEntries,
      unfinishedToken,
      true,
      language,
    );
    res.json({ token: newToken });

    // Send the email in the background
    sendUnfinishedSubmissionLink({
      to: req.body.email,
      token: newToken,
      survey,
      language,
    });
  }),
);

/**
 * Endpoint for getting an unfinished submission by token
 */
router.get(
  '/:organization/:name/unfinished-submission',
  validateRequest([
    query('token').isString().withMessage('Token must be a string'),
    query('withPersonalInfo')
      .optional()
      .isBoolean()
      .withMessage('withPersonalInfo must be a boolean'),
    param('organization').isString(),
    param('name').isString(),
  ]),
  asyncHandler(async (req, res) => {
    const organizationId = getOrganizationIdWithName(req.params.organization);
    if (!organizationId) {
      throw new NotFoundError(
        `Organization with name ${req.params.organization} not found`,
      );
    }
    const survey = await getSurvey({
      name: req.params.name,
      organization: organizationId,
    });
    if (!survey.isPublished) {
      // In case the survey shouldn't be published, throw the same not found error
      throw new NotFoundError(`Survey with name ${req.params.name} not found`);
    }
    const answers = await getUnfinishedAnswerEntries(
      String(req.query.token),
      req.query.withPersonalInfo === 'true',
    );
    const language = await getSurveyAnswerLanguage(String(req.query.token));
    res.json({ answers, language });
  }),
);

export default router;
