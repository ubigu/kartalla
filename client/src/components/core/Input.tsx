import { Box, useTheme } from '@mui/material';
import {
  getBackgroundColor,
  getBorderColor,
  getBoxShadow,
  getLabelColor,
} from '@src/themes/colorHelpers';
import React, { useId, useState } from 'react';
import { InputHelperText } from './InputHelperText';

const paddingX = 6;

const focusStyle = {
  outline: '2px solid',
  outlineColor: getBorderColor('focus'),
  backgroundColor: getBackgroundColor('focus'),
  boxShadow: getBoxShadow('focus'),
};
const hoverStyle = {
  borderColor: getBorderColor('hover'),
  backgroundColor: getBackgroundColor('hover'),
};

interface CoreInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  helperText?: string;
}

export function CoreInput({
  label,
  id,
  style,
  error,
  helperText,
  required,
  ...props
}: CoreInputProps) {
  const theme = useTheme();
  const helperId = useId();
  const internalId = useId();
  const inputId = id ?? internalId;
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '2px' }}>
      {label && (
        <Box
          component={'label'}
          htmlFor={inputId}
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
      <Box
        component={'input'}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={helperText ? helperId : undefined}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        sx={{
          height: '28px',
          fontSize: '14px',
          fontFamily: theme.typography.fontFamily,
          color: theme.palette.harmaa.main,
          backgroundColor: getBackgroundColor('default', !!error),
          border: `1px solid`,
          borderColor: getBorderColor('default', !!error),
          borderRadius: '3px',
          padding: `0 ${paddingX}px`,
          boxShadow: getBoxShadow('default', !!error),
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s, background-color 0.2s',
          '&:hover:not(:focus)': { ...(!error && hoverStyle) },
          '&:focus-visible': { ...(!error && focusStyle) },
          ...style,
        }}
        {...props}
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
