import { expect } from '@playwright/test';
import { getCheckBoxQuestionData, testSurveyData } from '../../utils/data';
import { test } from '../../utils/fixtures';
import { clearData, clearSections } from '../../utils/db';

const PAGE_NAME = 'Sivu 1';
let checkBoxQuestion = getCheckBoxQuestionData(PAGE_NAME);

/** Testing question creation and answering to it. */
test.describe.only('CheckBox question', () => {
  test.beforeAll(async ({ workerShortcuts }) => {
    await workerShortcuts.createWorkerSurvey(testSurveyData, PAGE_NAME);
  });
  test.beforeEach(async ({ workerSurveyEditPage }) => {
    // Reload the page to refresh cleared sections
    workerSurveyEditPage.page.reload();
  });
  test.afterEach(async () => {
    await clearSections();
  });

  test.afterAll(async () => {
    await clearData();
  });
  test('without limits', async ({
    workerSurveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    await workerSurveyEditPage.createCheckBoxQuestion(checkBoxQuestion);
    await expect(workerSurveyEditPage.page.getByRole('alert')).toHaveText(
      'Kysely tallennettiin onnistuneesti!',
    );

    // Publish survey and answer question
    await shortcuts.publishAndStartSurvey(
      testSurveyData.title,
      testSurveyData.urlName,
    );

    const checkBoxes = await surveyPage.page.getByRole('checkbox').all();
    expect(checkBoxes).toHaveLength(checkBoxQuestion.answerOptions.length);

    // Multiple can be checked at the same time

    // Click first
    await checkBoxes[0].check();
    expect(await checkBoxes[0].isChecked()).toBe(true);
    for (let i = 1; i < checkBoxes.length; i++) {
      expect(await checkBoxes[i].isChecked()).toBe(false);
    }

    // Click second
    await checkBoxes[1].check();
    expect(await checkBoxes[0].isChecked()).toBe(true);
    expect(await checkBoxes[1].isChecked()).toBe(true);
    for (let i = 2; i < checkBoxes.length; i++) {
      expect(await checkBoxes[i].isChecked()).toBe(false);
    }
  });

  test('with limits', async ({
    workerSurveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    checkBoxQuestion = {
      ...checkBoxQuestion,
      answerLimits: { min: 1, max: 3 },
    };

    await workerSurveyEditPage.createCheckBoxQuestion(checkBoxQuestion);
    await expect(workerSurveyEditPage.page.getByRole('alert')).toHaveText(
      'Kysely tallennettiin onnistuneesti!',
    );

    // Publish survey and answer question
    await shortcuts.publishAndStartSurvey(
      testSurveyData.title,
      testSurveyData.urlName,
    );

    const checkBoxes = await surveyPage.page.getByRole('checkbox').all();
    expect(checkBoxes).toHaveLength(checkBoxQuestion.answerOptions.length);

    // Check within limits
    await checkBoxes[0].check();
    await checkBoxes[1].check();
    await checkBoxes[2].check();
    await checkBoxes[3].check();
    for (let i = 0; i < checkBoxes.length; i++) {
      expect(await checkBoxes[i].isChecked()).toBe(true);
    }

    // Try to submit the survey
    await surveyPage.page.getByRole('button', { name: 'Lähetä' }).click();
    const pageAlerts = await surveyPage.page.getByRole('alert').all();
    expect(pageAlerts).toHaveLength(2);
  });
});
