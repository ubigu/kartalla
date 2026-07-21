import { SubmissionAnswerEntry, SubmissionInfo } from '@interfaces/survey';
import {
  createSurveySubmission,
  EmailJobRequest,
  getSurveyAnswerLanguage,
  getUnfinishedAnswerEntries,
} from '@src/application/submission';
import { getPublishedSurvey, getSurvey } from '@src/application/survey';
import { ForbiddenError, NotFoundError } from '@src/error';
import { getOrganizationIdWithName } from '@src/user';
import { validateRequest } from '@src/utils';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { body, param, query } from 'express-validator';

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
    const answerEntries: SubmissionAnswerEntry[] = req.body.entries;

    const answerLanguage = req.body.language;
    const unfinishedToken = req.query.token ? String(req.query.token) : null;

    // Report emails aren't sent here - they're enqueued atomically with the
    // submission row itself, and delivered later by the email queue worker
    // (report-handlers.ts), which regenerates the PDF from the submission ID.
    const submissionInfo: SubmissionInfo = req.body.info;
    const emailJobs: EmailJobRequest[] = survey.email.enabled
      ? [
          ...(submissionInfo?.email
            ? [
                {
                  type: 'submission-report' as const,
                  to: submissionInfo.email,
                  includeAttachments: false,
                },
              ]
            : []),
          ...(survey.email?.autoSendTo ?? []).map((to) => ({
            type: 'submission-report' as const,
            to,
            includeAttachments: true,
          })),
        ]
      : [];

    await createSurveySubmission(
      survey.id,
      answerEntries,
      unfinishedToken,
      false,
      answerLanguage,
      emailJobs,
    );
    res.status(201).send();
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
    const answerEntries: SubmissionAnswerEntry[] = req.body.entries;
    const language = req.body.language;
    const unfinishedToken = req.query.token ? String(req.query.token) : null;

    const { unfinishedToken: newToken } = await createSurveySubmission(
      survey.id,
      answerEntries,
      unfinishedToken,
      true,
      language,
      [{ type: 'unfinished-submission', to: req.body.email }],
    );
    res.json({ token: newToken });
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
    const answers = await getUnfinishedAnswerEntries(String(req.query.token));

    const language = await getSurveyAnswerLanguage(String(req.query.token));
    res.json({ answers, language });
  }),
);

export default router;
