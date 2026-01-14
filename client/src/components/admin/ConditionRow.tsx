import { useState } from 'react';

import { Conditions, SectionOption } from '@interfaces/survey';
import {
  Checkbox,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import { useTranslations } from '@src/stores/TranslationContext';
import { isNumeric } from '@src/utils/typeCheck';

interface SelectPlaceholderProps {
  selected: number[];
  options: SectionOption[];
}

function SelectPlaceholder({ selected, options }: SelectPlaceholderProps) {
  const { tr, surveyLanguage } = useTranslations();

  if (selected.length === 0) {
    return (
      <Typography sx={{ color: 'grey' }}>
        {tr.EditSurveyPage.conditions.noSelections}
      </Typography>
    );
  }

  if (selected.length > 1) {
    return (
      <Typography>
        {tr.EditSurveyPage.conditions.selections.replace(
          '{x}',
          String(selected.length),
        )}
      </Typography>
    );
  }

  const selectedOptionId = selected[0];

  return (
    <Typography>
      {selectedOptionId === -1
        ? tr.EditSurveyPage.conditions.somethingElse
        : options.find((option) => option.id === selectedOptionId)?.text[
            surveyLanguage
          ]}
    </Typography>
  );
}

interface RowProps {
  label: string;
  conditionIsNumeric?: boolean;
  options?: SectionOption[];
  conditions?: Conditions;
  textFieldValue?: number | string;
  onInput: (values: number[]) => void;
  allowCustomAnswer?: boolean;
  alignment?: 'left' | 'right';
  labelPrefix?: string;
}

export function ConditionRow({
  label,
  conditionIsNumeric = false,
  options = [],
  conditions = { equals: [], lessThan: [], greaterThan: [] },
  onInput,
  textFieldValue = '',
  allowCustomAnswer = false,
  alignment = 'right',
  labelPrefix = '',
}: RowProps) {
  const [validationError, setValidationError] = useState(false);
  const { tr, surveyLanguage } = useTranslations();

  return (
    <FormControl
      fullWidth
      sx={{
        flexDirection: 'row',
        marginTop: '10px',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <FormLabel
        sx={{
          flex: 1,
          textAlign: alignment,
          transform: validationError ? 'translateY(-50%)' : null,
        }}
      >
        <span style={{ fontWeight: 'bold' }}>{`${labelPrefix} `}</span>
        {label}
      </FormLabel>
      {conditionIsNumeric ? (
        <TextField
          error={validationError}
          helperText={
            validationError && tr.FollowUpSection.conditions.validationError
          }
          value={isNaN(Number(textFieldValue)) ? '-' : textFieldValue}
          placeholder={tr.FollowUpSection.conditions.insertValue}
          onChange={(event) => {
            const { value } = event.target;

            if (value !== '' && value !== '-' && !isNumeric(value)) {
              setValidationError(true);
              return;
            } else if (validationError) setValidationError(false);

            onInput(value === '' ? [] : [Number(value)]);
          }}
          sx={{
            flex: 1,
            '& .MuiInputBase-root': { backgroundColor: 'white' },
            '& .MuiInputBase-input': { paddingY: '0.75rem' },
            '& .MuiFormHelperText-root': { backgroundColor: null },
          }}
        />
      ) : (
        <Select
          disabled={options.every((option) => option.id < 0)}
          multiple
          sx={{
            flex: 1,
            backgroundColor: 'white',
            '& .MuiSelect-select': { paddingY: '0.75rem' },
          }}
          displayEmpty
          value={conditions?.equals}
          onChange={(event) => {
            let { value } = event.target;

            // On autofill we get a stringified value.
            if (typeof value === 'string') {
              value = value.split(',').map((v) => Number(v));
            }
            onInput(value);
          }}
          renderValue={(selected) => (
            <SelectPlaceholder selected={selected} options={options} />
          )}
        >
          {options?.map((option) => (
            <MenuItem value={option.id} key={option.id}>
              <Checkbox checked={conditions?.equals.includes(option.id)} />
              <Typography>{option.text[surveyLanguage]}</Typography>
            </MenuItem>
          ))}

          {allowCustomAnswer && (
            <MenuItem value={-1} key={-1}>
              <Checkbox checked={conditions?.equals.includes(-1)} />
              <Typography>
                {tr.FollowUpSection.conditions.customAnswer}
              </Typography>
            </MenuItem>
          )}
        </Select>
      )}
    </FormControl>
  );
}
