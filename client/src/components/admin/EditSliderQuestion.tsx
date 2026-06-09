// @ts-strict-ignore
import { SurveySliderQuestion } from '@interfaces/survey';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTranslations } from '@src/stores/TranslationContext';
import { useWorkingLanguage } from '@src/stores/WorkingLanguageContext';
import { useEffect } from 'react';

interface Props {
  section: SurveySliderQuestion;
  disabled?: boolean;
  onChange: (section: SurveySliderQuestion) => void;
}

const useStyles = makeStyles({
  numberField: {
    maxWidth: '10rem',
  },
});

export default function EditSliderQuestion({
  section,
  disabled,
  onChange,
}: Props) {
  const { tr } = useTranslations();
  const { workingLanguage } = useWorkingLanguage();

  const classes = useStyles();

  // When switching to literal presentation type, change numeric value boundaries accordingly
  useEffect(() => {
    if (section.presentationType === 'literal') {
      onChange({
        ...section,
        minValue: 0,
        maxValue: 10,
      });
    }
  }, [section.presentationType]);

  return (
    <>
      <FormControlLabel
        label={tr.SurveySections.isRequired}
        control={
          <Checkbox
            name="is-required"
            disabled={disabled}
            checked={section.isRequired}
            onChange={(event) => {
              onChange({
                ...section,
                isRequired: event.target.checked,
              });
            }}
          />
        }
      />
      <FormControl>
        <FormLabel id="presentation-type-label">
          {tr.EditSliderQuestion.presentationType}
        </FormLabel>
        <RadioGroup
          row
          aria-labelledby="presentation-type-label"
          name="presentation-type-group"
          value={section.presentationType}
          onChange={(event) => {
            onChange({
              ...section,
              presentationType: event.target.value as 'literal' | 'numeric',
            });
          }}
        >
          <FormControlLabel
            value="literal"
            control={<Radio />}
            label={tr.EditSliderQuestion.literal}
          />
          <FormControlLabel
            value="numeric"
            control={<Radio />}
            label={tr.EditSliderQuestion.numeric}
          />
        </RadioGroup>
      </FormControl>
      {section.presentationType === 'literal' && (
        <>
          <TextField
            label={tr.EditSliderQuestion.minValue}
            value={
              section.minLabel?.[workingLanguage] ??
              tr.EditSliderQuestion.defaultTranslatedMinLabel?.[workingLanguage]
            }
            onChange={(event) => {
              onChange({
                ...section,
                minLabel: {
                  ...section.maxLabel,
                  [workingLanguage]: event.target.value,
                },
              });
            }}
          />
          <TextField
            label={tr.EditSliderQuestion.maxValue}
            value={
              section.maxLabel?.[workingLanguage] ??
              tr.EditSliderQuestion.defaultTranslatedMaxLabel?.[workingLanguage]
            }
            onChange={(event) => {
              onChange({
                ...section,
                maxLabel: {
                  ...section.maxLabel,
                  [workingLanguage]: event.target.value,
                },
              });
            }}
          />
          <FormHelperText>
            {tr.EditSliderQuestion.literalHelperText}
          </FormHelperText>
        </>
      )}
      {section.presentationType === 'numeric' && (
        <>
          <TextField
            type="number"
            className={classes.numberField}
            label={tr.EditSliderQuestion.minValue}
            value={section.minValue ?? ''}
            onChange={(event) => {
              onChange({
                ...section,
                minValue: !event.target.value.length
                  ? null
                  : Number(event.target.value),
              });
            }}
          />
          <TextField
            type="number"
            className={classes.numberField}
            label={tr.EditSliderQuestion.maxValue}
            value={section.maxValue ?? ''}
            onChange={(event) => {
              onChange({
                ...section,
                maxValue: !event.target.value.length
                  ? null
                  : Number(event.target.value),
              });
            }}
          />
        </>
      )}
    </>
  );
}
