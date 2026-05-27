import { expect } from '@playwright/test';
import { getBudgetingQuestionData, getTestSurveyData, TEST_SURVEY_URL_NAMES } from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.budgeting);
let surveyData = testSurveyData;
const budgetingQuestion = getBudgetingQuestionData(PAGE_NAME);

test.describe('Budgeting question', () => {
  test.beforeEach(async ({ shortcuts }) => {
    surveyData = await shortcuts.createSurveyViaApi(testSurveyData);
  });
  test.afterEach(async ({ shortcuts }) => {
    await shortcuts.deleteSurvey();
  });

  test('allocate budget across targets', async ({
    surveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    await surveyEditPage.createBudgetingQuestion(budgetingQuestion);
    await expect(surveyEditPage.page.getByRole('alert')).toHaveText(
      'Kysely tallennettiin onnistuneesti!',
    );

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
    await expect(surveyEditPage.page.getByRole('alert')).toHaveText(
      'Kysely tallennettiin onnistuneesti!',
    );

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
