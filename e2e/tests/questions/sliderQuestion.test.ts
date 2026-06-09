import { expect } from '@playwright/test';
import {
  getSliderQuestionDataNumber,
  getSliderQuestionDataString,
  getTestSurveyData,
  TEST_SURVEY_URL_NAMES,
} from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.slider, ['fi']);
const sliderNumberQuestion = getSliderQuestionDataNumber(PAGE_NAME);
const sliderStringQuestion = getSliderQuestionDataString(PAGE_NAME);

test.use({ surveyParams: testSurveyData });

test.describe('Slider question', () => {
  test.beforeEach(async ({ surveyData, surveyEditPage }) => {
    surveyEditPage.surveyId = surveyData.id;
    await surveyEditPage.goto();
  });

  test('number variant', async ({ surveyData, surveyEditPage, surveyPage, shortcuts }) => {
    await surveyEditPage.createSliderQuestion(sliderNumberQuestion);
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    const fieldset = surveyPage.page.locator('.question-fieldset');
    await fieldset.locator('input').focus();
    await surveyPage.page.keyboard.press('ArrowRight');

    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.locator('h1').filter({ hasText: surveyData.thanksPage.title }),
    ).toBeVisible();
  });

  test('string variant', async ({ surveyData, surveyEditPage, surveyPage, shortcuts }) => {
    await surveyEditPage.createSliderQuestion(sliderStringQuestion);
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    const fieldset = surveyPage.page.locator('.question-fieldset');
    await fieldset.locator('input').focus();
    await surveyPage.page.keyboard.press('ArrowRight');

    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.locator('h1').filter({ hasText: surveyData.thanksPage.title }),
    ).toBeVisible();
  });
});
