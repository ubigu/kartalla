import { SurveyPersonalInfoQuestion } from '@interfaces/survey';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
} from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { Check } from '@mui/icons-material';
import React from 'react';

interface Props {
  section: SurveyPersonalInfoQuestion;
  onChange: (section: SurveyPersonalInfoQuestion) => void;
}

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
  const { tr } = useTranslations();

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
      </FormGroup>
    </>
  );
}
