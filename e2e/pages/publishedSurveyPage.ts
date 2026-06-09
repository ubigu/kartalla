import { Locator, Page } from '@playwright/test';
import { ORG_SLUG } from '../utils/config';
import { BasePage } from './basePage';

export class PublishedSurveyPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(surveyName: string, lang?: string) {
    await this._page.goto(
      `/${ORG_SLUG}/${surveyName}${lang ? `?lang=${lang}` : ''}`,
    );
  }

  async startSurvey() {
    await this._page
      .getByRole('button', { name: 'Aloita kysely tästä' })
      .click();
  }

  /**
   * Returns the question fieldset on the current page whose heading exactly
   * matches the given title. Lets tests target a question by name instead of
   * relying on DOM order. Exact matching avoids collisions between titles where
   * one contains the other (e.g. "Matriisi" vs "Moni-matriisi").
   */
  getQuestionByTitle(title: string): Locator {
    return this._page.locator('.question-fieldset').filter({
      has: this._page.getByRole('heading', { name: title, exact: true }),
    });
  }

  async goToNextPage() {
    await this._page.getByRole('button', { name: 'Seuraava' }).click();
  }

  async submit() {
    await this._page.getByRole('button', { name: 'Lähetä' }).click();
  }
}
