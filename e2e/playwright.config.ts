import { PlaywrightTestConfig, devices } from '@playwright/test';
import { BASE_URL } from './utils/config';

const config: PlaywrightTestConfig = {
  globalSetup: './utils/globalSetup',
  globalTeardown: './utils/globalTeardown',
  // The heavy survey tests (create/answer all question types) exceed the
  // default 30s budget on slower engines (Edge, WebKit). Give them headroom.
  timeout: 60 * 1000,
  use: {
    locale: 'fi-FI',
    baseURL: BASE_URL,
  },
  projects: [
    {
      name: 'Chrome',
      testMatch: '/tests/**/*.test.ts',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: { ignoreHTTPSErrors: true },
        viewport: { width: 1280, height: 3000 }, // Tall viewport to avoid scrollable content
      },
    },
    {
      name: 'firefox',
      testMatch: '/tests/survey.test.ts',
      use: {
        ...devices['Desktop Firefox'],
        contextOptions: { ignoreHTTPSErrors: true },
        viewport: { width: 1280, height: 3000 }, // Tall viewport to avoid scrollable content
      },
    },
    {
      name: 'Microsoft Edge',
      testMatch: '/tests/survey.test.ts',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        contextOptions: { ignoreHTTPSErrors: true },
        viewport: { width: 1280, height: 3000 }, // Tall viewport to avoid scrollable content
      },
    },
    {
      name: 'Mobile Chrome',
      testMatch: '/tests/survey.test.ts',
      use: {
        ...devices['Nokia Lumia 520'],
        contextOptions: { ignoreHTTPSErrors: true },
      }, // width: 320, height: 533
    },
    {
      name: 'Mobile Safari',
      testMatch: '/tests/survey.test.ts',
      use: {
        ...devices['iPhone SE'],
        contextOptions: { ignoreHTTPSErrors: true },
      }, // width: 320, height: 568
    },
  ],
};

export default config;
