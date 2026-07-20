import {
  LanguageCode,
  LocalizedText,
  Survey,
  SurveyPage,
  SurveyPageSection,
} from '@interfaces/survey';
import { Theme } from '@mui/material';
import { isSurveyFieldRequired } from '@src/stores/SurveyContext';
import { isLanguage } from '@src/stores/TranslationContext';
import { assertNever } from './typeCheck';

const SKIP_KEYS = new Set<string>(['localizedMapUrls']);

export function isLocalizedText(value: unknown): value is LocalizedText {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length > 0 &&
    entries.every(
      ([key, val]) =>
        isLanguage(key) && (val === null || typeof val === 'string'),
    )
  );
}

export function* walkLocalizedTexts(node: unknown): Generator<LocalizedText> {
  if (!node || typeof node !== 'object') return;
  if (isLocalizedText(node)) {
    yield node;
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) yield* walkLocalizedTexts(item);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (SKIP_KEYS.has(key)) continue;
    yield* walkLocalizedTexts(value);
  }
}

export function clearSurveyLanguage<T>(survey: T, lang: LanguageCode): T {
  for (const node of walkLocalizedTexts(survey)) {
    node[lang] = '';
  }
  return survey;
}

export function copySurveyLanguage<T>(
  survey: T,
  from: LanguageCode,
  to: LanguageCode,
  clearFrom: boolean = true,
): T {
  for (const node of walkLocalizedTexts(survey)) {
    node[to] = node[from] ?? '';
    if (clearFrom) node[from] = '';
  }
  return survey;
}

/**
 * Single source of truth for which fields are translatable per section type
 * and in what order. collectPageFields and countSectionRows both derive from
 * this — the rendering in SurveySectionTranslationBody must match this order.
 */
export function collectSectionFields(
  section: SurveyPageSection,
  lang: LanguageCode,
): string[] {
  const fields: string[] = [];
  fields.push(section.title?.[lang] ?? '');

  switch (section.type) {
    case 'text':
      fields.push(section.body?.[lang] ?? '');
      break;
    case 'image':
      fields.push(section.altText?.[lang] ?? '');
      break;
    case 'radio':
    case 'checkbox':
    case 'sorting':
      section.options?.forEach((option) => {
        fields.push(option.text?.[lang] ?? '');
        if (option.info) fields.push(option.info[lang] ?? '');
      });
      break;
    case 'radio-image':
      section.options?.forEach((option) => {
        fields.push(option.text?.[lang] ?? '');
        fields.push(option.altText?.[lang] ?? '');
        if (option.info) fields.push(option.info[lang] ?? '');
      });
      break;
    case 'slider':
      if (section.minLabel) fields.push(section.minLabel[lang] ?? '');
      if (section.maxLabel) fields.push(section.maxLabel[lang] ?? '');
      break;
    case 'matrix':
    case 'multi-matrix':
      section.classes?.forEach((c) => fields.push(c[lang] ?? ''));
      section.subjects?.forEach((s) => fields.push(s[lang] ?? ''));
      break;
    case 'budgeting':
    case 'geo-budgeting':
      section.targets?.forEach((t) => fields.push(t.name?.[lang] ?? ''));
      if (section.helperText) fields.push(section.helperText[lang] ?? '');
      break;
    case 'grouped-checkbox':
      section.groups?.forEach((group) => {
        fields.push(group.name?.[lang] ?? '');
        group.options?.forEach((option) => {
          fields.push(option.text?.[lang] ?? '');
          if (option.info) fields.push(option.info[lang] ?? '');
        });
      });
      break;
    case 'personal-info':
      if (section.customLabel) fields.push(section.customLabel[lang] ?? '');
      break;
    case 'map':
      section.subQuestions?.forEach((subQ) =>
        fields.push(subQ.title?.[lang] ?? ''),
      );
      break;
    case 'free-text':
    case 'numeric':
    case 'attachment':
    case 'document':
      break;
    default:
      assertNever(section);
  }

  if (section.info) fields.push(section.info[lang] ?? '');
  section.followUpSections?.forEach((fu) =>
    fields.push(fu.title?.[lang] ?? ''),
  );

  return fields;
}

export function collectPageFields(
  page: SurveyPage,
  lang: LanguageCode,
): string[] {
  const fields: string[] = [];
  fields.push(page.title?.[lang] ?? '');
  for (const section of page.sections ?? []) {
    fields.push(...collectSectionFields(section, lang));
  }
  return fields;
}

export function collectSurveyFields(
  survey: Survey,
  lang: LanguageCode,
): string[] {
  const fields: string[] = [];
  fields.push(survey.title?.[lang] ?? '');
  fields.push(survey.subtitle?.[lang] ?? '');
  fields.push(survey.description?.[lang] ?? '');
  for (const page of survey.pages ?? []) {
    fields.push(...collectPageFields(page, lang));
  }
  fields.push(survey.thanksPage?.title?.[lang] ?? '');
  fields.push(survey.thanksPage?.text?.[lang] ?? '');
  return fields;
}

export interface TranslationFieldCount {
  filled: number;
  total: number;
}

export function countSurveyTranslations(
  survey: Survey,
  languages: LanguageCode[],
): Record<LanguageCode, TranslationFieldCount> {
  const counts = {} as Record<LanguageCode, TranslationFieldCount>;
  for (const lang of languages) {
    const fields = collectSurveyFields(survey, lang);
    counts[lang] = {
      filled: fields.filter((field) => field.trim()).length,
      total: fields.length,
    };
  }
  return counts;
}

export function isSectionCompleteInLang(
  fieldsByLang: (lang: LanguageCode) => string[],
  lang: LanguageCode,
): boolean {
  return fieldsByLang(lang).every((field) => field.trim());
}

export function getTabColor(
  fieldsByLang: (lang: LanguageCode) => string[],
  enabledLanguages: LanguageCode[],
  theme: Theme,
): string | undefined {
  const completeLanguages = enabledLanguages.filter((lang) =>
    isSectionCompleteInLang(fieldsByLang, lang),
  );

  if (completeLanguages.length === enabledLanguages.length) return undefined;
  if (completeLanguages.length > 0) return theme.palette.textWarning.main;
  return theme.palette.textError.main;
}

export const frontPageFields: {
  key: string;
  values: (survey: Survey) => LocalizedText;
}[] = [
  { key: 'survey.title', values: (survey) => survey.title },
  { key: 'survey.subtitle', values: (survey) => survey.subtitle },
  { key: 'survey.description', values: (survey) => survey.description },
];

export function getFrontPageFieldsByLang(
  survey: Survey,
  enabledLanguages: LanguageCode[],
): (lang: LanguageCode) => string[] {
  const activeFields = frontPageFields.filter(
    ({ key, values }) =>
      isSurveyFieldRequired(key) ||
      enabledLanguages.some((lang) => values(survey)?.[lang]?.trim()),
  );

  return (lang) =>
    activeFields.map(({ values }) => values(survey)?.[lang] ?? '');
}

export function getFrontPageTabColor(
  survey: Survey,
  enabledLanguages: LanguageCode[],
  theme: Theme,
): string | undefined {
  return getTabColor(
    getFrontPageFieldsByLang(survey, enabledLanguages),
    enabledLanguages,
    theme,
  );
}

export function getPageTabColor(
  page: SurveyPage,
  enabledLanguages: LanguageCode[],
  theme: Theme,
): string | undefined {
  return getTabColor(
    (lang) => collectPageFields(page, lang),
    enabledLanguages,
    theme,
  );
}

export const thanksPageFields: {
  key: string;
  values: (survey: Survey) => LocalizedText;
}[] = [
  {
    key: 'survey.thanksPage.title',
    values: (survey) => survey.thanksPage?.title,
  },
  {
    key: 'survey.thanksPage.text',
    values: (survey) => survey.thanksPage?.text,
  },
];

export function getThanksPageFieldsByLang(
  survey: Survey,
  enabledLanguages: LanguageCode[],
): (lang: LanguageCode) => string[] {
  const activeFields = thanksPageFields.filter(
    ({ key, values }) =>
      isSurveyFieldRequired(key) ||
      enabledLanguages.some((lang) => values(survey)?.[lang]?.trim()),
  );

  return (lang) =>
    activeFields.map(({ values }) => values(survey)?.[lang] ?? '');
}

export function getThanksPageTabColor(
  survey: Survey,
  enabledLanguages: LanguageCode[],
  theme: Theme,
): string | undefined {
  return getTabColor(
    getThanksPageFieldsByLang(survey, enabledLanguages),
    enabledLanguages,
    theme,
  );
}

export function getLangBadgeStatus(
  survey: Survey,
  enabledLanguages: LanguageCode[],
  lang: LanguageCode,
): 'default' | 'warning' | 'error' {
  const sectionFieldsByLang = [
    getFrontPageFieldsByLang(survey, enabledLanguages),
    ...(survey.pages ?? []).map(
      (page) => (lang: LanguageCode) => collectPageFields(page, lang),
    ),
    getThanksPageFieldsByLang(survey, enabledLanguages),
  ];

  const completeSections = sectionFieldsByLang.filter((fieldsByLang) =>
    isSectionCompleteInLang(fieldsByLang, lang),
  );

  if (completeSections.length === sectionFieldsByLang.length) return 'default';
  if (completeSections.length > 0) return 'warning';
  return 'error';
}
