import { LocalizedText, SurveyMultiMatrixQuestion } from '@interfaces/survey';
import AddIcon from '@src/components/icons/AddIcon';
import CancelIcon from '@src/components/icons/CancelIcon';
import {
  Checkbox,
  Fab,
  FormControlLabel,
  FormGroup,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import QuestionOptions from './QuestionOptions';
import { useTranslations } from '@src/stores/TranslationContext';

interface Props {
  section: SurveyMultiMatrixQuestion;
  disabled: boolean;
  onChange: (section: SurveyMultiMatrixQuestion) => void;
}

export function EditMultiMatrixQuestion({
  onChange,
  section,
  disabled,
}: Props) {
  const { tr, initializeLocalizedObject, surveyLanguage } = useTranslations();

  function clampValue(value: number, min: number, max: number) {
    return value === null ? null : Math.max(Math.min(max, value), min);
  }

  function handleAnswerLimitsMinChange(value: number) {
    // Clamp value between 0 and amount of options
    const min = clampValue(
      value,
      section.isRequired ? 1 : 0,
      section.classes.length,
    );
    // Accept original max value when 1) new min is empty, 2) old max was empty, or 3) old max is greater than new min
    const max =
      min === null ||
      section.answerLimits.max === null ||
      section.answerLimits.max >= min
        ? section.answerLimits.max
        : min;
    onChange({
      ...section,
      answerLimits: {
        min,
        max,
      },
    });
  }

  function handleAnswerLimitsMaxChange(value: number) {
    // Clamp value between 1 and amount of options
    const max = clampValue(value, 1, section.classes.length);
    // Accept original min value when 1) new max is empty, 2) old min was empty, or 3) old min is smaller than new max
    const min =
      max === null ||
      section.answerLimits.min === null ||
      section.answerLimits.min <= max
        ? section.answerLimits.min
        : max;
    onChange({
      ...section,
      answerLimits: {
        min,
        max,
      },
    });
  }

  return (
    <>
      <FormGroup row>
        <FormControlLabel
          control={
            <Checkbox
              name="is-required"
              checked={section.isRequired}
              onChange={(event) => {
                onChange({
                  ...section,
                  isRequired: event.target.checked,
                });
              }}
            />
          }
          label={tr.SurveySections.isRequired}
        />
      </FormGroup>
      <FormGroup row>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Fab
            color="primary"
            aria-label="add-matrix-class"
            size="small"
            sx={{ boxShadow: 'none' }}
            onClick={() => {
              onChange({
                ...section,
                classes: [...section.classes, initializeLocalizedObject(null)],
              });
            }}
          >
            <AddIcon />
          </Fab>
          <Typography style={{ paddingLeft: '1rem' }}>
            {tr.SurveySections.classes}{' '}
          </Typography>
        </div>
      </FormGroup>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        {section.classes?.map((entry: LocalizedText, index) => {
          return (
            <div
              key={`matrix-class-${index}`}
              data-testid={`matrix-class-${index}`}
              style={{ position: 'relative' }}
            >
              <Tooltip title={entry[surveyLanguage] ?? ''}>
                <TextField
                  inputProps={{ autoFocus: true }}
                  style={{
                    marginRight: '0.25rem',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  }}
                  value={entry[surveyLanguage] ?? ''}
                  onChange={(event) => {
                    const updatedClasses = [...section.classes];
                    updatedClasses[index][surveyLanguage] = event.target.value;
                    onChange({ ...section, classes: updatedClasses });
                  }}
                >
                  {entry[surveyLanguage]}
                </TextField>
              </Tooltip>
              <IconButton
                aria-label="delete"
                size="small"
                onClick={() => {
                  const updatedClasses = [...section.classes];
                  updatedClasses.splice(index, 1);
                  onChange({
                    ...section,
                    classes: updatedClasses,
                    answerLimits: section.answerLimits
                      ? {
                          ...section.answerLimits,
                          max:
                            section.answerLimits.max > updatedClasses.length
                              ? updatedClasses.length
                              : section.answerLimits.max,
                        }
                      : null,
                  });
                }}
                style={{
                  position: 'absolute',
                  top: '-1rem',
                  right: '-0.75rem',
                }}
              >
                <CancelIcon />
              </IconButton>
            </div>
          );
        })}
      </div>
      <QuestionOptions
        options={section.subjects.map((subject) => ({ text: subject }))}
        onChange={(subjects: any) => {
          onChange({
            ...section,
            subjects: subjects.map((subject: any) => ({ ...subject.text })),
          });
        }}
        title={tr.SurveySections.subjects}
      />
      <FormGroup row>
        <FormControlLabel
          control={
            <Checkbox
              name="limit-answers"
              disabled={disabled}
              checked={Boolean(section.answerLimits)}
              onChange={(event) => {
                onChange({
                  ...section,
                  answerLimits: event.target.checked
                    ? {
                        min: null,
                        max: null,
                      }
                    : null,
                });
              }}
            />
          }
          label={tr.SurveySections.limitAnswers}
        />
      </FormGroup>
      {section.answerLimits && (
        <FormGroup row>
          <TextField
            sx={{
              marginRight: '1rem',
            }}
            id="min-answers"
            disabled={disabled}
            type="number"
            variant="standard"
            label={tr.SurveySections.minAnswers}
            InputLabelProps={{ shrink: true }}
            value={section.answerLimits?.min ?? ''}
            onChange={(event) => {
              handleAnswerLimitsMinChange(
                !event.target.value.length ? null : Number(event.target.value),
              );
            }}
          />
          <TextField
            id="max-answers"
            disabled={disabled}
            type="number"
            variant="standard"
            label={tr.SurveySections.maxAnswers}
            InputLabelProps={{ shrink: true }}
            value={section.answerLimits?.max ?? ''}
            onChange={(event) => {
              handleAnswerLimitsMaxChange(
                !event.target.value.length ? null : Number(event.target.value),
              );
            }}
          />
        </FormGroup>
      )}
      <FormGroup row>
        <FormControlLabel
          control={
            <Checkbox
              name="allow-empty-answer"
              checked={section.allowEmptyAnswer}
              onChange={(event) => {
                onChange({
                  ...section,
                  allowEmptyAnswer: event.target.checked,
                });
              }}
            />
          }
          label={tr.SurveySections.allowEmptyAnswer}
        />
      </FormGroup>
    </>
  );
}
