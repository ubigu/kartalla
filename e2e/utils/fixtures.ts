import AxeBuilder from '@axe-core/playwright';
import { test as base, Browser, chromium, Page } from '@playwright/test';
import { SurveyAdminPage } from '../pages/adminPage';
import { BasePage } from '../pages/basePage';
import { PublishedSurveyPage } from '../pages/publishedSurveyPage';
import { SurveyEditPage, SurveyParams } from '../pages/surveyEditPage';
import { postSurvey } from './api';
import { BASE_URL } from './config';
import { deleteSurveyById } from './db';

interface PageFixtures {
  basePage: BasePage;
  surveyEditPage: SurveyEditPage;
  surveyAdminPage: SurveyAdminPage;
  surveyPage: PublishedSurveyPage;
  /** Input params for the `surveyData` fixture; set per file via `test.use()`. */
  surveyParams: SurveyParams | undefined;
  /** A survey created via the API before each test and deleted afterwards. */
  surveyData: SurveyParams & { id: string };
  workerShortcuts: {
    createWorkerSurvey: (surveyData: SurveyParams) => Promise<SurveyParams>;
  };
  shortcuts: {
    createSurveyViaApi: (
      surveyData: SurveyParams,
    ) => Promise<SurveyParams & { id: string }>;
    deleteSurvey: (surveyId: string) => Promise<void>;
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
  locale?: string,
): Promise<Page> {
  const contextOptions = {
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 720 } as const,
    isMobile: false,
    hasTouch: false,
    ...(locale && { locale }),
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

/** Builds a desktop SurveyEditPage whose `setLocale` recreates the page in-place. */
async function makeSurveyEditPage(
  browser: Browser,
  browserName: string,
): Promise<SurveyEditPage> {
  const pageFactory = (locale: string) =>
    createDesktopEditPage(browser, browserName, locale);
  const page = await createDesktopEditPage(browser, browserName);
  return new SurveyEditPage(page, undefined, pageFactory);
}

export const test = base.extend<PageFixtures & AxeFixture, WorkerPageFixtures>({
  workerSurveyEditPage: [
    async ({ browser, browserName }, use) => {
      await use(await makeSurveyEditPage(browser, browserName));
    },
    { scope: 'worker' },
  ],
  surveyEditPage: async ({ browser, browserName }, use) => {
    await use(await makeSurveyEditPage(browser, browserName));
  },
  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  },
  surveyAdminPage: async ({ page }, use) => {
    await use(new SurveyAdminPage(page));
  },
  surveyPage: async ({ page }, use) => {
    await use(new PublishedSurveyPage(page));
  },
  surveyParams: [undefined, { option: true }],
  surveyData: async ({ shortcuts, surveyParams }, use) => {
    if (!surveyParams) {
      throw new Error(
        'The `surveyData` fixture requires `surveyParams` to be set via test.use({ surveyParams }).',
      );
    }
    const created = await shortcuts.createSurveyViaApi(surveyParams);
    await use(created);
    await shortcuts.deleteSurvey(created.id);
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
  shortcuts: async ({ surveyAdminPage, surveyPage }, use, workerInfo) => {
    const { workerIndex } = workerInfo;
    await use({
      async createSurveyViaApi(surveyData: SurveyParams) {
        const prefixed = getWorkerSurveyParams(surveyData, workerIndex);
        const id = await postSurvey(prefixed);
        return { ...prefixed, id };
      },
      async deleteSurvey(surveyId: string) {
        await deleteSurveyById(surveyId);
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
