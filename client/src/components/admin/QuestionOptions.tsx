import { LocalizedText, SectionOption } from '@interfaces/survey';
import { Fab, IconButton, TextField, Tooltip, Typography } from '@mui/material';

import AddIcon from '@src/components/icons/AddIcon';
import DeleteBinIcon from '@src/components/icons/DeleteBinIcon';

import { makeStyles } from '@mui/styles';
import { useTranslations } from '@src/stores/TranslationContext';
import { createRef, useEffect, useMemo } from 'react';
import OptionInfoDialog from './OptionInfoDialog';

const useStyles = makeStyles({
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
    flexGrow: 1,
  },
});

interface Props {
  options: SectionOption[];
  disabled?: boolean;
  onChange: (options: SectionOption[]) => void;
  title: string;
  enableClipboardImport?: boolean;
  allowOptionInfo?: boolean;
}

export default function QuestionOptions({
  options,
  disabled,
  onChange,
  title,
  enableClipboardImport = false,
  allowOptionInfo = false,
}: Props) {
  const classes = useStyles();
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

  function handleClipboardInput(
    optionValue: string,
    optionIndex: number,
    optionToChange: SectionOption,
  ) {
    const clipboardRows = optionValue.split(/(?!\B"[^"]*)\n(?![^"]*"\B)/);
    const optionFields = clipboardRows
      .map((row, index): { text: LocalizedText; info?: LocalizedText } => {
        const optionFields = row.split('\t');
        let optionInfo = optionFields?.[1] ?? '';
        if (optionInfo.charAt(0) === '"') {
          optionInfo = optionInfo.slice(1, optionInfo.length);
        }
        if (optionInfo.charAt(optionInfo.length - 1) === '"') {
          optionInfo = optionInfo.slice(0, optionInfo.length - 1);
        }
        if (
          ![1, 2].includes(optionFields.length) ||
          (clipboardRows.length > 1 && optionFields[0] === '')
        )
          return null;
        return {
          text: {
            ...(index === 0
              ? optionToChange.text
              : initializeLocalizedObject(null)),
            [surveyLanguage]: optionFields[0],
          },
          ...(allowOptionInfo
            ? {
                info: {
                  ...initializeLocalizedObject(null),
                  [surveyLanguage]: optionInfo,
                },
              }
            : {}),
        };
      })
      .filter((option) => option);

    if (!optionFields || !optionFields.length) return;
    // First add option for the empty option field where focus is currently
    const updatedOptions = options.map((option, i) =>
      optionIndex === i ? optionFields[0] : option,
    );
    // Add other fields
    const newOptions = optionFields.slice(1, optionFields.length);
    onChange([...updatedOptions, ...newOptions]);
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.row}>
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
      </div>
      <div>
        {options.map((option, index) => (
          <div className={`${classes.row} ${classes.option}`} key={index}>
            <div className={classes.textInput}>
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
                  // Only allow copying from clipboard if
                  // 1) feature is enabled
                  // 2) the copied fields' format is correct
                  // 3) clipboard is pasted on the last option field
                  if (enableClipboardImport && index + 1 === options.length) {
                    handleClipboardInput(event.target.value, index, option);
                  } else {
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
                  }
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
            </div>
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
          </div>
        ))}
      </div>
    </div>
  );
}
