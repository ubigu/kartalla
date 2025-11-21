import {
  GeoBudgetTarget,
  SurveyGeoBudgetingQuestion,
} from '@interfaces/survey';
import {
  Box,
  Fab,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import AddIcon from '@src/components/icons/AddIcon';
import DeleteBinIcon from '@src/components/icons/DeleteBinIcon';
import MarkerIconSelect from '@src/components/admin/MarkerIconSelect';

import { useTranslations } from '@src/stores/TranslationContext';
import React, { createRef, useEffect, useMemo } from 'react';

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
    background: 'white',
    borderRadius: '0.25rem',
    alignItems: 'center',
    padding: '0.75rem 1rem 1rem 1rem',
    boxSizing: 'border-box',
  },
  optionContainer: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    paddingRight: '2.5rem',
    gap: '1rem',
  },
};

interface Props {
  section: SurveyGeoBudgetingQuestion;
  targets: GeoBudgetTarget[];
  disabled?: boolean;
  onChange: (targets: GeoBudgetTarget[]) => void;
}

export function GeoBudgetTargets({
  section,
  targets,
  disabled,
  onChange,
}: Props) {
  const { tr, surveyLanguage, initializeLocalizedObject } = useTranslations();

  // Array of references to the option input elements
  const inputRefs = useMemo(
    () =>
      Array(targets.length)
        .fill(null)
        .map(() => createRef<HTMLInputElement>()),
    [targets.length],
  );

  // Whenever input element count changes, focus on the last one
  useEffect(() => {
    const lastElement = inputRefs[inputRefs.length - 1]?.current;
    lastElement?.focus();
  }, [inputRefs.length]);

  function updateTarget(index: number, newValues: Partial<GeoBudgetTarget>) {
    onChange(
      targets.map((target, i) =>
        index === i
          ? {
              ...target,
              ...newValues,
            }
          : target,
      ),
    );
  }

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.row}>
        <Fab
          color="primary"
          disabled={disabled}
          aria-label="add-geo-budget-target"
          size="small"
          sx={{ boxShadow: 'none' }}
          onClick={() => {
            onChange([
              ...targets,
              {
                name: initializeLocalizedObject(''),
                price: 0,
              },
            ]);
          }}
        >
          <AddIcon />
        </Fab>
        <Typography style={{ paddingLeft: '1rem' }}>
          {tr.BudgetingQuestion.budgetTargets}
        </Typography>
      </Box>
      <Stack gap={'1rem'}>
        {targets.map((target, index) => (
          <Box sx={{ ...styles.row, ...styles.option }} key={index}>
            <Box sx={styles.optionContainer}>
              <Box display="flex" gap="1rem" alignItems="flex-start">
                <MarkerIconSelect
                  value={target.icon ?? ''}
                  onChange={(icon) => {
                    updateTarget(index, {
                      icon: icon || undefined,
                    });
                  }}
                />
                <TextField
                  data-testid={`geo-budget-target-name-${index}`}
                  label={tr.GeoBudgetingQuestion.targetName}
                  inputRef={inputRefs[index]}
                  style={{ flex: 1 }}
                  variant="standard"
                  disabled={disabled}
                  size="small"
                  value={target.name?.[surveyLanguage] ?? ''}
                  onChange={(event) =>
                    updateTarget(index, {
                      name: {
                        ...target.name,
                        [surveyLanguage]: event.target.value,
                      },
                    })
                  }
                  onKeyDown={(event) => {
                    if (['Enter', 'NumpadEnter'].includes(event.key)) {
                      event.preventDefault();
                      if (index === targets.length - 1) {
                        // Last item on list - add new target
                        onChange([
                          ...targets,
                          {
                            name: initializeLocalizedObject(''),
                            price: 0,
                          },
                        ]);
                      } else {
                        // Focus on the next item
                        inputRefs[index + 1].current.focus();
                      }
                    }
                  }}
                />
                <TextField
                  type="number"
                  label={tr.GeoBudgetingQuestion.targetPrice}
                  variant="standard"
                  InputProps={{ endAdornment: section.unit ?? '' }}
                  value={target.price ?? 0}
                  onChange={(event) => {
                    const value = Math.max(Number(event.target.value), 0);
                    updateTarget(index, {
                      price: value,
                    });
                  }}
                />
              </Box>
            </Box>
            <Tooltip title={tr.SurveySections.removeOption}>
              <span style={{ alignSelf: 'start' }}>
                <IconButton
                  aria-label="delete"
                  disabled={disabled}
                  size="small"
                  onClick={() => {
                    onChange(targets.filter((_, i) => index !== i));
                  }}
                >
                  <DeleteBinIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
