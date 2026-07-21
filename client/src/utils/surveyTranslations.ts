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

const OPTIONAL_SECTION_FIELDS: Partial<
  Record<SurveyPageSection['type'], string[]>
> = {
  budgeting: ['helperText'],
  'geo-budgeting': ['helperText'],
};

function isOptionalSectionField(
  sectionType: SurveyPageSection['type'],
  key: string,
): boolean {
  return OPTIONAL_SECTION_FIELDS[sectionType]?.includes(key) ?? false;
}

interface SectionField {
  key: string;
  value: string;
}

/**
 * Single source of truth for which fields are translatable per section type
 * and in what order. collectSectionFields, collectPageFields and
 * countSectionRows all derive from this — the rendering in
 * SurveySectionTranslationBody must match this order.
 */
function collectSectionFieldEntries(
  section: SurveyPageSection,
  lang: LanguageCode,
): SectionField[] {
  const fields: SectionField[] = [];
  fields.push({ key: 'title', value: section.title?.[lang] ?? '' });

  switch (section.type) {
    case 'text':
      fields.push({ key: 'body', value: section.body?.[lang] ?? '' });
      break;
    case 'image':
      fields.push({ key: 'altText', value: section.altText?.[lang] ?? '' });
      break;
    case 'radio':
    case 'checkbox':
    case 'sorting':
      section.options?.forEach((option) => {
        fields.push({ key: 'option.text', value: option.text?.[lang] ?? '' });
        if (option.info)
          fields.push({ key: 'option.info', value: option.info[lang] ?? '' });
      });
      break;
    case 'radio-image':
      section.options?.forEach((option) => {
        fields.push({ key: 'option.text', value: option.text?.[lang] ?? '' });
        fields.push({
          key: 'option.altText',
          value: option.altText?.[lang] ?? '',
        });
        if (option.info)
          fields.push({ key: 'option.info', value: option.info[lang] ?? '' });
      });
      break;
    case 'slider':
      if (section.minLabel)
        fields.push({ key: 'minLabel', value: section.minLabel[lang] ?? '' });
      if (section.maxLabel)
        fields.push({ key: 'maxLabel', value: section.maxLabel[lang] ?? '' });
      break;
    case 'matrix':
    case 'multi-matrix':
      section.classes?.forEach((c) =>
        fields.push({ key: 'class', value: c[lang] ?? '' }),
      );
      section.subjects?.forEach((s) =>
        fields.push({ key: 'subject', value: s[lang] ?? '' }),
      );
      break;
    case 'budgeting':
    case 'geo-budgeting':
      section.targets?.forEach((t) =>
        fields.push({ key: 'target.name', value: t.name?.[lang] ?? '' }),
      );
      if (section.helperText)
        fields.push({
          key: 'helperText',
          value: section.helperText[lang] ?? '',
        });
      break;
    case 'grouped-checkbox':
      section.groups?.forEach((group) => {
        fields.push({ key: 'group.name', value: group.name?.[lang] ?? '' });
        group.options?.forEach((option) => {
          fields.push({ key: 'option.text', value: option.text?.[lang] ?? '' });
          if (option.info)
            fields.push({
              key: 'option.info',
              value: option.info[lang] ?? '',
            });
        });
      });
      break;
    case 'personal-info':
      if (section.customLabel)
        fields.push({
          key: 'customLabel',
          value: section.customLabel[lang] ?? '',
        });
      break;
    case 'map':
      section.subQuestions?.forEach((subQ) =>
        fields.push({
          key: 'subQuestion.title',
          value: subQ.title?.[lang] ?? '',
        }),
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

  if (section.info)
    fields.push({ key: 'info', value: section.info[lang] ?? '' });
  section.followUpSections?.forEach((fu) =>
    fields.push({ key: 'followUp.title', value: fu.title?.[lang] ?? '' }),
  );

  return fields;
}

export function collectSectionFields(
  section: SurveyPageSection,
  lang: LanguageCode,
): string[] {
  return collectSectionFieldEntries(section, lang).map((field) => field.value);
}

/**
 * Like collectSectionFields, but optional fields (see OPTIONAL_SECTION_FIELDS)
 * are dropped unless they're actually used in at least one enabled language —
 * mirroring how frontPageFields/thanksPageFields treat their optional fields.
 */
function getSectionFieldsByLangForCompleteness(
  section: SurveyPageSection,
  enabledLanguages: LanguageCode[],
): (lang: LanguageCode) => string[] {
  const isFieldUsed = (key: string) =>
    enabledLanguages.some((lang) =>
      collectSectionFieldEntries(section, lang)
        .find((field) => field.key === key)
        ?.value.trim(),
    );

  return (lang) =>
    collectSectionFieldEntries(section, lang)
      .filter(
        (field) =>
          !isOptionalSectionField(section.type, field.key) ||
          isFieldUsed(field.key),
      )
      .map((field) => field.value);
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

function getPageFieldsByLangForCompleteness(
  page: SurveyPage,
  enabledLanguages: LanguageCode[],
): (lang: LanguageCode) => string[] {
  const sectionFieldsByLang = (page.sections ?? []).map((section) =>
    getSectionFieldsByLangForCompleteness(section, enabledLanguages),
  );

  return (lang) => [
    page.title?.[lang] ?? '',
    ...sectionFieldsByLang.flatMap((fieldsByLang) => fieldsByLang(lang)),
  ];
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
    getPageFieldsByLangForCompleteness(page, enabledLanguages),
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
    ...(survey.pages ?? []).map((page) =>
      getPageFieldsByLangForCompleteness(page, enabledLanguages),
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
