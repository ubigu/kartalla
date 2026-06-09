import { setUserDefaultLanguage } from '../../utils/api';
import { clearMockUserDefaultLanguage } from '../../utils/db';
import { expect, test } from './fixtures';

test.describe('Admin landing page default language', () => {
  test.beforeEach(async ({ surveyAdminPage, mockUserId }) => {
    await surveyAdminPage.setLocale('fi-FI');
    await clearMockUserDefaultLanguage(mockUserId);
  });

  test.afterEach(async ({ mockUserId }) => {
    await clearMockUserDefaultLanguage(mockUserId);
  });

  test('is always based on query param if available', async ({
    surveyAdminPage,
    mockUserId,
  }) => {
    await setUserDefaultLanguage('fi', mockUserId);
    await surveyAdminPage.goto('en');
    await expect(
      surveyAdminPage.page.getByRole('button', { name: 'User menu' }),
    ).toBeVisible();
  });

  test('is users default language is query param is not provided', async ({
    surveyAdminPage,
    mockUserId,
  }) => {
    await setUserDefaultLanguage('sv', mockUserId);
    await surveyAdminPage.goto();
    await expect(
      surveyAdminPage.page.getByRole('button', { name: 'Användarmeny' }),
    ).toBeVisible();
  });

  test('falls back to browser language', async ({ surveyAdminPage }) => {
    await surveyAdminPage.setLocale('en-Gb');
    await surveyAdminPage.goto();
    await expect(
      surveyAdminPage.page.getByRole('button', { name: 'User menu' }),
    ).toBeVisible();
  });
});
