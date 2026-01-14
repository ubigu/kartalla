import { LocalizedText, Survey, SurveyEmailInfoItem } from '@interfaces/survey';
import {
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';

import { useToasts } from '@src/stores/ToastContext';
import CopyToClipboard from '../CopyToClipboard';
import Fieldset from '../Fieldset';
import RichTextEditor from '../RichTextEditor';
import EditSurveySectionTranslations from './EditSurveySectionTranslations';
import TranslationField from './TranslationField';

const useStyles = makeStyles({
  rowContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  },
  langContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: '0.2rem',
  },
  pageContainer: {
    padding: '1rem',
    marginBottom: '1rem',
    border: '2px dashed lightgrey',
    borderRadius: '0.5rem',
  },
  missingTranslation: {
    color: 'red',
  },
  titleText: {
    color: 'grey',
  },
  keyValueContainer: {
    padding: '1rem',
    marginTop: '0.5rem',
    border: '1px solid lightgrey',
    borderRadius: '0.5rem',
  },
});

function surveyToTranslationString(survey: Survey) {
  const columnHeaders = 'Label \t fi \t en \t se \n';
  const surveyStrings: string[] = [];

  function isPartialLocalizedText(
    value: unknown,
  ): value is Partial<LocalizedText> {
    return (
      typeof value === 'object' &&
      value !== null &&
      ('fi' in value || 'en' in value || 'se' in value)
    );
  }

  function isObject(value: unknown): value is object {
    return !!value && typeof value === 'object';
  }

  function getRowString(
    label: string,
    valueFi: string,
    valueEn: string,
    valueSe: string,
  ): string {
    return `${label} \t ${valueFi ?? ''} \t ${valueEn ?? ''} \t ${
      valueSe ?? ''
    }\n`;
  }

  // Uses recursion to loop through the entire Survey object and to add all values of objects of type LocalizedText to the clipboard
  function addRowString(obj: unknown, label: string, index: number = 0) {
    if (Array.isArray(obj)) {
      index = 1;
      obj.forEach((item) => addRowString(item, `${label}.[${index}]`, index++));
    }
    if (!isObject(obj)) {
      return;
    }

    if (isPartialLocalizedText(obj)) {
      surveyStrings.push(
        getRowString(`${label}`, obj?.fi ?? '', obj?.en ?? '', obj?.se ?? ''),
      );
      return;
    }

    Object.entries(obj).forEach(([key, value]) => {
      if (!value) {
        return;
      } else if (Array.isArray(value)) {
        index = 1;
        value.forEach((item) => {
          addRowString(item, `${label}.${key}[${index}]`, index++);
        });
      } else if (typeof value === 'object' && !isPartialLocalizedText(value)) {
        addRowString(value, `${label}.${key}[${index}]`, index);
      } else if (isPartialLocalizedText(value)) {
        surveyStrings.push(
          getRowString(`${label}.${key}`, value.fi, value.en, value.se),
        );
      }
    });
  }

  addRowString(survey, 'Survey');
  return [columnHeaders, ...surveyStrings].join('');
}

export default function EditSurveyTranslations() {
  const {
    activeSurvey,
    activeSurveyLoading,
    editSurvey,
    editSection,
    editFollowUpSection,
    editPage,
  } = useSurvey();
  const { tr, languages } = useTranslations();
  const classes = useStyles();
  const { showToast } = useToasts();

  return (
    <>
      <Fieldset loading={activeSurveyLoading}>
        <div>
          <FormControlLabel
            control={
              <Checkbox
                name="email-enabled"
                disabled={activeSurveyLoading}
                checked={activeSurvey.localisationEnabled ?? false}
                onChange={(event) => {
                  editSurvey({
                    ...activeSurvey,
                    localisationEnabled: event.target.checked,
                  });
                }}
              />
            }
            label={tr.EditSurveyTranslations.enableLocalisation}
          />
          <FormHelperText>
            {tr.EditSurveyTranslations.provideTranslations}
          </FormHelperText>
        </div>
        {activeSurvey.localisationEnabled && (
          <>
            <div
              className={classes.rowContainer}
              style={{ justifyContent: 'flex-start' }}
            >
              <Typography>
                {tr.EditSurveyTranslations.copyTextFields}
              </Typography>
              <div style={{ display: 'inline-block' }}>
                <CopyToClipboard
                  data={surveyToTranslationString(activeSurvey)}
                />
              </div>
            </div>
            <Typography variant="h5">
              {tr.EditSurveyTranslations.supportedLanguages}:{' '}
            </Typography>
            <div className={classes.rowContainer}>
              {languages.map((lang, langIndex) => {
                return (
                  <div
                    className={classes.langContainer}
                    key={`lang-container-${langIndex}`}
                  >
                    <div
                      className={classes.rowContainer}
                      style={{ justifyContent: 'flex-start' }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={activeSurvey.enabledLanguages[lang]}
                            onChange={(event) => {
                              if (
                                !Object.values({
                                  ...activeSurvey.enabledLanguages,
                                  [lang]: event.target.checked,
                                }).some((languageEnabled) => languageEnabled)
                              ) {
                                showToast({
                                  severity: 'error',
                                  message:
                                    tr.EditSurveyTranslations
                                      .errorAtleastOnelanguage,
                                });
                                return;
                              }
                              editSurvey({
                                ...activeSurvey,
                                enabledLanguages: {
                                  ...activeSurvey.enabledLanguages,
                                  [lang]: event.target.checked,
                                },
                              });
                            }}
                            sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                          ></Checkbox>
                        }
                        label={
                          <Typography
                            variant="h6"
                            style={{ fontWeight: 'bold' }}
                          >
                            {tr.EditSurveyTranslations[
                              lang
                            ].toLocaleUpperCase()}
                          </Typography>
                        }
                      />
                    </div>
                    <br />
                    <Typography className={classes.titleText}>
                      {langIndex === 0
                        ? tr.EditSurveyTranslations.surveyTitle
                        : ''}{' '}
                      &nbsp;
                    </Typography>
                    <TranslationField
                      variant="standard"
                      value={activeSurvey.title?.[lang] ?? ''}
                      onChange={(event) => {
                        editSurvey({
                          ...activeSurvey,
                          title: {
                            ...activeSurvey.title,
                            [lang]: event.target.value,
                          },
                        });
                      }}
                    />
                    <Typography className={classes.titleText}>
                      {langIndex === 0
                        ? tr.EditSurveyTranslations.surveySubtitle
                        : ''}{' '}
                      &nbsp;
                    </Typography>
                    <TranslationField
                      variant="standard"
                      value={activeSurvey.subtitle?.[lang] ?? ''}
                      onChange={(event) => {
                        editSurvey({
                          ...activeSurvey,
                          subtitle: {
                            ...activeSurvey.subtitle,
                            [lang]: event.target.value,
                          },
                        });
                      }}
                    />
                    <Typography
                      sx={{ marginTop: '0.5rem' }}
                      className={classes.titleText}
                    >
                      {langIndex === 0
                        ? tr.EditSurveyTranslations.surveyDescription
                        : ''}{' '}
                      &nbsp;
                    </Typography>
                    <RichTextEditor
                      value={activeSurvey.description?.[lang] ?? ''}
                      missingValue={Boolean(!activeSurvey.description?.[lang])}
                      toolbarOptions={{
                        options: ['inline', 'fontSize'],
                        fontSize: {
                          options: [
                            8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60,
                          ],
                        },
                        inline: {
                          options: ['bold', 'italic'],
                        },
                      }}
                      onChange={(value) =>
                        editSurvey({
                          ...activeSurvey,
                          description: {
                            ...activeSurvey.description,
                            [lang]: value,
                          },
                        })
                      }
                      editorHeight={'100px'}
                    />
                    {activeSurvey.email.enabled && (
                      <>
                        <br />
                        <Typography className={classes.titleText}>
                          {langIndex === 0
                            ? tr.EditSurveyTranslations.emailInfo
                            : ''}
                          &nbsp;
                        </Typography>
                        <TranslationField
                          value={activeSurvey.email.subject?.[lang] ?? ''}
                          onChange={(event) =>
                            editSurvey({
                              ...activeSurvey,
                              email: {
                                ...activeSurvey.email,
                                subject: {
                                  ...activeSurvey.email.subject,
                                  [lang]: event.target.value,
                                },
                              },
                            })
                          }
                        />
                        <RichTextEditor
                          value={activeSurvey.email.body?.[lang] ?? ''}
                          missingValue={Boolean(
                            !activeSurvey.email.body?.[lang],
                          )}
                          onChange={(value) =>
                            editSurvey({
                              ...activeSurvey,
                              email: {
                                ...activeSurvey.email,
                                body: {
                                  ...activeSurvey.email.body,
                                  [lang]: value,
                                },
                              },
                            })
                          }
                          editorHeight={'100px'}
                        />
                        {activeSurvey?.email?.info?.map(
                          (infoRow: SurveyEmailInfoItem, index: number) => (
                            <div
                              key={`email-info-${index}`}
                              className={classes.keyValueContainer}
                            >
                              <TranslationField
                                variant="standard"
                                color="primary"
                                value={infoRow.name?.[lang] ?? ''}
                                onChange={(event) => {
                                  const updatedInfoRow = {
                                    ...infoRow,
                                    name: {
                                      ...infoRow.name,
                                      [lang]: event.target.value,
                                    },
                                  };
                                  const infoRows = [...activeSurvey.email.info];
                                  infoRows[index] = updatedInfoRow;
                                  editSurvey({
                                    ...activeSurvey,
                                    email: {
                                      ...activeSurvey.email,
                                      info: infoRows,
                                    },
                                  });
                                }}
                              />
                              <TranslationField
                                variant="standard"
                                color="primary"
                                value={infoRow.value?.[lang] ?? ''}
                                onChange={(event) => {
                                  const updatedInfoRow = {
                                    ...infoRow,
                                    value: {
                                      ...infoRow.value,
                                      [lang]: event.target.value,
                                    },
                                  };
                                  const infoRows = [...activeSurvey.email.info];
                                  infoRows[index] = updatedInfoRow;
                                  editSurvey({
                                    ...activeSurvey,
                                    email: {
                                      ...activeSurvey.email,
                                      info: infoRows,
                                    },
                                  });
                                }}
                              />
                            </div>
                          ),
                        )}
                      </>
                    )}
                    <br />
                    <Typography className={classes.titleText}>
                      {langIndex === 0
                        ? tr.EditSurveyTranslations.surveyPages
                        : ''}{' '}
                      &nbsp;
                    </Typography>
                    {activeSurvey.pages.map((page, pageIndex) => {
                      return (
                        <div key={`page-container-${pageIndex}`}>
                          <Typography className={classes.titleText}>
                            {langIndex === 0
                              ? `${pageIndex + 1}. ${
                                  tr.EditSurveyTranslations.page
                                }`
                              : ''}
                            &nbsp;
                          </Typography>
                          <div className={classes.pageContainer}>
                            <TranslationField
                              variant="standard"
                              color="primary"
                              value={page.title?.[lang] ?? ''}
                              onChange={(event) =>
                                editPage({
                                  ...page,
                                  title: {
                                    ...page.title,
                                    [lang]: event.target.value,
                                  },
                                })
                              }
                            />
                            {page.sidebar.type == 'image' && (
                              <TranslationField
                                variant="standard"
                                color="primary"
                                value={page.sidebar?.imageAltText?.[lang] ?? ''}
                                onChange={(event) =>
                                  editPage({
                                    ...page,
                                    sidebar: {
                                      ...page.sidebar,
                                      imageAltText: {
                                        ...page.sidebar.imageAltText,
                                        [lang]: event.target.value,
                                      },
                                    },
                                  })
                                }
                              />
                            )}
                            {page.sections.map((section, sectionIndex) => (
                              <div key={`survey-section-${sectionIndex}`}>
                                <EditSurveySectionTranslations
                                  languageCode={lang}
                                  section={section}
                                  onEdit={(editedSection) =>
                                    editSection(
                                      page.id,
                                      sectionIndex,
                                      editedSection,
                                    )
                                  }
                                />
                                {section?.followUpSections?.map(
                                  (followUpSection, index) => (
                                    <EditSurveySectionTranslations
                                      key={`survey-follow-up-section-${sectionIndex}-${index}`}
                                      languageCode={lang}
                                      section={followUpSection}
                                      onEdit={(editedFollowUpSection) => {
                                        editFollowUpSection(
                                          page.id,
                                          section.id,
                                          editedFollowUpSection,
                                        );
                                      }}
                                    />
                                  ),
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <>
                      <Typography className={classes.titleText}>
                        {langIndex === 0
                          ? tr.EditSurveyTranslations.thanksPage
                          : ''}
                        &nbsp;
                      </Typography>
                      <TranslationField
                        value={activeSurvey.thanksPage.title?.[lang] ?? ''}
                        onChange={(event) =>
                          editSurvey({
                            ...activeSurvey,
                            thanksPage: {
                              ...activeSurvey.thanksPage,
                              title: {
                                ...activeSurvey.thanksPage.title,
                                [lang]: event.target.value,
                              },
                            },
                          })
                        }
                      />
                      <RichTextEditor
                        value={activeSurvey.thanksPage.text?.[lang] ?? ''}
                        missingValue={Boolean(
                          !activeSurvey.thanksPage.text?.[lang],
                        )}
                        onChange={(value) =>
                          editSurvey({
                            ...activeSurvey,
                            thanksPage: {
                              ...activeSurvey.thanksPage,
                              text: {
                                ...activeSurvey.thanksPage.text,
                                [lang]: value,
                              },
                            },
                          })
                        }
                        editorHeight={'100px'}
                      />
                    </>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Fieldset>
    </>
  );
}
