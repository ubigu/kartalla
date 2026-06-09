import { Page } from '@playwright/test';
import { SurveyEditPage } from '../../pages/surveyEditPage';

export const LOCALIZATION_URL_NAME = 'testikysely-localization';

export async function goToBasicSettings(page: Page) {
  await page.getByRole('link', { name: 'Kyselyn perusasetukset' }).click();
  await page
    .getByRole('heading', { name: 'Kyselyn perusasetukset' })
    .waitFor({ state: 'visible' });
}

export async function initializeWorkingLanguage(
  surveyEditPage: SurveyEditPage,
  languageOption: string,
) {
  const page = surveyEditPage.page;
  await goToBasicSettings(page);
  await page.getByRole('combobox', { name: 'Millä kielellä työstät' }).click();
  await page.getByRole('option', { name: languageOption }).click();
  await page.getByRole('button', { name: 'Vahvista kieliasetukset' }).click();
  await surveyEditPage.saveSurvey();
}
