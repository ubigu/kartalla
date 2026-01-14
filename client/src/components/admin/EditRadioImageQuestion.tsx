import { SurveyRadioImageQuestion } from '@interfaces/survey';

import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import QuestionImageOptions from './QuestionImageOptions';

interface Props {
  section: SurveyRadioImageQuestion;
  disabled?: boolean;
  onChange: (section: SurveyRadioImageQuestion) => void;
}

export default function EditRadioImageQuestion({
  section,
  disabled,
  onChange,
}: Props) {
  const { tr } = useTranslations();

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
      <QuestionImageOptions
        disabled={disabled}
        options={section.options}
        onChange={(options) => {
          onChange({ ...section, options });
        }}
        title={tr.SurveySections.options}
        allowOptionInfo={false}
      />
    </>
  );
}
