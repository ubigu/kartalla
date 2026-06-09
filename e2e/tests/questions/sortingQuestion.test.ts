import { expect } from '@playwright/test';
import { getSortingQuestionData, getTestSurveyData, TEST_SURVEY_URL_NAMES } from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.sorting, ['fi']);
const sortingQuestion = getSortingQuestionData(PAGE_NAME);

test.use({ surveyParams: testSurveyData });

test.describe('Sorting question', () => {
  test.beforeEach(async ({ surveyData, surveyEditPage }) => {
    surveyEditPage.surveyId = surveyData.id;
    await surveyEditPage.goto();
  });

  test('drag to sort', async ({ surveyData, surveyEditPage, surveyPage, shortcuts }) => {
    await surveyEditPage.createSortingQuestion(sortingQuestion);
    await surveyEditPage.expectSaveSuccess();

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
