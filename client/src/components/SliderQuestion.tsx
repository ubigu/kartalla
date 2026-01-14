import { SurveySliderQuestion } from '@interfaces/survey';
import { FormLabel, Slider } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { visuallyHidden } from '@mui/utils';
import { useTranslations } from '@src/stores/TranslationContext';
import { useMemo, useRef } from 'react';

interface Props {
  value: number;
  question: SurveySliderQuestion;
  onChange: (value: number) => void;
  setDirty: (dirty: boolean) => void;
  readOnly: boolean;
}

const useStyles = makeStyles({
  label: {
    cursor: 'pointer',
  },
});

export default function SliderQuestion({
  value,
  question,
  onChange,
  setDirty,
  readOnly = false,
}: Props) {
  const { surveyLanguage } = useTranslations();
  const classes = useStyles();
  const sliderRef = useRef<HTMLElement | null>(null);
  const { tr } = useTranslations();
  const verbalExtremes = question.presentationType === 'literal';
  const labels = useMemo(() => {
    return verbalExtremes
      ? {
          min:
            question.minLabel?.[surveyLanguage] ??
            tr.SliderQuestion.defaultMinLabel,
          max:
            question.maxLabel?.[surveyLanguage] ??
            tr.SliderQuestion.defaultMaxLabel,
        }
      : {
          min: question.minValue,
          max: question.maxValue,
        };
  }, [question, surveyLanguage]);

  // "Dummy" value to be displayed (in the middle) before a valid input is given
  const visibleEmptyValue = useMemo(() => {
    return (question.minValue + question.maxValue) / 2;
  }, [question]);

  return (
    <div
      id={`${question.id}-input`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '30rem',
      }}
    >
      <FormLabel
        sx={{ display: 'flex', justifyContent: 'space-between' }}
        id={`${question.id}-value-label`}
        className={classes.label}
        required={false}
      >
        <span style={visuallyHidden}>{tr.SliderQuestion.scale}: </span>
        <span>
          {question.minValue}
          {verbalExtremes && `: ${labels.min}`}
        </span>
        <span>
          {question.maxValue}
          {verbalExtremes && `: ${labels.max}`}
        </span>
      </FormLabel>
      <Slider
        disabled={readOnly}
        aria-label={question.title?.[surveyLanguage]}
        ref={sliderRef}
        slotProps={{
          input: {
            'aria-describedby': `${question.id}-value-label`,
            'aria-required': question.isRequired,
            'aria-invalid': question.isRequired && value === null,
          },
        }}
        value={value ?? visibleEmptyValue}
        min={question.minValue}
        max={question.maxValue}
        valueLabelDisplay="auto"
        getAriaValueText={(v) => v.toString()}
        step={1}
        marks
        sx={{
          '.MuiSlider-track, .MuiSlider-rail': {
            color: value === null ? '#ccc' : 'inherit',
          },
          '.MuiSlider-mark': {
            color: value === null ? 'white' : 'inherit',
          },
        }}
        onClick={() => {
          if (value === null) {
            onChange(visibleEmptyValue);
          }
        }}
        onChange={(_, value: number) => {
          setDirty(true);
          onChange(value);
        }}
      />
    </div>
  );
}
