import { expect } from '@playwright/test';
import { getPersonalInfoQuestionData, getTestSurveyData, TEST_SURVEY_URL_NAMES } from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const testSurveyData = getTestSurveyData(TEST_SURVEY_URL_NAMES.personalInfo);
let surveyData = testSurveyData;
const personalInfoQuestion = getPersonalInfoQuestionData(PAGE_NAME);

test.describe('Personal info question', () => {
  test.beforeEach(async ({ shortcuts }) => {
    surveyData = await shortcuts.createSurveyViaApi(testSurveyData);
  });
  test.afterEach(async ({ shortcuts }) => {
    await shortcuts.deleteSurvey();
  });

  test('all fields', async ({ surveyEditPage, surveyPage, shortcuts }) => {
    await surveyEditPage.createPersonalInfoQuestion(personalInfoQuestion);
    await expect(surveyEditPage.page.getByRole('alert')).toHaveText(
      'Kysely tallennettiin onnistuneesti!',
    );

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    const fieldset = surveyPage.page.locator('.question-fieldset');
    await fieldset.getByLabel('Nimi').fill('Testi Testaaja');
    await fieldset.getByLabel('Sähköposti').fill('testi@testaaja.fi');
    await fieldset.getByLabel('Puhelinnumero').fill('0401234567');
    await fieldset.getByLabel('Osoite').fill('Testikatu 1, 00100 Helsinki');
    await fieldset.getByLabel(personalInfoQuestion.customTitle).fill('1234567-8');

    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.locator('h1').filter({ hasText: surveyData.thanksPage.title }),
    ).toBeVisible();
  });

  test('only name and email', async ({ surveyEditPage, surveyPage, shortcuts }) => {
    await surveyEditPage.createPersonalInfoQuestion({
      ...personalInfoQuestion,
      name: true,
      email: true,
      phone: false,
      address: false,
      custom: false,
    });
    await expect(surveyEditPage.page.getByRole('alert')).toHaveText(
      'Kysely tallennettiin onnistuneesti!',
    );

    await shortcuts.publishAndStartSurvey(
      surveyData.title,
      surveyData.urlName,
    );

    const fieldset = surveyPage.page.locator('.question-fieldset');
    await fieldset.getByLabel('Nimi').fill('Testi Testaaja');
    await fieldset.getByLabel('Sähköposti').fill('testi@testaaja.fi');

    await expect(fieldset.getByLabel('Puhelinnumero')).not.toBeVisible();
    await expect(fieldset.getByLabel('Osoite')).not.toBeVisible();

    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    await expect(
      surveyPage.page.locator('h1').filter({ hasText: surveyData.thanksPage.title }),
    ).toBeVisible();
  });
});
