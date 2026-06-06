import { expect } from '@playwright/test';
import {
  getRadioQuestionData,
  getTestSurveyData,
  TEST_SURVEY_URL_NAMES,
} from '../../utils/data';
import { test } from '../../utils/fixtures';

const PAGE_NAME = 'Sivu 1';
const radioQuestion = getRadioQuestionData(PAGE_NAME);

test.use({ surveyParams: getTestSurveyData(TEST_SURVEY_URL_NAMES.radio, ['fi']) });

test.describe('Radio question', () => {
  test.beforeEach(async ({ surveyData, surveyEditPage }) => {
    surveyEditPage.surveyId = surveyData.id;
    await surveyEditPage.goto();
  });

  test('with regular options', async ({
    surveyData,
    surveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    await surveyEditPage.createRadioQuestion(radioQuestion);
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(surveyData.title, surveyData.urlName);

    const radioButtons = await surveyPage.page.getByRole('radio').all();
    expect(radioButtons).toHaveLength(radioQuestion.answerOptions.length);

    await radioButtons[0].check();
    expect(await radioButtons[0].isChecked()).toBe(true);
    for (let i = 1; i < radioButtons.length; i++) {
      expect(await radioButtons[i].isChecked()).toBe(false);
    }

    await radioButtons[1].check();
    expect(await radioButtons[1].isChecked()).toBe(true);
    for (let i = 0; i < radioButtons.length; i++) {
      if (i === 1) continue;
      expect(await radioButtons[i].isChecked()).toBe(false);
    }
  });

  test('with alternative answer', async ({
    surveyData,
    surveyEditPage,
    surveyPage,
    shortcuts,
  }) => {
    await surveyEditPage.createRadioQuestion({
      ...radioQuestion,
      allowCustom: true,
    });
    await surveyEditPage.expectSaveSuccess();

    await shortcuts.publishAndStartSurvey(surveyData.title, surveyData.urlName);

    const radioButtons = await surveyPage.page.getByRole('radio').all();
    expect(radioButtons).toHaveLength(radioQuestion.answerOptions.length + 1);

    await radioButtons[0].check();
    expect(await radioButtons[0].isChecked()).toBe(true);
    for (let i = 1; i < radioButtons.length; i++) {
      expect(await radioButtons[i].isChecked()).toBe(false);
    }

    await radioButtons[1].check();
    expect(await radioButtons[1].isChecked()).toBe(true);
    for (let i = 0; i < radioButtons.length; i++) {
      if (i === 1) continue;
      expect(await radioButtons[i].isChecked()).toBe(false);
    }

    await surveyPage.page.getByLabel('Jokin muu (täsmennä alla)').check();
    expect(await radioButtons[radioButtons.length - 1].isChecked()).toBe(true); // last radio is the custom answer option
    await surveyPage.page
      .getByLabel('Täsmennä vastaustasi tässä.')
      .fill('Custom answer');

    for (let i = 0; i < radioButtons.length; i++) {
      if (i === radioButtons.length - 1) continue; // skip the custom answer option
      expect(await radioButtons[i].isChecked()).toBe(false);
    }
  });
});
