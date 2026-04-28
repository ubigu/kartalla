import { Box, Button, SxProps, Theme, useTheme } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import {
  getBackgroundColor,
  getBorderColor,
  getBoxShadow,
  getDisabledInputStyles,
  getDisabledLabelColor,
  getLabelColor,
} from '@src/themes/colorHelpers';
import React, { useEffect, useId, useRef, useState } from 'react';
import CheckIcon from '../icons/CheckIcon';
import ChevronDownSmallIcon from '../icons/ChevronDownSmallIcon';
import { InputHelperText } from './InputHelperText';

const paddingX = 6;
const chevronWidth = 22;

interface ComboboxListboxBaseProps<T extends string> {
  listBoxRef: React.RefObject<HTMLElement | null>;
  listboxId: string;
  label?: string;
  multiselect?: boolean;
  filteredOptions: ComboboxOption<T>[];
  handleMultiSelect: (opt: ComboboxOption<T>) => void;
  handleSelect: (opt: ComboboxOption<T>) => void;
  activeIndex: number;
  activeItemRef: React.RefObject<HTMLElement | null>;
  renderValue?: (option: ComboboxOption<T>) => React.ReactNode;
  isOpen?: boolean;
}

interface ComboboxListboxProps<
  T extends string,
> extends ComboboxListboxBaseProps<T> {
  multiselect?: boolean;
  value?: ComboboxOption<T>['value'] | ComboboxOption<T>['value'][];
  isOpen?: boolean;
}

function ComboboxListbox<T extends string>(props: ComboboxListboxProps<T>) {
  const {
    listBoxRef,
    listboxId,
    label,
    multiselect,
    filteredOptions,
    value,
    handleMultiSelect,
    handleSelect,
    activeIndex,
    activeItemRef,
    renderValue,
    isOpen,
  } = props;
  const theme = useTheme();
  return (
    <Box
      ref={listBoxRef}
      tabIndex={-1}
      component="ul"
      id={listboxId}
      role="listbox"
      aria-label={label}
      aria-multiselectable={multiselect}
      sx={{
        display: isOpen ? 'default' : 'none',
        position: 'absolute',
        top: 'calc(100% + 1px)',
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
      {filteredOptions.map((opt, i) => {
        const isSelected = multiselect
          ? Array.isArray(value) &&
            (value.some((v) => String(v) === String(opt.value)) ?? false)
          : String(value) === String(opt.value);

        return (
          <Box
            component="li"
            key={opt.value}
            id={`${listboxId}-${i}`}
            ref={i === activeIndex ? activeItemRef : undefined}
            role="option"
            aria-selected={isSelected}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              multiselect ? handleMultiSelect(opt) : handleSelect(opt)
            }
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
              gap: '6px',
              backgroundColor:
                i === activeIndex ? 'surfaceHover.main' : 'transparent',
              '&:hover': {
                backgroundColor: 'surfaceHover.main',
              },
            }}
          >
            {multiselect && isSelected && (
              <Box
                aria-hidden="true"
                sx={{
                  width: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  color: isSelected ? 'textSecondary.main' : 'transparent',
                }}
              >
                <CheckIcon
                  stroke={theme.palette.primary.main}
                  sx={{ fontSize: 14 }}
                />
              </Box>
            )}
            {renderValue?.(opt) ?? opt.label}
          </Box>
        );
      })}
    </Box>
  );
}

export interface ComboboxOption<T extends String> {
  value: T extends string ? T : number;
  label: string;
}

interface ComboboxBaseProps<T extends String> {
  id?: string;
  label?: string;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
  error?: boolean;
  helperText?: string;
  helperTextProps?: React.ComponentProps<typeof InputHelperText>;
  options: ComboboxOption<T>[];
  disabled?: boolean;
  placeholder?: string;
  renderValue?: (option: ComboboxOption<T>) => React.ReactNode;
  wrapperSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
  'aria-describedby'?: string;
  'aria-label'?: string;
}

type SingleSelectProps<T extends string> = ComboboxBaseProps<T> & {
  multiselect?: false;
  value?: ComboboxOption<T>['value'];
  onChange?: (value: ComboboxOption<T>['value']) => void;
  onMultiChange?: never;
};

type MultiSelectProps<T extends string> = ComboboxBaseProps<T> & {
  multiselect: true;
  onMultiChange?: (values: ComboboxOption<T>['value'][]) => void;
  value?: ComboboxOption<T>['value'][];
  onChange?: never;
};

type ComboboxProps<T extends string> =
  | SingleSelectProps<T>
  | MultiSelectProps<T>;

function getSelectedLabel<T extends string>(props: ComboboxProps<T>) {
  const { multiselect, options, value } = props;

  if (multiselect) {
    return value?.length && value.length > 0
      ? value
          .map(
            (value) =>
              options?.find((opt) => String(opt.value) === String(value))
                ?.label ?? String(value),
          )
          .join(', ')
      : '';
  }

  return options
    ? (options.find((opt) => opt.value === String(value))?.label ?? '')
    : String(value ?? '');
}

/** NOTE: This component is WIP. There's some accessibility issues that need to be fixed before using these in surveys.  */
export function Combobox_WIP<T extends string = string>(
  props: ComboboxProps<T>,
) {
  const {
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
    multiselect,
    onMultiChange,
    wrapperSx,
    sx,
    'aria-describedby': ariaDescribedBy,
    'aria-label': ariaLabel,
  } = props;
  const theme = useTheme();
  const { tr } = useTranslations();
  const helperId = useId();
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLElement>(null);
  const activeItemRef = useRef<HTMLElement>(null);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const activeIndex = filteredOptions.findIndex(
    (opt) => String(opt.value) === String(activeValue),
  );
  const selectedLabel = getSelectedLabel(props);
  const [inputValue, setInputValue] = useState(
    multiselect ? '' : selectedLabel,
  );

  useEffect(() => {
    if (!multiselect && !isOpen) setInputValue(selectedLabel);
  }, [selectedLabel]);

  const optionCount = filteredOptions.length;

  function open() {
    setFilteredOptions(options);
    setActiveValue(!multiselect && value != null ? String(value) : null);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  function handleSelect(opt: ComboboxOption<T>) {
    setInputValue(opt.label);
    onChange?.(opt.value);
    inputRef.current?.focus();
    close();
  }

  function handleMultiSelect(opt: ComboboxOption<T>) {
    const currentValue = Array.isArray(value) ? value : [];
    const isSelected = currentValue.some(
      (v) => String(v) === String(opt.value),
    );

    onMultiChange?.(
      isSelected
        ? currentValue.filter(
            (currentVal) => String(currentVal) !== String(opt.value),
          )
        : [...currentValue, opt.value],
    );
    setInputValue('');
    setFilteredOptions(options);
    activeItemRef.current?.focus();
  }
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      const next = Math.min(
        activeIndex < 0 ? 0 : activeIndex + 1,
        optionCount - 1,
      );
      setActiveValue(
        filteredOptions[next] ? String(filteredOptions[next].value) : null,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(activeIndex < 0 ? 0 : activeIndex - 1, 0);
      setActiveValue(
        filteredOptions[prev] ? String(filteredOptions[prev].value) : null,
      );
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      const opt = filteredOptions[activeIndex];
      if (opt) {
        if (multiselect) handleMultiSelect(opt);
        else handleSelect(opt);
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      close();
    }
  }

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

      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          ...(multiselect && {
            flexWrap: 'wrap',
            gap: '4px',
            padding: `4px ${paddingX + chevronWidth}px 4px ${paddingX}px`,
            minHeight: '28px',
            backgroundColor: getBackgroundColor('default', !!error),
            border: '1px solid',
            borderColor: isFocused
              ? getBorderColor('focus')
              : getBorderColor('default', !!error),
            borderRadius: '3px',
            boxShadow: isFocused
              ? getBoxShadow('focus')
              : getBoxShadow('default', !!error),
            transition: 'border-color 0.2s, background-color 0.2s',
            cursor: disabled ? 'not-allowed' : undefined,
            ...(disabled ? getDisabledInputStyles() : {}),
            ...(!error && !disabled && !isFocused
              ? {
                  '&:hover': {
                    borderColor: getBorderColor('hover'),
                    backgroundColor: getBackgroundColor('hover'),
                  },
                }
              : {}),
          }),
        }}
      >
        {multiselect &&
          Array.isArray(value) &&
          value.map((val) => {
            const opt = options.find((o) => String(o.value) === String(val));
            return (
              <Box
                key={String(val)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'surfacePrimary.main',
                  outline: '1px solid',
                  outlineColor: 'borderSubtle.main',
                  borderRadius: '4px',
                  padding: '1px 4px 1px 6px',
                  fontSize: '12px',
                  color: theme.palette.harmaa.main,
                  lineHeight: '18px',
                }}
              >
                <span>{opt?.label ?? String(val)}</span>
                {!disabled && (
                  <Button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (opt) handleMultiSelect(opt);
                    }}
                    aria-label={`${tr.Combobox.removeSelection} ${opt?.label ?? String(val)}`}
                    sx={{
                      minWidth: 'min-content',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 2px',
                      margin: 0,
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      color: 'textSubtle.main',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      '&:hover': { color: theme.palette.harmaa.main },
                    }}
                  >
                    ×
                  </Button>
                )}
              </Box>
            );
          })}

        <Box
          ref={inputRef}
          component="input"
          type="text"
          id={id}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen ? `${listboxId}-${activeIndex}` : undefined
          }
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          disabled={disabled}
          placeholder={props.placeholder}
          value={inputValue}
          onChange={(e) => {
            const typed = (e.target as HTMLInputElement).value;
            setInputValue(typed);
            const newFiltered = options.filter((opt) =>
              opt.label.toLowerCase().includes(typed.toLowerCase()),
            );
            setFilteredOptions(newFiltered);
            setActiveValue(
              newFiltered[0] ? String(newFiltered[0].value) : null,
            );
            if (!isOpen) setIsOpen(true);
          }}
          onClick={() => {
            if (!disabled) isOpen ? close() : open();
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            if (
              (e as React.FocusEvent<HTMLInputElement>).relatedTarget ===
              listboxRef.current
            )
              return;
            setIsFocused(false);
            if (!multiselect) setInputValue(selectedLabel);
            else setInputValue('');
            close();
          }}
          onKeyDown={handleKeyDown}
          sx={[
            {
              height: '28px',
              fontSize: '14px',
              fontFamily: theme.typography.fontFamily,
              color: theme.palette.harmaa.main,
              outline: 'none',
              textOverflow: 'ellipsis',
              cursor: disabled ? 'not-allowed' : undefined,
              ...(multiselect
                ? {
                    flex: 1,
                    minWidth: '80px',
                    width: 'auto',
                    border: 'none',
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    padding: 0,
                    '&::placeholder': {
                      color: 'textSubtle.main',
                      opacity: 1,
                    },
                    '&:focus-visible': {
                      outline: 'none',
                    },
                  }
                : {
                    backgroundColor: getBackgroundColor('default', !!error),
                    border: '1px solid',
                    borderColor: getBorderColor('default', !!error),
                    borderRadius: '3px',
                    padding: `0 ${paddingX + chevronWidth}px 0 ${paddingX}px`,
                    boxShadow: getBoxShadow('default', !!error),
                    width: '100%',
                    boxSizing: 'border-box',
                    '&::placeholder': {
                      color: 'textSubtle.main',
                      opacity: 1,
                    },
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
                  }),
            },
            ...(Array.isArray(sx) ? sx : [sx ?? {}]),
          ]}
        />

        <Box
          sx={{
            position: 'absolute',
            right: `${paddingX}px`,
            top: '50%',
            transform: `translateY(-50%) rotate(${isOpen ? 180 : 0}deg)`,
            transition: 'transform 0.15s',
            display: 'flex',
            color: 'primary.main',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          onClick={() => {
            if (!disabled) isOpen ? close() : open();
          }}
        >
          <ChevronDownSmallIcon
            stroke={disabled ? theme.palette.textSubtle.main : 'currentColor'}
          />
        </Box>

        <ComboboxListbox
          listBoxRef={listboxRef}
          listboxId={listboxId}
          label={label}
          multiselect={multiselect}
          filteredOptions={filteredOptions}
          value={value}
          handleMultiSelect={handleMultiSelect}
          handleSelect={handleSelect}
          activeIndex={activeIndex}
          activeItemRef={activeItemRef}
          renderValue={props.renderValue}
          isOpen={isOpen}
        />
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
