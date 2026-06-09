import { expect } from '@playwright/test';
import {
  getCheckBoxQuestionData,
  getFreeTextQuestionData,
  getGroupedCheckboxQuestionData,
  getMapQuestionData,
  getMatrixQuestionData,
  getMultiMatrixQuestionData,
  getNumericQuestionData,
  getPersonalInfoQuestionData,
  getRadioQuestionData,
  getSliderQuestionDataNumber,
  getSliderQuestionDataString,
  getSortingQuestionData,
  getTestSurveyData,
  TEST_SURVEY_URL_NAMES,
} from '../utils/data';
import { clearTestSurveys } from '../utils/db';
import { test } from '../utils/fixtures';

const testSurveyData = {
  ...getTestSurveyData(TEST_SURVEY_URL_NAMES.survey, ['fi']),
  pageNames: ['Sivu 1', 'Sivu 2'],
};
let surveyData = testSurveyData;

const personalInfoQuestion = getPersonalInfoQuestionData(
  testSurveyData.pageNames[0],
);
const radioQuestion = getRadioQuestionData(testSurveyData.pageNames[0]);
const checkBoxQuestion = getCheckBoxQuestionData(testSurveyData.pageNames[0]);
const freeTextQuestion = getFreeTextQuestionData(testSurveyData.pageNames[0]);
const numericQuestion = getNumericQuestionData(testSurveyData.pageNames[0]);
const mapQuestion = getMapQuestionData(testSurveyData.pageNames[1]);
const sortingQuestion = getSortingQuestionData(testSurveyData.pageNames[1]);
const sliderNumberQuestion = getSliderQuestionDataNumber(
  testSurveyData.pageNames[1],
);
const sliderStringQuestion = getSliderQuestionDataString(
  testSurveyData.pageNames[1],
);
const matrixQuestion = getMatrixQuestionData(testSurveyData.pageNames[1]);
const multiMatrixQuestion = getMultiMatrixQuestionData(
  testSurveyData.pageNames[1],
);
const groupedCheckboxQuestion = getGroupedCheckboxQuestionData(
  testSurveyData.pageNames[1],
);

test.describe('Survey test', () => {
  test.beforeAll(async ({ workerShortcuts }) => {
    surveyData = await workerShortcuts.createWorkerSurvey(testSurveyData);
  });
  test.afterAll(async () => {
    await clearTestSurveys([TEST_SURVEY_URL_NAMES.survey]);
  });

  test('create questions', async ({ workerSurveyEditPage, makeAxeBuilder }) => {
    await workerSurveyEditPage.goto();
    expect((await makeAxeBuilder('body').analyze()).violations).toHaveLength(0);
    await workerSurveyEditPage.createPersonalInfoQuestion(personalInfoQuestion);
    await workerSurveyEditPage.createRadioQuestion({
      ...radioQuestion,
      isRequired: true,
    });
    await workerSurveyEditPage.createCheckBoxQuestion(checkBoxQuestion);

    await workerSurveyEditPage.createFreeTextQuestion(freeTextQuestion);
    await workerSurveyEditPage.createNumericQuestion(numericQuestion);
    await workerSurveyEditPage.createMapQuestion(mapQuestion);
    await workerSurveyEditPage.createSortingQuestion(sortingQuestion);
    await workerSurveyEditPage.createSliderQuestion(sliderNumberQuestion);
    await workerSurveyEditPage.createSliderQuestion(sliderStringQuestion);
    await workerSurveyEditPage.createMatrixQuestion(matrixQuestion);
    await workerSurveyEditPage.createMultiMatrixQuestion(multiMatrixQuestion);
    await workerSurveyEditPage.createGroupedCheckboxQuestion(
      groupedCheckboxQuestion,
    );
  });
  test('answer survey', async ({
    surveyAdminPage,
    surveyPage,
    makeAxeBuilder,
  }) => {
    await surveyAdminPage.goto();
    await expect(
      surveyAdminPage.page.locator('h3').filter({ hasText: surveyData.title }),
    ).toBeVisible();
    expect(await surveyAdminPage.getSurveyList()).toHaveLength(1);
    await surveyAdminPage.publishSurvey(surveyData.urlName);

    // Start the survey
    await surveyPage.goto(surveyData.urlName);
    await surveyPage.startSurvey();

    // Check title
    expect(await surveyPage.page.locator('h1').textContent()).toBe(
      surveyData.title,
    );

    // Answer questions, targeting each by the title used during creation

    // Personal info question
    const personalInfoFieldset = surveyPage.getQuestionByTitle(
      personalInfoQuestion.title,
    );
    await personalInfoFieldset.getByLabel('Nimi').fill('Testi Testaaja');
    await personalInfoFieldset
      .getByLabel('Sähköposti')
      .fill('testi@testaaja.fi');
    await personalInfoFieldset.getByLabel('Puhelinnumero').fill('0401234567');
    await personalInfoFieldset
      .getByLabel('Osoite')
      .fill('Testikatu 1, 00100 Helsinki');
    await personalInfoFieldset.getByLabel('Y-tunnus').fill('1234567-8');

    // Radio question
    const radioFieldset = surveyPage.getQuestionByTitle(radioQuestion.title);

    // Checkbox question
    const checkBoxFieldset = surveyPage.getQuestionByTitle(
      checkBoxQuestion.title,
    );
    await Promise.all(
      checkBoxQuestion.answerOptions.map(async (option) => {
        await checkBoxFieldset
          .locator(`input[name=${option}]`)
          .first()
          .check({ force: true }); // Check doesn't work here:
      }),
    );

    // Free text question
    const freeTextFieldset = surveyPage.getQuestionByTitle(
      freeTextQuestion.title,
    );
    await freeTextFieldset.getByRole('textbox').fill('Testivastaus');

    // Numeric question
    const numericFieldset = surveyPage.getQuestionByTitle(numericQuestion.title);
    if (numericQuestion.maxValue) {
      await numericFieldset
        .getByRole('spinbutton')
        .fill(String(numericQuestion.maxValue));
    } else if (numericQuestion.minValue) {
      await numericFieldset
        .getByRole('spinbutton')
        .fill(String(numericQuestion.minValue));
    } else {
      await numericFieldset.getByRole('spinbutton').fill('5');
    }

    // Try to change page without answering mandatory questions
    await surveyPage.goToNextPage();
    await expect(
      surveyPage.page.getByText(
        'Vastaa kaikkiin pakolliseksi merkittyihin kysymyksiin.',
      ),
    ).toBeVisible();
    // Answer mandatory radio question that was left unanswered
    await radioFieldset.getByRole('radio').first().click();
    // Change page
    await surveyPage.goToNextPage();
    await expect(
      surveyPage.page.getByRole('button', { name: 'Edellinen' }),
    ).toBeVisible();
    // Wait for the first question of the second page to be visible
    await surveyPage.page
      .locator('.question-fieldset')
      .first()
      .waitFor({ state: 'visible' });

    // Sorting question
    const sortingFieldset = surveyPage.getQuestionByTitle(sortingQuestion.title);
    await sortingFieldset
      .locator('input')
      .first()
      .dragTo(sortingFieldset.locator('input').last());

    // Slider question (number)
    const sliderNumberFieldset = surveyPage.getQuestionByTitle(
      sliderNumberQuestion.title,
    );
    await sliderNumberFieldset.locator('input').focus();
    await surveyPage.page.keyboard.press('ArrowRight');

    // Slider question (string)
    const sliderStringFieldset = surveyPage.getQuestionByTitle(
      sliderStringQuestion.title,
    );
    await sliderStringFieldset.locator('input').focus();
    await surveyPage.page.keyboard.press('ArrowRight');

    // Matrix question
    const matrixFieldset = surveyPage.getQuestionByTitle(matrixQuestion.title);
    const viewPortSize = surveyPage.page.viewportSize();
    if (viewPortSize && viewPortSize.width < 430) {
      for (const row of matrixQuestion.matrixRows) {
        await matrixFieldset.getByLabel(row).click();
        // Select listbox is not a child of the fieldset
        await surveyPage.page
          .getByRole('listbox')
          .getByRole('option')
          .first()
          .click();
      }
    } else {
      await Promise.all(
        matrixQuestion.matrixRows.map(async () => {
          await matrixFieldset
            .locator('input')
            .first()
            .check({ force: true }); // Check doesn't work here: https://github.com/microsoft/playwright/issues/27016
        }),
      );
    }

    // Multi matrix question
    const multiMatrixFieldset = surveyPage.getQuestionByTitle(
      multiMatrixQuestion.title,
    );
    await expect(multiMatrixFieldset).toBeVisible();

    if (viewPortSize && viewPortSize.width < 430) {
      for (const row of multiMatrixQuestion.matrixRows) {
        await multiMatrixFieldset.getByLabel(row).click();
        // Select listbox is not a child of the fieldset
        await surveyPage.page
          .getByRole('listbox')
          .getByRole('option')
          .first()
          .click();
        await surveyPage.page.keyboard.press('Escape');
      }
    } else {
      await Promise.all(
        multiMatrixQuestion.matrixRows.map(async (_row, idx) => {
          await multiMatrixFieldset
            .locator(`input[name="question-${idx}"]`)
            .first()
            .check({ force: true }); // Check doesn't work here: https://github.com/microsoft/playwright/issues/27016
        }),
      );
    }
    // Grouped checkbox question
    const groupedCheckboxFieldset = surveyPage.getQuestionByTitle(
      groupedCheckboxQuestion.title,
    );
    await groupedCheckboxFieldset.getByRole('button').first().click();
    await groupedCheckboxFieldset.locator('input').first().check();
    await groupedCheckboxFieldset.getByRole('button').last().click();
    await groupedCheckboxFieldset.locator('input').last().check();

    // Accessibility check
    expect((await makeAxeBuilder('main').analyze()).violations).toHaveLength(0);

    await surveyPage.submit();

    // Thanks page
    await expect(
      surveyPage.page
        .locator('h1')
        .filter({ hasText: surveyData.thanksPage.title }),
    ).toBeVisible();
    expect((await makeAxeBuilder('body').analyze()).violations).toHaveLength(0);

    // Check that submission count has increased by one
    await surveyAdminPage.goto();
    // No point of testing mobile viewports here
    await surveyAdminPage.page.setViewportSize({ width: 1280, height: 720 });
    await expect(
      surveyAdminPage.page.locator('h3').filter({ hasText: surveyData.title }),
    ).toBeVisible();
    const surveyItem = surveyAdminPage.page.getByRole('listitem').filter({
      has: surveyAdminPage.page.getByRole('heading', {
        name: surveyData.title,
        exact: true,
      }),
    });
    await expect(
      surveyItem.getByRole('link', { name: 'Vastaukset (1)' }),
    ).toBeVisible();
  });
});
