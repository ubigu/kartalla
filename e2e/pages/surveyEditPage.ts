import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

interface SurveyThanksPageParams {
  title: string;
  text: string;
}
export interface SurveyParams {
  title: string;
  subtitle: string;
  urlName: string;
  author: string;
  startDate: string; // DD.MM.YYYY hh:mm
  endDate: string; // DD.MM.YYYY hh:mm
  thanksPage: SurveyThanksPageParams;
  pageNames: string[];
  languages?: string[];
}

interface CommonQuestionParams {
  pageName: string;
  title: string;
  isRequired?: boolean;
  additionalInfo?: string;
}

export interface PersonalInfoQuestionParams extends CommonQuestionParams {
  name: boolean;
  email: boolean;
  phone: boolean;
  address: boolean;
  custom: boolean;
  customTitle: string;
}

export interface RadioQuestionParams extends CommonQuestionParams {
  answerOptions: string[];
  allowCustom?: boolean;
  additionalInfo?: string;
}

export interface CheckBoxQuestionParams extends CommonQuestionParams {
  answerOptions: string[];
  answerLimits?: { min: number; max: number };
  allowCustom?: boolean;
}

export interface FreeTextQuestionParams extends CommonQuestionParams {
  maxLength?: number;
}

export interface NumericQuestionParams extends CommonQuestionParams {
  minValue?: number;
  maxValue?: number;
}

export interface MapQuestionParams extends CommonQuestionParams {
  selectionTypes: ('point' | 'line' | 'area')[];
  subQuestionParams?: any[];
}

export interface SortingQuestionParams extends CommonQuestionParams {
  answerOptions: string[];
}

export interface SliderQuestionParams extends CommonQuestionParams {
  variant: 'string' | 'number';
  minValue: number | string;
  maxValue: number | string;
}

export interface MultiMatrixQuestionParams extends CommonQuestionParams {
  matrixRows: string[];
  matrixColumns: string[];
  answersLimited?: { min: number; max: number };
  allowEmpty?: boolean;
}

export interface MatrixQuestionParams extends CommonQuestionParams {
  matrixRows: string[];
  matrixColumns: string[];
}

export interface CheckboxGroupParams {
  groupTitle: string;
  answerOptions: string[];
}

export interface GroupedCheckboxQuestionParams extends CommonQuestionParams {
  groups: CheckboxGroupParams[];
  limitAnswers?: { min: number; max: number };
}

export interface AttachmentQuestionParams extends CommonQuestionParams {}

export interface BudgetingQuestionParams extends CommonQuestionParams {
  totalBudget: number;
  unit?: string;
  targets: string[];
}

export class SurveyEditPage extends BasePage {
  private _surveyId: string | null;

  constructor(
    page: Page,
    surveyId?: string,
    createPage?: (locale: string) => Promise<Page>,
  ) {
    super(page, createPage);
    this._surveyId = surveyId ?? null;
  }

  get surveyId() {
    return this._surveyId;
  }

  set surveyId(id) {
    this._surveyId = id;
  }

  async goto() {
    if (this._surveyId) {
      await this._page.goto(`/admin/kyselyt/${this._surveyId}`);
    } else {
      await this._page.goto('/admin');
      await this._page.getByRole('button', { name: 'Uusi kysely' }).click();
      await this._page.waitForURL('**/admin/kyselyt/*/perusasetukset');
      const urlParts = this._page.url().split('/');
      this._surveyId = urlParts[urlParts.length - 2];
    }
  }

  async fillBasicInfo(params: SurveyParams) {
    await this._page
      .getByRole('link', { name: 'Kyselyn perusasetukset' })
      .click();
    if (params.languages) {
      for (const lang of params.languages) {
        await this._page
          .getByRole('combobox', { name: 'Millä kielellä työstät' })
          .click();
        await this._page.getByRole('option', { name: lang }).click();
      }

      await this._page
        .getByRole('button', { name: 'Vahvista kieliasetukset' })
        .click();
    }
    await this._page.getByLabel('Kyselyn otsikko *').fill(params.title);
    await this._page.getByLabel('Kyselyn aliotsikko').fill(params.subtitle);
    await this._page.getByLabel('Osoite *').fill(params.urlName);
    await this._page
      .getByRole('textbox', { name: 'Kyselyn laatija/yhteyshenkilö' })
      .fill(params.author);
    await this._page.getByLabel('Alkamisaika').fill(params.startDate);
    await this._page.getByLabel('Loppumisaika').fill(params.endDate);
    await this.renamePage('Nimetön sivu', params.pageNames[0]);
    for (const pageName of params.pageNames.slice(1)) {
      await this._page
        .getByLabel('Navigointivalikko')
        .getByText('Lisää uusi sivu')
        .click();
      await this.renamePage('Nimetön sivu', pageName);
    }
  }

  async fillThanksPage(params: SurveyThanksPageParams) {
    await this._page.getByRole('link', { name: 'Kiitos-sivu' }).click();
    await this._page.getByLabel('Kiitos-sivun otsikko').fill(params.title);
    await this._page
      .getByLabel('Kiitos-sivun teksti')
      .locator('div')
      .nth(2)
      .fill(params.text);
  }

  async saveSurvey() {
    const saveButton = this._page.getByRole('button', { name: 'Tallenna' });
    await saveButton.waitFor({ state: 'visible' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(this._page.getByRole('alert')).toBeVisible();
  }

  /** Asserts the "survey saved successfully" notification is shown. */
  async expectSaveSuccess() {
    await expect(this._page.getByRole('alert')).toHaveText(
      'Kysely tallennettiin onnistuneesti!',
    );
  }

  async goToPage(pageName: string) {
    await this._page.getByRole('link', { name: pageName }).click();
  }

  async renamePage(oldName: string, newName: string) {
    await this.goToPage(oldName);
    await this._page.getByLabel('Sivun nimi *').fill(newName);
    await this.saveSurvey();
  }

  /**
   * Opens the "add question" accordion for the given page and returns the
   * locator scoped to the freshly expanded question section.
   */
  private async startQuestion(
    pageName: string,
    addButtonLabel: string,
  ): Promise<Locator> {
    await this.goToPage(pageName);
    await this._page.getByRole('button', { name: addButtonLabel }).click();
    return this._page.locator('.section-accordion-expanded');
  }

  /** Fills the title and "required" toggle shared by every question type. */
  private async fillCommonFields(
    question: Locator,
    params: CommonQuestionParams,
  ) {
    await question.getByLabel('Otsikko').fill(params.title);
    if (params.isRequired) {
      await question
        .getByRole('checkbox', { name: 'Vastaus pakollinen' })
        .check();
    }
  }

  /** Enables and fills the optional "additional info" rich text field. */
  private async fillAdditionalInfo(question: Locator, additionalInfo?: string) {
    if (!additionalInfo) return;
    await question.getByLabel('Anna lisätietoja kysymykseen').check();
    await question
      .getByLabel('Teksti')
      .locator('div')
      .nth(2)
      .fill(additionalInfo);
  }

  /**
   * Fills the list of answer options, adding a new option row before each one
   * after the first (the first row already exists).
   */
  private async fillAnswerOptions(question: Locator, options: string[]) {
    for (const [idx, option] of options.entries()) {
      if (idx > 0) await question.getByLabel('add-question-option').click();
      await question
        .getByTestId(`radio-input-option-${idx}`)
        .locator('textarea')
        .nth(0)
        .fill(option);
    }
  }

  /**
   * Adds and fills a list of option rows where no row exists yet, clicking
   * "add option" before each one. Used by matrix rows and budgeting targets.
   */
  private async addAndFillOptions(question: Locator, options: string[]) {
    for (const [idx, option] of options.entries()) {
      await question.getByLabel('add-question-option').click();
      await question
        .getByTestId(`radio-input-option-${idx}`)
        .locator('textarea')
        .nth(0)
        .fill(option);
    }
  }

  /** Adds and fills matrix columns (answer classes). */
  private async fillMatrixColumns(question: Locator, columns: string[]) {
    for (const [idx, col] of columns.entries()) {
      await question.getByLabel('add-matrix-class').click();
      await question
        .getByTestId(`matrix-class-${idx}`)
        .locator('input')
        .nth(0)
        .fill(col);
    }
  }

  /** Enables and fills the optional min/max answer count limits. */
  private async fillAnswerLimits(
    question: Locator,
    limits?: { min: number; max: number },
  ) {
    if (!limits) return;
    await question.getByLabel('Rajoita vastauslukumäärää').check();
    await question
      .getByLabel('Vastauksia vähintään')
      .fill(limits.min.toString());
    await question
      .getByLabel('Vastauksia enintään')
      .fill(limits.max.toString());
  }

  private saveQuestion() {
    return this._page.getByRole('button', { name: 'Tallenna' }).click();
  }

  async createPersonalInfoQuestion(params: PersonalInfoQuestionParams) {
    const question = await this.startQuestion(
      params.pageName,
      'Lisää henkilötietokysymys',
    );
    await this.fillCommonFields(question, params);

    if (params.name) await question.getByLabel('Nimi').check();
    if (params.email) await question.getByLabel('Sähköposti').check();
    if (params.phone) await question.getByLabel('Puhelinnumero').check();
    if (params.address) await question.getByLabel('Osoite').check();
    if (params.custom) {
      await question.getByTestId('custom-checkbox').check();
      await question.getByPlaceholder('Muu tieto').fill(params.customTitle);
    }

    await this.fillAdditionalInfo(question, params.additionalInfo);
    await this.saveQuestion();
  }

  async createRadioQuestion(params: RadioQuestionParams) {
    const question = await this.startQuestion(
      params.pageName,
      'Lisää valintakysymys',
    );
    await this.fillCommonFields(question, params);
    await this.fillAnswerOptions(question, params.answerOptions);
    if (params.allowCustom) {
      await question.getByLabel('Salli “Jokin muu, mikä?” -').check();
    }
    await this.fillAdditionalInfo(question, params.additionalInfo);
    await this.saveQuestion();
  }

  async createCheckBoxQuestion(params: CheckBoxQuestionParams) {
    const question = await this.startQuestion(
      params.pageName,
      'Lisää monivalintakysymys',
    );
    await this.fillCommonFields(question, params);
    await this.fillAnswerOptions(question, params.answerOptions);
    await this.fillAnswerLimits(question, params.answerLimits);
    if (params.allowCustom) {
      await question.getByLabel('Salli “Jokin muu, mikä?” -').check();
    }
    await this.fillAdditionalInfo(question, params.additionalInfo);
    await this.saveQuestion();
  }

  async createFreeTextQuestion(params: FreeTextQuestionParams) {
    const question = await this.startQuestion(
      params.pageName,
      'Lisää vapaatekstikysymys',
    );
    await this.fillCommonFields(question, params);
    if (params.maxLength) {
      await question
        .getByLabel('Maksimi merkkimäärä')
        .fill(params.maxLength.toString());
    }
    await this.fillAdditionalInfo(question, params.additionalInfo);
    await this.saveQuestion();
  }

  async createNumericQuestion(params: NumericQuestionParams) {
    const question = await this.startQuestion(
      params.pageName,
      'Lisää numeerinen kysymys',
    );
    await this.fillCommonFields(question, params);
    if (params.minValue) {
      await question.getByLabel('Minimiarvo').fill(params.minValue.toString());
    }
    if (params.maxValue) {
      await question.getByLabel('Maksimiarvo').fill(params.maxValue.toString());
    }
    await this.fillAdditionalInfo(question, params.additionalInfo);
    await this.saveQuestion();
  }

  async createMapQuestion(params: MapQuestionParams) {
    const question = await this.startQuestion(
      params.pageName,
      'Lisää karttakysymys',
    );
    await this.fillCommonFields(question, params);

    const selectionTypeMap = { point: 'Piste', line: 'Viiva', area: 'Alue' };
    for (const selectionType of params.selectionTypes) {
      await question
        .getByLabel(selectionTypeMap[selectionType], { exact: true })
        .check();
    }

    await this.fillAdditionalInfo(question, params.additionalInfo);
    await this.saveQuestion();
  }

  async createSortingQuestion(params: SortingQuestionParams) {
    const question = await this.startQuestion(
      params.pageName,
      'Lisää järjestyskysymys',
    );
    await this.fillCommonFields(question, params);
    await this.fillAnswerOptions(question, params.answerOptions);
    await this.fillAdditionalInfo(question, params.additionalInfo);
    await this.saveQuestion();
  }

  async createSliderQuestion(params: SliderQuestionParams) {
    const question = await this.startQuestion(
      params.pageName,
      'Lisää liukukytkinkysymys',
    );
    await this.fillCommonFields(question, params);

    if (params.variant === 'string') {
      await question.getByLabel('Sanallinen').check();
    } else {
      await question.getByLabel('Numeerinen').check();
    }
    await question.getByLabel('Minimiarvo').fill(params.minValue.toString());
    await question.getByLabel('Maksimiarvo').fill(params.maxValue.toString());

    await this.fillAdditionalInfo(question, params.additionalInfo);
    await this.saveQuestion();
  }

  async createMultiMatrixQuestion(params: MultiMatrixQuestionParams) {
    const question = await this.startQuestion(
      params.pageName,
      'Lisää monivalinta-likert-kysymys',
    );
    await this.fillCommonFields(question, params);
    await this.addAndFillOptions(question, params.matrixRows);
    await this.fillMatrixColumns(question, params.matrixColumns);
    await this.fillAnswerLimits(question, params.answersLimited);
    await this.fillAdditionalInfo(question, params.additionalInfo);
    await this.saveQuestion();
  }

  async createMatrixQuestion(params: MatrixQuestionParams) {
    const question = await this.startQuestion(
      params.pageName,
      'Lisää likert-kysymys',
    );
    await this.fillCommonFields(question, params);
    await this.addAndFillOptions(question, params.matrixRows);
    await this.fillMatrixColumns(question, params.matrixColumns);
    await this.fillAdditionalInfo(question, params.additionalInfo);
    await this.saveQuestion();
  }

  async createGroupedCheckboxQuestion(params: GroupedCheckboxQuestionParams) {
    const question = await this.startQuestion(
      params.pageName,
      'Lisää ryhmitetty monivalintakysymys',
    );
    await this.fillCommonFields(question, params);

    for (const [groupIndex, group] of params.groups.entries()) {
      await question.getByLabel('add-checkbox-group').click();
      const groupLocator = question.getByTestId(`group-${groupIndex}-expanded`);
      await groupLocator.getByLabel('Ryhmän nimi').fill(group.groupTitle);

      for (const [optionIndex, option] of group.answerOptions.entries()) {
        await groupLocator.getByLabel('add-question-option').click();
        await groupLocator
          .getByTestId(`radio-input-option-${optionIndex}`)
          .locator('textarea')
          .nth(0)
          .fill(option);
      }
    }

    await this.fillAdditionalInfo(question, params.additionalInfo);
    await this.saveQuestion();
  }

  async createAttachmentQuestion(params: AttachmentQuestionParams) {
    const question = await this.startQuestion(
      params.pageName,
      'Lisää vastausliite',
    );
    await this.fillCommonFields(question, params);
    await this.fillAdditionalInfo(question, params.additionalInfo);
    await this.saveQuestion();
  }

  async createBudgetingQuestion(params: BudgetingQuestionParams) {
    const question = await this.startQuestion(
      params.pageName,
      'Lisää budjetointikysymys',
    );
    await this.fillCommonFields(question, params);
    await question
      .getByLabel('Kokonaisbudjetti')
      .fill(params.totalBudget.toString());
    if (params.unit) {
      await question.getByLabel('Yksikkö').fill(params.unit);
    }
    await this.addAndFillOptions(question, params.targets);
    await this.fillAdditionalInfo(question, params.additionalInfo);
    await this.saveQuestion();
  }

  async deleteSurvey() {
    await this._page.getByRole('button', { name: 'Poista kysely' }).click();
    this._surveyId = null;
  }
}
