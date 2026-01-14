import { SurveyCheckboxQuestion } from '@interfaces/survey';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTranslations } from '@src/stores/TranslationContext';
import QuestionOptions from './QuestionOptions';

const useStyles = makeStyles({
  answerLimitInput: {
    marginRight: '1rem',
  },
});

interface Props {
  section: SurveyCheckboxQuestion;
  disabled?: boolean;
  onChange: (section: SurveyCheckboxQuestion) => void;
}

export default function EditCheckBoxQuestion({
  section,
  disabled,
  onChange,
}: Props) {
  const classes = useStyles();
  const { tr } = useTranslations();

  function clampValue(value: number, min: number, max: number) {
    return value === null ? null : Math.max(Math.min(max, value), min);
  }

  function handleAnswerLimitsMinChange(value: number) {
    // Clamp value between 1 and amount of options
    const min = clampValue(value, 1, section.options.length);
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
    const max = clampValue(value, 1, section.options.length);
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
          label={tr.SurveySections.isRequired}
        />
      </FormGroup>
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
            id="min-answers"
            disabled={disabled}
            className={classes.answerLimitInput}
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
      <QuestionOptions
        options={section.options}
        disabled={disabled}
        onChange={(options) => {
          onChange({
            ...section,
            options,
          });
        }}
        title={tr.SurveySections.options}
        enableClipboardImport={true}
        allowOptionInfo={false}
      />
      <FormGroup row>
        <FormControlLabel
          control={
            <Checkbox
              name="allow-custom-answer"
              disabled={disabled}
              checked={section.allowCustomAnswer}
              onChange={(event) => {
                onChange({
                  ...section,
                  allowCustomAnswer: event.target.checked,
                });
              }}
            />
          }
          label={tr.SurveySections.allowCustomAnswer}
        />
      </FormGroup>
    </>
  );
}
