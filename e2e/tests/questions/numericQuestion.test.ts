import { expect } from '@playwright/test';
import { getNumericQuestionData, getTestSurveyData, TEST_SURVEY_URL_NAMES } from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.numeric, ['fi']);
const numericQuestion = getNumericQuestionData(PAGE_NAME);

test.use({ surveyParams: testSurveyData });

test.describe('Numeric question', () => {
  test.beforeEach(async ({ surveyData, surveyEditPage }) => {
    surveyEditPage.surveyId = surveyData.id;
    await surveyEditPage.goto();
  });

  test('valid value', async ({ surveyData, surveyEditPage, surveyPage, shortcuts }) => {
    await surveyEditPage.createNumericQuestion(numericQuestion);
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    await expect(
      surveyPage.page.getByText(
        `Arvon pitää olla lukujen ${numericQuestion.minValue} ja ${numericQuestion.maxValue} välissä`,
      ),
    ).toBeVisible();

    await surveyPage.page.getByRole('spinbutton').fill(String(numericQuestion.minValue));

    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.locator('h1').filter({ hasText: surveyData.thanksPage.title }),
    ).toBeVisible();
  });

  test('out of range value', async ({ surveyData, surveyEditPage, surveyPage, shortcuts }) => {
    await surveyEditPage.createNumericQuestion(numericQuestion);
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    await surveyPage.page
      .getByRole('spinbutton')
      .fill(String((numericQuestion.maxValue as number) + 1));

    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.getByText('Vastaa kaikkiin pakolliseksi merkittyihin kysymyksiin.'),
    ).toBeVisible();
  });
});
