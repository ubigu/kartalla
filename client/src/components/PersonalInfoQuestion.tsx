import {
  PersonalInfoAnswer,
  SurveyPersonalInfoQuestion,
} from '@interfaces/survey';
import { Box, Typography } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import React from 'react';
import { useState } from 'react';

const labelWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  '& label': {
    fontSize: '12px',
    color: 'primary.main',
  },
  '& input': {
    boxShadow: '0px -1px 2px 0px rgba(89, 120, 134, 0.15)',
    maxWidth: '450px',
    backgroundColor: '#F6F8FA',
    border: '0.5px solid #E9ECEF',
    borderRadius: '4px',
    height: '28px',
  },
};

interface Props {
  autoFocus?: boolean;
  question: SurveyPersonalInfoQuestion;
  value: PersonalInfoAnswer | null;
  onChange: (value: PersonalInfoAnswer, hasError: boolean) => void;
  readOnly?: boolean;
}

export function PersonalInfoQuestion({
  readOnly = false,
  autoFocus = false,
  question,
  value,
  onChange,
}: Props) {
  const { tr } = useTranslations();
  const [_hasInvalidInput, setHasInvalidInput] = useState({
    name: false,
    email: false,
    phone: false,
  });
  const [showInputErrorsFor, setShowInputErrorsFor] = useState({
    name: false,
    email: false,
    phone: false,
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'stretch',
        '& .MuiFormControl-root': {
          width: '100%',
        },
      }}
    >
      {question.askName && (
        <Box sx={labelWrapperStyle}>
          <label htmlFor={`${question.id}-nameInput`}>
            {tr.PersonalInfoQuestion.nameLabel}
          </label>
          <input
            aria-describedby={`${question.id}-nameError`}
            id={`${question.id}-nameInput`}
            disabled={readOnly}
            autoFocus={autoFocus}
            value={value?.name ?? ''}
            maxLength={50}
            pattern="\D*" // Matches any character that is not a digit (Arabic numeral)
            required={question.isRequired}
            onBlur={(event) =>
              setShowInputErrorsFor((prev) => ({
                ...prev,
                name: !event.target.validity.valid,
              }))
            }
            onChange={(event) => {
              setHasInvalidInput((prev) => {
                const newValue = {
                  ...prev,
                  name: !event.target.validity.valid,
                };
                onChange(
                  { ...value, name: event.target.value },
                  Object.values(newValue).some((isInvalid) => isInvalid),
                );
                return newValue;
              });
            }}
          />

          <div aria-live="polite">
            <Typography
              fontSize={12}
              color="error"
              id={`${question.id}-nameError`}
            >
              {showInputErrorsFor.name && 'Tarkista nimi.'}
            </Typography>
          </div>
        </Box>
      )}
      {question.askEmail && (
        <Box sx={labelWrapperStyle}>
          <label htmlFor={`${question.id}-emailInput`}>
            {tr.PersonalInfoQuestion.emailLabel}
          </label>
          <input
            aria-describedby={`${question.id}-emailError`}
            id={`${question.id}-emailInput`}
            type="email"
            disabled={readOnly}
            autoFocus={autoFocus}
            value={value?.email ?? ''}
            maxLength={50}
            pattern="[a-zA-Z0-9+._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
            required={question.isRequired}
            onBlur={(event) =>
              setShowInputErrorsFor((prev) => ({
                ...prev,
                email: !event.target.validity.valid,
              }))
            }
            onChange={(event) => {
              setHasInvalidInput((prev) => {
                const newValue = {
                  ...prev,
                  email: !event.target.validity.valid,
                };
                onChange(
                  { ...value, email: event.target.value },
                  Object.values(newValue).some((isInvalid) => isInvalid),
                );
                return newValue;
              });
            }}
          />

          <div aria-live="polite">
            <Typography
              fontSize={12}
              color="error"
              id={`${question.id}-emailError`}
            >
              {showInputErrorsFor.email && 'Tarkista sähköpostiosoite.'}
            </Typography>
          </div>
        </Box>
      )}
      {question.askPhone && (
        <Box sx={labelWrapperStyle}>
          <label htmlFor={`${question.id}-phoneInput`}>
            {tr.PersonalInfoQuestion.phoneLabel}
          </label>
          <input
            aria-describedby={`${question.id}-phoneError`}
            type="tel"
            id={`${question.id}-phoneInput`}
            disabled={readOnly}
            autoFocus={autoFocus}
            maxLength={25}
            pattern="\+?[\d]*"
            value={value?.phone ?? ''}
            required={question.isRequired}
            onBlur={(event) =>
              setShowInputErrorsFor((prev) => ({
                ...prev,
                phone: !event.target.validity.valid,
              }))
            }
            onChange={(event) => {
              setHasInvalidInput((prev) => {
                const newValue = {
                  ...prev,
                  phone: !event.target.validity.valid,
                };
                const sanitizedPhone = event.target.value
                  .replace(/\s+/g, '')
                  .trim();
                onChange(
                  {
                    ...value,
                    phone: sanitizedPhone,
                  },
                  Object.values(newValue).some((isInvalid) => isInvalid),
                );
                return newValue;
              });
            }}
          />

          <div aria-live="polite">
            <Typography
              fontSize={12}
              color="error"
              id={`${question.id}-phoneError`}
            >
              {showInputErrorsFor.phone && 'Tarkista puhelinnumero.'}
            </Typography>
          </div>
        </Box>
      )}
    </Box>
  );
}
