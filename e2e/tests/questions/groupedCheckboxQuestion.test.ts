import { expect } from '@playwright/test';
import { getGroupedCheckboxQuestionData, getTestSurveyData, TEST_SURVEY_URL_NAMES } from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.groupedCheckbox);
let surveyData = testSurveyData;
const groupedCheckboxQuestion = getGroupedCheckboxQuestionData(PAGE_NAME);

test.describe('Grouped checkbox question', () => {
  test.beforeEach(async ({ shortcuts }) => {
    surveyData = await shortcuts.createSurveyViaApi(testSurveyData);
  });
  test.afterEach(async ({ shortcuts }) => {
    await shortcuts.deleteSurvey();
  });

  test('answer from each group', async ({ surveyEditPage, surveyPage, shortcuts }) => {
    await surveyEditPage.createGroupedCheckboxQuestion(groupedCheckboxQuestion);
    await expect(surveyEditPage.page.getByRole('alert')).toHaveText(
      'Kysely tallennettiin onnistuneesti!',
    );

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    const fieldset = surveyPage.page.locator('.question-fieldset');
    const groupButtons = fieldset.getByRole('button');
    expect(await groupButtons.count()).toBe(groupedCheckboxQuestion.groups.length);

    await groupButtons.first().click();
    await fieldset.locator('input').first().check();

    await groupButtons.last().click();
    await fieldset.locator('input').last().check();

    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.locator('h1').filter({ hasText: surveyData.thanksPage.title }),
    ).toBeVisible();
  });
});
