import { expect, Page } from '@playwright/test';

export class SurveyAdminPage {
  private _page: Page;

  constructor(page: Page) {
    this._page = page;
  }

  get page() {
    return this._page;
  }

  async goto() {
    await this._page.goto(`http://localhost:8080/admin/`);
  }

  async getSurveyList() {
    return this._page.getByTestId('survey-admin-list').all();
  }

  async publishSurvey(surveyName: string) {
    const surveyItem = this._page.getByRole('listitem').filter({
      has: this._page.getByRole('heading', { name: surveyName, exact: true }),
    });
    const publishButton = surveyItem.getByRole('button', { name: 'julkaise' });
    const unPublishButton = surveyItem.getByRole('button', {
      name: 'Päätä kysely',
    });

    // Need to wait here because isVisible() does not wait for the element to be visible
    await expect(publishButton.or(unPublishButton)).toBeVisible();

    const alreadyPublished = await unPublishButton.isVisible();

    if (alreadyPublished) {
      return;
    }
    await publishButton.click();

    await this._page.getByRole('button', { name: 'Kyllä' }).click();
    await expect(surveyItem.getByText('Julkaistu')).toBeVisible();
  }
}
