import { SurveyCheckboxQuestion } from '@interfaces/survey';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  TextField,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { useTranslations } from '@src/stores/TranslationContext';
import { createRef, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Max length of a custom answer in radio/checkbox questions
 */
const customAnswerMaxLength = 250;

interface Props {
  autoFocus?: boolean;
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  question: SurveyCheckboxQuestion;
  setDirty: (dirty: boolean) => void;
  validationErrors?: string[];
}

export default function CheckBoxQuestion({
  autoFocus = false,
  value,
  onChange,
  question,
  setDirty,
  validationErrors = null,
}: Props) {
  const [customAnswerValue, setCustomAnswerValue] = useState('');
  const { tr, surveyLanguage } = useTranslations();
  const actionRef = useRef([]);

  if (autoFocus) {
    actionRef.current = question.options.map(
      (_, i) => actionRef.current[i] ?? createRef(),
    );
  }

  useEffect(() => {
    // autoFocus prop won't trigger focus styling, must be done manually
    autoFocus && actionRef.current[0]?.current.focusVisible();
  }, []);

  const answerLimitText = useMemo(() => {
    if (!question.answerLimits) {
      return null;
    }
    return (
      question.answerLimits.min && question.answerLimits.max
        ? tr.SurveyQuestion.answerLimitsMinMax
        : question.answerLimits.min
          ? tr.SurveyQuestion.answerLimitsMin
          : question.answerLimits.max
            ? tr.SurveyQuestion.answerLimitsMax
            : ''
    )
      .replace('{min}', `${question.answerLimits.min}`)
      .replace('{max}', `${question.answerLimits.max}`);
  }, [question.answerLimits, surveyLanguage]);

  // Update custom answer value if value from context is string
  useEffect(() => {
    // If the value array contains a string, it is the custom value
    const customValue = value.find((v) => typeof v === 'string') as string;
    setCustomAnswerValue(customValue ?? '');
  }, [value]);

  return (
    <>
      {answerLimitText && (
        // Align this helper text with the form label
        <>
          <FormHelperText
            style={{ marginLeft: 0 }}
            id={`checkbox-helper-label-${question.id}`}
          >
            {answerLimitText}
          </FormHelperText>
          {validationErrors && validationErrors.includes('answerLimits') && (
            <FormHelperText style={visuallyHidden} role="alert">
              {`${question.title?.[surveyLanguage]}, ${answerLimitText}`}
            </FormHelperText>
          )}
        </>
      )}
      <FormGroup>
        {question.options.map((option, index) => (
          <FormControlLabel
            key={option.id}
            label={option.text?.[surveyLanguage] ?? ''}
            control={
              <Checkbox
                action={actionRef.current[index]}
                autoFocus={index === 0 && autoFocus}
                // TS can't infer the precise memoized value type from question.type, but for checkboxes it's always an array
                checked={value.includes(option.id)}
                onChange={(event) => {
                  setDirty(true);
                  const newValue = event.currentTarget.checked
                    ? // Add the value to the selected options
                      [...value, option.id]
                    : // Filter out the value from the selected options
                      value.filter((optionId) => optionId !== option.id);
                  onChange(newValue);
                }}
                name={option.text?.[surveyLanguage]}
              />
            }
            sx={{
              lineHeight: 1.2,
              marginBottom: '0.5em',
              marginTop: '0.5em',
            }}
          />
        ))}
        {question.allowCustomAnswer && (
          <FormControlLabel
            control={
              <Checkbox
                checked={value.includes(customAnswerValue)}
                onChange={(event) => {
                  const newValue = event.currentTarget.checked
                    ? // Add the custom answer to the array
                      [...value, customAnswerValue]
                    : // Remove any custom answers (of type string) from the array
                      value.filter((option) => typeof option !== 'string');
                  onChange(newValue);
                }}
              />
            }
            label={tr.SurveyQuestion.customAnswer}
            sx={{
              lineHeight: 1.2,
              marginBottom: '0.5em',
              marginTop: '0.5em',
            }}
          />
        )}
        {value.includes(customAnswerValue) && (
          <TextField
            value={customAnswerValue}
            required={question.isRequired}
            placeholder={tr.SurveyQuestion.customAnswerField}
            inputProps={{
              maxLength: customAnswerMaxLength,
              'aria-label': tr.SurveyQuestion.customAnswerField,
            }}
            onChange={(event) => {
              setCustomAnswerValue(event.currentTarget.value);
              onChange(
                value.map((option) =>
                  typeof option === 'string'
                    ? event.currentTarget.value
                    : option,
                ),
              );
            }}
          />
        )}
      </FormGroup>
    </>
  );
}
