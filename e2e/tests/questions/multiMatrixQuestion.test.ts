import { expect } from '@playwright/test';
import {
  getMultiMatrixQuestionData,
  getTestSurveyData,
  TEST_SURVEY_URL_NAMES,
} from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.multiMatrix, ['fi']);
const multiMatrixQuestion = getMultiMatrixQuestionData(PAGE_NAME);

test.use({ surveyParams: testSurveyData });

test.describe('Multi matrix question', () => {
  test.beforeEach(async ({ surveyData, surveyEditPage }) => {
    surveyEditPage.surveyId = surveyData.id;
    await surveyEditPage.goto();
  });

  test('without limits', async ({ surveyData, surveyEditPage, surveyPage, shortcuts }) => {
    await surveyEditPage.createMultiMatrixQuestion({
      ...multiMatrixQuestion,
      answersLimited: undefined,
    });
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    const fieldset = surveyPage.page.locator('.question-fieldset');
    const viewPortSize = surveyPage.page.viewportSize();

    if (viewPortSize && viewPortSize.width < 430) {
      for (const row of multiMatrixQuestion.matrixRows) {
        await fieldset.getByLabel(row).click();
        await surveyPage.page
          .getByRole('listbox')
          .getByRole('option')
          .first()
          .click();
        await surveyPage.page.keyboard.press('Escape');
      }
    } else {
      for (const [idx] of multiMatrixQuestion.matrixRows.entries()) {
        await fieldset
          .locator(`input[name="question-${idx}"]`)
          .first()
          .check({ force: true });
      }
    }

    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page
        .locator('h1')
        .filter({ hasText: surveyData.thanksPage.title }),
    ).toBeVisible();
  });

  test('with answer limits exceeded', async ({
    surveyData,
    surveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    await surveyEditPage.createMultiMatrixQuestion({
      ...multiMatrixQuestion,
      answersLimited: { min: 1, max: 1 },
    });
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    // Only desktop viewport: selecting 1 option only for the first row leaves
    // the other rows empty, violating the min=1 constraint for each row
    const viewPortSize = surveyPage.page.viewportSize();
    if (viewPortSize && viewPortSize.width >= 430) {
      const fieldset = surveyPage.page.locator('.question-fieldset');
      await fieldset
        .locator('input[name="question-0"]')
        .first()
        .check({ force: true });

      await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
      await expect(
        surveyPage.page
          .getByRole('alert')
          .getByText(
            'Valitse vähintään 1, enintään 1 vaihtoehtoa kultakin riviltä. Kysymyksen riveillä 2, 3 ja 4 on liian vähän valittuja vastauksia.',
          ),
      ).toBeVisible();
    }
  });
});
