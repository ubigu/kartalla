import {
  LanguageCode,
  LocalizedText,
  SurveyPage,
  SurveyPageSection,
} from '@interfaces/survey';
import { Box, Typography } from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { Fragment, ReactNode } from 'react';
import { CoreInput } from '../core/Input';
import RichTextEditor from '../RichTextEditor';
import { inlineToolbarOptions } from './EditSurveyTranslationsV2';
import { sectionTypeIcons } from './surveySectionIcons';
import { TranslationRow } from './TranslationRow';

function updateAt<T>(array: T[], index: number, patch: Partial<T>): T[] {
  const updated = [...array];
  updated[index] = { ...updated[index], ...patch };
  return updated;
}

interface Props {
  section: SurveyPageSection;
  sectionIndex: number;
  totalCols: number;
  visibleCols: LanguageCode[];
  activePage: SurveyPage;
}

function SubheaderRow({
  label,
  colCount,
  icon,
  prefix,
  scope,
}: {
  label: string;
  colCount: number;
  icon?: ReactNode;
  prefix?: string;
  scope: string;
}) {
  return (
    <Box component="tr">
      <Box
        component="th"
        scope={scope}
        colSpan={colCount}
        sx={(theme) => ({
          textAlign: 'left',
          padding: '14px 8px 6px 8px',
          borderBottom: `1px solid ${theme.palette.textSecondary.main}`,
        })}
      >
        <Box sx={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {prefix && (
            <Typography component="span" variant="secondaryHeader">
              {prefix}
            </Typography>
          )}
          <Box
            sx={(theme) => ({
              display: 'flex',
              fontSize: '12px',
              color: theme.palette.textSecondary.main,
              '& svg': { fontSize: 'inherit', color: 'inherit' },
            })}
          >
            {icon}
          </Box>
          <Typography component="p" variant="secondaryHeader">
            {label}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function SurveySectionTranslationBody({
  section,
  sectionIndex,
  totalCols,
  visibleCols,
  activePage,
}: Props) {
  const { language, tr } = useTranslations();
  const { editSection, editFollowUpSection } = useSurvey();

  const sectionLabel = section.title?.[language] || `${sectionIndex + 1}.`;
  let rowIndex = 0;
  const nextStripe = () => rowIndex++ % 2 !== 0;

  const renderChoiceOptions = () => {
    const s = section as Extract<SurveyPageSection, { type: 'radio' }>;
    return s.options?.map((option, optionIndex) => (
      <Fragment key={`opt-${optionIndex}`}>
        <TranslationRow
          stripe={nextStripe()}
          label={`${optionIndex + 1}. ${tr.EditSurveyTranslations.option.toLowerCase()}`}
          cols={visibleCols}
          render={(lang) => (
            <CoreInput
              value={option.text?.[lang] ?? ''}
              onChange={(e) =>
                editSection(activePage.id, sectionIndex, {
                  ...s,
                  options: updateAt(s.options, optionIndex, {
                    text: { ...option.text, [lang]: e.target.value },
                  }),
                })
              }
            />
          )}
        />
        {option.info && (
          <TranslationRow
            stripe={nextStripe()}
            label={`${optionIndex + 1}. ${tr.EditSurveyTranslations.optionInfo.toLowerCase()}`}
            cols={visibleCols}
            render={(lang) => (
              <CoreInput
                value={option.info?.[lang] ?? ''}
                onChange={(e) =>
                  editSection(activePage.id, sectionIndex, {
                    ...s,
                    options: updateAt(s.options, optionIndex, {
                      info: {
                        ...option.info,
                        [lang]: e.target.value,
                      } as LocalizedText,
                    }),
                  })
                }
              />
            )}
          />
        )}
      </Fragment>
    ));
  };

  const renderMatrixRows = (): ReactNode => {
    const s = section as Extract<SurveyPageSection, { type: 'matrix' }>;
    return (
      <>
        {s.classes?.map((matrixClass, classIndex) => (
          <TranslationRow
            key={`cls-${classIndex}`}
            stripe={nextStripe()}
            label={`${tr.EditSurveyTranslations.matrixClass} ${classIndex + 1}`}
            cols={visibleCols}
            render={(lang) => (
              <CoreInput
                value={matrixClass?.[lang] ?? ''}
                onChange={(e) =>
                  editSection(activePage.id, sectionIndex, {
                    ...s,
                    classes: updateAt(s.classes, classIndex, {
                      [lang]: e.target.value,
                    }),
                  })
                }
              />
            )}
          />
        ))}
        {s.subjects?.map((subject, subjectIndex) => (
          <TranslationRow
            key={`sbj-${subjectIndex}`}
            stripe={nextStripe()}
            label={`${tr.EditSurveyTranslations.matrixSubject} ${subjectIndex + 1}`}
            cols={visibleCols}
            render={(lang) => (
              <CoreInput
                value={subject?.[lang] ?? ''}
                onChange={(e) =>
                  editSection(activePage.id, sectionIndex, {
                    ...s,
                    subjects: updateAt(s.subjects, subjectIndex, {
                      [lang]: e.target.value,
                    }),
                  })
                }
              />
            )}
          />
        ))}
      </>
    );
  };

  const renderBudgetingRows = (): ReactNode => {
    const s = section as Extract<SurveyPageSection, { type: 'budgeting' }>;
    return (
      <>
        {s.targets?.map((target, targetIndex) => (
          <TranslationRow
            key={`tgt-${targetIndex}`}
            stripe={nextStripe()}
            label={`${tr.EditSurveyTranslations.budgetTarget} ${targetIndex + 1}`}
            cols={visibleCols}
            render={(lang) => (
              <CoreInput
                value={target.name?.[lang] ?? ''}
                onChange={(e) =>
                  editSection(activePage.id, sectionIndex, {
                    ...s,
                    targets: updateAt(s.targets, targetIndex, {
                      name: { ...target.name, [lang]: e.target.value },
                    }),
                  })
                }
              />
            )}
          />
        ))}
        {s.helperText && (
          <TranslationRow
            stripe={nextStripe()}
            label={tr.EditSurveyTranslations.helperText}
            cols={visibleCols}
            render={(lang) => (
              <RichTextEditor
                value={s.helperText?.[lang] ?? ''}
                missingValue={false}
                onChange={(val) =>
                  editSection(activePage.id, sectionIndex, {
                    ...s,
                    helperText: {
                      ...s.helperText,
                      [lang]: val,
                    } as LocalizedText,
                  })
                }
                editorHeight="80px"
                resizable
                toolbarOptions={inlineToolbarOptions}
              />
            )}
          />
        )}
      </>
    );
  };

  const typeRowRenderers: Partial<
    Record<SurveyPageSection['type'], () => ReactNode>
  > = {
    map: () => {
      const s = section as Extract<SurveyPageSection, { type: 'map' }>;
      return s.subQuestions.map((question, questionIndex) => {
        const subQuestionLabel =
          question.title?.[language] ||
          `${sectionIndex + 1}.${questionIndex + 1}.`;
        return (
          <Fragment key={`fu-${questionIndex}`}>
            <SubheaderRow
              scope="row"
              prefix="↳"
              label={`${sectionIndex + 1}.${questionIndex + 1} ${subQuestionLabel}`}
              colCount={totalCols}
              icon={sectionTypeIcons[question.type]}
            />
            <TranslationRow
              stripe={nextStripe()}
              label={tr.EditSurveyTranslations.questionText}
              cols={visibleCols}
              render={(lang) => (
                <CoreInput
                  value={question.title?.[lang] ?? ''}
                  onChange={(e) =>
                    editSection(activePage.id, section.id!, {
                      ...question,
                      title: { ...question.title, [lang]: e.target.value },
                    })
                  }
                />
              )}
            />
          </Fragment>
        );
      });
    },
    text: () => {
      const s = section as Extract<SurveyPageSection, { type: 'text' }>;
      return (
        <TranslationRow
          stripe={nextStripe()}
          label={tr.EditSurveyTranslations.bodyText}
          cols={visibleCols}
          render={(lang) => (
            <RichTextEditor
              value={s.body?.[lang] ?? ''}
              missingValue={false}
              onChange={(val) =>
                editSection(activePage.id, sectionIndex, {
                  ...s,
                  body: { ...s.body, [lang]: val },
                })
              }
              resizable
              editorHeight="80px"
              toolbarOptions={inlineToolbarOptions}
            />
          )}
        />
      );
    },
    image: () => {
      const s = section as Extract<SurveyPageSection, { type: 'image' }>;
      return (
        <TranslationRow
          stripe={nextStripe()}
          label={tr.EditSurveyTranslations.imageCaption}
          cols={visibleCols}
          render={(lang) => (
            <CoreInput
              value={s.altText?.[lang] ?? ''}
              onChange={(e) =>
                editSection(activePage.id, sectionIndex, {
                  ...s,
                  altText: { ...s.altText, [lang]: e.target.value },
                })
              }
            />
          )}
        />
      );
    },
    radio: renderChoiceOptions,
    checkbox: renderChoiceOptions,
    sorting: renderChoiceOptions,
    'radio-image': () => {
      const s = section as Extract<SurveyPageSection, { type: 'radio-image' }>;
      return s.options?.map((option, optionIndex) => (
        <Fragment key={`imgopt-${optionIndex}`}>
          <TranslationRow
            stripe={nextStripe()}
            label={`${optionIndex + 1}. ${tr.EditSurveyTranslations.option.toLowerCase()}`}
            cols={visibleCols}
            render={(lang) => (
              <CoreInput
                value={option.text?.[lang] ?? ''}
                onChange={(e) =>
                  editSection(activePage.id, sectionIndex, {
                    ...s,
                    options: updateAt(s.options, optionIndex, {
                      text: { ...option.text, [lang]: e.target.value },
                    }),
                  })
                }
              />
            )}
          />
          <TranslationRow
            stripe={nextStripe()}
            label={`${optionIndex + 1}. ${tr.EditSurveyTranslations.optionAltText.toLowerCase()}`}
            cols={visibleCols}
            render={(lang) => (
              <CoreInput
                value={option.altText?.[lang] ?? ''}
                onChange={(e) =>
                  editSection(activePage.id, sectionIndex, {
                    ...s,
                    options: updateAt(s.options, optionIndex, {
                      altText: { ...option.altText, [lang]: e.target.value },
                    }),
                  })
                }
              />
            )}
          />
          {option.info && (
            <TranslationRow
              stripe={nextStripe()}
              label={`${optionIndex + 1}. ${tr.EditSurveyTranslations.optionInfo.toLowerCase()}`}
              cols={visibleCols}
              render={(lang) => (
                <CoreInput
                  value={option.info?.[lang] ?? ''}
                  onChange={(e) =>
                    editSection(activePage.id, sectionIndex, {
                      ...s,
                      options: updateAt(s.options, optionIndex, {
                        info: {
                          ...option.info,
                          [lang]: e.target.value,
                        } as LocalizedText,
                      }),
                    })
                  }
                />
              )}
            />
          )}
        </Fragment>
      ));
    },
    slider: () => {
      const s = section as Extract<SurveyPageSection, { type: 'slider' }>;
      return (
        <>
          {s.minLabel && (
            <TranslationRow
              stripe={nextStripe()}
              label={tr.EditSurveyTranslations.sliderMinLabel}
              cols={visibleCols}
              render={(lang) => (
                <CoreInput
                  value={s.minLabel?.[lang] ?? ''}
                  onChange={(e) =>
                    editSection(activePage.id, sectionIndex, {
                      ...s,
                      minLabel: { ...s.minLabel, [lang]: e.target.value },
                    })
                  }
                />
              )}
            />
          )}
          {s.maxLabel && (
            <TranslationRow
              stripe={nextStripe()}
              label={tr.EditSurveyTranslations.sliderMaxLabel}
              cols={visibleCols}
              render={(lang) => (
                <CoreInput
                  value={s.maxLabel?.[lang] ?? ''}
                  onChange={(e) =>
                    editSection(activePage.id, sectionIndex, {
                      ...s,
                      maxLabel: { ...s.maxLabel, [lang]: e.target.value },
                    })
                  }
                />
              )}
            />
          )}
        </>
      );
    },
    matrix: renderMatrixRows,
    'multi-matrix': renderMatrixRows,
    budgeting: renderBudgetingRows,
    'geo-budgeting': renderBudgetingRows,
    'grouped-checkbox': () => {
      const s = section as Extract<
        SurveyPageSection,
        { type: 'grouped-checkbox' }
      >;
      return s.groups?.map((group, groupIndex) => (
        <Fragment key={`grp-${groupIndex}`}>
          <TranslationRow
            stripe={nextStripe()}
            label={`${tr.EditSurveyTranslations.group} ${groupIndex + 1}`}
            cols={visibleCols}
            render={(lang) => (
              <CoreInput
                value={group.name?.[lang] ?? ''}
                onChange={(e) =>
                  editSection(activePage.id, sectionIndex, {
                    ...s,
                    groups: updateAt(s.groups, groupIndex, {
                      name: { ...group.name, [lang]: e.target.value },
                    }),
                  })
                }
              />
            )}
          />
          {group.options?.map((option, optionIndex) => (
            <Fragment key={`grp-opt-${optionIndex}`}>
              <TranslationRow
                stripe={nextStripe()}
                label={`  ${optionIndex + 1}. ${tr.EditSurveyTranslations.option.toLowerCase()}`}
                cols={visibleCols}
                render={(lang) => (
                  <CoreInput
                    value={option.text?.[lang] ?? ''}
                    onChange={(e) =>
                      editSection(activePage.id, sectionIndex, {
                        ...s,
                        groups: updateAt(s.groups, groupIndex, {
                          options: updateAt(group.options, optionIndex, {
                            text: { ...option.text, [lang]: e.target.value },
                          }),
                        }),
                      })
                    }
                  />
                )}
              />
              {option.info && (
                <TranslationRow
                  stripe={nextStripe()}
                  label={`  ${optionIndex + 1}. ${tr.EditSurveyTranslations.optionInfo.toLowerCase()}`}
                  cols={visibleCols}
                  render={(lang) => (
                    <CoreInput
                      value={option.info?.[lang] ?? ''}
                      onChange={(e) =>
                        editSection(activePage.id, sectionIndex, {
                          ...s,
                          groups: updateAt(s.groups, groupIndex, {
                            options: updateAt(group.options, optionIndex, {
                              info: {
                                ...option.info,
                                [lang]: e.target.value,
                              } as LocalizedText,
                            }),
                          }),
                        })
                      }
                    />
                  )}
                />
              )}
            </Fragment>
          ))}
        </Fragment>
      ));
    },
    'personal-info': () => {
      const s = section as Extract<
        SurveyPageSection,
        { type: 'personal-info' }
      >;
      if (!s.customLabel) return null;
      return (
        <TranslationRow
          stripe={nextStripe()}
          label={tr.EditSurveyTranslations.customLabel}
          cols={visibleCols}
          render={(lang) => (
            <CoreInput
              value={s.customLabel?.[lang] ?? ''}
              onChange={(e) =>
                editSection(activePage.id, sectionIndex, {
                  ...s,
                  customLabel: {
                    ...s.customLabel,
                    [lang]: e.target.value,
                  } as LocalizedText,
                })
              }
            />
          )}
        />
      );
    },
  };

  return (
    <Box component="tbody" key={`section-${sectionIndex}`}>
      <SubheaderRow
        scope="colgroup"
        label={`${sectionIndex + 1}. ${sectionLabel}`}
        colCount={totalCols}
        icon={sectionTypeIcons[section.type]}
      />
      <TranslationRow
        stripe={nextStripe()}
        label={tr.EditSurveyTranslations.questionText}
        cols={visibleCols}
        render={(lang) => (
          <CoreInput
            value={section.title?.[lang] ?? ''}
            onChange={(e) =>
              editSection(activePage.id, sectionIndex, {
                ...section,
                title: { ...section.title, [lang]: e.target.value },
              })
            }
          />
        )}
      />
      {typeRowRenderers[section.type]?.()}
      {section.info && (
        <TranslationRow
          stripe={nextStripe()}
          label={tr.EditSurveyTranslations.additionalInfo}
          cols={visibleCols}
          render={(lang) => (
            <RichTextEditor
              value={section.info?.[lang] ?? ''}
              missingValue={false}
              onChange={(val) =>
                editSection(activePage.id, sectionIndex, {
                  ...section,
                  info: { ...section.info, [lang]: val } as LocalizedText,
                })
              }
              resizable
              editorHeight="80px"
              toolbarOptions={inlineToolbarOptions}
            />
          )}
        />
      )}
      {section.followUpSections?.map((followUp, followUpIndex) => {
        const followUpLabel =
          followUp.title?.[language] ||
          `${sectionIndex + 1}.${followUpIndex + 1}.`;
        return (
          <Fragment key={`fu-${followUpIndex}`}>
            <SubheaderRow
              scope="row"
              prefix="↳"
              label={`${sectionIndex + 1}.${followUpIndex + 1} ${followUpLabel}`}
              colCount={totalCols}
              icon={sectionTypeIcons[followUp.type]}
            />
            <TranslationRow
              stripe={nextStripe()}
              label={tr.EditSurveyTranslations.questionText}
              cols={visibleCols}
              render={(lang) => (
                <CoreInput
                  value={followUp.title?.[lang] ?? ''}
                  onChange={(e) =>
                    editFollowUpSection(activePage.id, section.id!, {
                      ...followUp,
                      title: { ...followUp.title, [lang]: e.target.value },
                    })
                  }
                />
              )}
            />
          </Fragment>
        );
      })}
    </Box>
  );
}
