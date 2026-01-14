import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, Fab, TextField } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { ChangeEvent } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  readOnly?: boolean;
}

export function NumericStepperInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  disabled = false,
  readOnly = false,
}: Props) {
  const { tr } = useTranslations();
  function handleDecrement() {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  }

  function handleIncrement() {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const inputValue = Number(event.target.value);
    const clampedValue = Math.max(min, Math.min(max, inputValue));
    onChange(clampedValue);
  }

  const isDecrementDisabled = disabled || readOnly || value <= min;
  const isIncrementDisabled = disabled || readOnly || value >= max;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Fab
        size="small"
        color="primary"
        onClick={handleDecrement}
        disabled={isDecrementDisabled}
        aria-label={tr.BudgetingQuestion.decreaseValue}
        sx={{ zIndex: 0 }}
      >
        <RemoveIcon fontSize="small" />
      </Fab>

      <TextField
        type="number"
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        inputProps={{
          readOnly,
          min,
          max,
          step,
        }}
        sx={{ width: '80px' }}
        size="small"
        variant="standard"
      />

      <Fab
        size="small"
        color="primary"
        onClick={handleIncrement}
        disabled={isIncrementDisabled}
        aria-label={tr.BudgetingQuestion.increaseValue}
        sx={{ zIndex: 0 }}
      >
        <AddIcon fontSize="small" />
      </Fab>
    </Box>
  );
}
