import { Box, useTheme } from '@mui/material';
import {
  DateTimePickerProps,
  DateTimePicker as MuiDateTimePicker,
} from '@mui/x-date-pickers/DateTimePicker';
import CalendarSmallIcon from '@src/components/icons/CalendarSmallIcon';
import {
  getBackgroundColor,
  getBorderColor,
  getBoxShadow,
  getLabelColor,
} from '@src/themes/colorHelpers';
import { useId, useState } from 'react';
import { InputHelperText } from './InputHelperText';
import { controlBorderRadius } from './styles';

interface Props<TDate> extends DateTimePickerProps<TDate> {
  label?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
}

export function DateTimePicker<TDate>({
  label,
  error,
  helperText,
  required,
  placeholder,
  ...props
}: Props<TDate>) {
  const theme = useTheme();
  const helperId = useId();
  const internalId = useId();
  const [isFocused, setIsFocused] = useState(false);

  const inputStyles = {
    height: '28px',
    fontSize: '14px',
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.harmaa.main,
    backgroundColor: getBackgroundColor('default', !!error),
    border: '0.5px solid',
    borderColor: getBorderColor('default', !!error),
    borderRadius: controlBorderRadius,
    boxShadow: getBoxShadow('default', !!error),
    padding: '0 6px',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s, background-color 0.2s',
  };

  return (
    <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '2px' }}>
      {label && (
        <Box
          component="label"
          htmlFor={internalId}
          sx={{
            fontSize: '12px',
            color: getLabelColor({ isFocused, isError: !!error }),
            lineHeight: 'normal',
          }}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </Box>
      )}
      <MuiDateTimePicker
        {...props}
        slots={{
          openPickerIcon: () => <CalendarSmallIcon fontSize="small" />,
          ...props.slots,
        }}
        slotProps={{
          ...props.slotProps,
          openPickerButton: {
            disableRipple: true,
            ...props.slotProps?.openPickerButton,
          },
          textField: {
            size: 'small',
            error: !!error,
            inputProps: {
              'aria-describedby': helperText ? helperId : undefined,
              id: internalId,
              placeholder,
            },
            onFocus: () => setIsFocused(true),
            onBlur: () => setIsFocused(false),
            sx: {
              '& .MuiInputBase-root': {
                ...inputStyles,
                '&:hover:not(.Mui-focused)': !error
                  ? {
                      borderColor: getBorderColor('hover'),
                      backgroundColor: getBackgroundColor('hover'),
                    }
                  : {},
                '&.Mui-focused': !error
                  ? {
                      outline: '2px solid',
                      outlineColor: getBorderColor('focus'),
                      backgroundColor: getBackgroundColor('focus'),
                      boxShadow: getBoxShadow('focus'),
                    }
                  : {},
              },
              '& .MuiInputBase-input': {
                padding: 0,
                height: '28px',
                fontSize: '14px',
                fontFamily: theme.typography.fontFamily,
                color: theme.palette.harmaa.main,
              },
              '& .MuiOutlinedInput-notchedOutline': { display: 'none' },
              '& .MuiInputAdornment-root': { marginLeft: 0 },
              '& .MuiIconButton-root': {
                padding: '12px',
                color: error ? 'brandRed.main' : 'primary.main',
                '&:hover': {
                  color: error ? 'textError.main' : 'primary.dark',
                },
              },
              '& .MuiInputBase-root.Mui-focused .MuiIconButton-root': {
                color: error ? 'brandRed.main' : 'primary.dark',
              },
              '& fieldset': { display: 'none' },
              width: '100%',
            },
            ...(props.slotProps?.textField as object),
          },
        }}
        label={undefined}
      />
      {error ? (
        helperText && (
          <InputHelperText id={helperId} isError>
            {helperText}
          </InputHelperText>
        )
      ) : helperText ? (
        <InputHelperText id={helperId}>{helperText}</InputHelperText>
      ) : null}
    </Box>
  );
}
