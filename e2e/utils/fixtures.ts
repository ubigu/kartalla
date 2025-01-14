import { test as base } from '@playwright/test';
import { SurveyEditPage } from '../pages/surveyEditPage';
import { SurveyAdminPage } from '../pages/adminPage';
import { PublishedSurveyPage } from '../pages/publishedSurveyPage';
import AxeBuilder from '@axe-core/playwright';

interface PageFixtures {
  surveyEditPage: SurveyEditPage;
  surveyAdminPage: SurveyAdminPage;
  surveyPage: PublishedSurveyPage;
}

interface AxeFixture {
  makeAxeBuilder: () => AxeBuilder;
}

export const test = base.extend<PageFixtures & AxeFixture>({
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
});
