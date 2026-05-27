import AxeBuilder from '@axe-core/playwright';
import { test as base, Browser, chromium, Page } from '@playwright/test';
import { SurveyAdminPage } from '../pages/adminPage';
import { PublishedSurveyPage } from '../pages/publishedSurveyPage';
import { SurveyEditPage, SurveyParams } from '../pages/surveyEditPage';
import { createSurveyViaApi } from './api';
import { deleteSurveyById } from './db';

interface PageFixtures {
  surveyEditPage: SurveyEditPage;
  surveyAdminPage: SurveyAdminPage;
  surveyPage: PublishedSurveyPage;
  workerShortcuts: {
    createWorkerSurvey: (surveyData: SurveyParams) => Promise<SurveyParams>;
  };
  shortcuts: {
    createSurveyViaApi: (surveyData: SurveyParams) => Promise<SurveyParams>;
    deleteSurvey: () => Promise<void>;
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

// Always use chromium for edit page because firefox is not working in CI: https://github.com/microsoft/playwright/issues/32236
// Some problems with webkit mobile browsers here: https://github.com/microsoft/playwright/issues/28364
async function createDesktopEditPage(
  browser: Browser,
  browserName: string,
): Promise<Page> {
  const contextOptions = {
    viewport: { width: 1280, height: 720 } as const,
    isMobile: false,
    hasTouch: false,
  };
  const context =
    browserName !== 'chromium'
      ? await (await chromium.launch()).newContext(contextOptions)
      : await browser.newContext(contextOptions);
  return context.newPage();
}

function getWorkerSurveyParams(
  surveyParams: SurveyParams,
  workerIndex: number,
) {
  return {
    ...surveyParams,
    title: `${surveyParams.title}-${workerIndex}`,
    urlName: `${surveyParams.urlName}-${workerIndex}`,
  };
}

export const test = base.extend<PageFixtures & AxeFixture, WorkerPageFixtures>({
  workerSurveyEditPage: [
    async ({ browser, browserName }, use) => {
      await use(
        new SurveyEditPage(await createDesktopEditPage(browser, browserName)),
      );
    },
    { scope: 'worker' },
  ],
  surveyEditPage: async ({ browser, browserName }, use) => {
    await use(
      new SurveyEditPage(await createDesktopEditPage(browser, browserName)),
    );
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
  workerShortcuts: async ({ workerSurveyEditPage }, use, workerInfo) => {
    const { workerIndex } = workerInfo;
    await use({
      /** Creates a worker survey page that can be reused in a describe block */
      async createWorkerSurvey(surveyData: SurveyParams) {
        const prefixed = getWorkerSurveyParams(surveyData, workerIndex);
        await workerSurveyEditPage.goto();
        await workerSurveyEditPage.fillBasicInfo(prefixed);
        await workerSurveyEditPage.fillThanksPage(prefixed.thanksPage);
        await workerSurveyEditPage.saveSurvey();
        return prefixed;
      },
    });
  },
  shortcuts: async (
    { surveyEditPage, surveyAdminPage, surveyPage },
    use,
    workerInfo,
  ) => {
    const { workerIndex } = workerInfo;
    await use({
      async createSurveyViaApi(surveyData: SurveyParams) {
        const prefixed = getWorkerSurveyParams(surveyData, workerIndex);
        const id = await createSurveyViaApi(prefixed);
        surveyEditPage.surveyId = id;
        await surveyEditPage.goto();
        return prefixed;
      },
      async deleteSurvey() {
        const id = surveyEditPage.surveyId;
        if (id) await deleteSurveyById(id);
      },
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
