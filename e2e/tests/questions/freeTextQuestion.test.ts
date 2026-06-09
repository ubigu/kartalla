import { expect } from '@playwright/test';
import { getFreeTextQuestionData, getTestSurveyData, TEST_SURVEY_URL_NAMES } from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.freetext, ['fi']);
const freeTextQuestion = getFreeTextQuestionData(PAGE_NAME);

test.use({ surveyParams: testSurveyData });

test.describe('Free text question', () => {
  test.beforeEach(async ({ surveyData, surveyEditPage }) => {
    surveyEditPage.surveyId = surveyData.id;
    await surveyEditPage.goto();
  });

  test('basic answer', async ({ surveyData, surveyEditPage, surveyPage, shortcuts }) => {
    await surveyEditPage.createFreeTextQuestion(freeTextQuestion);
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    await surveyPage.page.getByRole('textbox').fill('Testivastaus');
    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.locator('h1').filter({ hasText: surveyData.thanksPage.title }),
    ).toBeVisible();
  });

  test('with max length', async ({ surveyData, surveyEditPage, surveyPage, shortcuts }) => {
    const shortMaxLength = 20;
    await surveyEditPage.createFreeTextQuestion({
      ...freeTextQuestion,
      maxLength: shortMaxLength,
    });
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    // >= 90% of max length triggers the character counter
    const longText = 'A'.repeat(Math.ceil(shortMaxLength * 0.9));
    await surveyPage.page.getByRole('textbox').fill(longText);

    const remaining = shortMaxLength - longText.length;
    await expect(
      surveyPage.page.getByText(`${remaining} merkkiä jäljellä.`),
    ).toBeVisible();
  });
});
