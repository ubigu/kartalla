import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSurveyAnswers } from '@src/stores/SurveyAnswerContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import React, { useState } from 'react';

interface Props {
  open: boolean;
  isTestSurvey: boolean;
  onCancel: () => void;
  onSave: (token: string) => void;
}

const useStyles = makeStyles({
  paragraph: {
    marginBottom: '1rem',
  },
});

export default function SaveAsUnfinishedDialog({
  open,
  isTestSurvey,
  onCancel,
  onSave,
}: Props) {
  const { tr, language } = useTranslations();
  const classes = useStyles();
  const [email, setEmail] = useState('');
  const [emailDirty, setEmailDirty] = useState(false);
  const [loading, setLoading] = useState(false);

  const { survey, answers, unfinishedToken, setUnfinishedToken } =
    useSurveyAnswers();
  const { showToast } = useToasts();

  async function handleSave() {
    if (isTestSurvey) {
      onSave(null);
      return;
    }
    setLoading(true);
    try {
      const { token } = await request<{ token: string }>(
        `/api/published-surveys/${survey.organization.name}/${
          survey.name
        }/unfinished-submission${
          unfinishedToken ? `?token=${unfinishedToken}` : ''
        }`,
        {
          method: 'POST',
          body: {
            email,
            entries: answers,
            language,
          },
        },
      );
      showToast({
        message: tr.SaveAsUnfinishedDialog.saveSuccessful,
        severity: 'success',
        autoHideDuration: 30000,
      });
      setUnfinishedToken(token);
      onSave(token);
    } catch (error) {
      showToast({
        message: tr.SaveAsUnfinishedDialog.errorSaving,
        severity: 'error',
      });
    }
    setLoading(false);
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        setEmailDirty(false);
        onCancel();
      }}
      aria-describedby="save-dialog-content"
    >
      <DialogTitle>{tr.SurveyStepper.saveAsUnfinished}</DialogTitle>
      <DialogContent>
        <div id="save-dialog-content">
          <Typography variant="body1" className={classes.paragraph}>
            {tr.SaveAsUnfinishedDialog.description}
          </Typography>
          <Typography variant="body1" className={classes.paragraph}>
            {tr.SaveAsUnfinishedDialog.disclaimer}
          </Typography>
        </div>
        <TextField
          autoFocus
          aria-label={tr.SaveAsUnfinishedDialog.email}
          label={tr.SaveAsUnfinishedDialog.email}
          required
          name="email"
          error={emailDirty && !email.length}
          value={email}
          inputProps={{ type: 'email' }}
          style={{ width: '25rem', maxWidth: '100%' }}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
          onBlur={() => {
            setEmailDirty(true);
          }}
          sx={{
            '& .MuiOutlinedInput-root.Mui-focused': {
              outlineOffset: '.5em', // Outline obstructs label otherwise
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setEmailDirty(false);
            onCancel();
          }}
          disabled={loading}
        >
          {tr.commands.cancel}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || !email.length}
        >
          {tr.options.ok}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
