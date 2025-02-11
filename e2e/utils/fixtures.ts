import { test as base, chromium, devices, Page } from '@playwright/test';
import { SurveyEditPage, SurveyParams } from '../pages/surveyEditPage';
import { SurveyAdminPage } from '../pages/adminPage';
import { PublishedSurveyPage } from '../pages/publishedSurveyPage';
import AxeBuilder from '@axe-core/playwright';

interface PageFixtures {
  surveyEditPage: SurveyEditPage;
  surveyAdminPage: SurveyAdminPage;
  surveyPage: PublishedSurveyPage;
  workerShortcuts: {
    createWorkerSurvey: (surveyData: SurveyParams) => Promise<void>;
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
  makeAxeBuilder: (include: string) => AxeBuilder;
}

export const test = base.extend<PageFixtures & AxeFixture, WorkerPageFixtures>({
  workerSurveyEditPage: [
    async ({ browser }, use) => {
      let page: Page;
      // Prevent mobile viewports for edit page
      if (
        browser.browserType().name() === 'webkit' &&
        (
          (browser.browserType() as any)._defaultContextOptions as Record<
            string,
            any
          >
        ).viewport.width < 1024
      ) {
        // Some problems with webkit mobile browsers here: https://github.com/microsoft/playwright/issues/28364
        const chromiumBrowser = await chromium.launch();
        const desktopContext = await chromiumBrowser.newContext({
          viewport: { width: 1280, height: 720 },
          isMobile: false,
          hasTouch: false,
        });

        page = await desktopContext.newPage();
      } else {
        const context = await browser.newContext({
          viewport: { width: 1280, height: 720 },
          isMobile: false,
          hasTouch: false,
        });
        page = await context.newPage();
      }
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
    const makeAxeBuilder = (include: string) =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['aria-allowed-attr', 'label'])
        .include(include);

    await use(makeAxeBuilder);
  },
  workerShortcuts: async ({ workerSurveyEditPage }, use) => {
    await use({
      /** Creates a worker survey page that can be reused in a describe block */
      async createWorkerSurvey(surveyData: SurveyParams) {
        await workerSurveyEditPage.goto();
        await workerSurveyEditPage.fillBasicInfo(surveyData);
        await workerSurveyEditPage.fillThanksPage(surveyData.thanksPage);
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
