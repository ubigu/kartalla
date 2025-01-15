import { expect } from '@playwright/test';
import { getRadioQuestionData, testSurveyData } from '../../utils/data';
import { test } from '../../utils/fixtures';
import { clearData, clearSections } from '../../utils/db';

const PAGE_NAME = 'Sivu 1';
let radioQuestion = getRadioQuestionData(PAGE_NAME);

/** Testing question creation and answering to it. */
test.describe('Radio question', () => {
  test.beforeAll(async ({ workerShortcuts }) => {
    await workerShortcuts.createWorkerSurvey(testSurveyData, PAGE_NAME);
  });
  test.afterEach(async () => {
    await clearSections();
  });
  test.afterAll(async () => {
    await clearData();
  });
  test('with regular options', async ({
    workerSurveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    await workerSurveyEditPage.createRadioQuestion(radioQuestion);
    await expect(workerSurveyEditPage.page.getByRole('alert')).toHaveText(
      'Kysely tallennettiin onnistuneesti!',
    );

    // Publish survey and answer question
    await shortcuts.publishAndStartSurvey(
      testSurveyData.title,
      testSurveyData.urlName,
    );

    const radioButtons = await surveyPage.page.getByRole('radio').all();
    expect(radioButtons).toHaveLength(radioQuestion.answerOptions.length);

    // Only one can be checked at a time

    // Click first
    await radioButtons[0].check();
    expect(await radioButtons[0].isChecked()).toBe(true);
    for (let i = 1; i < radioButtons.length; i++) {
      expect(await radioButtons[i].isChecked()).toBe(false);
    }

    // Click second
    await radioButtons[1].check();
    expect(await radioButtons[1].isChecked()).toBe(true);
    for (let i = 0; i < radioButtons.length; i++) {
      if (i === 1) continue;
      expect(await radioButtons[i].isChecked()).toBe(false);
    }
  });

  test('with alternative answer', async ({
    workerSurveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    await workerSurveyEditPage.goto();

    await workerSurveyEditPage.createRadioQuestion({
      ...radioQuestion,
      allowCustom: true,
    });
    await expect(workerSurveyEditPage.page.getByRole('alert')).toHaveText(
      'Kysely tallennettiin onnistuneesti!',
    );

    // Publish survey and answer question
    await shortcuts.publishAndStartSurvey(
      testSurveyData.title,
      testSurveyData.urlName,
    );

    const radioButtons = await surveyPage.page.getByRole('radio').all();

    expect(radioButtons).toHaveLength(radioQuestion.answerOptions.length + 1);

    // Only one can be checked at a time

    // Click first
    await radioButtons[0].check();
    expect(await radioButtons[0].isChecked()).toBe(true);
    for (let i = 1; i < radioButtons.length; i++) {
      expect(await radioButtons[i].isChecked()).toBe(false);
    }

    // Click second
    await radioButtons[1].check();
    expect(await radioButtons[1].isChecked()).toBe(true);
    for (let i = 0; i < radioButtons.length; i++) {
      if (i === 1) continue;
      expect(await radioButtons[i].isChecked()).toBe(false);
    }

    // Click alternative and write answer
    await surveyPage.page.getByLabel('Jokin muu (täsmennä alla)').check();
    expect(await radioButtons[radioButtons.length - 1].isChecked()).toBe(true); // Last radio button is the custom answer
    await surveyPage.page
      .getByLabel('Täsmennä vastaustasi tässä.')
      .fill('Custom answer');

    for (let i = 0; i < radioButtons.length; i++) {
      if (i === radioButtons.length - 1) continue; // skip alternative answer
      expect(await radioButtons[i].isChecked()).toBe(false);
    }
  });
});
