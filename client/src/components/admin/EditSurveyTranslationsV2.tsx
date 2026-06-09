import {
  LanguageCode,
  SurveyPage,
  SurveyPageSection,
} from '@interfaces/survey';
import { Box, Theme, Typography, useTheme } from '@mui/material';
import { Input } from '@src/components/core/Input';
import { loadingPulse } from '@src/components/core/styles';
import { Tab, Tabs } from '@src/components/core/Tabs';
import RichTextEditor from '@src/components/RichTextEditor';
import { useSurvey } from '@src/stores/SurveyContext';
import {
  supportedLanguages,
  useTranslations,
} from '@src/stores/TranslationContext';
import { useWorkingLanguage } from '@src/stores/WorkingLanguageContext';
import {
  collectPageFields,
  collectSectionFields,
} from '@src/utils/surveyTranslations';
import { useState } from 'react';
import { Select } from '../core/Select';
import { SurveySectionTranslationBody } from './SurveySectionTranslationBody';
import { TRANSLATION_ROW_LABEL_WIDTH, TranslationRow } from './TranslationRow';

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

function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function countSectionRows(section: SurveyPageSection): number {
  return collectSectionFields(section, 'fi').length;
}

export const inlineToolbarOptions = {
  options: ['inline'],
  inline: { options: ['bold', 'italic'] },
};

export default function EditSurveyTranslationsV2() {
  const { activeSurvey, activeSurveyLoading, editSurvey, editPage } =
    useSurvey();
  const { workingLanguage } = useWorkingLanguage();
  const { tr, language } = useTranslations();
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const enabledLanguages = supportedLanguages.filter(
    (lang) => activeSurvey.enabledLanguages[lang],
  );
  const otherEnabledLanguages = enabledLanguages.filter(
    (lang) => lang !== workingLanguage,
  );
  const [columnLangs, setColumnLangs] = useState<LanguageCode[]>(
    enabledLanguages.filter((l) => l !== workingLanguage),
  );
  const [visibleColCount, setVisibleColCount] = useState(
    enabledLanguages.length,
  );

  const visibleCols = [
    workingLanguage,
    ...columnLangs.slice(0, visibleColCount - 1),
  ];

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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          minWidth: 'max-content',
        }}
      >
        <Typography variant="secondaryHeader" component="h2">
          {tr.EditSurvey.translations}
        </Typography>

        <Tabs value={activeTab} onChange={setActiveTab}>
          {pages.map((page, pageIndex) => {
            const pageTitle =
              page.title?.[language] ||
              `${tr.EditSurvey.page} ${pageIndex + 1}`;
            const tabColor = getPageTabColor(page, enabledLanguages, theme);
            return (
              <Tab
                key={page.id}
                label={`${pageIndex + 1}. ${pageTitle}`}
                labelColor={tabColor}
              />
            );
          })}
        </Tabs>
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
              <Select
                value={String(visibleColCount)}
                options={enabledLanguages.map((_, colIndex) => ({
                  value: String(colIndex + 1),
                  label: `${colIndex + 1} ${colIndex === 0 ? tr.EditSurveyTranslations.column : tr.EditSurveyTranslations.columns}`,
                }))}
                onChange={(value) => setVisibleColCount(Number(value))}
                sx={{ width: '100%' }}
              />
            </Box>
            <Box component="th" scope="col" sx={{ padding: '2px 8px' }}>
              <Typography
                sx={(theme) => ({
                  fontSize: '14px',
                  fontWeight: 700,
                  color: theme.palette.textSecondary.main,
                  textAlign: 'left',
                  height: '28px',
                  lineHeight: '28px',
                  padding: '0 6px',
                })}
              >
                {capitalizeFirst(tr.EditSurveyTranslations[workingLanguage])} (
                {workingLanguage}){' '}
                <Box
                  component={'span'}
                  sx={{
                    color: theme.palette.harmaa.main,
                    fontWeight: 400,
                  }}
                >
                  {'(työstökieli)'}
                </Box>
              </Typography>
            </Box>
            {visibleCols
              .filter((l) => l !== workingLanguage)
              .map((lang, colIdx) => (
                <Box
                  component="th"
                  scope="col"
                  key={`${lang}-${colIdx}`}
                  sx={{ padding: '2px 8px' }}
                >
                  {otherEnabledLanguages.length <= 1 ? (
                    <Typography
                      sx={(theme) => ({
                        fontSize: '14px',
                        fontWeight: 700,
                        color: theme.palette.textSecondary.main,
                        textAlign: 'left',
                        height: '28px',
                        lineHeight: '28px',
                        padding: '0 6px',
                      })}
                    >
                      {capitalizeFirst(tr.EditSurveyTranslations[lang])} ({lang}
                      )
                    </Typography>
                  ) : (
                    <Select
                      value={lang}
                      options={otherEnabledLanguages.map((langCode) => ({
                        value: langCode,
                        label: `${capitalizeFirst(tr.EditSurveyTranslations[langCode])} (${langCode})`,
                      }))}
                      onChange={(value) => {
                        const next = [...columnLangs];
                        next[colIdx] = value as LanguageCode;
                        setColumnLangs(next);
                      }}
                      sx={(theme) => ({
                        width: '100%',
                        fontWeight: 700,
                        color: theme.palette.textSecondary.main,
                      })}
                    />
                  )}
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
              <Input
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
              <Input
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
                  <Input
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
                    <Input
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
