import { SurveyPersonalInfoQuestion } from '@interfaces/survey';
import { Check } from '@mui/icons-material';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Input,
} from '@mui/material';
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

const checkedIcon = (
  <span
    style={{
      backgroundColor: 'white',
      width: '28px',
      height: '28px',
      borderRadius: '4px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Check fontSize="medium" />
  </span>
);

const uncheckedIcon = (
  <span
    style={{
      backgroundColor: 'white',
      width: '28px',
      height: '28px',
      borderRadius: '4px',
    }}
  />
);

export function EditPersonalInfoQuestion({ section, onChange }: Props) {
  const { tr, surveyLanguage } = useTranslations();

  return (
    <>
      <FormGroup>
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
        <FormControlLabel
          sx={{ marginLeft: '-9px' }}
          control={
            <Checkbox
              name="name"
              size="large"
              checkedIcon={checkedIcon}
              icon={uncheckedIcon}
              checked={section.askName}
              onChange={(event) => {
                onChange({
                  ...section,
                  askName: event.target.checked,
                });
              }}
            />
          }
          label={tr.PersonalInfoQuestion.nameLabel}
        />
        <FormControlLabel
          sx={{ marginLeft: '-9px' }}
          control={
            <Checkbox
              name="email"
              size="large"
              checkedIcon={checkedIcon}
              icon={uncheckedIcon}
              checked={section.askEmail}
              onChange={(event) => {
                onChange({
                  ...section,
                  askEmail: event.target.checked,
                });
              }}
            />
          }
          label={tr.PersonalInfoQuestion.emailLabel}
        />
        <FormControlLabel
          sx={{ marginLeft: '-9px' }}
          control={
            <Checkbox
              name="phone"
              size="large"
              checkedIcon={checkedIcon}
              icon={uncheckedIcon}
              checked={section.askPhone}
              onChange={(event) => {
                onChange({
                  ...section,
                  askPhone: event.target.checked,
                });
              }}
            />
          }
          label={tr.PersonalInfoQuestion.phoneLabel}
        />
        <FormControlLabel
          sx={{ marginLeft: '-9px' }}
          control={
            <Checkbox
              name="address"
              size="large"
              checkedIcon={checkedIcon}
              icon={uncheckedIcon}
              checked={section.askAddress}
              onChange={(event) => {
                onChange({
                  ...section,
                  askAddress: event.target.checked,
                });
              }}
            />
          }
          label={tr.PersonalInfoQuestion.addressLabel}
        />
        <FormControlLabel
          sx={{ marginLeft: '-9px' }}
          control={
            <Checkbox
              data-testid="custom-checkbox"
              name="customText"
              size="large"
              checkedIcon={checkedIcon}
              icon={uncheckedIcon}
              checked={Boolean(section.askCustom)}
              onChange={(event) => {
                onChange({
                  ...section,
                  askCustom: event.target.checked,
                });
              }}
            />
          }
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
