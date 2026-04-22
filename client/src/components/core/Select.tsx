import {
  Box,
  MenuItem,
  Select as MuiSelect,
  SelectProps,
  useTheme,
} from '@mui/material';
import React, { useId } from 'react';
import ChevronDownSmallIcon from '../icons/ChevronDownSmallIcon';
import { InputHelperText } from './InputHelperText';

export interface SelectOption {
  value: string;
  label: string;
}

interface CoreSelectProps extends Omit<SelectProps, 'label' | 'variant'> {
  label?: string;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
  helperText?: string;
  helperTextProps?: React.ComponentProps<typeof InputHelperText>;
  options?: SelectOption[];
}

export function CoreSelect({
  label,
  labelProps,
  options,
  id,
  sx,
  children,
  helperText,
  helperTextProps,
  ...props
}: CoreSelectProps) {
  const theme = useTheme();
  const helperTextId = useId();
  const generatedLabelId = useId();
  const labelId = label ? generatedLabelId : undefined;
  return (
    <Box
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: '2px',
        position: 'relative',
      }}
    >
      {label && (
        <Box
          component={'label'}
          id={labelId}
          htmlFor={id as string}
          sx={{
            fontSize: '12px',
            color: theme.palette.textInteractive.main,
            lineHeight: 'normal',
          }}
          {...labelProps}
        >
          {label}
        </Box>
      )}
      <MuiSelect
        IconComponent={(props) => <ChevronDownSmallIcon {...props} />}
        labelId={labelId}
        inputProps={{ id: id as string }}
        renderValue={
          options
            ? (value) => {
                const opt = options.find((o) => o.value === String(value));
                return (
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {opt?.label ?? String(value)}
                  </span>
                );
              }
            : undefined
        }
        sx={[
          {
            height: '28px',
            fontSize: '14px',
            color: theme.palette.harmaa.main,
            backgroundColor: `${theme.palette.surfaceSubtle.main} !important`,
            border: `0.5px solid ${theme.palette.borderSubtle.main}`,
            borderRadius: '4px',
            boxShadow: '0px 1px 2px 0px #59788626 inset',
            '& .MuiOutlinedInput-notchedOutline': { borderWidth: 0 },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderWidth: 0 },
            '&.Mui-focused': {
              border: `1px solid ${theme.palette.primary.main}`,
            },
            '& .MuiSelect-select': {
              padding: '0 6px',
              paddingRight: '28px !important',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              '& > *': {
                flex: '1 1 0',
                minWidth: 0,
                overflow: 'hidden',
              },
            },
            '& .MuiSvgIcon-root': { color: theme.palette.primary.main },
          },
          ...(Array.isArray(sx) ? sx : [sx ?? {}]),
        ]}
        aria-describedby={helperText ? helperTextId : undefined}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <MenuItem
                key={opt.value}
                value={opt.value}
                sx={{ fontSize: '14px', color: theme.palette.harmaa.main }}
              >
                {opt.label}
              </MenuItem>
            ))
          : children}
      </MuiSelect>
      {helperText && (
        <InputHelperText id={helperTextId} {...helperTextProps}>
          {helperText}
        </InputHelperText>
      )}
    </Box>
  );
}
