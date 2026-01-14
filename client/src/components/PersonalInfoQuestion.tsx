import {
  PersonalInfoAnswer,
  SurveyPersonalInfoQuestion,
} from '@interfaces/survey';
import { Box, Typography } from '@mui/material';
import { useSurveyAnswers } from '@src/stores/SurveyAnswerContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { PropsWithChildren, useState } from 'react';

const labelWrapperStyle = (labelColor?: string) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  '& label': {
    fontSize: '12px',
    color: labelColor ?? 'primary.main',
  },
  '& input': {
    boxShadow: '0px -1px 2px 0px rgba(89, 120, 134, 0.15)',
    maxWidth: '450px',
    backgroundColor: '#F6F8FA',
    border: '0.5px solid #E9ECEF',
    borderRadius: '4px',
    height: '28px',
  },
});

interface Props {
  autoFocus?: boolean;
  question: SurveyPersonalInfoQuestion;
  value: PersonalInfoAnswer | null;
  onChange: (value: PersonalInfoAnswer, hasError: boolean) => void;
  readOnly?: boolean;
}

interface WrapperProps {
  id: string;
  errorMessage: string;
  showError: boolean;
  labelColor?: string;
}

function PersonalInfoInputWrapper({
  id,
  errorMessage,
  showError,
  labelColor,
  children,
}: PropsWithChildren<WrapperProps>) {
  return (
    <Box sx={labelWrapperStyle(labelColor)}>
      {children}
      <div aria-live="polite">
        <Typography fontSize={12} color="error" id={`${id}-error`}>
          {showError && errorMessage}
        </Typography>
      </div>
    </Box>
  );
}

export function PersonalInfoQuestion({
  readOnly = false,
  autoFocus = false,
  question,
  value,
  onChange,
}: Props) {
  const { survey } = useSurveyAnswers();
  const { tr, surveyLanguage } = useTranslations();
  const [hasInvalidInput, setHasInvalidInput] = useState({
    name: false,
    email: false,
    phone: false,
    address: false,
    custom: false,
  });
  const [showInputErrorsFor, setShowInputErrorsFor] = useState({
    name: false,
    email: false,
    phone: false,
    address: false,
    custom: false,
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
        <PersonalInfoInputWrapper
          id={`${question.id}-nameInput`}
          showError={showInputErrorsFor.name}
          errorMessage={tr.PersonalInfoQuestion.nameError}
          labelColor={survey.sectionTitleColor}
        >
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
              const newValue = {
                ...hasInvalidInput,
                name: !event.target.validity.valid,
              };
              setHasInvalidInput(newValue);
              onChange(
                { ...value, name: event.target.value },
                Object.values(newValue).some((isInvalid) => isInvalid),
              );
            }}
          />
        </PersonalInfoInputWrapper>
      )}
      {question.askEmail && (
        <PersonalInfoInputWrapper
          id={`${question.id}-emailInput`}
          showError={showInputErrorsFor.email}
          errorMessage={tr.PersonalInfoQuestion.emailError}
          labelColor={survey.sectionTitleColor}
        >
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
            pattern="[a-zA-Z0-9\+._%\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
            required={question.isRequired}
            onBlur={(event) =>
              setShowInputErrorsFor((prev) => ({
                ...prev,
                email: !event.target.validity.valid,
              }))
            }
            onChange={(event) => {
              const newValue = {
                ...hasInvalidInput,
                email: !event.target.validity.valid,
              };
              setHasInvalidInput(newValue);
              onChange(
                { ...value, email: event.target.value },
                Object.values(newValue).some((isInvalid) => isInvalid),
              );
            }}
          />
        </PersonalInfoInputWrapper>
      )}
      {question.askPhone && (
        <PersonalInfoInputWrapper
          id={`${question.id}-phoneInput`}
          showError={showInputErrorsFor.phone}
          errorMessage={tr.PersonalInfoQuestion.phoneError}
          labelColor={survey.sectionTitleColor}
        >
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
              const newValue = {
                ...hasInvalidInput,
                phone: !event.target.validity.valid,
              };
              setHasInvalidInput(newValue);
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
            }}
          />
        </PersonalInfoInputWrapper>
      )}
      {question.askAddress && (
        <PersonalInfoInputWrapper
          id={`${question.id}-addressInput`}
          showError={showInputErrorsFor.address}
          errorMessage={tr.PersonalInfoQuestion.addressError}
          labelColor={survey.sectionTitleColor}
        >
          <label htmlFor={`${question.id}-addressInput`}>
            {tr.PersonalInfoQuestion.addressLabel}
          </label>
          <input
            aria-describedby={`${question.id}-addressError`}
            id={`${question.id}-addressInput`}
            disabled={readOnly}
            autoFocus={autoFocus}
            value={value?.address ?? ''}
            maxLength={70}
            required={question.isRequired}
            onBlur={(event) =>
              setShowInputErrorsFor((prev) => ({
                ...prev,
                address: !event.target.validity.valid,
              }))
            }
            onChange={(event) => {
              const newValue = {
                ...hasInvalidInput,
                address: !event.target.validity.valid,
              };
              setHasInvalidInput(newValue);
              onChange(
                { ...value, address: event.target.value },
                Object.values(newValue).some((isInvalid) => isInvalid),
              );
            }}
          />
        </PersonalInfoInputWrapper>
      )}
      {question.askCustom && (
        <PersonalInfoInputWrapper
          id={`${question.id}-customInput`}
          showError={showInputErrorsFor.custom}
          errorMessage={tr.PersonalInfoQuestion.customError.replace(
            '{label}',
            question.customLabel?.[surveyLanguage] ?? '',
          )}
          labelColor={survey.sectionTitleColor}
        >
          <label htmlFor={`${question.id}-customInput`}>
            {question?.customLabel?.[surveyLanguage] ?? ''}
          </label>
          <input
            aria-describedby={`${question.id}-customError`}
            id={`${question.id}-customInput`}
            disabled={readOnly}
            autoFocus={autoFocus}
            value={value?.custom ?? ''}
            maxLength={50}
            required={question.isRequired}
            onBlur={(event) =>
              setShowInputErrorsFor((prev) => ({
                ...prev,
                custom: !event.target.validity.valid,
              }))
            }
            onChange={(event) => {
              const newValue = {
                ...hasInvalidInput,
                custom: !event.target.validity.valid,
              };
              setHasInvalidInput(newValue);
              onChange(
                { ...value, custom: event.target.value },
                Object.values(newValue).some((isInvalid) => isInvalid),
              );
            }}
          />
        </PersonalInfoInputWrapper>
      )}
    </Box>
  );
}
