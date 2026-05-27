import { expect } from '@playwright/test';
import { getAttachmentQuestionData, getTestSurveyData, TEST_SURVEY_URL_NAMES } from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.attachment);
let surveyData = testSurveyData;
const attachmentQuestion = getAttachmentQuestionData(PAGE_NAME);

test.describe('Attachment question', () => {
  test.beforeEach(async ({ shortcuts }) => {
    surveyData = await shortcuts.createSurveyViaApi(testSurveyData);
  });
  test.afterEach(async ({ shortcuts }) => {
    await shortcuts.deleteSurvey();
  });

  test('shows file upload zone', async ({
    surveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    await surveyEditPage.createAttachmentQuestion(attachmentQuestion);
    await expect(surveyEditPage.page.getByRole('alert')).toHaveText(
      'Kysely tallennettiin onnistuneesti!',
    );

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

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
