import {
  LanguageCode,
  SectionImageOption,
  SurveyMapSubQuestion,
  SurveyPageSection,
} from '@interfaces/survey';
import { makeStyles } from '@mui/styles';
import { useTranslations } from '@src/stores/TranslationContext';
import React from 'react';
import RichTextEditor from '../RichTextEditor';
import TranslationField from './TranslationField';

const useStyles = makeStyles({
  sectionContainer: {
    border: '2px solid grey',
    padding: '1rem',
    marginBottom: '1rem',
  },
  titleText: {
    color: 'grey',
  },
});

interface Props {
  section: SurveyPageSection;
  languageCode: LanguageCode;
  onEdit: (section: SurveyPageSection) => void;
}

export default function EditSurveySectionTranslations({
  section,
  languageCode,
  onEdit,
}: Props) {
  const { languages } = useTranslations();
  const classes = useStyles();

  return (
    <div className={classes.sectionContainer}>
      <TranslationField
        variant="standard"
        value={section.title?.[languageCode] ?? ''}
        onChange={(event) => {
          onEdit({
            ...section,
            title: { ...section.title, [languageCode]: event.target.value },
          });
        }}
      />
      {(section.type === 'checkbox' ||
        section.type === 'radio' ||
        section.type === 'sorting') &&
        section.options?.map((option, optionIndex) => (
          <TranslationField
            key={`option-field-${optionIndex}`}
            value={option.text[languageCode]}
            onChange={(event) => {
              const updatedOptions = [...section.options];
              updatedOptions[optionIndex] = {
                ...updatedOptions[optionIndex],
                text: {
                  ...option.text,
                  [languageCode]: event.target.value,
                },
              };
              onEdit({ ...section, options: updatedOptions });
            }}
          />
        ))}
      {section.type === 'budgeting' &&
        section.targets?.map((target, targetIndex) => (
          <TranslationField
            key={`target-field-${targetIndex}`}
            value={target.name[languageCode]}
            onChange={(event) => {
              const updatedTargets = [...section.targets];
              updatedTargets[targetIndex] = {
                ...updatedTargets[targetIndex],
                name: {
                  ...target.name,
                  [languageCode]: event.target.value,
                },
              };
              onEdit({ ...section, targets: updatedTargets });
            }}
          />
        ))}
      {section.type === 'geo-budgeting' &&
        section.targets?.map((target, targetIndex) => (
          <TranslationField
            key={`geo-target-field-${targetIndex}`}
            value={target.name[languageCode]}
            onChange={(event) => {
              const updatedTargets = [...section.targets];
              updatedTargets[targetIndex] = {
                ...updatedTargets[targetIndex],
                name: {
                  ...target.name,
                  [languageCode]: event.target.value,
                },
              };
              onEdit({ ...section, targets: updatedTargets });
            }}
          />
        ))}
      {section.type === 'radio-image' &&
        section.options?.map((option: SectionImageOption, optionIndex) => (
          <div key={`image-option-field-${optionIndex}`}>
            <TranslationField
              value={option.text[languageCode] ?? ''}
              onChange={(event) => {
                const updatedOptions = [...section.options];
                updatedOptions[optionIndex] = {
                  ...updatedOptions[optionIndex],
                  text: {
                    ...option.text,
                    [languageCode]: event.target.value,
                  },
                };
                onEdit({ ...section, options: updatedOptions });
              }}
            />
            <TranslationField
              value={option.altText[languageCode] ?? ''}
              onChange={(event) => {
                const updatedOptions = [...section.options];
                updatedOptions[optionIndex] = {
                  ...updatedOptions[optionIndex],
                  altText: {
                    ...option.altText,
                    [languageCode]: event.target.value,
                  },
                };
                onEdit({ ...section, options: updatedOptions });
              }}
            />
          </div>
        ))}
      {section.type === 'grouped-checkbox' && (
        <div>
          {section.groups.map((group, groupIndex) => {
            return (
              <div key={`group-index=${groupIndex}`}>
                <TranslationField
                  value={group.name[languageCode] ?? ''}
                  onChange={(event) => {
                    const updatedGroups = [...section.groups];
                    updatedGroups[groupIndex].name = {
                      ...updatedGroups[groupIndex].name,
                      [languageCode]: event.target.value,
                    };
                    onEdit({ ...section, groups: updatedGroups });
                  }}
                />
                {group.options.map((option, optionIndex) => (
                  <div key={`option-index-${optionIndex}`}>
                    <TranslationField
                      value={option.text[languageCode] ?? ''}
                      onChange={(event) => {
                        const updatedGroups = [...section.groups];
                        const updatedOptions = [...group.options];
                        updatedOptions[optionIndex].text = {
                          ...updatedOptions[optionIndex].text,
                          [languageCode]: event.target.value,
                        };
                        updatedGroups[groupIndex].options = updatedOptions;
                        onEdit({ ...section, groups: updatedGroups });
                      }}
                    />
                    {languages
                      .map((supportedLanguage) =>
                        Boolean(option.info?.[supportedLanguage]),
                      )
                      .includes(true) && (
                      <div
                        style={{
                          wordBreak: 'break-word',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          position: 'relative',
                        }}
                      >
                        <RichTextEditor
                          value={option.info?.[languageCode]}
                          missingValue={Boolean(!option.info?.[languageCode])}
                          onChange={(value) => {
                            const updatedGroups = [...section.groups];
                            const updatedOptions = [...group.options];
                            updatedOptions[optionIndex].info = {
                              ...updatedOptions[optionIndex].info,
                              [languageCode]: value,
                            };
                            updatedGroups[groupIndex].options = updatedOptions;
                            onEdit({ ...section, groups: updatedGroups });
                          }}
                          editorHeight={'100px'}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      {section.type === 'slider' && (section.maxLabel || section.minLabel) && (
        <div>
          <TranslationField
            value={section.minLabel?.[languageCode]}
            onChange={(event) =>
              onEdit({
                ...section,
                minLabel: {
                  ...section.minLabel,
                  [languageCode]: event.target.value,
                },
              })
            }
          />
          <TranslationField
            value={section.maxLabel?.[languageCode]}
            onChange={(event) =>
              onEdit({
                ...section,
                maxLabel: {
                  ...section.maxLabel,
                  [languageCode]: event.target.value,
                },
              })
            }
          />
        </div>
      )}
      {(section.type === 'matrix' || section.type === 'multi-matrix') && (
        <div>
          {section.classes &&
            section.classes.map((matrixClass, classIndex) => (
              <TranslationField
                key={`matrix-class-${classIndex}`}
                value={matrixClass[languageCode] ?? ''}
                onChange={(event) => {
                  const updatedClasses = [...section.classes];
                  updatedClasses[classIndex] = {
                    ...matrixClass,
                    [languageCode]: event.target.value,
                  };
                  onEdit({ ...section, classes: updatedClasses });
                }}
              />
            ))}
          {section.subjects &&
            section.subjects.map((matrixSubject, subjectIndex) => (
              <TranslationField
                key={`matrix-subject-${subjectIndex}`}
                value={matrixSubject[languageCode] ?? ''}
                onChange={(event) => {
                  const updatedSubjects = [...section.subjects];
                  updatedSubjects[subjectIndex] = {
                    ...matrixSubject,
                    [languageCode]: event.target.value,
                  };
                  onEdit({ ...section, subjects: updatedSubjects });
                }}
              />
            ))}
        </div>
      )}
      {section.type === 'map' &&
        section.subQuestions?.map((subquestion, questionIndex) => (
          <EditSurveySectionTranslations
            key={`subquestion-index-${questionIndex}`}
            languageCode={languageCode}
            onEdit={(updatedSubquestion: SurveyMapSubQuestion) => {
              const updatedSubquestions = [...section.subQuestions];
              updatedSubquestions[questionIndex] = updatedSubquestion;
              onEdit({ ...section, subQuestions: updatedSubquestions });
            }}
            section={subquestion}
          />
        ))}
      {section.type === 'text' && (
        <>
          <RichTextEditor
            value={section.body?.[languageCode]}
            missingValue={Boolean(!section.body?.[languageCode])}
            onChange={(value) => {
              onEdit({
                ...section,
                body: { ...section.body, [languageCode]: value },
              });
            }}
            editorHeight={'100px'}
          ></RichTextEditor>
          <br />
        </>
      )}
      {section.type === 'image' && (
        <TranslationField
          value={section.altText[languageCode] ?? ''}
          onChange={(event) => {
            onEdit({
              ...section,
              altText: {
                ...section.altText,
                [languageCode]: event.target.value,
              },
            });
          }}
        />
      )}
      {section.type === 'personal-info' && (
        <TranslationField
          value={section.customLabel?.[languageCode] ?? ''}
          onChange={(event) => {
            onEdit({
              ...section,
              customLabel: {
                ...section.customLabel,
                [languageCode]: event.target.value,
              },
            });
          }}
        />
      )}
      {/* Section info */}
      {section.info && (
        <div
          style={{
            wordBreak: 'break-word',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            position: 'relative',
          }}
        >
          <RichTextEditor
            value={section.info?.[languageCode]}
            missingValue={Boolean(!section.info?.[languageCode])}
            onChange={(value) => {
              onEdit({
                ...section,
                info: { ...section.info, [languageCode]: value },
              });
            }}
            editorHeight={'100px'}
          />
        </div>
      )}
    </div>
  );
}
