import { Box, SxProps, Theme, useTheme } from '@mui/material';
import {
  getBackgroundColor,
  getBorderColor,
  getBoxShadow,
  getDisabledInputStyles,
  getDisabledLabelColor,
  getLabelColor,
} from '@src/themes/colorHelpers';
import React, { useId, useRef, useState } from 'react';
import ChevronDownSmallIcon from '../icons/ChevronDownSmallIcon';
import { InputHelperText } from './InputHelperText';

const paddingX = 6;
const chevronWidth = 22;

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string | number = string> {
  id?: string;
  label?: string;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
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
  wrapperSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
  'aria-describedby'?: string;
  'aria-label'?: string;
}

export function Select<T extends string | number = string>({
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
  renderLabel,
  renderDisplayLabel,
  wrapperSx,
  sx,
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
}: SelectProps<T>) {
  const theme = useTheme();
  const helperId = useId();
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? placeholder ?? '';
  const optionCount = options.length;

  function open() {
    const currentIndex = options.findIndex((o) => o.value === value);
    setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleSelect(opt: SelectOption<T>) {
    onChange?.(opt.value);
    close();
    buttonRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      setActiveIndex((i) => Math.min(i + 1, optionCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      if (activeIndex >= 0) handleSelect(options[activeIndex]);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      close();
    }
  }

  const activeOptionId =
    isOpen && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined;

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
          component="label"
          htmlFor={id}
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
        </Box>
      )}

      <Box sx={{ position: 'relative', display: 'flex', flex: 1 }}>
        <Box
          ref={buttonRef}
          component="button"
          type="button"
          id={id}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={() => {
            if (!disabled) isOpen ? close() : open();
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={(e: React.FocusEvent<HTMLButtonElement>) => {
            if (e.relatedTarget === listboxRef.current) return;
            setIsFocused(false);
            close();
          }}
          onKeyDown={handleKeyDown}
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
              border: '1px solid',
              borderColor: getBorderColor('default', !!error),
              borderRadius: '3px',
              padding: `0 ${paddingX + chevronWidth}px 0 ${paddingX}px`,
              boxShadow: getBoxShadow('default', !!error),
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
              textAlign: 'left',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'border-color 0.2s, background-color 0.2s',
              ...(disabled ? getDisabledInputStyles() : {}),
              '&:hover:not(:focus)':
                !error && !disabled
                  ? {
                      borderColor: getBorderColor('hover'),
                      backgroundColor: getBackgroundColor('hover'),
                    }
                  : {},
              '&:focus-visible': !error
                ? {
                    paddingLeft: `${paddingX - 1}px`,
                    border: '2px solid',
                    borderColor: getBorderColor('focus'),
                    backgroundColor: getBackgroundColor('focus'),
                    boxShadow: getBoxShadow('focus'),
                  }
                : {},
            },
            ...(Array.isArray(sx) ? sx : [sx ?? {}]),
          ]}
        >
          {renderDisplayLabel
            ? renderDisplayLabel(selectedOption)
            : displayLabel}
        </Box>

        <Box
          sx={{
            position: 'absolute',
            right: `${paddingX}px`,
            top: '50%',
            transform: `translateY(-50%) rotate(${isOpen ? 180 : 0}deg)`,
            transition: 'transform 0.15s',
            pointerEvents: 'none',
            display: 'flex',
            color: 'primary.main',
          }}
        >
          <ChevronDownSmallIcon
            stroke={disabled ? theme.palette.textSubtle.main : 'currentColor'}
          />
        </Box>

        {
          <Box
            ref={listboxRef}
            tabIndex={-1}
            component="ul"
            id={listboxId}
            role="listbox"
            aria-label={label}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, optionCount - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIndex >= 0) handleSelect(options[activeIndex]);
              } else if (e.key === 'Escape' || e.key === 'Tab') {
                close();
                buttonRef.current?.focus();
              } else {
                buttonRef.current?.focus();
              }
            }}
            onBlur={(e: React.FocusEvent) => {
              if (e.relatedTarget === buttonRef.current) return;
              setIsFocused(false);
              close();
            }}
            sx={{
              display: isOpen ? 'default' : 'none',
              position: 'absolute',
              top: 'calc(100%)',
              left: 0,
              right: 0,
              zIndex: 1300,
              margin: 0,
              padding: '4px 0',
              listStyle: 'none',
              backgroundColor: 'surfacePrimary.main',
              border: '1px solid',
              borderColor: 'borderSubtle.main',
              borderRadius: '8px',
              borderTopRightRadius: 0,
              borderTopLeftRadius: 0,
              borderTop: 'none',
              boxShadow: '0px 4px 16px 0px #59788626',
              outline: 'none',
              '&:focus': {
                borderColor: getBorderColor('focus'),
                boxShadow: getBoxShadow('focus'),
              },
              overflowY: 'auto',
              maxHeight: '240px',
            }}
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <Box
                  component="li"
                  key={opt.value}
                  id={`${listboxId}-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setActiveIndex(i)}
                  sx={{
                    px: `${paddingX}px`,
                    py: '4px',
                    fontSize: '14px',
                    fontFamily: theme.typography.fontFamily,
                    color: isSelected
                      ? 'textSecondary.main'
                      : theme.palette.harmaa.main,
                    fontWeight: isSelected ? 700 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor:
                      i === activeIndex ? 'surfaceHover.main' : 'transparent',
                  }}
                >
                  {renderLabel ? renderLabel(opt, i) : opt.label}
                </Box>
              );
            })}
          </Box>
        }
      </Box>

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
