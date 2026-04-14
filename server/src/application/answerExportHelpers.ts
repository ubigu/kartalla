import { type AnswerEntry } from './answerTypes';
import { type SectionHeader, type SubmissionPersonalInfo } from './exportUtils';

export const mockDate = new Date('2024-01-15T10:00:00Z');

export type SectionHeaderRow = SectionHeader & { questionOrderIndex: number };

/** Minimal AnswerEntry for a free-text answer */
export function makeFreeTextRow(
  submissionId: number,
  sectionId: number,
  valueText: string | null,
): AnswerEntry {
  return {
    answerId: 1,
    pageIndex: 0,
    details: {},
    sectionId,
    sectionIndex: 0,
    submissionId,
    submissionLanguage: 'fi',
    title: { fi: '', en: '', se: '' },
    type: 'free-text',
    geometrySRID: null,
    valueGeometry: null,
    valueText,
    valueOptionId: null,
    valueNumeric: null,
    valueJson: null,
    createdAt: mockDate,
    groupIndex: null,
    optionIndex: null,
    mapLayers: [],
  };
}

/** Minimal SectionHeader row for a free-text question */
export function makeFreeTextSectionHeader(
  sectionId: number,
  titleFi: string,
): SectionHeaderRow {
  return {
    optionId: null,
    optionIndex: null,
    text: null,
    sectionId,
    sectionIndex: 0,
    title: { fi: titleFi, en: titleFi, se: titleFi },
    type: 'free-text',
    details: {},
    parentSection: null,
    predecessorSection: null,
    groupName: null,
    groupIndex: null,
    questionIndex: 0,
    pageIndex: 0,
    questionOrderIndex: 0,
  };
}

/** Minimal AnswerEntry for a radio/checkbox answer */
export function makeRadioRow(
  submissionId: number,
  sectionId: number,
  valueOptionId: number | null,
  valueText: string | null = null,
): AnswerEntry {
  return {
    answerId: 2,
    pageIndex: 0,
    details: {},
    sectionId,
    sectionIndex: 0,
    submissionId,
    submissionLanguage: 'fi',
    title: { fi: '', en: '', se: '' },
    type: 'radio',
    geometrySRID: null,
    valueGeometry: null,
    valueText,
    valueOptionId,
    valueNumeric: null,
    valueJson: null,
    createdAt: mockDate,
    groupIndex: null,
    optionIndex: null,
    mapLayers: [],
  };
}

/** Minimal SectionHeader row for a radio option */
export function makeRadioSectionHeader(
  sectionId: number,
  optionId: number,
  titleFi: string,
  optionTextFi: string,
): SectionHeaderRow {
  return {
    optionId,
    optionIndex: 0,
    text: { fi: optionTextFi, en: optionTextFi, se: optionTextFi },
    sectionId,
    sectionIndex: 0,
    title: { fi: titleFi, en: titleFi, se: titleFi },
    type: 'radio',
    details: {},
    parentSection: null,
    predecessorSection: null,
    groupName: null,
    groupIndex: null,
    questionIndex: 0,
    pageIndex: 0,
    questionOrderIndex: 0,
  };
}

export function makeMatrixRow(
  submissionId: number,
  sectionId: number,
  valueJson: unknown[],
): AnswerEntry {
  return {
    answerId: 3,
    pageIndex: 0,
    details: {},
    sectionId,
    sectionIndex: 1,
    submissionId,
    submissionLanguage: 'fi',
    title: { fi: '', en: '', se: '' },
    type: 'matrix',
    geometrySRID: null,
    valueGeometry: null,
    valueText: null,
    valueOptionId: null,
    valueNumeric: null,
    valueJson,
    createdAt: mockDate,
    groupIndex: null,
    optionIndex: null,
    mapLayers: [],
  };
}

export function makeMatrixSectionHeader(
  sectionId: number,
  titleFi: string,
  subjects: string[],
  classes: string[],
): SectionHeaderRow {
  return {
    optionId: null,
    optionIndex: null,
    text: null,
    sectionId,
    sectionIndex: 1,
    title: { fi: titleFi, en: titleFi, se: titleFi },
    type: 'matrix',
    details: {
      subjects: subjects.map((s) => ({ fi: s })),
      classes: classes.map((c) => ({ fi: c })),
    },
    parentSection: null,
    predecessorSection: null,
    groupName: null,
    groupIndex: null,
    questionIndex: 0,
    pageIndex: 0,
    questionOrderIndex: 1,
  };
}

export function makeSortingRow(
  submissionId: number,
  sectionId: number,
): AnswerEntry {
  return {
    ...makeFreeTextRow(submissionId, sectionId, null),
    type: 'sorting',
    valueJson: [99],
  };
}

export function makeSortingSectionHeader(
  sectionId: number,
  optionIndex: number,
  title: SectionHeader['title'],
  text: SectionHeader['text'] = null,
  optionId: number = 99,
): SectionHeaderRow {
  return {
    optionId,
    optionIndex,
    text,
    sectionId,
    sectionIndex: 0,
    title,
    type: 'sorting',
    details: {},
    parentSection: null,
    predecessorSection: null,
    groupName: null,
    groupIndex: null,
    questionIndex: 0,
    pageIndex: 0,
    questionOrderIndex: 0,
  };
}

export function makeBudgetingRow(
  submissionId: number,
  sectionId: number,
): AnswerEntry {
  return {
    ...makeFreeTextRow(submissionId, sectionId, null),
    type: 'budgeting',
    valueJson: [100],
  };
}

export function makeBudgetingSectionHeader(
  sectionId: number,
  title: SectionHeader['title'],
  targets: { name: SectionHeader['title'] }[],
): SectionHeaderRow {
  return {
    optionId: null,
    optionIndex: null,
    text: null,
    sectionId,
    sectionIndex: 0,
    title,
    type: 'budgeting',
    details: { targets },
    parentSection: null,
    predecessorSection: null,
    groupName: null,
    groupIndex: null,
    questionIndex: 0,
    pageIndex: 0,
    questionOrderIndex: 0,
  };
}

export function makeMultiMatrixRow(
  submissionId: number,
  sectionId: number,
): AnswerEntry {
  return {
    ...makeMatrixRow(submissionId, sectionId, [[0]]),
    type: 'multi-matrix',
  };
}

export function makeMultiMatrixSectionHeader(
  sectionId: number,
  title: SectionHeader['title'],
  subjects: SectionHeader['title'][],
  classes: SectionHeader['title'][],
): SectionHeaderRow {
  return {
    ...makeMatrixSectionHeader(sectionId, '', [], []),
    title,
    type: 'multi-matrix',
    details: { subjects, classes },
  };
}

export function makeNumericRow(
  submissionId: number,
  sectionId: number,
  valueNumeric: number,
): AnswerEntry {
  return {
    ...makeFreeTextRow(submissionId, sectionId, null),
    type: 'numeric',
    valueNumeric,
  };
}

export function makeNumericSectionHeader(
  sectionId: number,
  titleFi: string,
): SectionHeaderRow {
  return { ...makeFreeTextSectionHeader(sectionId, titleFi), type: 'numeric' };
}

export function makePersonalInfo(
  submissionId: string,
  overrides: Partial<SubmissionPersonalInfo> = {},
): SubmissionPersonalInfo {
  return {
    submissionId,
    name: null,
    email: null,
    phone: null,
    address: null,
    custom: null,
    timeStamp: mockDate,
    language: 'fi',
    details: {
      isRequired: false,
      askName: false,
      askEmail: false,
      askPhone: false,
      askAddress: false,
      askCustom: false,
      customLabel: { fi: '', en: '', se: '' },
    },
    ...overrides,
  };
}

export const multiLangTitle = {
  fi: 'Suomalainen kysymys',
  en: 'English question',
  se: 'Svensk fråga',
};
export const multiLangSubject = {
  fi: 'Kohde FI',
  en: 'Subject EN',
  se: 'Ämne SE',
};
export const multiLangClass = {
  fi: 'Luokka FI',
  en: 'Class EN',
  se: 'Klass SE',
};
export const multiLangTarget = {
  fi: 'Kohde FI',
  en: 'Target EN',
  se: 'Mål SE',
};
export const multiLangOption = {
  fi: 'Vaihtoehto FI',
  en: 'Option EN',
  se: 'Alternativ SE',
};
