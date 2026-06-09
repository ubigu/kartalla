import { expect } from '@playwright/test';
import { getGroupedCheckboxQuestionData, getTestSurveyData, TEST_SURVEY_URL_NAMES } from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.groupedCheckbox, ['fi']);
const groupedCheckboxQuestion = getGroupedCheckboxQuestionData(PAGE_NAME);

test.use({ surveyParams: testSurveyData });

test.describe('Grouped checkbox question', () => {
  test.beforeEach(async ({ surveyData, surveyEditPage }) => {
    surveyEditPage.surveyId = surveyData.id;
    await surveyEditPage.goto();
  });

  test('answer from each group', async ({ surveyData, surveyEditPage, surveyPage, shortcuts }) => {
    await surveyEditPage.createGroupedCheckboxQuestion(groupedCheckboxQuestion);
    await surveyEditPage.expectSaveSuccess();

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
