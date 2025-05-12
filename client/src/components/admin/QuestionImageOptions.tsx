import {
  LocalizedText,
  SectionImageOption,
  SectionOption,
} from '@interfaces/survey';
import {
  Box,
  Fab,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import DeleteBinIcon from '@src/components/icons/DeleteBinIcon';
import AddIcon from '@src/components/icons/AddIcon';

import { useTranslations } from '@src/stores/TranslationContext';
import React, { createRef, useEffect, useMemo } from 'react';
import OptionInfoDialog from './OptionInfoDialog';
import FileUpload from './FileUpload';
import { useSurvey } from '@src/stores/SurveyContext';
import { HelpCircleIcon } from '../icons/HelpCircleIcon';

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
  options: SectionImageOption[];
  disabled?: boolean;
  onChange: (options: SectionImageOption[]) => void;
  title: string;
  allowOptionInfo?: boolean;
}

export default function QuestionImageOptions({
  options,
  disabled,
  onChange,
  title,
  allowOptionInfo = false,
}: Props) {
  const { tr, surveyLanguage, initializeLocalizedObject } = useTranslations();
  const { activeSurvey } = useSurvey();
  const theme = useTheme();

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

  function updateOption(index: number, newValues: Partial<SectionImageOption>) {
    onChange(
      options.map((option, i) =>
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
              ...options,
              {
                text: initializeLocalizedObject(''),
                imageUrl: null,
                altText: initializeLocalizedObject(''),
                attributions: '',
              },
            ]);
          }}
        >
          <AddIcon />
        </Fab>
        <Typography style={{ paddingLeft: '1rem' }}>{title}</Typography>
      </Box>
      <Stack gap={'1rem'}>
        {options.map((option, index) => (
          <Box sx={{ ...styles.row, ...styles.option }} key={index}>
            <Box
              sx={styles.optionContainer}
              data-testid={`radio-image-input-option-${index}`}
            >
              <Box display="flex" alignItems="center" gap="1rem">
                <TextField
                  multiline
                  label={tr.QuestionImageOption.optionLabel}
                  inputRef={inputRefs[index]}
                  style={{ width: '100%' }}
                  variant="standard"
                  disabled={disabled}
                  size="small"
                  value={option.text?.[surveyLanguage] ?? ''}
                  onChange={(event) =>
                    updateOption(index, {
                      text: {
                        ...option.text,
                        [surveyLanguage]: event.target.value,
                      },
                    })
                  }
                  onKeyDown={(event) => {
                    if (['Enter', 'NumpadEnter'].includes(event.key)) {
                      event.preventDefault();
                      if (index === options.length - 1) {
                        // Last item on list - add new option
                        onChange([
                          ...options,
                          {
                            text: initializeLocalizedObject(''),
                            imageUrl: null,
                            altText: initializeLocalizedObject(''),
                            attributions: '',
                          },
                        ]);
                      } else {
                        // Focus on the next item
                        inputRefs[index + 1].current.focus();
                      }
                    }
                  }}
                />
                <Tooltip title={tr.QuestionImageOption.optionLabelHelp}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <HelpCircleIcon
                      sx={{
                        ':hover': {
                          background: 'lightGrey',
                          borderRadius: '50%',
                        },
                      }}
                      fontSize="small"
                      htmlColor={theme.palette.harmaa.main}
                    />
                  </span>
                </Tooltip>
              </Box>
              <FileUpload
                allowedFilesRegex={/^data:image\/(png|jpg|jpeg);base64/}
                disabled={disabled}
                surveyId={activeSurvey.id}
                targetPath={[String(activeSurvey.id)]}
                surveyOrganizationId={activeSurvey.organization.id}
                value={
                  !option.imageUrl
                    ? null
                    : [
                        {
                          url: option.imageUrl,
                        },
                      ]
                }
                onUpload={({ url }) => updateOption(index, { imageUrl: url })}
                onDelete={() => updateOption(index, { imageUrl: null })}
              />
              <TextField
                value={option.altText[surveyLanguage]}
                label={tr.EditImageSection.altText}
                onChange={(event) =>
                  updateOption(index, {
                    altText: {
                      ...option.altText,
                      [surveyLanguage]: event.target.value,
                    },
                  })
                }
              />
              <TextField
                value={option.attributions}
                label={tr.EditImageSection.attributions}
                onChange={(event) =>
                  updateOption(index, {
                    attributions: event.target.value,
                  })
                }
              />
            </Box>
            {allowOptionInfo && (
              <OptionInfoDialog
                infoText={option?.info?.[surveyLanguage]}
                onChangeOptionInfo={(newInfoText) =>
                  updateOption(index, {
                    info: {
                      ...option.info,
                      [surveyLanguage]: newInfoText,
                    },
                  })
                }
              />
            )}
            <Tooltip title={tr.SurveySections.removeOption}>
              <span style={{ alignSelf: 'start' }}>
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
      </Stack>
    </Box>
  );
}
