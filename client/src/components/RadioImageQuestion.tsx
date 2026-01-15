import { SurveyRadioImageQuestion } from '@interfaces/survey';
import {
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { createRef, useEffect, useRef } from 'react';

interface Props {
  autoFocus?: boolean;
  question: SurveyRadioImageQuestion;
  value: number | string;
  onChange: (value: number | string) => void;
  setDirty: (dirty: boolean) => void;
  isMapSubQuestion?: boolean;
}

export function RadioImageQuestion({
  isMapSubQuestion,
  question,
  value,
  autoFocus,
  onChange,
  setDirty,
}: Props) {
  const { surveyLanguage } = useTranslations();
  const actionRef = useRef([]);

  if (autoFocus) {
    actionRef.current = question.options.map(
      (_, i) => actionRef.current[i] ?? createRef(),
    );
  }

  useEffect(() => {
    // autoFocus prop won't trigger focus styling, must be done manually
    if (autoFocus) actionRef.current[0]?.current.focusVisible();
  }, []);

  return (
    <RadioGroup
      id={`${question.id}-input`}
      value={value}
      onChange={(event) => {
        const numericValue = Number(event.currentTarget.value);
        if (event.currentTarget.value.length > 0 && !isNaN(numericValue)) {
          setDirty(true);
        }
        // Empty strings are converted to 0 with Number()
        onChange(
          event.currentTarget.value.length > 0 && !isNaN(numericValue)
            ? numericValue
            : event.currentTarget.value,
        );
      }}
      name={`${question.title?.[surveyLanguage]}-group`}
    >
      {question.options.map((option, index) => (
        <FormControlLabel
          key={option.id}
          value={option.id}
          label={
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: isMapSubQuestion ? 'min(350px, 100%)' : '60%',
                border: '1px solid #e4e4e4',
                borderRadius: '0.25rem',
                overflow: 'hidden',
                '@media (max-width:600px)': { maxWidth: '80%' },
              }}
            >
              <img
                style={{
                  width: '100%',
                }}
                src={`/api/file/${option.imageUrl}`}
                alt={option.altText?.[surveyLanguage]}
              />
              {option.attributions && (
                <Typography
                  variant="body2"
                  sx={(theme) => ({
                    lineHeight: 0.5,
                    padding: '0.5rem',
                    backgroundColor: theme.palette.primary.main,
                    color: '#fff',
                    textAlign: 'center',
                  })}
                >
                  {option.attributions}
                </Typography>
              )}
            </Box>
          }
          control={
            <Radio
              action={actionRef.current[index]}
              autoFocus={index === 0 && autoFocus}
            />
          }
          sx={{
            lineHeight: 1.2,
            marginBottom: '0.5em',
            marginTop: '0.5em',
            '& .MuiRadio-root': { padding: '16px', marginRight: '8px' },
          }}
        />
      ))}
    </RadioGroup>
  );
}
