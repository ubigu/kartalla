import { Page } from '@playwright/test';

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

export interface RadioImageQuestionParams extends CommonQuestionParams {
  answerOptions: {
    imageUrl: string | null;
    altText: string | null;
    attributions: string | null;
    label: string;
  }[];
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

export class SurveyEditPage {
  private _page: Page;
  private _surveyId: string | null;
  private _workerIdx: number | null = null;

  constructor(page: Page, workerIdx: number, surveyId?: string) {
    this._page = page;
    this._surveyId = surveyId ?? null;
    this._workerIdx = workerIdx;
  }

  get page() {
    return this._page;
  }

  get surveyId() {
    return this._surveyId;
  }

  set surveyId(id) {
    this._surveyId = id;
  }

  async goto() {
    if (this._surveyId) {
      await this._page.goto(
        `http://localhost:8080/admin/kyselyt/${this._surveyId}`,
      );
    } else {
      await this._page.goto('http://localhost:8080/admin');
      await this._page.getByRole('button', { name: 'Uusi kysely' }).click();
      await this._page.waitForURL(
        'http://localhost:8080/admin/kyselyt/*/perustiedot',
      );
      const urlParts = this._page.url().split('/');
      this._surveyId = urlParts[urlParts.length - 2];
    }
  }

  async fillBasicInfo(params: SurveyParams) {
    await this._page.getByRole('link', { name: 'Kyselyn perustiedot' }).click();
    await this._page
      .getByLabel('Kyselyn otsikko *')
      .fill(`${params.title}-${this._workerIdx}`);
    await this._page.getByLabel('Kyselyn aliotsikko').fill(params.subtitle);
    await this._page
      .getByLabel('Kyselyn nimi *')
      .fill(`${params.urlName}-${this._workerIdx}`);
    await this._page
      .getByLabel('Kyselyn laatija/yhteyshenkil')
      .fill(params.author);
    await this._page.getByLabel('Alkamisaika').fill(params.startDate);
    await this._page.getByLabel('Loppumisaika').fill(params.endDate);
    await this.renamePage('Nimetön sivu', params.pageNames[0]);
    for (const pageName of params.pageNames.slice(1)) {
      await this._page
        .getByLabel('Navigointivalikko')
        .getByText('Luo sivu')
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
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async goToPage(pageName: string) {
    await this._page.getByRole('link', { name: pageName }).click();
    await this._page.getByLabel('Sivun nimi *').waitFor({ state: 'visible' });
  }

  async renamePage(oldName: string, newName: string) {
    await this.goToPage(oldName);
    await this._page.getByLabel('Sivun nimi *').fill(newName);
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async createPersonalInfoQuestion(
    personalInfoQuestionParams: PersonalInfoQuestionParams,
  ) {
    await this.goToPage(personalInfoQuestionParams.pageName);
    await this._page.getByLabel('add-personal-info-section').click();
    const questionLocator = this._page.locator('.section-accordion-expanded');
    await questionLocator
      .getByLabel('Otsikko')
      .fill(personalInfoQuestionParams.title);
    if (personalInfoQuestionParams.isRequired) {
      await questionLocator
        .getByRole('checkbox', { name: 'Vastaus pakollinen' })
        .check();
    }

    if (personalInfoQuestionParams.name) {
      await questionLocator.getByLabel('Nimi').check();
    }
    if (personalInfoQuestionParams.email) {
      await questionLocator.getByLabel('Sähköposti').check();
    }
    if (personalInfoQuestionParams.phone) {
      await questionLocator.getByLabel('Puhelinnumero').check();
    }
    if (personalInfoQuestionParams.address) {
      await questionLocator.getByLabel('Osoite').check();
    }
    if (personalInfoQuestionParams.custom) {
      await questionLocator.getByTestId('custom-checkbox').check();
      await questionLocator
        .getByPlaceholder('Muu tieto')
        .fill(personalInfoQuestionParams.customTitle);
    }

    if (personalInfoQuestionParams.additionalInfo) {
      await questionLocator.getByLabel('Anna lisätietoja kysymykseen').check();
      await questionLocator
        .getByLabel('Teksti')
        .locator('div')
        .nth(2)
        .fill(personalInfoQuestionParams.additionalInfo);
    }
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async createRadioQuestion(radioQuestionParams: RadioQuestionParams) {
    await this.goToPage(radioQuestionParams.pageName);
    await this._page.getByLabel('add-radio-question').click();

    const questionLocator = this._page.locator('.section-accordion-expanded');

    await questionLocator.getByLabel('Otsikko').fill(radioQuestionParams.title);
    if (radioQuestionParams.isRequired) {
      await questionLocator
        .getByRole('checkbox', { name: 'Vastaus pakollinen' })
        .check();
    }

    for (const [idx, option] of radioQuestionParams.answerOptions.entries()) {
      if (idx > 0)
        await questionLocator.getByLabel('add-question-option').click();
      await questionLocator
        .getByTestId(`radio-input-option-${idx}`)
        .locator('textarea')
        .nth(0)
        .fill(option);
    }
    if (radioQuestionParams.allowCustom) {
      await questionLocator.getByLabel('Salli “Jokin muu, mikä?” -').check();
    }
    if (radioQuestionParams.additionalInfo) {
      await questionLocator.getByLabel('Anna lisätietoja kysymykseen').check();
      await questionLocator
        .getByLabel('Teksti')
        .locator('div')
        .nth(2)
        .fill(radioQuestionParams.additionalInfo);
    }
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async createRadioImageQuestion(
    radioImageQuestionParams: RadioImageQuestionParams,
  ) {
    await this.goToPage(radioImageQuestionParams.pageName);
    await this._page.getByLabel('add-radio-image-question').click();

    const questionLocator = this._page.locator('.section-accordion-expanded');

    await questionLocator
      .getByLabel('Otsikko')
      .fill(radioImageQuestionParams.title);

    if (radioImageQuestionParams.isRequired) {
      await questionLocator
        .getByRole('checkbox', { name: 'Vastaus pakollinen' })
        .check();
    }

    for (const [
      idx,
      option,
    ] of radioImageQuestionParams.answerOptions.entries()) {
      if (idx > 0)
        await questionLocator.getByLabel('add-question-option').click();
      await questionLocator
        .getByTestId(`radio-image-input-option-${idx}`)
        .getByRole('textbox', { name: 'Vastausvaihtoehdon selite' })
        .fill(option.label);
      if (option.altText)
        await questionLocator
          .getByTestId(`radio-image-input-option-${idx}`)
          .getByLabel('Vaihtoehtoinen teksti kuvalle')
          .fill(option.altText);
      if (option.attributions)
        await questionLocator
          .getByTestId(`radio-image-input-option-${idx}`)
          .getByLabel('Tekijänoikeustiedot')
          .fill(option.attributions);
    }

    if (radioImageQuestionParams.additionalInfo) {
      await questionLocator.getByLabel('Anna lisätietoja kysymykseen').check();
      await questionLocator
        .getByLabel('rdw-editor')
        .locator('div')
        .nth(2)
        .fill(radioImageQuestionParams.additionalInfo);
    }
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async createCheckBoxQuestion(checkBoxQuestionParams: CheckBoxQuestionParams) {
    await this.goToPage(checkBoxQuestionParams.pageName);
    await this._page.getByLabel('add-checkbox-question').click();
    const questionLocator = this._page.locator('.section-accordion-expanded');
    await questionLocator
      .getByLabel('Otsikko')
      .fill(checkBoxQuestionParams.title);
    if (checkBoxQuestionParams.isRequired) {
      await questionLocator
        .getByRole('checkbox', { name: 'Vastaus pakollinen' })
        .check();
    }

    for (const [
      idx,
      option,
    ] of checkBoxQuestionParams.answerOptions.entries()) {
      if (idx > 0)
        await questionLocator.getByLabel('add-question-option').click();
      await questionLocator
        .getByTestId(`radio-input-option-${idx}`)
        .locator('textarea')
        .nth(0)
        .fill(option);
    }

    if (checkBoxQuestionParams.answerLimits) {
      await questionLocator.getByLabel('Rajoita vastauslukumäärää').check();
      await questionLocator
        .getByLabel('Vastauksia vähintään')
        .fill(checkBoxQuestionParams.answerLimits.min.toString());
      await questionLocator
        .getByLabel('Vastauksia enintään')
        .fill(checkBoxQuestionParams.answerLimits.max.toString());
    }
    if (checkBoxQuestionParams.allowCustom) {
      await questionLocator.getByLabel('Salli “Jokin muu, mikä?” -').check();
    }
    if (checkBoxQuestionParams.additionalInfo) {
      await questionLocator.getByLabel('Anna lisätietoja kysymykseen').check();
      await questionLocator
        .getByLabel('Teksti')
        .locator('div')
        .nth(2)
        .fill(checkBoxQuestionParams.additionalInfo);
    }
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async createFreeTextQuestion(freeTextQuestionParams: FreeTextQuestionParams) {
    await this.goToPage(freeTextQuestionParams.pageName);
    await this._page.getByLabel('add-free-text-question').click();
    const questionLocator = this._page.locator('.section-accordion-expanded');
    await questionLocator
      .getByLabel('Otsikko')
      .fill(freeTextQuestionParams.title);
    if (freeTextQuestionParams.isRequired) {
      await questionLocator
        .getByRole('checkbox', { name: 'Vastaus pakollinen' })
        .check();
    }
    if (freeTextQuestionParams.maxLength) {
      await questionLocator
        .getByLabel('Maksimipituus')
        .fill(freeTextQuestionParams.maxLength.toString());
    }
    if (freeTextQuestionParams.additionalInfo) {
      await questionLocator.getByLabel('Anna lisätietoja kysymykseen').check();
      await questionLocator
        .getByLabel('Teksti')
        .locator('div')
        .nth(2)
        .fill(freeTextQuestionParams.additionalInfo);
    }
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async createNumericQuestion(numericQuestionParams: NumericQuestionParams) {
    await this.goToPage(numericQuestionParams.pageName);
    await this._page.getByLabel('add-numeric-question').click();
    const questionLocator = this._page.locator('.section-accordion-expanded');
    await questionLocator
      .getByLabel('Otsikko')
      .fill(numericQuestionParams.title);
    if (numericQuestionParams.isRequired) {
      await questionLocator
        .getByRole('checkbox', { name: 'Vastaus pakollinen' })
        .check();
    }
    if (numericQuestionParams.minValue) {
      await questionLocator
        .getByLabel('Minimiarvo')
        .fill(numericQuestionParams.minValue.toString());
    }
    if (numericQuestionParams.maxValue) {
      await questionLocator
        .getByLabel('Maksimiarvo')
        .fill(numericQuestionParams.maxValue.toString());
    }

    if (numericQuestionParams.additionalInfo) {
      await questionLocator.getByLabel('Anna lisätietoja kysymykseen').check();
      await questionLocator
        .getByLabel('Teksti')
        .locator('div')
        .nth(2)
        .fill(numericQuestionParams.additionalInfo);
    }
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async createMapQuestion(mapQuestionParams: MapQuestionParams) {
    await this.goToPage(mapQuestionParams.pageName);
    await this._page.getByLabel('add-map-question').click();
    const questionLocator = this._page.locator('.section-accordion-expanded');
    await questionLocator.getByLabel('Otsikko').fill(mapQuestionParams.title);
    if (mapQuestionParams.isRequired) {
      await questionLocator
        .getByRole('checkbox', { name: 'Vastaus pakollinen' })
        .check();
    }

    const selectionTypeMap = { point: 'Piste', line: 'Viiva', area: 'Alue' };

    for (const selectionType of mapQuestionParams.selectionTypes) {
      await questionLocator
        .getByLabel(selectionTypeMap[selectionType], { exact: true })
        .check();
    }

    if (mapQuestionParams.additionalInfo) {
      await questionLocator.getByLabel('Anna lisätietoja kysymykseen').check();
      await questionLocator
        .getByLabel('Teksti')
        .locator('div')
        .nth(2)
        .fill(mapQuestionParams.additionalInfo);
    }
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async createSortingQuestion(sortingQuestionParams: SortingQuestionParams) {
    await this.goToPage(sortingQuestionParams.pageName);
    await this._page.getByLabel('add-sorting-question').click();
    const questionLocator = this._page.locator('.section-accordion-expanded');
    await questionLocator
      .getByLabel('Otsikko')
      .fill(sortingQuestionParams.title);
    if (sortingQuestionParams.isRequired) {
      await questionLocator
        .getByRole('checkbox', { name: 'Vastaus pakollinen' })
        .check();
    }
    for (const [idx, option] of sortingQuestionParams.answerOptions.entries()) {
      if (idx > 0)
        await questionLocator.getByLabel('add-question-option').click();
      await questionLocator
        .getByTestId(`radio-input-option-${idx}`)
        .locator('textarea')
        .nth(0)
        .fill(option);
    }
    if (sortingQuestionParams.additionalInfo) {
      await questionLocator.getByLabel('Anna lisätietoja kysymykseen').check();
      await questionLocator
        .getByLabel('Teksti')
        .locator('div')
        .nth(2)
        .fill(sortingQuestionParams.additionalInfo);
    }
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async createSliderQuestion(sliderQuestionParams: SliderQuestionParams) {
    await this.goToPage(sliderQuestionParams.pageName);
    await this._page.getByLabel('add-slider-question').click();
    const questionLocator = this._page.locator('.section-accordion-expanded');
    await questionLocator
      .getByLabel('Otsikko')
      .fill(sliderQuestionParams.title);
    if (sliderQuestionParams.isRequired) {
      await questionLocator
        .getByRole('checkbox', { name: 'Vastaus pakollinen' })
        .check();
    }

    if (sliderQuestionParams.variant === 'string') {
      await questionLocator.getByLabel('Sanallinen').check();
    } else {
      await questionLocator.getByLabel('Numeerinen').check();
    }
    await questionLocator
      .getByLabel('Minimiarvo')
      .fill(sliderQuestionParams.minValue.toString());
    await questionLocator
      .getByLabel('Maksimiarvo')
      .fill(sliderQuestionParams.maxValue.toString());

    if (sliderQuestionParams.additionalInfo) {
      await questionLocator.getByLabel('Anna lisätietoja kysymykseen').check();
      await questionLocator
        .getByLabel('Teksti')
        .locator('div')
        .nth(2)
        .fill(sliderQuestionParams.additionalInfo);
    }
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async createMultiMatrixQuestion(
    multiMatrixQuestionParams: MultiMatrixQuestionParams,
  ) {
    await this.goToPage(multiMatrixQuestionParams.pageName);
    await this._page.getByLabel('add-multiple-choice-matrix-question').click();
    const questionLocator = this._page.locator('.section-accordion-expanded');
    await questionLocator
      .getByLabel('Otsikko')
      .fill(multiMatrixQuestionParams.title);
    if (multiMatrixQuestionParams.isRequired) {
      await questionLocator
        .getByRole('checkbox', { name: 'Vastaus pakollinen' })
        .check();
    }
    for (const [idx, row] of multiMatrixQuestionParams.matrixRows.entries()) {
      await questionLocator.getByLabel('add-question-option').click();
      await questionLocator
        .getByTestId(`radio-input-option-${idx}`)
        .locator('textarea')
        .nth(0)
        .fill(row);
    }
    for (const [
      idx,
      col,
    ] of multiMatrixQuestionParams.matrixColumns.entries()) {
      await questionLocator.getByLabel('add-matrix-class').click();
      await questionLocator
        .getByTestId(`matrix-class-${idx}`)
        .locator('input')
        .nth(0)
        .fill(col);
    }

    if (multiMatrixQuestionParams.answersLimited) {
      await questionLocator.getByLabel('Rajoita vastauslukumäärää').check();
      await questionLocator
        .getByLabel('Vastauksia vähintään')
        .fill(multiMatrixQuestionParams.answersLimited.min.toString());
      await questionLocator
        .getByLabel('Vastauksia enintään')
        .fill(multiMatrixQuestionParams.answersLimited.max.toString());
    }

    if (multiMatrixQuestionParams.additionalInfo) {
      await questionLocator.getByLabel('Anna lisätietoja kysymykseen').check();
      await questionLocator
        .getByLabel('Teksti')
        .locator('div')
        .nth(2)
        .fill(multiMatrixQuestionParams.additionalInfo);
    }
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async createMatrixQuestion(matrixQuestionParams: MatrixQuestionParams) {
    await this.goToPage(matrixQuestionParams.pageName);
    await this._page.getByLabel('add-matrix-question').click();
    const questionLocator = this._page.locator('.section-accordion-expanded');
    await questionLocator
      .getByLabel('Otsikko')
      .fill(matrixQuestionParams.title);
    if (matrixQuestionParams.isRequired) {
      await questionLocator
        .getByRole('checkbox', { name: 'Vastaus pakollinen' })
        .check();
    }
    for (const [idx, row] of matrixQuestionParams.matrixRows.entries()) {
      await questionLocator.getByLabel('add-question-option').click();
      await questionLocator
        .getByTestId(`radio-input-option-${idx}`)
        .locator('textarea')
        .nth(0)
        .fill(row);
    }
    for (const [idx, col] of matrixQuestionParams.matrixColumns.entries()) {
      await questionLocator.getByLabel('add-matrix-class').click();
      await questionLocator
        .getByTestId(`matrix-class-${idx}`)
        .locator('input')
        .nth(0)
        .fill(col);
    }
    if (matrixQuestionParams.additionalInfo) {
      await questionLocator.getByLabel('Anna lisätietoja kysymykseen').check();
      await questionLocator
        .getByLabel('Teksti')
        .locator('div')
        .nth(2)
        .fill(matrixQuestionParams.additionalInfo);
    }
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async createGroupedCheckboxQuestion(
    groupedCheckboxQuestionParams: GroupedCheckboxQuestionParams,
  ) {
    await this.goToPage(groupedCheckboxQuestionParams.pageName);
    await this._page.getByLabel('add-grouped-checkbox-question').click();
    const questionLocator = this._page.locator('.section-accordion-expanded');
    await questionLocator
      .getByLabel('Otsikko')
      .fill(groupedCheckboxQuestionParams.title);
    if (groupedCheckboxQuestionParams.isRequired) {
      await questionLocator
        .getByRole('checkbox', { name: 'Vastaus pakollinen' })
        .check();
    }
    for (const [
      groupIndex,
      group,
    ] of groupedCheckboxQuestionParams.groups.entries()) {
      await questionLocator
        .getByLabel('add-checkbox-group')
        .waitFor({ state: 'visible' }); // For some reason explicit wait is needed
      await questionLocator.getByLabel('add-checkbox-group').click();
      const groupLocator = questionLocator.getByTestId(
        `group-${groupIndex}-expanded`,
      );
      await groupLocator.getByLabel('Ryhmän nimi').fill(group.groupTitle);

      for (const [optionIndex, option] of group.answerOptions.entries()) {
        await groupLocator.getByTestId('add-question-option').click();
        await groupLocator
          .getByTestId(`radio-input-option-${optionIndex}`)
          .locator('textarea')
          .waitFor({ state: 'visible' }); // For some reason explicit wait is needed
        await groupLocator
          .getByTestId(`radio-input-option-${optionIndex}`)
          .locator('textarea')
          .nth(0)
          .fill(option);
      }
    }
    if (groupedCheckboxQuestionParams.additionalInfo) {
      await questionLocator.getByLabel('Anna lisätietoja kysymykseen').check();
      await questionLocator
        .getByLabel('Teksti')
        .locator('div')
        .nth(2)
        .fill(groupedCheckboxQuestionParams.additionalInfo);
    }
    await this._page.getByLabel('save-changes').click();
    await this._page.getByTestId('info-toast').waitFor();
  }

  async deleteSurvey() {
    await this._page.getByRole('button', { name: 'Poista kysely' }).click();
    this._surveyId = null;
  }
}
