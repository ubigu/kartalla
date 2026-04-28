import {
  LanguageCode,
  SurveyPage,
  SurveyPageSection,
} from '@interfaces/survey';
import { Box, Theme, Typography, useTheme } from '@mui/material';
import { Combobox_WIP } from '@src/components/core/Combobox';
import { CoreInput } from '@src/components/core/Input';
import { loadingPulse } from '@src/components/core/styles';
import { CoreTab, CoreTabs } from '@src/components/core/Tabs';
import RichTextEditor from '@src/components/RichTextEditor';
import { useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import { Language, useTranslations } from '@src/stores/TranslationContext';
import { assertNever } from '@src/utils/typeCheck';
import { useState } from 'react';
import { CoreCheckbox } from '../core/Checkbox';
import { SurveySectionTranslationBody } from './SurveySectionTranslationBody';
import { TRANSLATION_ROW_LABEL_WIDTH, TranslationRow } from './TranslationRow';

export function collectPageFields(
  page: SurveyPage,
  lang: LanguageCode,
): string[] {
  const fields: string[] = [];
  fields.push(page.title?.[lang] ?? '');
  for (const section of page.sections ?? []) {
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
        section.classes?.forEach((matrixClass) =>
          fields.push(matrixClass[lang] ?? ''),
        );
        section.subjects?.forEach((subject) =>
          fields.push(subject[lang] ?? ''),
        );
        break;
      case 'budgeting':
      case 'geo-budgeting':
        section.targets?.forEach((target) =>
          fields.push(target.name?.[lang] ?? ''),
        );
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
      case 'free-text':
      case 'numeric':
      case 'map':
      case 'attachment':
      case 'document':
        // title only — no additional translatable fields
        break;
      default:
        assertNever(section);
    }
    if (section.info) fields.push(section.info[lang] ?? '');
    section.followUpSections?.forEach((followUp) =>
      fields.push(followUp.title?.[lang] ?? ''),
    );
  }
  return fields;
}

function getPageTabColor(
  page: SurveyPage,
  enabledLanguages: LanguageCode[],
  theme: Theme,
): string | undefined {
  let anyMissing = false;
  for (const lang of enabledLanguages) {
    const fields = collectPageFields(page, lang);
    const filledCount = fields.filter((field) => field.trim()).length;
    if (filledCount === 0) return theme.palette.textError.main;
    if (filledCount < fields.length) anyMissing = true;
  }
  return anyMissing ? theme.palette.textWarning.main : undefined;
}

export function countSectionRows(section: SurveyPageSection): number {
  let count = 1; // questionText title row
  switch (section.type) {
    case 'text':
      count += 1;
      break;
    case 'image':
      count += 1;
      break;
    case 'radio':
    case 'checkbox':
    case 'sorting':
      section.options?.forEach((opt) => {
        count += 1;
        if (opt.info) count += 1;
      });
      break;
    case 'radio-image':
      section.options?.forEach((opt) => {
        count += 2;
        if (opt.info) count += 1;
      });
      break;
    case 'slider':
      if (section.minLabel) count += 1;
      if (section.maxLabel) count += 1;
      break;
    case 'matrix':
    case 'multi-matrix':
      count += (section.classes?.length ?? 0) + (section.subjects?.length ?? 0);
      break;
    case 'budgeting':
    case 'geo-budgeting':
      count += section.targets?.length ?? 0;
      if (section.helperText) count += 1;
      break;
    case 'grouped-checkbox':
      section.groups?.forEach((group) => {
        count += 1;
        group.options?.forEach((opt) => {
          count += 1;
          if (opt.info) count += 1;
        });
      });
      break;
    case 'personal-info':
      if (section.customLabel) count += 1;
      break;
    case 'map':
      count += section.subQuestions?.length ?? 0;
      break;
    case 'free-text':
    case 'numeric':
    case 'attachment':
    case 'document':
      break;
    default:
      assertNever(section);
  }
  if (section.info) count += 1;
  count += section.followUpSections?.length ?? 0;
  return count;
}

export const inlineToolbarOptions = {
  options: ['inline'],
  inline: { options: ['bold', 'italic'] },
};

export function LanguageSelector({
  allLanguages,
  enabledLanguages,
  onToggle,
  label,
  getLabel,
}: {
  allLanguages: Language[];
  enabledLanguages: Record<Language, boolean>;
  onToggle: (lang: Language, enabled: boolean) => void;
  label: string;
  getLabel: (lang: Language) => string;
}) {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Typography
        sx={{ fontSize: '12px', color: theme.palette.textInteractive.main }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', gap: '4px' }}>
        {allLanguages.map((lang, idx) => {
          const isChecked = !!enabledLanguages[lang];
          return (
            <CoreCheckbox
              key={`${lang}-${idx}`}
              label={getLabel(lang)}
              onClick={() => onToggle(lang, !isChecked)}
              checked={isChecked}
            />
          );
        })}
      </Box>
    </Box>
  );
}

export default function EditSurveyTranslationsV2() {
  const { activeSurvey, activeSurveyLoading, editSurvey, editPage } =
    useSurvey();
  const { tr, language, languages } = useTranslations();
  const { showToast } = useToasts();
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const enabledLanguages = languages.filter(
    (lang) => activeSurvey.enabledLanguages[lang],
  );
  const [columnLangs, setColumnLangs] = useState<LanguageCode[]>(languages);
  const [visibleColCount, setVisibleColCount] = useState(languages.length);

  const visibleCols = columnLangs.slice(0, visibleColCount);

  const pages = activeSurvey.pages ?? [];
  const activePage = pages[activeTab];
  const totalCols = visibleCols.length + 1;

  // Compute cumulative start indices so stripe alternation is continuous across all tbodies
  const SURVEY_ROW_COUNT = 3; // title, subtitle, description
  const PAGE_TITLE_START = SURVEY_ROW_COUNT;
  const sections = activePage?.sections ?? [];
  const sectionStarts: number[] = [];
  let nextIdx = PAGE_TITLE_START + 1;
  for (const section of sections) {
    sectionStarts.push(nextIdx);
    nextIdx += countSectionRows(section);
  }
  const thanksStart = nextIdx;

  return (
    <Box
      sx={{
        minWidth: 'fit-content',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        ...(activeSurveyLoading && loadingPulse),
      }}
    >
      <Typography variant="mainHeader" component="h1">
        {tr.EditSurveyTranslations.multilingualism}
      </Typography>

      <LanguageSelector
        allLanguages={languages}
        enabledLanguages={activeSurvey.enabledLanguages}
        label={tr.EditSurveyTranslations.supportedLanguages}
        getLabel={(lang) => `${tr.EditSurveyTranslations[lang]} (${lang})`}
        onToggle={(lang, enabled) => {
          const next = { ...activeSurvey.enabledLanguages, [lang]: enabled };
          if (!Object.values(next).some(Boolean)) {
            showToast({
              severity: 'error',
              message: tr.EditSurveyTranslations.errorAtleastOnelanguage,
            });
            return;
          }
          editSurvey({ ...activeSurvey, enabledLanguages: next });
        }}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: 'max-content',
        }}
      >
        <Typography variant="secondaryHeader" component="h2">
          {tr.EditSurvey.translations}
        </Typography>

        <CoreTabs value={activeTab} onChange={setActiveTab}>
          {pages.map((page, pageIndex) => {
            const pageTitle =
              page.title?.[language] ||
              `${tr.EditSurvey.page} ${pageIndex + 1}`;
            const tabColor = getPageTabColor(page, enabledLanguages, theme);
            return (
              <CoreTab
                key={page.id}
                label={`${pageIndex + 1}. ${pageTitle}`}
                labelColor={tabColor}
              />
            );
          })}
        </CoreTabs>
      </Box>

      <Box
        component="table"
        sx={{
          width: `min(100%, ${visibleColCount * 600}px)`,
          borderCollapse: 'separate',
          borderSpacing: '0px 4px',
          tableLayout: 'fixed',
          marginTop: '12px',
        }}
      >
        <Box component="thead">
          <Box
            component="tr"
            sx={(theme) => ({
              borderBottom: `2px solid ${theme.palette.primary.main}`,
            })}
          >
            <Box
              component="th"
              sx={{ width: TRANSLATION_ROW_LABEL_WIDTH, padding: '4px 0' }}
            >
              <Combobox_WIP
                value={String(visibleColCount)}
                options={languages.map((_, colIndex) => ({
                  value: String(colIndex + 1),
                  label: `${colIndex + 1} ${colIndex === 0 ? tr.EditSurveyTranslations.column : tr.EditSurveyTranslations.columns}`,
                }))}
                onChange={(value) => setVisibleColCount(Number(value))}
                sx={{ width: '100%' }}
              />
            </Box>
            {visibleCols.map((lang, colIdx) => (
              <Box
                component="th"
                scope="col"
                key={colIdx}
                sx={{ padding: '2px 8px' }}
              >
                <Combobox_WIP
                  value={lang}
                  options={languages.map((langCode) => ({
                    value: langCode,
                    label: `${tr.EditSurveyTranslations[langCode]} (${langCode})`,
                  }))}
                  onChange={(value) => {
                    const next = [...columnLangs];
                    next[colIdx] = value as LanguageCode;
                    setColumnLangs(next);
                  }}
                  sx={(theme) => ({
                    fontSize: '16px',
                    fontWeight: 700,
                    color: theme.palette.textSecondary.main,
                  })}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Survey-level fields */}
        <Box component="tbody">
          <TranslationRow
            label={tr.EditSurveyTranslations.surveyTitle}
            stripe={false}
            cols={visibleCols}
            render={(lang) => (
              <CoreInput
                value={activeSurvey.title?.[lang] ?? ''}
                onChange={(e) =>
                  editSurvey({
                    ...activeSurvey,
                    title: {
                      ...activeSurvey.title,
                      [lang]: e.target.value,
                    },
                  })
                }
              />
            )}
          />
          <TranslationRow
            label={tr.EditSurveyTranslations.surveySubtitle}
            stripe={true}
            cols={visibleCols}
            render={(lang) => (
              <CoreInput
                value={activeSurvey.subtitle?.[lang] ?? ''}
                onChange={(e) =>
                  editSurvey({
                    ...activeSurvey,
                    subtitle: {
                      ...activeSurvey.subtitle,
                      [lang]: e.target.value,
                    },
                  })
                }
              />
            )}
          />
          <TranslationRow
            label={tr.EditSurveyTranslations.surveyDescription}
            stripe={false}
            cols={visibleCols}
            headerVerticalAlign="top"
            render={(lang) => (
              <RichTextEditor
                value={activeSurvey.description?.[lang] ?? ''}
                missingValue={false}
                onChange={(val) =>
                  editSurvey({
                    ...activeSurvey,
                    description: { ...activeSurvey.description, [lang]: val },
                  })
                }
                editorHeight="80px"
                resizable
                toolbarOptions={inlineToolbarOptions}
              />
            )}
          />
        </Box>

        {activePage && (
          <>
            {/* Page title */}
            <Box component="tbody">
              <TranslationRow
                label={tr.EditSurveyTranslations.pageTitle}
                stripe={PAGE_TITLE_START % 2 !== 0}
                cols={visibleCols}
                render={(lang) => (
                  <CoreInput
                    value={activePage.title?.[lang] ?? ''}
                    onChange={(e) =>
                      editPage({
                        ...activePage,
                        title: { ...activePage.title, [lang]: e.target.value },
                      })
                    }
                  />
                )}
              />
            </Box>

            {/* Sections */}
            {activePage.sections.map((section, sectionIndex) => (
              <SurveySectionTranslationBody
                key={`${section.id}-${sectionIndex}`}
                activePage={activePage}
                section={section}
                sectionIndex={sectionIndex}
                totalCols={totalCols}
                visibleCols={visibleCols}
                startIndex={sectionStarts[sectionIndex]}
              />
            ))}

            {/* Thanks page — only on the last page tab */}
            {activeTab === pages.length - 1 && (
              <Box component="tbody">
                <TranslationRow
                  label={tr.EditSurveyTranslations.thanksPageTitle}
                  stripe={thanksStart % 2 !== 0}
                  cols={visibleCols}
                  render={(lang) => (
                    <CoreInput
                      value={activeSurvey.thanksPage.title?.[lang] ?? ''}
                      onChange={(e) =>
                        editSurvey({
                          ...activeSurvey,
                          thanksPage: {
                            ...activeSurvey.thanksPage,
                            title: {
                              ...activeSurvey.thanksPage.title,
                              [lang]: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  )}
                />
                <TranslationRow
                  label={tr.EditSurveyTranslations.thanksPageText}
                  stripe={(thanksStart + 1) % 2 !== 0}
                  cols={visibleCols}
                  headerVerticalAlign="top"
                  render={(lang) => (
                    <RichTextEditor
                      value={activeSurvey.thanksPage.text?.[lang] ?? ''}
                      missingValue={false}
                      onChange={(val) =>
                        editSurvey({
                          ...activeSurvey,
                          thanksPage: {
                            ...activeSurvey.thanksPage,
                            text: {
                              ...activeSurvey.thanksPage.text,
                              [lang]: val,
                            },
                          },
                        })
                      }
                      resizable
                      editorHeight="80px"
                      toolbarOptions={inlineToolbarOptions}
                    />
                  )}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
