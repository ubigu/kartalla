import { SurveyFreeTextQuestion } from '@interfaces/survey';
import { FormHelperText, TextField } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';

interface Props {
  autoFocus?: boolean;
  question: SurveyFreeTextQuestion;
  value: string;
  onChange: (value: string) => void;
  setDirty: (dirty: boolean) => void;
  maxLength?: number;
  readOnly?: boolean;
  isEmptyAndRequired: boolean;
}

export default function FreeTextQuestion({
  autoFocus = false,
  question,
  value,
  onChange,
  setDirty,
  maxLength = 500,
  readOnly = false,
  isEmptyAndRequired,
}: Props) {
  const { tr } = useTranslations();

  return (
    <>
      <TextField
        disabled={readOnly}
        autoFocus={autoFocus}
        value={value}
        multiline
        required={question.isRequired}
        inputProps={{
          id: `${question.id}-input`,
          maxLength: maxLength,
          'aria-describedby':
            question.isRequired && isEmptyAndRequired
              ? `${question.id}-helper-text ${question.id}-required-text`
              : `${question.id}-helper-text`,
        }}
        onChange={(event) => {
          setDirty(true);
          onChange(event.target.value);
        }}
      />
      <FormHelperText id={`${question.id}-helper-text`}>
        <span
          aria-hidden={value?.length > 0 && value?.length < 0.9 * maxLength}
        >
          {tr.SurveyQuestion.charactersRemaining.replace(
            '{x}',
            String(maxLength - (value?.length ?? 0)),
          )}
        </span>
      </FormHelperText>
    </>
  );
}
