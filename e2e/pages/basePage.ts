import { Page } from '@playwright/test';
import { BASE_URL } from '../utils/config';

export class BasePage {
  protected _page: Page;
  private _createPage?: (locale: string) => Promise<Page>;
  private _extraHeaders?: Record<string, string>;

  constructor(page: Page, createPage?: (locale: string) => Promise<Page>) {
    this._page = page;
    this._createPage = createPage;
  }

  get page() {
    return this._page;
  }

  /**
   * Applies extra HTTP headers to the current page and remembers them so they
   * are re-applied to any page created by {@link setLocale} (which spins up a
   * fresh context). Used by the localization tests to route requests to a
   * per-worker mock user.
   */
  async setExtraHeaders(headers: Record<string, string>) {
    this._extraHeaders = headers;
    await this._page.setExtraHTTPHeaders(headers);
  }

  async setLocale(locale: string) {
    const oldContext = this._page.context();

    if (this._createPage) {
      this._page = await this._createPage(locale);
    } else {
      const browser = oldContext.browser();
      if (!browser) {
        throw new Error(
          'Unable to set locale. Browser not bound for page context.',
        );
      }
      const viewport = this._page.viewportSize();
      const newContext = await browser.newContext({
        baseURL: BASE_URL,
        locale,
        ...(viewport && { viewport }),
      });
      this._page = await newContext.newPage();
    }
    if (this._extraHeaders) {
      await this._page.setExtraHTTPHeaders(this._extraHeaders);
    }
    await oldContext.close();
  }
}
