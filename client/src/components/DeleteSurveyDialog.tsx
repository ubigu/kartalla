import { Survey } from '@interfaces/survey';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { useState } from 'react';

interface Props {
  open: boolean;
  survey: Survey;
  onClose: (result: boolean) => void;
}

export default function DeleteSurveyDialog({ survey, onClose, open }: Props) {
  const [typedSurveyName, setTypedSurveyName] = useState<string>('');
  const { tr } = useTranslations();

  function handleClose(result: boolean) {
    return function () {
      onClose(result);
    };
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose(false)}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {tr.DeleteSurveyDialog.dialogTitle}{' '}
      </DialogTitle>
      <DialogContent>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <Typography> {tr.DeleteSurveyDialog.surveyName}: </Typography>
          <Typography style={{ paddingLeft: '0.5rem', color: 'purple' }}>
            {' '}
            {survey.name}
          </Typography>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <Typography> {tr.DeleteSurveyDialog.surveyAuthor}: </Typography>
          <Typography style={{ paddingLeft: '0.5rem', color: 'purple' }}>
            {' '}
            {survey.author}
          </Typography>
        </div>
        <br />
        <Typography
          id="alert-dialog-description"
          style={{ fontWeight: 'bold' }}
        >
          {' '}
          {tr.DeleteSurveyDialog.warningMessage}
        </Typography>
        <br />
        {survey.name && (
          <>
            <Typography>{tr.DeleteSurveyDialog.activateDeleting}: </Typography>
            <TextField
              style={{ minWidth: '50%' }}
              variant="standard"
              onChange={(event) => setTypedSurveyName(event.target.value)}
              placeholder={tr.DeleteSurveyDialog.surveyToBeDeleted}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setTypedSurveyName('');
            onClose(false);
          }}
          autoFocus
        >
          {tr.commands.cancel}
        </Button>
        <Button
          disabled={survey.name ? typedSurveyName !== survey.name : false}
          onClick={() => {
            setTypedSurveyName('');
            onClose(true);
          }}
        >
          {tr.commands.remove}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
