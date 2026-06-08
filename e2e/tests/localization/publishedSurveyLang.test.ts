import { Page } from '@playwright/test';
import { SurveyParams } from '../../pages/surveyEditPage';
import { setUserDefaultLanguage } from '../../utils/api';
import { getTestSurveyData } from '../../utils/data';
import { expect, test } from './fixtures';
import { goToBasicSettings, LOCALIZATION_URL_NAME } from './shared';

async function enableMultilingualWithEnglish(page: Page) {
  await goToBasicSettings(page);
  await page
    .getByLabel('Kysely käännetään useille kielille')
    .check({ force: true });
  await page.getByLabel('englanti (en)').click();
  await page.getByRole('button', { name: 'Vahvista kieliasetukset' }).click();
}

test.describe('Public survey language routing', () => {
  let surveyData: SurveyParams & { id: string };

  test.beforeEach(async ({ shortcuts, surveyEditPage, mockUserId }) => {
    surveyData = await shortcuts.createSurveyViaApi(
      getTestSurveyData(LOCALIZATION_URL_NAME),
    );
    surveyEditPage.surveyId = surveyData.id;
    await setUserDefaultLanguage('fi', mockUserId);
  });
  test.afterEach(async ({ shortcuts }) => {
    await shortcuts.deleteSurvey(surveyData.id);
  });

  test('single-language survey ignores lang query param', async ({
    surveyAdminPage,
    surveyPage,
  }) => {
    await surveyAdminPage.goto();
    await surveyAdminPage.publishSurvey(surveyData.title);

    // localisationEnabled is false — ?lang=en should be ignored, UI stays Finnish
    await surveyPage.goto(surveyData.urlName, 'en');
    await expect(
      surveyPage.page.getByRole('button', { name: 'Aloita kysely tästä' }),
    ).toBeVisible();
  });

  test('multilingual survey shows content in the requested language', async ({
    surveyEditPage,
    surveyAdminPage,
    surveyPage,
  }) => {
    await surveyEditPage.goto();
    await enableMultilingualWithEnglish(surveyEditPage.page);
    await surveyEditPage.saveSurvey();

    await surveyAdminPage.goto();
    await surveyAdminPage.publishSurvey(surveyData.title);

    await surveyPage.goto(surveyData.urlName, 'en');
    await expect(
      surveyPage.page.getByRole('button', { name: 'Start the survey' }),
    ).toBeVisible();
  });

  test('multilingual survey falls back to browser language or first language for unsupported lang', async ({
    surveyEditPage,
    surveyAdminPage,
    surveyPage,
  }) => {
    // fi + en enabled, sv is not
    await surveyEditPage.goto();
    await enableMultilingualWithEnglish(surveyEditPage.page);
    await surveyEditPage.saveSurvey();

    await surveyAdminPage.goto();
    await surveyAdminPage.publishSurvey(surveyData.title);

    // ?lang=sv is not an enabled language — should fall back browser default en
    await surveyPage.setLocale('en-Gb');
    await surveyPage.goto(surveyData.urlName, 'sv');
    await expect(
      surveyPage.page.getByRole('button', { name: 'Start the survey' }),
    ).toBeVisible();
    await surveyPage.setLocale('none');
    // ?lang=sv is not an enabled language — should fall back to fi
    await surveyPage.goto(surveyData.urlName, 'sv');
    await expect(
      surveyPage.page.getByRole('button', { name: 'Aloita kysely tästä' }),
    ).toBeVisible();
  });
});
