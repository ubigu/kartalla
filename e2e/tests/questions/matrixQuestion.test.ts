import { expect } from '@playwright/test';
import { getMatrixQuestionData, getTestSurveyData, TEST_SURVEY_URL_NAMES } from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.matrix, ['fi']);
const matrixQuestion = getMatrixQuestionData(PAGE_NAME);

test.use({ surveyParams: testSurveyData });

test.describe('Matrix question', () => {
  test.beforeEach(async ({ surveyData, surveyEditPage }) => {
    surveyEditPage.surveyId = surveyData.id;
    await surveyEditPage.goto();
  });

  test('answer each row', async ({ surveyData, surveyEditPage, surveyPage, shortcuts }) => {
    await surveyEditPage.createMatrixQuestion(matrixQuestion);
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    const fieldset = surveyPage.page.locator('.question-fieldset');
    const viewPortSize = surveyPage.page.viewportSize();

    if (viewPortSize && viewPortSize.width < 430) {
      for (const row of matrixQuestion.matrixRows) {
        await fieldset.getByLabel(row).click();
        await surveyPage.page.getByRole('listbox').getByRole('option').first().click();
      }
    } else {
      for (const _row of matrixQuestion.matrixRows) {
        await fieldset.locator('input').first().check({ force: true });
      }
    }

    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.locator('h1').filter({ hasText: surveyData.thanksPage.title }),
    ).toBeVisible();
  });
});
