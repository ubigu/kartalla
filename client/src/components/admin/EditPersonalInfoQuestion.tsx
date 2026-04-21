// @ts-strict-ignore
import { SurveyPersonalInfoQuestion } from '@interfaces/survey';
import { CoreCheckbox } from '@src/components/core/Checkbox';
import { FormGroup, FormLabel, Input } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslations } from '@src/stores/TranslationContext';

interface Props {
  section: SurveyPersonalInfoQuestion;
  onChange: (section: SurveyPersonalInfoQuestion) => void;
}

const inputStyle = {
  maxWidth: '600px',
  border: 'none',
  height: '28px',
  fontSize: '1rem',
};

export function EditPersonalInfoQuestion({ section, onChange }: Props) {
  const { tr, surveyLanguage } = useTranslations();
  const { palette } = useTheme();

  return (
    <>
      <FormGroup>
        <CoreCheckbox
          name="is-required"
          checked={section.isRequired}
          onChange={(event) => {
            onChange({
              ...section,
              isRequired: event.target.checked,
            });
          }}
          label={tr.SurveySections.isRequired}
          checkboxBackground={palette.surfacePrimary.main}
        />

        <FormLabel
          component="p"
          sx={{
            fontWeight: 700,
            fontSize: '16px',
            marginBottom: '8px',
          }}
        >
          {tr.PersonalInfoQuestion.label}
        </FormLabel>
        <CoreCheckbox
          checkboxBackground={palette.surfacePrimary.main}
          name="name"
          checked={section.askName}
          onChange={(event) => {
            onChange({
              ...section,
              askName: event.target.checked,
            });
          }}
          label={tr.PersonalInfoQuestion.nameLabel}
        />
        <CoreCheckbox
          checkboxBackground={palette.surfacePrimary.main}
          name="email"
          checked={section.askEmail}
          onChange={(event) => {
            onChange({
              ...section,
              askEmail: event.target.checked,
            });
          }}
          label={tr.PersonalInfoQuestion.emailLabel}
        />
        <CoreCheckbox
          checkboxBackground={palette.surfacePrimary.main}
          name="phone"
          checked={section.askPhone}
          onChange={(event) => {
            onChange({
              ...section,
              askPhone: event.target.checked,
            });
          }}
          label={tr.PersonalInfoQuestion.phoneLabel}
        />
        <CoreCheckbox
          checkboxBackground={palette.surfacePrimary.main}
          name="address"
          checked={section.askAddress}
          onChange={(event) => {
            onChange({
              ...section,
              askAddress: event.target.checked,
            });
          }}
          label={tr.PersonalInfoQuestion.addressLabel}
        />
        <CoreCheckbox
          checkboxBackground={palette.surfacePrimary.main}
          data-testid="custom-checkbox"
          name="customText"
          checked={Boolean(section.askCustom)}
          onChange={(event) => {
            onChange({
              ...section,
              askCustom: event.target.checked,
            });
          }}
          label={
            <Input
              value={section.customLabel?.[surveyLanguage] ?? ''}
              style={inputStyle}
              placeholder={tr.PersonalInfoQuestion.customLabel}
              onChange={(e) =>
                onChange({
                  ...section,
                  customLabel: {
                    ...section.customLabel,
                    [surveyLanguage]: e.target.value,
                  },
                })
              }
            />
          }
        />
      </FormGroup>
    </>
  );
}
