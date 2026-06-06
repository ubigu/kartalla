import { expect } from '@playwright/test';
import { getCheckBoxQuestionData, getTestSurveyData, TEST_SURVEY_URL_NAMES } from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.checkbox, ['fi']);
let checkBoxQuestion = getCheckBoxQuestionData(PAGE_NAME);

test.use({ surveyParams: testSurveyData });

test.describe('CheckBox question', () => {
  test.beforeEach(async ({ surveyData, surveyEditPage }) => {
    surveyEditPage.surveyId = surveyData.id;
    await surveyEditPage.goto();
  });

  test('without limits', async ({
    surveyData,
    surveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    await surveyEditPage.createCheckBoxQuestion(checkBoxQuestion);
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    const checkBoxes = await surveyPage.page.getByRole('checkbox').all();
    expect(checkBoxes).toHaveLength(checkBoxQuestion.answerOptions.length);

    await checkBoxes[0].check();
    expect(await checkBoxes[0].isChecked()).toBe(true);
    for (let i = 1; i < checkBoxes.length; i++) {
      expect(await checkBoxes[i].isChecked()).toBe(false);
    }

    await checkBoxes[1].check();
    expect(await checkBoxes[0].isChecked()).toBe(true);
    expect(await checkBoxes[1].isChecked()).toBe(true);
    for (let i = 2; i < checkBoxes.length; i++) {
      expect(await checkBoxes[i].isChecked()).toBe(false);
    }
  });

  test('with limits', async ({
    surveyData,
    surveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    checkBoxQuestion = {
      ...checkBoxQuestion,
      answerLimits: { min: 1, max: 3 },
    };

    await surveyEditPage.createCheckBoxQuestion(checkBoxQuestion);
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    const checkBoxes = await surveyPage.page.getByRole('checkbox').all();
    expect(checkBoxes).toHaveLength(checkBoxQuestion.answerOptions.length);

    await checkBoxes[0].check();
    await checkBoxes[1].check();
    await checkBoxes[2].check();

    // After reaching max=3, the 4th option is disabled
    expect(await checkBoxes[3].isDisabled()).toBe(true);

    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.locator('h1').filter({ hasText: surveyData.thanksPage.title }),
    ).toBeVisible();
  });
});
