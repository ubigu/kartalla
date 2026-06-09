import { expect } from '@playwright/test';
import {
  getAttachmentQuestionData,
  getTestSurveyData,
  TEST_SURVEY_URL_NAMES,
} from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.attachment, [
  'fi',
]);
const attachmentQuestion = getAttachmentQuestionData(PAGE_NAME);

test.use({ surveyParams: testSurveyData });

test.describe('Attachment question', () => {
  test.beforeEach(async ({ surveyData, surveyEditPage }) => {
    surveyEditPage.surveyId = surveyData.id;
    await surveyEditPage.goto();
  });

  test('shows file upload zone', async ({
    surveyData,
    surveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    await surveyEditPage.createAttachmentQuestion(attachmentQuestion);
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(surveyData.title, surveyData.urlName);

    await expect(
      surveyPage.page.locator('.question-fieldset').filter({
        hasText: attachmentQuestion.title,
      }),
    ).toBeVisible();

    await expect(
      surveyPage.page.getByText(
        'Sallitut tiedostoformaatit: jpg, jpeg, png, pdf, docx, xlsx sekä yleisimmät videoformaatit.',
      ),
    ).toBeVisible();

    // Intentionally submitting without an attachment to verify the error
    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.getByRole('alert').filter({
        hasText:
          'Kyselyn lähettämisessä tapahtui virhe. Ole hyvä ja yritä myöhemmin uudestaan.',
      }),
    ).toBeVisible();
  });
});
