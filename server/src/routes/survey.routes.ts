import { LanguageCode, Survey, SurveyPage } from '@interfaces/survey';
import { generatePdf } from '@src/application/pdf-generator';
import {
  deletePublicationCredentials,
  getAnswerEntries,
  getPublicationCredentials,
  getSubmissionsForSurvey,
  getTimestamp,
  upsertPublicationCredentials,
} from '@src/application/submission';
import {
  createSurvey,
  createSurveyPage,
  deleteSurvey,
  deleteSurveyPage,
  getDistinctAutoSendToEmails,
  getSurvey,
  getSurveys,
  getTagsByOrganizations,
  publishSurvey,
  unpublishSurvey,
  updateSurvey,
  userCanEditSurvey,
  userCanViewSurvey,
} from '@src/application/survey';
import {
  ensureAuthenticated,
  ensurePublicationAccess,
  ensureSurveyGroupAccess,
} from '@src/auth';
import { getGeometryDBEntriesAsGeoJSON } from '@src/application/answer';
import { BadRequestError, ForbiddenError } from '@src/error';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../utils';
import { isSuperUser } from '@src/user';
const router = Router();

/**
 * Endpoint for getting all email addresses that are used as report recipients
 */
router.get(
  '/report-emails',
  ensureAuthenticated(),
  asyncHandler(async (req, res) => {
    const emails = await getDistinctAutoSendToEmails();
    res.json(emails);
  }),
);

/**
 * Endpoint for getting orgs all available tags
 */
router.get(
  '/org-tags',
  ensureAuthenticated(),
  asyncHandler(async (req, res) => {
    const orgTags = await getTagsByOrganizations(req.user.organizations);
    res.json(orgTags);
  }),
);

/**
 * Endpoint for getting all surveys.
 */
router.get(
  '/',
  validateRequest([
    query('filterByAuthored')
      .toBoolean()
      .isBoolean()
      .withMessage('filterByAuthored must be a boolean'),
    query('filterByPublished')
      .toBoolean()
      .isBoolean()
      .withMessage('filterByPublished must be a boolean'),
  ]),
  ensureAuthenticated(),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { filterByAuthored, filterByPublished } = req.query;
    const organization = isSuperUser(req.user)
      ? null
      : req.user.organizations[0];
    const surveys = await getSurveys(
      filterByAuthored ? userId : null,
      Boolean(filterByPublished),
      organization,
    );

    res.status(200).json(surveys);
  }),
);

/**
 * Endpoint for getting a single survey
 */
router.get(
  '/:id',
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
  ]),
  ensureAuthenticated(),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);

    const permissionsOk = await userCanViewSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError(
        'User not author, editor nor viewer of the survey.',
      );
    }

    // For now, use the first organization
    const survey = await getSurvey({
      id: surveyId,
      ...(!isSuperUser(req.user) && {
        organization: req.user.organizations[0],
      }),
    });
    res.status(200).json(survey);
  }),
);

/**
 * Endpoint for creating a new survey
 */
router.post(
  '/',
  ensureAuthenticated(),
  asyncHandler(async (req, res) => {
    const createdSurvey = await createSurvey(req.user);
    res.status(201).json(createdSurvey);
  }),
);

/**
 * Endpoint for updating an existing survey
 */
router.put(
  '/:id',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
    body('name')
      .isString()
      .optional({ nullable: true })
      .withMessage('Name must be a string'),
    body('title')
      .isObject()
      .optional({ nullable: true })
      .withMessage('Title must be a string'),
    body('subtitle')
      .isObject()
      .optional({ nullable: true })
      .withMessage('Subtitle must be a string'),
    body('author')
      .isString()
      .optional({ nullable: true })
      .withMessage('Author must be a string'),
    body('authorUnit')
      .isString()
      .optional({ nullable: true })
      .withMessage('Author unit must be a string'),
    body('backgroundImageName')
      .isString()
      .optional({ nullable: true })
      .withMessage('Background image name must be a string'),
    body('backgroundImagePath')
      .isArray()
      .optional({ nullable: true })
      .withMessage('Background image path must be an array'),
    body('thanksPageImageName')
      .isString()
      .optional({ nullable: true })
      .withMessage('Thanks page image name must be a string'),
    body('thanksPageImagePath')
      .isArray()
      .optional({ nullable: true })
      .withMessage('Thanks page image path must be an array'),
    body('marginImages')
      .isObject()
      .withMessage('Margin images must be an object'),
    body('startDate')
      .isString()
      .optional({ nullable: true })
      .withMessage('Start date must be a date'),
    body('endDate')
      .isString()
      .optional({ nullable: true })
      .withMessage('End date must be a date'),
    body('pages').optional().isArray().withMessage('Pages must be an array'),
    body('pages.*.id')
      .optional()
      .isNumeric()
      .toInt()
      .withMessage('Page id must be a number'),
    body('pages.*.title')
      .optional()
      .isObject()
      .withMessage('Page title must be a string'),
    body('pages.*.sections')
      .optional()
      .isArray()
      .withMessage('Sections must be an array'),
    body('pages.*.sections.*.id')
      .optional({ checkFalsy: true })
      .isNumeric()
      .withMessage('Section id must be a number'),
    body('pages.*.sections.*.type')
      .optional({ checkFalsy: true })
      .isString()
      .withMessage('Section type must be a string'),
    body('organization')
      .isString()
      .withMessage('Organization must be a string'),
    body('tags').optional().isArray().withMessage('Tags must be an array.'),
  ]),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);
    const permissionsOk = await userCanEditSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError('User not author nor editor of the survey');
    }
    const survey: Survey = {
      ...req.body,
      id: surveyId,
      startDate: req.body.startDate ? new Date(req.body.startDate) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      pages: req.body.pages,
    };
    try {
      const updatedSurvey = await updateSurvey(survey);
      res.status(200).json(updatedSurvey);
    } catch (error) {
      throw error.table === 'answer_entry' && Boolean(error.constraint)
        ? new BadRequestError(
            `Submitted answer prevents survey update: ${error.constraint}`,
            'submitted_answer_prevents_update',
          )
        : error;
    }
  }),
);

/**
 * Endpoint for deleting an existing survey
 */
router.delete(
  '/:id',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
  ]),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);
    const permissionsOk = await userCanEditSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError('User not author nor editor of the survey');
    }
    const deletedSurvey = await deleteSurvey(surveyId);
    res.status(200).json(deletedSurvey);
  }),
);

/**
 * Endpoint for creating a new survey from the data of a previous survey
 */
router.post(
  '/:id/copy',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
  ]),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    // Create a new empty survey
    const createdSurvey = await createSurvey(req.user);
    // Get data of the survey that were copied
    const copiedSurveyData = await getSurvey({ id });
    if (!copiedSurveyData || !createdSurvey) {
      res.status(500).json('Error while copying survey');
      return;
    }

    // Just in case: change every 'id' -field found on the copied survey into null to prevent overwriting anything
    function eachRecursive(obj) {
      for (const key in obj) {
        if (typeof obj[key] == 'object' && obj[key] !== null) {
          eachRecursive(obj[key]);
        } else {
          if (obj.hasOwnProperty('id')) {
            obj.id = null;
          }
        }
      }
    }

    eachRecursive(copiedSurveyData);

    // For every page that exist on the copied survey's data, create a new page skeleton
    // createdSurvey.pages will already include one page on it by default
    const pageSkeletons = createdSurvey.pages;
    if (copiedSurveyData.pages.length > 1) {
      const additionalPages = await Promise.all(
        Array(copiedSurveyData.pages.length - 1)
          .fill(null)
          .map(() => createSurveyPage(createdSurvey.id)),
      );
      pageSkeletons.push(...additionalPages);
    }

    const newPages = copiedSurveyData.pages.map((page, index) => ({
      ...page,
      id: pageSkeletons[index].id,
    }));

    const newSurvey = {
      ...createdSurvey,
      mapUrl: copiedSurveyData.mapUrl,
      pages: newPages,
      thanksPage: copiedSurveyData.thanksPage,
    } as Survey;

    // Just to make sure that we are not overwriting the previous survey
    if (newSurvey.name === null && newSurvey.id !== id) {
      await updateSurvey(newSurvey);
      res.status(200).json(newSurvey.id);
      return;
    } else {
      res.status(500).json('Error while copying survey');
      return;
    }
  }),
);

/**
 * Endpoint for publishing the survey
 */
router.post(
  '/:id/publish',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
  ]),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);
    const permissionsOk = await userCanEditSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError('User not author nor editor of the survey');
    }

    const survey = await publishSurvey(surveyId);
    res.status(200).json(survey);
  }),
);

/**
 * Endpoint for unpublishing the survey
 */
router.post(
  '/:id/unpublish',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
  ]),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);
    const permissionsOk = await userCanEditSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError('User not author nor editor of the survey');
    }

    const survey = await unpublishSurvey(surveyId);
    res.status(200).json(survey);
  }),
);

/**
 * Endpoint for creating a new survey page
 */
router.post(
  '/:id/page',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
  ]),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);
    const permissionsOk = await userCanEditSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError('User not author nor editor of the survey');
    }
    const partialPage = req.body as Partial<SurveyPage>;
    const createdSurveyPage = await createSurveyPage(surveyId, partialPage);
    res.status(201).json(createdSurveyPage);
  }),
);

/**
 * Endpoint for deleting an existing survey page
 */
router.delete(
  '/:surveyId/page/:id',
  ensureAuthenticated(),
  ensureSurveyGroupAccess('surveyId'),
  validateRequest([
    param('surveyId')
      .isNumeric()
      .toInt()
      .withMessage('surveyId must be a number'),
  ]),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
  ]),
  asyncHandler(async (req, res) => {
    const pageId = Number(req.params.id);
    const surveyId = Number(req.params.surveyId);
    const permissionsOk = await userCanEditSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError('User not author nor editor of the survey');
    }

    const deletedSurveyPage = await deleteSurveyPage(pageId);
    res.status(200).json(deletedSurveyPage);
  }),
);

/**
 * Endpoint for getting the PDF report for a single submission
 */
router.get(
  '/:surveyId/report/:submissionId/:lang',
  ensureAuthenticated(),
  ensureSurveyGroupAccess('surveyId'),
  validateRequest([
    query('withPersonalInfo')
      .optional()
      .isBoolean()
      .withMessage('withPersonalInfo must be a boolean'),
  ]),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.surveyId);
    const submissionId = Number(req.params.submissionId);
    const permissionsOk = await userCanViewSurvey(req.user, surveyId);
    const language = req.params.lang as LanguageCode;
    if (!permissionsOk) {
      throw new ForbiddenError(
        'User not author, editor nor viewer of the survey',
      );
    }

    const [survey, answerEntries, timestamp] = await Promise.all([
      getSurvey({ id: surveyId }),
      getAnswerEntries(submissionId, req.query.withPersonalInfo === 'true'),
      getTimestamp(submissionId),
    ]);
    const pdfBuffer = await generatePdf(
      survey,
      { id: submissionId, timestamp },
      answerEntries,
      language,
    );
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }),
);

/**
 * Get list of survey submissions for an authenticated user with permissions
 */
router.get(
  '/:id/submissions',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
    query('withPersonalInfo')
      .optional()
      .isBoolean()
      .withMessage('withPersonalInfo must be a boolean'),
  ]),

  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);

    const isEditor = await userCanViewSurvey(req.user, surveyId);

    if (!isEditor) {
      throw new ForbiddenError(
        'User not author, editor nor viewer of the survey',
      );
    }

    const submissions = await getSubmissionsForSurvey(
      surveyId,
      req.query.withPersonalInfo === 'true',
    );
    res.json(submissions);
  }),
);

/**
 * Get the published survey submissions. Requires basic auth with the
 * credentials set via the /:id/publication/credentials endpoint
 */
router.get(
  '/:id/publication',
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
  ]),
  ensurePublicationAccess(),
  asyncHandler(async (req, res) => {
    const { alphanumericIncluded, geospatialIncluded, personalIncluded } =
      res.locals;
    const submissions = await getSubmissionsForSurvey(
      Number(req.params.id),
      alphanumericIncluded,
      geospatialIncluded,
      true,
      personalIncluded,
    );
    res.json(submissions);
  }),
);

/**
 * Get the published submissions for map questions as GeoJSON layers. Requires
 * basic auth with the credentials set via the /:id/publication/credentials endpoint
 */
router.get(
  '/:id/publication/geojson',
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
    query('question').toArray(),
  ]),
  ensurePublicationAccess(),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);
    if (!res.locals.geospatialIncluded) {
      res.status(401).send('No geospatial submissions have been published.');
    } else {
      res.json((await getGeometryDBEntriesAsGeoJSON(surveyId)) ?? {});
    }
  }),
);

/**
 * Get credentials for the published survey submissions
 */
router.get(
  '/:id/publication/credentials',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
  ]),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);
    const permissionsOk = await userCanEditSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError('User not author nor editor of the survey');
    }

    const publications = await getPublicationCredentials(surveyId);
    res.status(200).json(publications);
  }),
);

/**
 * Upsert the credentials for the survey submission publication
 */
router.put(
  '/:id/publication/credentials',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
    body('username').isString().withMessage('Username must be a string'),
    body('password').isString().withMessage('Password must be a string'),
  ]),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);
    const permissionsOk = await userCanEditSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError('User not author nor editor of the survey');
    }
    const {
      username,
      password,
      alphanumericIncluded,
      geospatialIncluded,
      personalIncluded,
    } = req.body;

    const credentials = await upsertPublicationCredentials(
      surveyId,
      username,
      password,
      alphanumericIncluded,
      geospatialIncluded,
      personalIncluded,
    );
    res.status(200).json(credentials);
  }),
);

/**
 * Delete the credentials for the survey submission publication
 */
router.delete(
  '/:id/publication/credentials',
  ensureAuthenticated(),
  ensureSurveyGroupAccess(),
  validateRequest([
    param('id').isNumeric().toInt().withMessage('ID must be a number'),
  ]),
  asyncHandler(async (req, res) => {
    const surveyId = Number(req.params.id);
    const permissionsOk = await userCanEditSurvey(req.user, surveyId);
    if (!permissionsOk) {
      throw new ForbiddenError('User not author nor editor of the survey');
    }
    const publication = await deletePublicationCredentials(surveyId);
    res.status(200).json(publication);
  }),
);
export default router;
