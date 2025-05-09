import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testMatch: 'survey.test.ts',
  projects: [
    {
      name: 'Chrome',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: { ignoreHTTPSErrors: true },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        contextOptions: { ignoreHTTPSErrors: true },
      },
    },
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        contextOptions: { ignoreHTTPSErrors: true },
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
