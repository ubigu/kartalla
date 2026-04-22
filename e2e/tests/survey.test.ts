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
  testSurveyData,
} from '../utils/data';
import { clearData } from '../utils/db';
import { test } from '../utils/fixtures';

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
    await workerShortcuts.createWorkerSurvey(testSurveyData);
  });
  test.afterAll(async () => {
    await clearData();
  });

  test('create questions', async ({ workerSurveyEditPage }) => {
    await workerSurveyEditPage.goto();
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
      surveyAdminPage.page
        .locator('h3')
        .filter({ hasText: testSurveyData.title }),
    ).toBeVisible();
    expect(await surveyAdminPage.getSurveyList()).toHaveLength(1);
    await surveyAdminPage.publishSurvey(testSurveyData.urlName);

    // Start the survey
    await surveyPage.goto(testSurveyData.urlName);
    await surveyPage.startSurvey();

    // Check title
    expect(await surveyPage.page.locator('h1').textContent()).toBe(
      testSurveyData.title,
    );

    // Answer questions
    const firstPageQuestionFieldsets = await surveyPage.page
      .locator('.question-fieldset')
      .all();

    const firstPageQuestions = await Promise.all(
      firstPageQuestionFieldsets.map(async (element) => {
        const title = await element.locator('h3').textContent();
        return { element, title };
      }),
    );

    // Find each question type based on the title used during creation

    // Personal info question
    const personalInfoFieldset = firstPageQuestions.find((item) =>
      item.title?.includes(personalInfoQuestion.title),
    );
    await personalInfoFieldset?.element
      .getByLabel('Nimi')
      .fill('Testi Testaaja');
    await personalInfoFieldset?.element
      .getByLabel('Sähköposti')
      .fill('testi@testaaja.fi');
    await personalInfoFieldset?.element
      .getByLabel('Puhelinnumero')
      .fill('0401234567');
    await personalInfoFieldset?.element
      .getByLabel('Osoite')
      .fill('Testikatu 1, 00100 Helsinki');
    await personalInfoFieldset?.element
      .getByLabel('Y-tunnus')
      .fill('1234567-8');

    // Radio question
    const radioFieldset = firstPageQuestions.find((item) =>
      item.title?.includes(radioQuestion.title),
    );

    // Checkbox question
    const checkBoxFieldset = firstPageQuestions.find((item) =>
      item.title?.includes(checkBoxQuestion.title),
    );

    await Promise.all(
      checkBoxQuestion.answerOptions.map(async (option) => {
        await checkBoxFieldset?.element
          .locator(`input[name=${option}]`)
          .first()
          .check({ force: true }); // Check doesn't work here:
      }),
    );

    // Free text question
    const freeTextFieldset = firstPageQuestions.find((item) =>
      item.title?.includes(freeTextQuestion.title),
    );

    await freeTextFieldset?.element.getByRole('textbox').fill('Testivastaus');

    // Numeric question
    const numericFieldset = firstPageQuestions.find((item) =>
      item.title?.includes(numericQuestion.title),
    );

    if (numericQuestion.maxValue) {
      await numericFieldset?.element
        .getByRole('spinbutton')
        .fill(String(numericQuestion.maxValue));
    } else if (numericQuestion.minValue) {
      await numericFieldset?.element
        .getByRole('spinbutton')
        .fill(String(numericQuestion.minValue));
    } else {
      await numericFieldset?.element.getByRole('spinbutton').fill('5');
    }

    // Try to change page without answering mandatory questions
    await surveyPage.page.getByRole('button', { name: 'Seuraava' }).click();
    await expect(
      surveyPage.page.getByText(
        'Vastaa kaikkiin pakolliseksi merkittyihin kysymyksiin.',
      ),
    ).toBeVisible();
    // Answer mandatory radio question that was left unanswered
    await radioFieldset?.element.getByRole('radio').first().click();
    // Change page
    await surveyPage.page.getByRole('button', { name: 'Seuraava' }).click();
    await expect(
      surveyPage.page.getByRole('button', { name: 'Edellinen' }),
    ).toBeVisible();
    // Wait for the first question of the second page to be visible
    await surveyPage.page
      .locator('.question-fieldset')
      .first()
      .waitFor({ state: 'visible' });
    const secondPageQuestionFieldsets = await surveyPage.page
      .locator('.question-fieldset')
      .all();
    const secondPageQuestions = await Promise.all(
      secondPageQuestionFieldsets.map(async (element) => {
        const title = await element.locator('h3').textContent();
        return { element, title };
      }),
    );

    // Sorting question
    const sortingFieldset = secondPageQuestions.find((item) =>
      item.title?.includes(sortingQuestion.title),
    );

    await sortingFieldset?.element
      .locator('input')
      .first()
      .dragTo(sortingFieldset?.element.locator('input').last());

    // Slider question (number)
    const sliderNumberFieldset = secondPageQuestions.find((item) =>
      item.title?.includes(sliderNumberQuestion.title),
    );

    await sliderNumberFieldset?.element.locator('input').focus();
    await surveyPage.page.keyboard.press('ArrowRight');

    // Slider question (string)
    const sliderStringFieldset = secondPageQuestions.find((item) =>
      item.title?.includes(sliderStringQuestion.title),
    );

    await sliderStringFieldset?.element.locator('input').focus();
    await surveyPage.page.keyboard.press('ArrowRight');

    // Matrix question
    const matrixFieldset = secondPageQuestions.find((item) =>
      item.title?.includes(matrixQuestion.title),
    );

    const viewPortSize = surveyPage.page.viewportSize();
    if (viewPortSize && viewPortSize.width < 430) {
      for (const row of matrixQuestion.matrixRows) {
        await matrixFieldset?.element.getByLabel(row).click();
        // Select listbox is not a child of the fieldset
        await surveyPage.page
          .getByRole('listbox')
          .getByRole('option')
          .first()
          .click();
      }
    } else {
      await Promise.all(
        matrixQuestion.matrixRows.map(async (_row, idx) => {
          await matrixFieldset?.element
            .locator('input')
            .first()
            .check({ force: true }); // Check doesn't work here: https://github.com/microsoft/playwright/issues/27016
        }),
      );
    }

    // Multi matrix question
    const multiMatrixFieldset = secondPageQuestions.find((item) =>
      item.title?.includes(multiMatrixQuestion.title),
    );
    expect(multiMatrixFieldset).toBeDefined();

    if (viewPortSize && viewPortSize.width < 430) {
      for (const row of multiMatrixQuestion.matrixRows) {
        await multiMatrixFieldset?.element.getByLabel(row).click();
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
          await multiMatrixFieldset?.element
            .locator(`input[name="question-${idx}"]`)
            .first()
            .check({ force: true }); // Check doesn't work here: https://github.com/microsoft/playwright/issues/27016
        }),
      );
    }
    // Grouped checkbox question
    const groupedCheckboxFieldset = secondPageQuestions.find((item) =>
      item.title?.includes(groupedCheckboxQuestion.title),
    );

    await groupedCheckboxFieldset?.element.getByRole('button').first().click();
    await groupedCheckboxFieldset?.element.locator('input').first().check();
    await groupedCheckboxFieldset?.element.getByRole('button').last().click();
    await groupedCheckboxFieldset?.element.locator('input').last().check();

    // Accessibility check
    expect((await makeAxeBuilder('main').analyze()).violations).toHaveLength(0);

    await surveyPage.page.getByText('Lähetä').click();

    // Thanks page
    await expect(
      surveyPage.page
        .locator('h1')
        .filter({ hasText: testSurveyData.thanksPage.title }),
    ).toBeVisible();
    expect((await makeAxeBuilder('body').analyze()).violations).toHaveLength(0);

    // Check that submission count has increased by one
    await surveyAdminPage.goto();
    // No point of testing mobile viewports here
    await surveyAdminPage.page.setViewportSize({ width: 1280, height: 720 });
    await expect(
      surveyAdminPage.page
        .locator('h3')
        .filter({ hasText: testSurveyData.title }),
    ).toBeVisible();
    await expect(
      surveyAdminPage.page.getByRole('link', { name: 'Vastaukset (1)' }),
    ).toBeVisible();
  });
});
