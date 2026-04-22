import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  retries: 1,
  testMatch: 'survey.test.ts',
  projects: [
    {
      name: 'Chrome',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: { ignoreHTTPSErrors: true },
        viewport: { width: 1280, height: 3000 }, // Tall viewport to avoid scrollable content
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        contextOptions: { ignoreHTTPSErrors: true },
        viewport: { width: 1280, height: 3000 }, // Tall viewport to avoid scrollable content
      },
    },
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        contextOptions: { ignoreHTTPSErrors: true },
        viewport: { width: 1280, height: 3000 }, // Tall viewport to avoid scrollable content
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Nokia Lumia 520'],
        contextOptions: { ignoreHTTPSErrors: true },
      }, // width: 320, height: 533
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone SE'],
        contextOptions: { ignoreHTTPSErrors: true },
      }, // width: 320, height: 568
    },
  ],
};

export default config;
