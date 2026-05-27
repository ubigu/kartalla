import { expect } from '@playwright/test';
import { getSortingQuestionData, getTestSurveyData, TEST_SURVEY_URL_NAMES } from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.sorting);
let surveyData = testSurveyData;
const sortingQuestion = getSortingQuestionData(PAGE_NAME);

test.describe('Sorting question', () => {
  test.beforeEach(async ({ shortcuts }) => {
    surveyData = await shortcuts.createSurveyViaApi(testSurveyData);
  });
  test.afterEach(async ({ shortcuts }) => {
    await shortcuts.deleteSurvey();
  });

  test('drag to sort', async ({ surveyEditPage, surveyPage, shortcuts }) => {
    await surveyEditPage.createSortingQuestion(sortingQuestion);
    await expect(surveyEditPage.page.getByRole('alert')).toHaveText(
      'Kysely tallennettiin onnistuneesti!',
    );

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    const fieldset = surveyPage.page.locator('.question-fieldset');
    const items = fieldset.locator('[data-rbd-draggable-id]');
    expect(await items.count()).toBe(sortingQuestion.answerOptions.length);

    await items.first().dragTo(items.last());

    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.locator('h1').filter({ hasText: surveyData.thanksPage.title }),
    ).toBeVisible();
  });
});
