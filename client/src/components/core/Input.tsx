import { Box, SxProps, Theme, Typography, useTheme } from '@mui/material';
import {
  getBackgroundColor,
  getBorderColor,
  getBoxShadow,
  getLabelColor,
} from '@src/themes/colorHelpers';
import React, { useId, useState } from 'react';
import { InputHelperText } from './InputHelperText';
import {
  controlBorderRadius,
  focusStyle,
  hoverStyle,
  visuallyHidden,
} from './styles';

const paddingX = 6;

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  helperText?: string;
  inlineDescription?: { visible: string; screenReader?: string };
  sx?: SxProps<Theme>;
}

export function Input({
  label,
  id,
  style,
  className,
  sx,
  error,
  helperText,
  required,
  disabled,
  inlineDescription,
  ...props
}: Props) {
  const theme = useTheme();
  const helperId = useId();
  const inlineDescriptionId = useId();
  const internalId = useId();
  const inputId = id ?? internalId;
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Box
      className="Input-root"
      sx={[
        { display: 'flex', flex: 1, flexDirection: 'column', gap: '2px' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {label && (
        <Box
          className="Input-label"
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
        className="Input-control"
        sx={{
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          backgroundColor: getBackgroundColor('default', !!error),
          border: `0.5px solid`,
          borderColor: getBorderColor('default', !!error),
          borderRadius: controlBorderRadius,
          boxShadow: getBoxShadow('default', !!error),
          transition: 'border-color 0.2s, background-color 0.2s',
          '&:hover:not(:focus-within)': {
            ...(!error && !disabled && hoverStyle),
          },
          '&:focus-within': { ...(!error && !disabled && focusStyle) },
        }}
      >
        {inlineDescription && (
          <Typography
            className="Input-inlineDescription"
            component={'span'}
            id={inlineDescriptionId}
            sx={{
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'stretch',
              color: 'textSecondary.main',
              paddingX: '6px',
              borderRight: '0.5px solid',
              borderColor: getBorderColor('default', !!error),
              background: `linear-gradient(180deg, ${theme.palette.surfacePrimary.main} 0%, transparent 100%), ${theme.palette.surfaceSubtle.main}`,
            }}
          >
            <span aria-hidden="true">{inlineDescription.visible}</span>
            {inlineDescription.screenReader && (
              <span style={visuallyHidden}>
                {inlineDescription.screenReader}
              </span>
            )}
          </Typography>
        )}
        <Box
          className={['Input-input', className].filter(Boolean).join(' ')}
          component={'input'}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            [inlineDescription && inlineDescriptionId, helperText && helperId]
              .filter(Boolean)
              .join(' ') || undefined
          }
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
            padding: `0 ${paddingX}px`,
            border: 'none',
            backgroundColor: 'transparent',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
            ...style,
          }}
          {...props}
        />
      </Box>
      {error ? (
        helperText && (
          <InputHelperText className="Input-helperText" id={helperId} isError>
            {helperText}
          </InputHelperText>
        )
      ) : helperText ? (
        <InputHelperText className="Input-helperText" id={helperId}>
          {helperText}
        </InputHelperText>
      ) : null}
    </Box>
  );
}
