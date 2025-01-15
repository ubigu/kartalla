import { test as base } from '@playwright/test';
import { SurveyEditPage, SurveyParams } from '../pages/surveyEditPage';
import { SurveyAdminPage } from '../pages/adminPage';
import { PublishedSurveyPage } from '../pages/publishedSurveyPage';
import AxeBuilder from '@axe-core/playwright';

interface PageFixtures {
  surveyEditPage: SurveyEditPage;
  surveyAdminPage: SurveyAdminPage;
  surveyPage: PublishedSurveyPage;
  workerShortcuts: {
    createWorkerSurvey: (
      surveyData: SurveyParams,
      pageName: string,
    ) => Promise<void>;
  };
  shortcuts: {
    publishAndStartSurvey: (
      surveyTitle: string,
      surveyUrlName: string,
    ) => Promise<void>;
  };
}
/** Worker fixtures are accessible for every test inside a describe block */
interface WorkerPageFixtures {
  workerSurveyEditPage: SurveyEditPage;
}

interface AxeFixture {
  makeAxeBuilder: () => AxeBuilder;
}

export const test = base.extend<PageFixtures & AxeFixture, WorkerPageFixtures>({
  workerSurveyEditPage: [
    async ({ browser }, use) => {
      const page = await browser.newPage();
      await use(new SurveyEditPage(page));
    },
    { scope: 'worker' },
  ],
  surveyEditPage: async ({ page }, use) => {
    await use(new SurveyEditPage(page));
  },
  surveyAdminPage: async ({ page }, use) => {
    await use(new SurveyAdminPage(page));
  },
  surveyPage: async ({ page }, use) => {
    await use(new PublishedSurveyPage(page));
  },
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['color-contrast', 'aria-allowed-attr'])
        .include('main');

    await use(makeAxeBuilder);
  },
  workerShortcuts: async ({ workerSurveyEditPage }, use) => {
    await use({
      /** Creates a worker survey page that can be reused in a describe block */
      async createWorkerSurvey(surveyData: SurveyParams, pageName: string) {
        await workerSurveyEditPage.goto();
        await workerSurveyEditPage.fillBasicInfo(surveyData);
        await workerSurveyEditPage.renamePage('Nimetön sivu', pageName);
      },
    });
  },
  shortcuts: async ({ surveyAdminPage, surveyPage }, use) => {
    await use({
      /** Publishes and starts a survey with provided title */
      async publishAndStartSurvey(surveyTitle: string, surveyUrlName: string) {
        await surveyAdminPage.goto();
        await surveyAdminPage.publishSurvey(surveyTitle);
        await surveyPage.goto(surveyUrlName);
        await surveyPage.startSurvey();
      },
    });
  },
});
