import { expect } from '@playwright/test';
import { getRadioQuestionData, testSurveyData } from '../utils/data';
import { test } from '../utils/fixtures';
import { clearData } from '../utils/db';

test.describe('Create a survey', () => {
  test.afterAll(async () => {
    await clearData();
  });
  test('with a radio question', async ({
    surveyEditPage,
    surveyAdminPage,
    surveyPage,
    makeAxeBuilder,
  }) => {
    await surveyEditPage.goto();
    await surveyEditPage.fillBasicInfo(testSurveyData);
    expect(surveyEditPage.surveyId).not.toBeNull();
    await surveyEditPage.renamePage('Nimetön sivu', 'Sivu 1');
    const radioQuestion = getRadioQuestionData('Sivu 1');
    await surveyEditPage.createRadioQuestion(radioQuestion);

    await surveyAdminPage.goto();
    await expect(
      surveyAdminPage.page
        .locator('h3')
        .filter({ hasText: testSurveyData.title }),
    ).toBeVisible();
    expect(await surveyAdminPage.getSurveyList()).toHaveLength(1);
    await surveyAdminPage.publishSurvey(testSurveyData.title);

    await surveyPage.goto(testSurveyData.urlName);
    await surveyPage.startSurvey();
    expect(await surveyPage.page.locator('h1').textContent()).toBe(
      testSurveyData.title,
    );
    expect(await surveyPage.page.locator('h3').textContent()).toContain(
      radioQuestion.title,
    );

    expect((await makeAxeBuilder().analyze()).violations).toHaveLength(0);
  });
});
