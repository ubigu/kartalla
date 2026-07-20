import {
  Survey,
  SurveyBudgetingQuestion,
  SurveyPersonalInfoQuestion,
  SurveyRadioQuestion,
  SurveyTextSection,
} from '@interfaces/survey';

export const createMockSurvey = (
  id: number,
  pageId: number,
  authorId: string = 'test-user-id',
): Survey => ({
  id,
  name: `test-survey-${id}`,
  title: { fi: 'Testikysely', en: 'Test survey', sv: '' },
  subtitle: { fi: '', en: '', sv: '' },
  description: { fi: '', en: '', sv: '' },
  author: 'Test Author',
  authorUnit: 'Test Unit',
  authorId,
  editors: [],
  viewers: [],
  mapProvider: 'openlayers',
  mapUrl: '',
  localizedMapUrls: { fi: '', en: '', sv: '' },
  startDate: new Date(),
  endDate: new Date(),
  allowTestSurvey: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  thanksPage: {
    title: { fi: 'Kiitos', en: 'Thanks', sv: '' },
    text: { fi: '', en: '', sv: '' },
  },
  theme: { id: 1, name: 'default', data: {} },
  sectionTitleColor: '#000000',
  email: {
    enabled: false,
    autoSendTo: [],
    subject: { fi: '', en: '', sv: '' },
    body: { fi: '', en: '', sv: '' },
    info: [],
    includePersonalInfo: false,
    includeMarginImages: false,
    required: false,
  },
  allowSavingUnfinished: false,
  localisationEnabled: false,
  displayPrivacyStatement: false,
  submissionCount: 0,
  marginImages: {
    top: { imageUrl: '' },
    bottom: { imageUrl: '' },
  },
  organization: { id: '', name: '' },
  tags: [],
  enabledLanguages: { fi: true, en: false, sv: false },
  isArchived: false,
  pages: [
    {
      id: pageId,
      title: { fi: 'Sivu 1', en: 'Page 1', sv: '' },
      sidebar: {
        type: 'none',
        mapLayers: [],
        imageUrl: '',
        defaultMapView: null as any,
        imageAltText: { fi: '', en: '', sv: '' },
        imageSize: 'fitted',
        imageAttributions: '',
      },
      sections: [],
      conditions: {},
    },
  ],
});

export const createMockPersonalInfoQuestion = (
  id: number,
): SurveyPersonalInfoQuestion => ({
  id,
  type: 'personal-info',
  title: { fi: 'Henkilötiedot', en: 'Personal info', sv: '' },
  isRequired: false,
  askName: true,
  askEmail: true,
  askPhone: false,
  askAddress: false,
  askCustom: false,
});

export const createMockTextSection = (id: number): SurveyTextSection => ({
  id,
  type: 'text',
  title: { fi: 'Otsikko', en: 'Title', sv: '' },
  body: { fi: 'Tekstiä', en: 'Some text', sv: '' },
  bodyColor: '#000000',
});

export const createMockBudgetingQuestion = (
  id: number,
): SurveyBudgetingQuestion => ({
  id,
  type: 'budgeting',
  title: { fi: 'Budjetointi', en: 'Budgeting', sv: '' },
  isRequired: false,
  budgetingMode: 'pieces',
  totalBudget: 100,
  targets: [
    {
      name: { fi: 'Kohde 1', en: 'Target 1', sv: '' },
    },
  ],
  allocationDirection: 'decreasing',
});

export const createMockRadioQuestion = (id: number): SurveyRadioQuestion => ({
  id,
  type: 'radio',
  title: { fi: 'Kysymys', en: 'Question', sv: '' },
  isRequired: false,
  allowCustomAnswer: false,
  options: [
    {
      text: { fi: 'Vaihtoehto 1', en: 'Option 1', sv: '' },
      info: { fi: 'Lisätieto', en: 'Info', sv: '' },
    },
    {
      text: { fi: 'Vaihtoehto 2', en: 'Option 2', sv: '' },
    },
  ],
});
