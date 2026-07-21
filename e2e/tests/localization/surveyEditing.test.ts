import { SurveyEditPage, SurveyParams } from '../../pages/surveyEditPage';
import { setUserDefaultLanguage } from '../../utils/api';
import { getMatrixQuestionData, getTestSurveyData } from '../../utils/data';
import { expect, test } from './fixtures';
import {
  goToBasicSettings,
  initializeWorkingLanguage,
  LOCALIZATION_URL_NAME,
} from './shared';

async function enableMultilingualAddEnglishThenSwitchBack(
  surveyEditPage: SurveyEditPage,
) {
  const page = surveyEditPage.page;
  await page.getByRole('combobox', { name: 'Kyselyn kieli' }).click();
  await page.getByRole('option', { name: 'Monikielinen' }).click();
  await page.getByLabel('englanti (en)').click();
  await surveyEditPage.saveSurvey();

  await page.getByRole('combobox', { name: /Työstökieli/i }).click();
  await page.getByRole('option', { name: /englanti \(en\)/i }).click();

  await goToBasicSettings(page);
  await page.getByLabel('Kyselyn otsikko *').fill('English survey title');
  await surveyEditPage.saveSurvey();

  await page.getByRole('link', { name: 'Kieliasetukset' }).click();
  await page.getByRole('combobox', { name: 'Kyselyn kieli' }).click();
  await page.getByRole('option', { name: /suomi \(fi\)/i }).click();
}

async function fillMandatoryBasicSettings(surveyEditPage: SurveyEditPage) {
  const page = surveyEditPage.page;
  await goToBasicSettings(page);
  await page.getByLabel('Kyselyn otsikko *').fill('Test survey title');
  await page.getByLabel('Osoite * ').fill(LOCALIZATION_URL_NAME);
  await page.getByLabel('Kyselyn laatija/yhteyshenkilö *').fill('Testaaja');
  await surveyEditPage.saveSurvey();
}

test.describe('Survey edit language settings', () => {
  let surveyData: SurveyParams & { id: string };

  test.beforeEach(async ({ shortcuts, surveyEditPage, mockUserId }) => {
    await setUserDefaultLanguage('fi', mockUserId);
    surveyData = await shortcuts.createSurveyViaApi(
      getTestSurveyData(LOCALIZATION_URL_NAME),
    );
    surveyEditPage.surveyId = surveyData.id;
    await surveyEditPage.goto();
  });

  test.afterEach(async ({ shortcuts }) => {
    await shortcuts.deleteSurvey(surveyData.id);
  });

  test('default working language is the same as application language for new surveys', async ({
    surveyAdminPage,
  }) => {
    await surveyAdminPage.setLocale('fi-FI');
    await surveyAdminPage.goto();
    await surveyAdminPage.page
      .getByRole('button', { name: 'Vaihda palvelun kieltä' })
      .click();
    await surveyAdminPage.page
      .getByRole('menuitem', { name: 'English (EN)' })
      .click();
    await surveyAdminPage.page.getByRole('menu').waitFor({ state: 'detached' });
    await expect(
      surveyAdminPage.page.getByText(surveyData.title).first(),
    ).toBeVisible();

    await surveyAdminPage.page
      .getByRole('button', { name: 'Create a new survey' })
      .click();

    await surveyAdminPage.page
      .getByLabel('In which language are you building the survey?')
      .waitFor({ state: 'visible' });

    await expect(
      surveyAdminPage.page.getByRole('combobox', {
        name: /In which language are you building the survey\?/i,
      }),
    ).toContainText('english (en)');
  });

  test('persist working language on navigation', async ({ surveyEditPage }) => {
    await initializeWorkingLanguage(surveyEditPage, 'englanti (en)');

    await surveyEditPage.goto();
    await surveyEditPage.goToPage('Kieliasetukset');
    await expect(
      surveyEditPage.page.getByRole('combobox', { name: 'Kyselyn kieli' }),
    ).toContainText('englanti (en)');
  });

  test('can enable multilingual mode', async ({ surveyEditPage }) => {
    await initializeWorkingLanguage(surveyEditPage, 'suomi (fi)');
    await surveyEditPage.goToPage('Kieliasetukset');
    await expect(
      surveyEditPage.page.getByText('Kyselyssä tuetut kielet'),
    ).not.toBeVisible();

    await surveyEditPage.page
      .getByRole('combobox', { name: 'Kyselyn kieli' })
      .click();
    await surveyEditPage.page
      .getByRole('option', { name: 'Monikielinen' })
      .click();

    await expect(
      surveyEditPage.page.getByText('Kyselyssä tuetut kielet'),
    ).toBeVisible();
    await surveyEditPage.saveSurvey();
    await expect(surveyEditPage.page.getByText('Monikielinen')).toBeVisible();
    await expect(
      surveyEditPage.page.getByRole('combobox', {
        name: 'Työstökieli suomi (fi)',
      }),
    ).toBeVisible();
  });

  test('can add supported languages when multilingual', async ({
    surveyEditPage,
  }) => {
    await initializeWorkingLanguage(surveyEditPage, 'suomi (fi)');
    await surveyEditPage.goToPage('Kieliasetukset');

    await surveyEditPage.page
      .getByRole('combobox', { name: 'Kyselyn kieli' })
      .click();
    await surveyEditPage.page
      .getByRole('option', { name: 'Monikielinen' })
      .click();

    await expect(
      surveyEditPage.page.getByLabel('suomi (fi): käännöksiä syötetty 5/6'),
    ).toBeChecked();
    await expect(
      surveyEditPage.page.getByLabel('englanti (en): käännöksiä syötetty 0/6'),
    ).not.toBeChecked();

    await surveyEditPage.page
      .getByLabel('englanti (en): käännöksiä syötetty 0/6')
      .click();
    await expect(
      surveyEditPage.page.getByLabel('englanti (en): käännöksiä syötetty 0/6'),
    ).toBeChecked();

    await surveyEditPage.saveSurvey();
  });

  test.describe('Single language mode', () => {
    test.beforeEach(async ({ surveyEditPage }) => {
      await initializeWorkingLanguage(surveyEditPage, 'suomi (fi)');
      await surveyEditPage.goToPage('Kieliasetukset');
    });

    test('can move translations to new language when changing working language', async ({
      surveyEditPage,
    }) => {
      const page = surveyEditPage.page;
      await page.getByRole('combobox', { name: 'Kyselyn kieli' }).click();
      await page.getByRole('option', { name: /englanti \(en\)/i }).click();

      await expect(
        page.getByText('Mitä tehdään nykyiselle sisällölle?'),
      ).toBeVisible();
      await page
        .getByRole('button', { name: /Sisältö on jo kielellä englanti/i })
        .click();

      await surveyEditPage.saveSurvey();
      await expect(
        page.getByRole('combobox', { name: 'Kyselyn kieli' }),
      ).toContainText('englanti (en)');
      await goToBasicSettings(page);
      await expect(
        page.getByRole('textbox', { name: 'Kyselyn otsikko' }),
      ).toHaveValue(surveyData.title);
    });

    test('can choose not to move translations when changing working language', async ({
      surveyEditPage,
    }) => {
      const page = surveyEditPage.page;
      await page.getByRole('combobox', { name: 'Kyselyn kieli' }).click();
      await page.getByRole('option', { name: /englanti \(en\)/i }).click();

      await expect(
        page.getByText('Mitä tehdään nykyiselle sisällölle?'),
      ).toBeVisible();
      await page
        .getByRole('button', { name: /Sisältö on kielellä suomi\./i })
        .click();

      await surveyEditPage.saveSurvey();
      await expect(
        page.getByRole('combobox', { name: 'Kyselyn kieli' }),
      ).toContainText('englanti (en)');
      await goToBasicSettings(page);
      await expect(page.getByLabel('Kyselyn otsikko')).toBeEmpty();
    });

    test('shows translations per language listed after switching from multilingual', async ({
      surveyEditPage,
    }) => {
      await enableMultilingualAddEnglishThenSwitchBack(surveyEditPage);

      await expect(
        surveyEditPage.page.getByText('Syötetyt käännökset'),
      ).toBeVisible();
      await expect(
        surveyEditPage.page.getByRole('button', {
          name: 'Poista käännökset...',
        }),
      ).toBeVisible();
    });

    test('can delete translations from a language other than working language', async ({
      surveyEditPage,
    }) => {
      await enableMultilingualAddEnglishThenSwitchBack(surveyEditPage);

      await surveyEditPage.page
        .getByRole('button', { name: 'Poista käännökset...' })
        .click();

      await surveyEditPage.saveSurvey();

      await expect(
        surveyEditPage.page.getByText('Syötetyt käännökset'),
      ).not.toBeVisible();
    });
  });

  test.describe('Multilingual mode', () => {
    test.beforeEach(async ({ surveyEditPage }) => {
      await initializeWorkingLanguage(surveyEditPage, 'suomi (fi)');
      await surveyEditPage.goToPage('Kieliasetukset');
      await surveyEditPage.page
        .getByRole('combobox', { name: 'Kyselyn kieli' })
        .click();
      await surveyEditPage.page
        .getByRole('option', { name: 'Monikielinen' })
        .click();
      await surveyEditPage.page
        .getByLabel('englanti (en): käännöksiä syötetty 0/6')
        .click();
      await surveyEditPage.saveSurvey();
    });

    test('last selected language checkbox is disabled', async ({
      surveyEditPage,
    }) => {
      const page = surveyEditPage.page;
      await page.getByLabel('englanti (en): käännöksiä syötetty 0/6').click();

      await expect(
        page.getByLabel('suomi (fi): käännöksiä syötetty 5/6'),
      ).toBeDisabled();
    });

    test('working language changes to remaining language when current working language is deselected', async ({
      surveyEditPage,
    }) => {
      const page = surveyEditPage.page;
      await expect(
        page.getByRole('combobox', { name: /Työstökieli.*suomi/i }),
      ).toBeVisible();
      await page.getByLabel('suomi (fi): käännöksiä syötetty 5/6').click();

      await expect(
        page.getByRole('combobox', { name: /Työstökieli.*englanti/i }),
      ).toBeVisible();
    });

    test('can delete translations from an unchecked language', async ({
      surveyEditPage,
    }) => {
      const page = surveyEditPage.page;
      await surveyEditPage.createMatrixQuestion(
        getMatrixQuestionData('Sivu 1'),
        ['fi', 'en'],
      );
      await surveyEditPage.expectSaveSuccess();

      await page.getByRole('combobox', { name: 'Työstökieli' }).click();
      await page.getByRole('option', { name: 'englanti (en)' }).click();
      await fillMandatoryBasicSettings(surveyEditPage);
      await page.getByRole('combobox', { name: 'Työstökieli' }).click();
      await page.getByRole('option', { name: 'suomi (fi)' }).click();

      await page.getByRole('combobox', { name: /Työstökieli/i }).click();
      await page.getByRole('option', { name: /englanti \(en\)/i }).click();

      await surveyEditPage.goToPage('Kieliasetukset');
      await page.getByLabel('suomi (fi): käännöksiä syötetty 12/13').click();

      await page.getByRole('button', { name: 'Poista käännökset...' }).click();
      await surveyEditPage.saveSurvey();

      await expect(
        page.getByLabel('suomi (fi): käännöksiä syötetty 0/13'),
      ).toBeVisible();
    });
  });
});
