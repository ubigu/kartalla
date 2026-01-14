import { BudgetTarget, SurveyBudgetingQuestion } from '@interfaces/survey';
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

import { useTranslations } from '@src/stores/TranslationContext';
import { createRef, useEffect, useMemo } from 'react';

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
  section: SurveyBudgetingQuestion;
  targets: BudgetTarget[];
  disabled?: boolean;
  onChange: (targets: BudgetTarget[]) => void;
}

export function QuestionBudgetTargets({
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

  function updateTarget(index: number, newValues: Partial<BudgetTarget>) {
    onChange(
      targets.map((option, i) =>
        index === i
          ? {
              ...option,
              ...newValues,
            }
          : option,
      ),
    );
  }

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
            onChange([
              ...targets,
              {
                name: initializeLocalizedObject(''),
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
              <Box display="flex" gap="1rem">
                <TextField
                  data-testid={`radio-input-option-${index}`}
                  multiline
                  label={tr.BudgetingQuestion.budgetTargetName}
                  inputRef={inputRefs[index]}
                  style={{ width: '100%' }}
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
                        // Last item on list - add new option
                        onChange([
                          ...targets,
                          {
                            name: initializeLocalizedObject(''),
                          },
                        ]);
                      } else {
                        // Focus on the next item
                        inputRefs[index + 1].current.focus();
                      }
                    }
                  }}
                />
                {section.budgetingMode === 'pieces' && (
                  <TextField
                    type="number"
                    label={tr.BudgetingQuestion.budgetTargetCost}
                    variant="standard"
                    InputProps={{ endAdornment: section.unit ?? '' }}
                    value={target.price ?? ''}
                    onChange={(event) => {
                      const value = Math.max(Number(event.target.value), 0);
                      updateTarget(index, {
                        ...target,
                        price: value,
                      });
                    }}
                  />
                )}
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
