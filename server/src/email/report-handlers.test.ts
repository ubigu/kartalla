import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockSurvey } from '@src/tests/data/survey';

// This module only wires already-battle-tested pieces (PDF generation, DB
// lookups, mail sending) into the queue - these tests are a smoke check that
// the wiring passes the right data to the right place, not a re-test of any
// of those pieces themselves.

const { registerEmailJobHandlerMock } = vi.hoisted(() => ({
  registerEmailJobHandlerMock: vi.fn(),
}));

vi.mock('./queue', () => ({
  registerEmailJobHandler: registerEmailJobHandlerMock,
}));

const { generatePdfMock } = vi.hoisted(() => ({ generatePdfMock: vi.fn() }));
vi.mock('@src/application/pdf-generator', () => ({
  generatePdf: generatePdfMock,
}));

const { getAnswerEntriesMock, getTimestampMock } = vi.hoisted(() => ({
  getAnswerEntriesMock: vi.fn(),
  getTimestampMock: vi.fn(),
}));
vi.mock('@src/application/submission', () => ({
  getAnswerEntries: getAnswerEntriesMock,
  getTimestamp: getTimestampMock,
}));

const { getSurveyMock } = vi.hoisted(() => ({ getSurveyMock: vi.fn() }));
vi.mock('@src/application/survey', () => ({ getSurvey: getSurveyMock }));

const { sendSubmissionReportMock } = vi.hoisted(() => ({
  sendSubmissionReportMock: vi.fn(),
}));
vi.mock('./submission-report', () => ({
  sendSubmissionReport: sendSubmissionReportMock,
}));

const { sendUnfinishedSubmissionLinkMock } = vi.hoisted(() => ({
  sendUnfinishedSubmissionLinkMock: vi.fn(),
}));
vi.mock('./unfinished-submission', () => ({
  sendUnfinishedSubmissionLink: sendUnfinishedSubmissionLinkMock,
}));

import { registerReportEmailHandlers } from './report-handlers';

function getRegisteredHandler(type: string) {
  const call = registerEmailJobHandlerMock.mock.calls.find(
    ([registeredType]) => registeredType === type,
  );
  return call?.[1];
}

beforeEach(() => {
  vi.clearAllMocks();
  registerReportEmailHandlers();
});

describe('registerReportEmailHandlers', () => {
  it('registers a handler for both job types', () => {
    expect(getRegisteredHandler('submission-report')).toBeInstanceOf(Function);
    expect(getRegisteredHandler('unfinished-submission')).toBeInstanceOf(
      Function,
    );
  });
});

describe('submission-report handler', () => {
  it('fetches the survey, timestamp and answers, generates the PDF, and sends the report', async () => {
    const survey = createMockSurvey(1, 1);
    const timestamp = new Date('2024-01-01');
    const answerEntries = [{ sectionId: 1, type: 'free-text', value: 'hi' }];
    const pdfFile = Buffer.from('pdf');
    getSurveyMock.mockResolvedValue(survey);
    getTimestampMock.mockResolvedValue(timestamp);
    getAnswerEntriesMock.mockResolvedValue(answerEntries);
    generatePdfMock.mockResolvedValue(pdfFile);

    const handler = getRegisteredHandler('submission-report');
    await handler({
      submissionId: 42,
      surveyId: 1,
      to: 'submitter@example.com',
      language: 'fi',
      includeAttachments: true,
    });

    expect(getSurveyMock).toHaveBeenCalledWith({ id: 1 });
    expect(getTimestampMock).toHaveBeenCalledWith(42);
    expect(getAnswerEntriesMock).toHaveBeenCalledWith(
      42,
      survey.email.includePersonalInfo,
    );
    expect(generatePdfMock).toHaveBeenCalledWith(
      survey,
      { id: 42, timestamp },
      answerEntries,
      'fi',
    );
    expect(sendSubmissionReportMock).toHaveBeenCalledWith({
      to: 'submitter@example.com',
      language: 'fi',
      survey,
      pdfFile,
      submissionId: 42,
      answerEntries,
      includeAttachments: true,
    });
  });
});

describe('unfinished-submission handler', () => {
  it('fetches the survey and sends the unfinished submission link', async () => {
    const survey = createMockSurvey(2, 1);
    getSurveyMock.mockResolvedValue(survey);

    const handler = getRegisteredHandler('unfinished-submission');
    await handler({
      surveyId: 2,
      to: 'someone@example.com',
      token: 'abc-token',
      language: 'en',
    });

    expect(getSurveyMock).toHaveBeenCalledWith({ id: 2 });
    expect(sendUnfinishedSubmissionLinkMock).toHaveBeenCalledWith({
      to: 'someone@example.com',
      token: 'abc-token',
      survey,
      language: 'en',
    });
  });
});
