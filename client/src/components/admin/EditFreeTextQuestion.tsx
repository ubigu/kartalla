import { SurveyFreeTextQuestion } from '@interfaces/survey';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
} from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';

interface Props {
  section: SurveyFreeTextQuestion;
  disabled?: boolean;
  onChange: (section: SurveyFreeTextQuestion) => void;
}

export default function EditFreeTextQuestion({
  section,
  disabled,
  onChange,
}: Props) {
  const { tr } = useTranslations();

  function handleAnswerLimitChange(newValue: number) {
    if (newValue < 0) return;

    onChange({ ...section, maxLength: newValue });
  }

  return (
    <>
      <FormGroup row>
        <TextField
          id="free-text-length"
          type="number"
          variant="standard"
          label={tr.SurveySections.answerMaxLength}
          InputLabelProps={{ shrink: true }}
          value={section?.maxLength ?? 500}
          onChange={(event) =>
            handleAnswerLimitChange(parseInt(event.target.value))
          }
        />
      </FormGroup>
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
    </>
  );
}
