import { SurveyRadioQuestion } from '@interfaces/survey';
import { FormControlLabel, Radio, RadioGroup, TextField } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTranslations } from '@src/stores/TranslationContext';
import { createRef, useEffect, useRef, useState } from 'react';

const useStyles = makeStyles({
  labelStyles: {
    lineHeight: 1.2,
    marginBottom: '0.5em',
    marginTop: '0.5em',
  },
});

/**
 * Max length of a custom answer in radio/checkbox questions
 */
const customAnswerMaxLength = 250;

interface Props {
  autoFocus?: boolean;
  value: number | string;
  onChange: (value: number | string) => void;
  question: SurveyRadioQuestion;
  setDirty: (dirty: boolean) => void;
}

export default function RadioQuestion({
  autoFocus = false,
  value,
  onChange,
  question,
  setDirty,
}: Props) {
  const [customAnswerValue, setCustomAnswerValue] = useState('');
  const { tr, surveyLanguage } = useTranslations();
  const classes = useStyles();
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

  // Update custom answer value if value from context is string
  useEffect(() => {
    // If the value is a string, it is the custom value
    setCustomAnswerValue(typeof value === 'string' ? value : '');
  }, [value]);

  return (
    <>
      <RadioGroup
        id={`${question.id}-input`}
        value={value}
        onChange={(event) => {
          const numericValue = Number(event.currentTarget.value);
          if (event.currentTarget.value.length > 0 && !isNaN(numericValue)) {
            setDirty(true);
          }
          // Empty strings are converted to 0 with Number()
          onChange(
            event.currentTarget.value.length > 0 && !isNaN(numericValue)
              ? numericValue
              : event.currentTarget.value,
          );
        }}
        name={`${question.title?.[surveyLanguage]}-group`}
      >
        {question.options.map((option, index) => (
          <FormControlLabel
            key={option.id}
            value={option.id}
            label={option.text?.[surveyLanguage] ?? ''}
            control={
              <Radio
                action={actionRef.current[index]}
                autoFocus={index === 0 && autoFocus}
              />
            }
            classes={{ label: classes.labelStyles }}
          />
        ))}
        {question.allowCustomAnswer && (
          <>
            <FormControlLabel
              value={customAnswerValue}
              label={tr.SurveyQuestion.customAnswer}
              control={<Radio />}
            />
            {/* Value is a number (ID) when a pre-defined option is selected - otherwise it's custom */}
            {typeof value === 'string' && (
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
                  onChange(event.currentTarget.value);
                }}
              />
            )}
          </>
        )}
      </RadioGroup>
    </>
  );
}
