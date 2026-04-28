import { Fab, Tooltip, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import SaveIcon from '@src/components/icons/SaveIcon';
import UndoIcon from '@src/components/icons/UndoIcon';
import { useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { editPageFixedRight } from './editSurveyStyles';
import { useMemo } from 'react';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    gap: '1rem',
    position: 'fixed',
    bottom: '1rem',
    right: editPageFixedRight,
  },
});

export default function EditSurveyControls() {
  const classes = useStyles();
  const {
    hasActiveSurveyChanged,
    activeSurveyLoading,
    saveChanges,
    discardChanges,
    validationErrors,
  } = useSurvey();
  const { showToast } = useToasts();
  const { tr } = useTranslations();
  const theme = useTheme();

  const undoDisabled = !hasActiveSurveyChanged || activeSurveyLoading;
  const invalidFieldsLabel = `${tr.EditSurvey.invalidFields} ${validationErrors
    ?.filter((e) => e !== null)
    .map((e) => tr.EditSurvey.validationError[e])
    .join(', ')}`;

  function getErrorInfoText(info: string) {
    switch (info) {
      case 'duplicate_survey_name':
        return tr.EditSurvey.saveFailedDuplicateName;
      case 'submitted_answer_prevents_update':
        return tr.EditSurvey.saveFailedAnswerSubmitted;
      default:
        return tr.EditSurvey.saveFailed;
    }
  }

  const validationErrorTooltip = useMemo(() => {
    return (
      <>
        {tr.EditSurvey.invalidFields}
        <ul>
          {validationErrors?.map(
            (error) =>
              error && (
                <li key={error}>{tr.EditSurvey.validationError[error]}</li>
              ),
          )}
        </ul>
      </>
    );
  }, [validationErrors]);

  return (
    <div className={classes.root}>
      <Tooltip title={tr.commands.discard}>
        <span>
          <Fab
            disabled={undoDisabled}
            sx={{
              backgroundColor: theme.palette.surfacePrimary.main,
              border: !undoDisabled
                ? `solid 1px ${theme.palette.primary.main}`
                : undefined,
            }}
            aria-label={tr.commands.discard}
            onClick={() => {
              discardChanges();
            }}
          >
            <UndoIcon
              htmlColor={!undoDisabled ? theme.palette.primary.main : undefined}
            />
          </Fab>
        </span>
      </Tooltip>
      <Tooltip
        title={
          validationErrors?.length && validationErrors.length > 0
            ? validationErrorTooltip
            : tr.commands.save
        }
      >
        <span>
          <Fab
            disabled={
              !hasActiveSurveyChanged ||
              activeSurveyLoading ||
              Boolean(validationErrors?.length && validationErrors.length > 0)
            }
            color="primary"
            aria-label={
              validationErrors?.length && validationErrors.length > 0
                ? invalidFieldsLabel
                : tr.commands.save
            }
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
                  message: getErrorInfoText(error.info),
                });
              }
            }}
          >
            <SaveIcon />
          </Fab>
        </span>
      </Tooltip>
    </div>
  );
}
