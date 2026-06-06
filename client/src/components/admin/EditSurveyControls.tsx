import { Box, Button, Tooltip } from '@mui/material';
import SaveIcon from '@src/components/icons/SaveIcon';
import { hasEnabledLanguages, useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import {
  getApiTranslation,
  useTranslations,
} from '@src/stores/TranslationContext';
import { useWorkingLanguage } from '@src/stores/WorkingLanguageContext';
import { useMemo } from 'react';
import ClearIcon from '../icons/ClearIcon';

const rootSx = {
  display: 'flex',
  flexDirection: 'row',
  gap: '1rem',
  justifyContent: 'space-between',
};

interface Props {
  disabled?: boolean;
}

export default function EditSurveyControls({ disabled }: Props) {
  const {
    originalActiveSurvey,
    activeSurvey,
    hasActiveSurveyChanged,
    activeSurveyLoading,
    saveChanges,
    discardChanges,
    validationErrors,
  } = useSurvey();
  const { resetWorkingLanguage } = useWorkingLanguage();
  const { showToast } = useToasts();
  const { tr } = useTranslations();

  const languagesNotSet = !hasEnabledLanguages(activeSurvey);
  const undoDisabled =
    disabled || !hasActiveSurveyChanged || activeSurveyLoading;
  const invalidFieldsLabel = [
    languagesNotSet ? tr.EditSurvey.languageSettingsNotConfirmed : null,
    ...(validationErrors
      ?.filter((e) => e !== null)
      .map((e) => tr.EditSurvey.validationError[e!]) ?? []),
  ]
    .filter(Boolean)
    .join(', ');

  const validationErrorTooltip = useMemo(() => {
    return (
      <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
        {languagesNotSet && (
          <li>{tr.EditSurvey.languageSettingsNotConfirmed}</li>
        )}
        {validationErrors?.map(
          (error) =>
            error && (
              <li key={error}>{tr.EditSurvey.validationError[error]}</li>
            ),
        )}
      </ul>
    );
  }, [languagesNotSet, validationErrors]);

  return (
    <Box sx={rootSx}>
      <Button
        variant="text"
        disabled={undoDisabled}
        startIcon={<ClearIcon />}
        onClick={() => {
          discardChanges();
          resetWorkingLanguage(originalActiveSurvey);
        }}
      >
        {tr.commands.cancel}
      </Button>
      <Tooltip
        title={
          languagesNotSet ||
          (validationErrors?.length && validationErrors.length > 0)
            ? validationErrorTooltip
            : tr.commands.save
        }
      >
        <span>
          <Button
            variant="contained"
            disabled={
              disabled ||
              !hasActiveSurveyChanged ||
              activeSurveyLoading ||
              Boolean(validationErrors?.length && validationErrors.length > 0)
            }
            color="primary"
            aria-label={
              languagesNotSet ||
              (validationErrors?.length && validationErrors.length > 0)
                ? invalidFieldsLabel
                : tr.commands.save
            }
            startIcon={<SaveIcon />}
            onClick={async () => {
              try {
                await saveChanges();
                showToast({
                  severity: 'success',
                  message: tr.EditSurvey.saveSuccessful,
                });
              } catch (error: any) {
                showToast({
                  severity: 'error',
                  message:
                    getApiTranslation(error.message_code, tr) ||
                    tr.EditSurvey.saveFailed,
                });
              }
            }}
          >
            {tr.commands.save}
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
}
