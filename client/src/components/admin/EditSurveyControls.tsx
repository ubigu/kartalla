import { Box, Button, DialogContentText, Tooltip } from '@mui/material';
import SaveIcon from '@src/components/icons/SaveIcon';
import { useBlocker } from '@src/hooks/useBlocker';
import { hasEnabledLanguages, useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import {
  getApiTranslation,
  useTranslations,
} from '@src/stores/TranslationContext';
import { useWorkingLanguage } from '@src/stores/WorkingLanguageContext';
import { useMemo, useState } from 'react';
import { BaseDialog } from '../core/BaseDialog';
import ClearIcon from '../icons/ClearIcon';

const rootSx = {
  display: 'flex',
  flexDirection: 'row',
  gap: '1rem',
  justifyContent: 'space-between',
};

interface Props {
  disabled?: boolean;
  /** Route base path of the survey being edited; navigation within it is not "leaving". */
  basePath: string;
}

export default function EditSurveyControls({ disabled, basePath }: Props) {
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
  const hasInvalidFields = Boolean(
    languagesNotSet ||
    (validationErrors?.length && validationErrors.length > 0),
  );

  const [pendingNavigation, setPendingNavigation] = useState<{
    retry: () => void;
  } | null>(null);

  useBlocker(({ location, retry }) => {
    if (location.pathname.startsWith(basePath)) {
      retry();
      return;
    }
    setPendingNavigation({ retry });
  }, !undoDisabled);

  function closeUnsavedChangesDialog() {
    setPendingNavigation(null);
  }

  function discardAndContinue() {
    discardChanges();
    resetWorkingLanguage(originalActiveSurvey);
    pendingNavigation?.retry();
    closeUnsavedChangesDialog();
  }

  async function saveAndContinue() {
    try {
      await saveChanges();
      showToast({
        severity: 'success',
        message: tr.EditSurvey.saveSuccessful,
      });
      pendingNavigation?.retry();
    } catch (error: any) {
      showToast({
        severity: 'error',
        message:
          getApiTranslation(error.message_code, tr) || tr.EditSurvey.saveFailed,
      });
    } finally {
      closeUnsavedChangesDialog();
    }
  }
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
    <>
      <BaseDialog
        open={pendingNavigation !== null}
        onClose={closeUnsavedChangesDialog}
        content={
          <DialogContentText>
            {tr.EditSurvey.unsavedChangesConfirm}
          </DialogContentText>
        }
        actions={
          <Box display={'flex'} flex={1} sx={{ gap: '8px' }}>
            <Button
              startIcon={<ClearIcon />}
              variant="text"
              onClick={closeUnsavedChangesDialog}
            >
              {tr.commands.cancel}
            </Button>
            <Button
              sx={{ marginLeft: 'auto' }}
              variant="outlined"
              onClick={discardAndContinue}
            >
              {tr.options.no}
            </Button>
            <Button
              variant="outlined"
              disabled={hasInvalidFields}
              onClick={saveAndContinue}
            >
              {tr.options.yes}
            </Button>
          </Box>
        }
      />
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
    </>
  );
}
