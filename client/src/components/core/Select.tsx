import {
  Box,
  MenuItem,
  Select as MuiSelect,
  SelectChangeEvent,
  SxProps,
  Theme,
  useTheme,
} from '@mui/material';
import {
  getBackgroundColor,
  getBorderColor,
  getBoxShadow,
  getDisabledInputStyles,
  getDisabledLabelColor,
  getLabelColor,
} from '@src/themes/colorHelpers';
import React, { useId, useState } from 'react';
import ChevronDownSmallIcon from '../icons/ChevronDownSmallIcon';
import { InputHelperText } from './InputHelperText';

const paddingX = 6;
const chevronWidth = 22;

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string = string> {
  id?: string;
  label?: string;
  labelProps?: React.HTMLAttributes<HTMLSpanElement>;
  error?: boolean;
  helperText?: string;
  helperTextProps?: React.ComponentProps<typeof InputHelperText>;
  options: SelectOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
  renderLabel?: (option: SelectOption<T>, index: number) => React.ReactNode;
  renderDisplayLabel?: (option: SelectOption<T> | undefined) => React.ReactNode;
  required?: boolean;
  wrapperSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
  'aria-describedby'?: string;
  'aria-label'?: string;
}

export function Select<T extends string = string>({
  id,
  label,
  labelProps,
  error,
  helperText,
  helperTextProps,
  options,
  value,
  onChange,
  disabled,
  placeholder,
  required,
  renderLabel,
  renderDisplayLabel,
  wrapperSx,
  sx,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: SelectProps<T>) {
  const theme = useTheme();
  const helperId = useId();
  const labelId = useId();
  const [isFocused, setIsFocused] = useState(false);

  const selectedOption = options.find((o) => o.value === value);

  const describedBy =
    [ariaDescribedBy, helperText ? helperId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <Box
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: '2px',
        ...wrapperSx,
      }}
    >
      {label && (
        <Box
          component="span"
          id={labelId}
          sx={{
            fontSize: '12px',
            width: 'fit-content',
            color: disabled
              ? getDisabledLabelColor()
              : getLabelColor({ isFocused, isError: !!error }),
            lineHeight: 'normal',
          }}
          {...labelProps}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </Box>
      )}

      <MuiSelect
        id={id}
        value={value}
        onChange={(e: SelectChangeEvent) => onChange?.(e.target.value as T)}
        disabled={disabled}
        required={required}
        error={!!error}
        displayEmpty
        renderValue={(val) => {
          if (renderDisplayLabel) return renderDisplayLabel(selectedOption);
          if (val === '' || val === undefined || val === null) {
            return (
              <Box component="span" sx={{ color: 'textPlaceholder.main' }}>
                {placeholder ?? ''}
              </Box>
            );
          }
          return selectedOption?.label ?? '';
        }}
        IconComponent={ChevronDownSmallIcon}
        labelId={label ? labelId : undefined}
        aria-describedby={describedBy}
        SelectDisplayProps={{ 'aria-label': label ? undefined : ariaLabel }}
        MenuProps={{
          PaperProps: {
            sx: {
              padding: '4px 0',
              backgroundColor: 'surfacePrimary.main',
              border: '0.5px solid',
              borderColor: 'borderSubtle.main',
              borderRadius: '8px',
              borderTopRightRadius: 0,
              borderTopLeftRadius: 0,
              borderTop: 'none',
              boxShadow: '0px 4px 16px 0px #59788626',
              '& .MuiList-root': { padding: 0 },
            },
          },
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        sx={[
          {
            height: '28px',
            fontSize: '14px',
            fontFamily: theme.typography.fontFamily,
            color: disabled
              ? 'textSubtle.main'
              : value
                ? theme.palette.harmaa.main
                : 'textPlaceholder.main',
            '&&': {
              backgroundColor: disabled
                ? 'surfaceSubtle.main'
                : getBackgroundColor('default', !!error),
            },
            border: '0.5px solid',
            borderColor: getBorderColor('default', !!error),
            borderRadius: '3px',
            boxShadow: getBoxShadow('default', !!error),
            transition: 'border-color 0.2s, background-color 0.2s',
            width: '100%',
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '& .MuiSelect-select': {
              padding: `0 ${paddingX + chevronWidth}px 0 ${paddingX}px `,
              height: '28px !important',
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiSelect-icon': {
              top: '50%',
              transform: 'translateY(-50%)',
              transition: 'transform 0.15s',
              color: disabled
                ? 'textSubtle.main'
                : error
                  ? 'textError.main'
                  : 'primary.main',
            },
            '& .MuiSelect-iconOpen': {
              transform: 'translateY(-50%) rotate(180deg)',
            },
            '&:hover:not(.Mui-focused):not(.Mui-disabled)': !error
              ? {
                  borderColor: getBorderColor('hover'),
                  backgroundColor: getBackgroundColor('hover'),
                }
              : {},
            '&.Mui-focused': {
              '& .MuiSelect-icon': {
                marginRight: '-1px',
              },
              border: '2px solid',
              borderColor: getBorderColor(error ? 'error' : 'focus'),
              backgroundColor: getBackgroundColor(error ? 'error' : 'focus'),
              boxShadow: getBoxShadow(error ? 'error' : 'focus'),
              '& .MuiSelect-select': {
                padding: `0 ${paddingX + chevronWidth - 1}px 0 ${paddingX - 1}px `,
              },
            },
            '&.Mui-disabled': {
              ...getDisabledInputStyles(),
            },
          },
          ...(Array.isArray(sx) ? sx : [sx ?? {}]),
        ]}
      >
        {options.map((opt, i) => {
          const isSelected = opt.value === value;
          return (
            <MenuItem
              key={opt.value}
              value={opt.value as string | number}
              sx={{
                px: `${paddingX}px`,
                py: '4px',
                fontSize: '14px',
                fontFamily: theme.typography.fontFamily,
                color: isSelected
                  ? 'textSecondary.main'
                  : theme.palette.harmaa.main,
                fontWeight: isSelected ? 700 : 400,
                '&.MuiMenuItem-root': {
                  backgroundColor: 'transparent',
                },
                '&:hover, &.Mui-focusVisible': {
                  backgroundColor: 'surfaceHover.main',
                },
                '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible':
                  {
                    backgroundColor: 'transparent',
                  },
                '&.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': {
                  backgroundColor: 'surfaceHover.main',
                },
              }}
            >
              {renderLabel ? renderLabel(opt, i) : opt.label}
            </MenuItem>
          );
        })}
      </MuiSelect>

      {error ? (
        helperText && (
          <InputHelperText id={helperId} isError {...helperTextProps}>
            {helperText}
          </InputHelperText>
        )
      ) : helperText ? (
        <InputHelperText id={helperId} {...helperTextProps}>
          {helperText}
        </InputHelperText>
      ) : null}
    </Box>
  );
}
