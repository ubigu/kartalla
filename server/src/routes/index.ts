import { Router } from 'express';
import answersRouter from './answers.routes';
import featureStylesRouter from './feature-styles.routes';
import fileRouter from './file.routes';
import healthRouter from './health.routes';
import mapRouter from './map.routes';
import publishedSurveyRouter from './published-survey.routes';
import surveyRouter from './survey.routes';
import themesRouter from './themes.routes';
import userRouter from './user.routes';
import openApiRouter from './openapi.routes';
import generalNotificationRouter from './generalNotification.routes';
import userGroupRouter from './userGroup.routes';
import keyVaultRouter from './keyvault.routes';
import svgIconRouter from './svg-icon.routes';

const router = Router();

router.use('/surveys', surveyRouter);
router.use('/published-surveys', publishedSurveyRouter);
router.use('/map', mapRouter);
router.use('/file', fileRouter);
router.use('/svg-icon', svgIconRouter);
router.use('/users', userRouter);
router.use('/answers', answersRouter);
router.use('/themes', themesRouter);
router.use('/feature-styles', featureStylesRouter);
router.use('/health', healthRouter);
router.use('/openapi', openApiRouter);
router.use('/general-notifications', generalNotificationRouter);
router.use('/user-groups', userGroupRouter);
router.use('/keyvault', keyVaultRouter);

export default router;
