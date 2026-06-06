import dayjs from 'dayjs';
import {
  AttachmentQuestionParams,
  BudgetingQuestionParams,
  CheckBoxQuestionParams,
  FreeTextQuestionParams,
  GroupedCheckboxQuestionParams,
  MapQuestionParams,
  MatrixQuestionParams,
  MultiMatrixQuestionParams,
  NumericQuestionParams,
  PersonalInfoQuestionParams,
  RadioQuestionParams,
  SliderQuestionParams,
  SortingQuestionParams,
  SurveyParams,
} from '../pages/surveyEditPage';

export const TEST_SURVEY_URL_NAMES = {
  survey: 'testikysely',
  attachment: 'testikysely-attachment',
  budgeting: 'testikysely-budgeting',
  checkbox: 'testikysely-checkbox',
  freetext: 'testikysely-freetext',
  groupedCheckbox: 'testikysely-grouped-checkbox',
  matrix: 'testikysely-matrix',
  multiMatrix: 'testikysely-multimatrix',
  numeric: 'testikysely-numeric',
  personalInfo: 'testikysely-personalinfo',
  radio: 'testikysely-radio',
  slider: 'testikysely-slider',
  sorting: 'testikysely-sorting',
} as const;

export function getTestSurveyData(
  urlName: string,
  languages?: string[],
): SurveyParams {
  return {
    title: urlName,
    subtitle: 'Testikyselyn aliotsikko',
    urlName,
    author: 'Testaaja',
    startDate: dayjs().add(1, 'day').format('dd.MM.yyyy HH:mm'),
    endDate: dayjs().add(1, 'year').format('dd.MM.yyyy HH:mm'),
    thanksPage: {
      title: 'Kiitos vastauksestasi!',
      text: 'Kiitos vastauksestasi! Voit sulkea tämän välilehden.',
    },
    pageNames: ['Sivu 1'],
    ...(languages && { languages }),
  };
}

export function getPersonalInfoQuestionData(
  pageName: string,
): PersonalInfoQuestionParams {
  return {
    pageName: pageName,
    title: 'Anna yhteystietosi',
    customTitle: 'Y-tunnus',
    name: true,
    email: true,
    phone: true,
    address: true,
    custom: true,
  };
}

export function getRadioQuestionData(pageName: string): RadioQuestionParams {
  return {
    pageName: pageName,
    title: 'Mikä on lempivärisi?',
    answerOptions: ['Punainen', 'Vihreä', 'Sininen'],
    isRequired: false,
    allowCustom: false,
    additionalInfo: 'Valitse vain yksi vaihtoehto',
  };
}

export function getCheckBoxQuestionData(
  pageName: string,
  answerLimits?: CheckBoxQuestionParams['answerLimits'],
): CheckBoxQuestionParams {
  return {
    pageName: pageName,
    title: 'Mitkä seuraavista ovat lempiruokiasi?',
    answerOptions: ['Pizza', 'Hampurilainen', 'Salaatti', 'Kebab'],
    isRequired: false,
    allowCustom: false,
    additionalInfo: 'Valitse kaikki, jotka pidät',
    answerLimits: answerLimits,
  };
}

export function getFreeTextQuestionData(
  pageName: string,
): FreeTextQuestionParams {
  return {
    pageName,
    title: 'Vapaa teksti',
    isRequired: false,
  };
}

export function getNumericQuestionData(
  pageName: string,
): NumericQuestionParams {
  return {
    pageName,
    title: 'Numero',
    isRequired: false,
    minValue: 2,
    maxValue: 11,
  };
}

export function getMapQuestionData(pageName: string): MapQuestionParams {
  return {
    pageName,
    title: 'Kartta',
    selectionTypes: ['point', 'area', 'line'],
  };
}

export function getSortingQuestionData(
  pageName: string,
): SortingQuestionParams {
  return {
    pageName,
    title: 'Järjestys',
    answerOptions: ['ensimmäinen', 'toinen', 'kolmas', 'neljäs'],
  };
}

export function getSliderQuestionDataNumber(
  pageName: string,
): SliderQuestionParams {
  return {
    pageName,
    title: 'Liukusäädin-numeerisella',
    variant: 'number',
    minValue: 0,
    maxValue: 10,
  };
}

export function getSliderQuestionDataString(
  pageName: string,
): SliderQuestionParams {
  return {
    pageName,
    title: 'Liukusäädin-tekstillä',
    variant: 'string',
    minValue: 'minimi',
    maxValue: 'maksimi',
  };
}

export function getMatrixQuestionData(pageName: string): MatrixQuestionParams {
  return {
    pageName,
    title: 'Matriisi',
    matrixRows: ['Rivi 1', 'Rivi 2', 'Rivi 3'],
    matrixColumns: ['Sarake 1', 'Sarake 2', 'Sarake 3'],
  };
}

export function getMultiMatrixQuestionData(
  pageName: string,
): MultiMatrixQuestionParams {
  return {
    pageName,
    title: 'Moni-matriisi',
    matrixRows: ['Rivi 1', 'Rivi 2', 'Rivi 3', 'Rivi 4'],
    matrixColumns: ['Sarake 1', 'Sarake 2', 'Sarake 3'],
    answersLimited: { min: 1, max: 3 },
  };
}

export function getAttachmentQuestionData(
  pageName: string,
): AttachmentQuestionParams {
  return {
    pageName,
    title: 'Liitetiedosto',
  };
}

export function getBudgetingQuestionData(
  pageName: string,
): BudgetingQuestionParams {
  return {
    pageName,
    title: 'Budjetti',
    totalBudget: 100,
    unit: '€',
    targets: ['Kohde 1', 'Kohde 2', 'Kohde 3'],
  };
}

export function getGroupedCheckboxQuestionData(
  pageName: string,
): GroupedCheckboxQuestionParams {
  return {
    pageName,
    title: 'Ryhmitelty monivalintakysymys',
    groups: [
      {
        groupTitle: 'Ryhmä 1',
        answerOptions: ['Vaihtoehto 1', 'Vaihtoehto 2'],
      },
      {
        groupTitle: 'Ryhmä 2',
        answerOptions: ['Vaihtoehto 3', 'Vaihtoehto 4'],
      },
    ],
  };
}
