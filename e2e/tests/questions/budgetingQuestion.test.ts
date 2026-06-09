import { expect } from '@playwright/test';
import { getBudgetingQuestionData, getTestSurveyData, TEST_SURVEY_URL_NAMES } from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.budgeting, ['fi']);
const budgetingQuestion = getBudgetingQuestionData(PAGE_NAME);

test.use({ surveyParams: testSurveyData });

test.describe('Budgeting question', () => {
  test.beforeEach(async ({ surveyData, surveyEditPage }) => {
    surveyEditPage.surveyId = surveyData.id;
    await surveyEditPage.goto();
  });

  test('allocate budget across targets', async ({
    surveyData,
    surveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    await surveyEditPage.createBudgetingQuestion(budgetingQuestion);
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    const fieldset = surveyPage.page.locator('.question-fieldset');
    const spinbuttons = fieldset.getByRole('spinbutton');
    expect(await spinbuttons.count()).toBe(budgetingQuestion.targets.length);

    await spinbuttons.first().fill('30');

    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.locator('h1').filter({ hasText: surveyData.thanksPage.title }),
    ).toBeVisible();
  });

  test('full allocation required', async ({
    surveyData,
    surveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    await surveyEditPage.createBudgetingQuestion(budgetingQuestion);

    const questionLocator = surveyEditPage.page.locator('.section-accordion-expanded');
    await questionLocator
      .getByRole('checkbox', { name: 'Koko budjetti käytettävä' })
      .check();
    await surveyEditPage.page.getByRole('button', { name: 'Tallenna' }).click();
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    const fieldset = surveyPage.page.locator('.question-fieldset');
    await fieldset.getByRole('spinbutton').first().fill('30');

    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.getByText('Vastaa kaikkiin pakolliseksi merkittyihin kysymyksiin.'),
    ).toBeVisible();
  });
});
