import { SectionOption } from '@interfaces/survey';
import {
  Box,
  Fab,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@src/components/icons/AddIcon';
import { useTranslations } from '@src/stores/TranslationContext';
import React from 'react';
import { createRef, useEffect, useMemo } from 'react';
import OptionInfoDialog from '../OptionInfoDialog';
import DeleteBinIcon from '@src/components/icons/DeleteBinIcon';

interface Props {
  options: SectionOption[];
  disabled?: boolean;
  onChange: (options: SectionOption[]) => void;
  title: string;
  enableClipboardImport?: boolean;
  allowOptionInfo?: boolean;
  allowOptionValue?: boolean;
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
  },
  option: {
    alignItems: 'center',
    padding: '1rem 0.5rem',
    boxSizing: 'border-box',
  },
  textInput: {
    display: 'flex',
    gap: '2rem',
    flexGrow: 1,
  },
};

export function BudgetMapOptions({
  options,
  disabled,
  onChange,
  title,
  allowOptionInfo = false,
  allowOptionValue = false,
}: Props) {
  const { tr, surveyLanguage, initializeLocalizedObject } = useTranslations();

  // Array of references to the option input elements
  const inputRefs = useMemo(
    () =>
      Array(options.length)
        .fill(null)
        .map(() => createRef<HTMLInputElement>()),
    [options.length],
  );

  // Whenever input element count changes, focus on the last one
  useEffect(() => {
    const lastElement = inputRefs[inputRefs.length - 1]?.current;
    lastElement?.focus();
  }, [inputRefs.length]);

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.row}>
        <Fab
          color="primary"
          disabled={disabled}
          aria-label="add-question-option"
          size="small"
          sx={{ boxShadow: 'none' }}
          onClick={() => {
            onChange([...options, { text: initializeLocalizedObject('') }]);
          }}
        >
          <AddIcon />
        </Fab>
        <Typography style={{ paddingLeft: '1rem' }}>{title}</Typography>
      </Box>
      <Box>
        {options.map((option, index) => (
          <Box sx={{ ...styles.row, ...styles.option }} key={index}>
            <Box sx={styles.textInput}>
              <TextField
                data-testid={`radio-input-option-${index}`}
                multiline
                inputRef={inputRefs[index]}
                style={{ width: '100%' }}
                variant="standard"
                disabled={disabled}
                size="small"
                value={option.text?.[surveyLanguage] ?? ''}
                onChange={(event) => {
                  onChange(
                    options.map((option, i) =>
                      index === i
                        ? {
                            ...option,
                            text: {
                              ...option.text,
                              [surveyLanguage]: event.target.value,
                            },
                          }
                        : option,
                    ),
                  );
                }}
                onKeyDown={(event) => {
                  if (['Enter', 'NumpadEnter'].includes(event.key)) {
                    event.preventDefault();
                    if (index === options.length - 1) {
                      // Last item on list - add new option
                      onChange([
                        ...options,
                        { text: initializeLocalizedObject('') },
                      ]);
                    } else {
                      // Focus on the next item
                      inputRefs[index + 1].current.focus();
                    }
                  }
                }}
              />
              {allowOptionValue && (
                <TextField
                  style={{ width: '100%' }}
                  type="number"
                  variant="standard"
                  disabled={disabled}
                  size="small"
                  value={option.value ?? ''}
                  onChange={(event) => {
                    onChange(
                      options.map((option, i) =>
                        index === i
                          ? {
                              ...option,
                              value: Number(event.target.value),
                            }
                          : option,
                      ),
                    );
                  }}
                />
              )}
            </Box>
            {allowOptionInfo && (
              <OptionInfoDialog
                infoText={option?.info?.[surveyLanguage]}
                onChangeOptionInfo={(newInfoText) => {
                  onChange(
                    options.map((option, i) =>
                      index === i
                        ? {
                            ...option,
                            info: {
                              ...option.info,
                              [surveyLanguage]: newInfoText,
                            },
                          }
                        : option,
                    ),
                  );
                }}
              />
            )}
            <Tooltip title={tr.SurveySections.removeOption}>
              <span>
                <IconButton
                  aria-label="delete"
                  disabled={disabled}
                  size="small"
                  onClick={() => {
                    onChange(options.filter((_, i) => index !== i));
                  }}
                >
                  <DeleteBinIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
