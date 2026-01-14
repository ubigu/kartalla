import { SurveyNumericQuestion } from '@interfaces/survey';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTranslations } from '@src/stores/TranslationContext';

interface Props {
  section: SurveyNumericQuestion;
  disabled?: boolean;
  onChange: (section: SurveyNumericQuestion) => void;
}

const useStyles = makeStyles({
  numberField: {
    maxWidth: '10rem',
  },
});

export default function EditNumericQuestion({
  section,
  disabled,
  onChange,
}: Props) {
  const { tr } = useTranslations();
  const classes = useStyles();

  return (
    <>
      <FormGroup row>
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
      </FormGroup>
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
  );
}
