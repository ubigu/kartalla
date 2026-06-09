import { test as base } from '../../utils/fixtures';

const BASE_MOCK_USER_ID =
  process.env.MOCK_USER_ID ?? '12345-67890-abcde-fghij3';

interface LocalizationWorkerFixtures {
  /**
   * A mock user id unique to each Playwright worker. The localization tests
   * mutate the user's persisted default language, which is shared global state
   * on the default mock user. Routing those requests (both browser and
   * node-side helpers) to a per-worker user keeps the tests isolated from each
   * other and from the rest of the suite while preserving full parallelism.
   */
  mockUserId: string;
}

/**
 * Test fixture for the localization tests. Each worker gets its own mock user
 * (via the `x-mock-user-id` header honored by the server's mock auth) so the
 * persisted default language can be changed without affecting parallel tests.
 */
export const test = base.extend<object, LocalizationWorkerFixtures>({
  mockUserId: [
    async ({}, use, workerInfo) => {
      await use(`${BASE_MOCK_USER_ID}-loc-w${workerInfo.workerIndex}`);
    },
    { scope: 'worker' },
  ],
  surveyAdminPage: async ({ surveyAdminPage, mockUserId }, use) => {
    await surveyAdminPage.setExtraHeaders({ 'x-mock-user-id': mockUserId });
    await use(surveyAdminPage);
  },
  surveyEditPage: async ({ surveyEditPage, mockUserId }, use) => {
    await surveyEditPage.setExtraHeaders({ 'x-mock-user-id': mockUserId });
    await use(surveyEditPage);
  },
  surveyPage: async ({ surveyPage, mockUserId }, use) => {
    await surveyPage.setExtraHeaders({ 'x-mock-user-id': mockUserId });
    await use(surveyPage);
  },
});

export { expect } from '@playwright/test';
