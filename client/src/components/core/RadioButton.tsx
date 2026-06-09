import { Box, Typography } from '@mui/material';
import {
  getBackgroundColor,
  getBorderColor,
  getBoxShadow,
} from '@src/themes/colorHelpers';
import React, { useId, useState } from 'react';
import { InputHelperText } from './InputHelperText';
import { visuallyHidden } from './styles';

interface Props extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label?: string;
  error?: boolean;
  helperText?: string;
}

export function RadioButton({
  label,
  id,
  error,
  helperText,
  required,
  disabled,
  checked,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const helperId = useId();
  const internalId = useId();
  const inputId = id ?? internalId;
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const circleBorderColor = error
    ? getBorderColor('default', true)
    : isFocused
      ? 'brandBlue.main'
      : isHovered
        ? 'primary.main'
        : getBorderColor('default');

  const circleBackground = error
    ? getBackgroundColor('default', true)
    : isHovered && !isFocused
      ? 'surfaceHover.main'
      : getBackgroundColor('default');

  const circleBoxShadow =
    isFocused && !disabled
      ? getBoxShadow('focus')
      : getBoxShadow('default', !!error);

  const dotColor = disabled ? 'borderSubtle.main' : 'primary.main';

  const labelColor = disabled
    ? 'textSubtle.main'
    : error
      ? 'textError.main'
      : isFocused
        ? 'brandBlue.main'
        : isHovered
          ? 'textInteractive.main'
          : 'harmaa.main';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Box
          component="input"
          type="radio"
          id={inputId}
          disabled={disabled}
          checked={checked}
          aria-invalid={!!error}
          aria-describedby={helperText ? helperId : undefined}
          onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          sx={visuallyHidden}
          {...props}
        />
        <Box
          component="label"
          htmlFor={inputId}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: disabled ? undefined : 'pointer',
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '0.5px solid',
              borderColor: circleBorderColor,
              backgroundColor: circleBackground,
              boxShadow: circleBoxShadow,
              flexShrink: 0,
              transition:
                'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
            }}
          >
            {checked && (
              <Box
                sx={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: dotColor,
                }}
              />
            )}
          </Box>
          {label && (
            <Typography
              component="span"
              sx={{
                fontSize: '14px',
                color: labelColor,
                lineHeight: 'normal',
                transition: 'color 0.2s',
              }}
            >
              {label}
              {required && <span aria-hidden="true"> *</span>}
            </Typography>
          )}
        </Box>
      </Box>
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
