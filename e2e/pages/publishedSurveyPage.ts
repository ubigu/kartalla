import { Page } from '@playwright/test';

export class PublishedSurveyPage {
  private _page: Page;
  private _workerIdx: number;

  constructor(page: Page, workerIdx: number) {
    this._page = page;
    this._workerIdx = workerIdx;
  }

  get page() {
    return this._page;
  }

  get workerIdx() {
    return this._workerIdx;
  }

  async goto(surveyName: string) {
    await this._page.goto(
      `http://localhost:8080/ubigu2/${surveyName}-${this._workerIdx}`,
    );
  }

  async startSurvey() {
    await this._page
      .getByRole('button', { name: 'Aloita kysely tästä' })
      .click();
  }
}
