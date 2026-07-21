import { generatePdf } from '@src/application/pdf-generator';
import { getAnswerEntries, getTimestamp } from '@src/application/submission';
import { getSurvey } from '@src/application/survey';
import {
  registerEmailJobHandler,
  SubmissionReportJobPayload,
  UnfinishedSubmissionJobPayload,
} from './queue';
import { sendSubmissionReport } from './submission-report';
import { sendUnfinishedSubmissionLink } from './unfinished-submission';

async function handleSubmissionReportJob(payload: SubmissionReportJobPayload) {
  const survey = await getSurvey({ id: payload.surveyId });
  const [timestamp, answerEntries] = await Promise.all([
    getTimestamp(payload.submissionId),
    getAnswerEntries(payload.submissionId, survey.email.includePersonalInfo),
  ]);
  const pdfFile = await generatePdf(
    survey,
    { id: payload.submissionId, timestamp },
    answerEntries,
    payload.language,
  );
  await sendSubmissionReport({
    to: payload.to,
    language: payload.language,
    survey,
    pdfFile,
    submissionId: payload.submissionId,
    answerEntries,
    includeAttachments: payload.includeAttachments,
  });
}

async function handleUnfinishedSubmissionJob(
  payload: UnfinishedSubmissionJobPayload,
) {
  const survey = await getSurvey({ id: payload.surveyId });
  await sendUnfinishedSubmissionLink({
    to: payload.to,
    token: payload.token,
    survey,
    language: payload.language,
  });
}

/**
 * Wires the actual PDF generation / mailer work into the generic email
 * queue (queue.ts), which otherwise has no dependency on puppeteer, pdfmake,
 * or nodemailer. Call once at server startup, before initializeEmailQueueWorker().
 */
export function registerReportEmailHandlers() {
  registerEmailJobHandler('submission-report', handleSubmissionReportJob);
  registerEmailJobHandler(
    'unfinished-submission',
    handleUnfinishedSubmissionJob,
  );
}
