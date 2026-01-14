import { SubmissionInfo } from '@interfaces/survey';
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
import { useTranslations } from '@src/stores/TranslationContext';
import { useState } from 'react';

interface Props {
  open: boolean;
  onCancel: () => void;
  onSubmit: (info: SubmissionInfo) => void;
  emailRequired: boolean;
}

const useStyles = makeStyles({
  paragraph: {
    marginBottom: '1rem',
  },
});

export default function SubmissionInfoDialog({
  open,
  onCancel,
  onSubmit,
  emailRequired,
}: Props) {
  const { tr } = useTranslations();
  const classes = useStyles();
  const [email, setEmail] = useState<string>(null);
  const [emailDirty, setEmailDirty] = useState(false);
  const [emailValid, setEmailValid] = useState(!emailRequired);

  return (
    <Dialog
      open={open}
      onClose={() => {
        onCancel();
      }}
    >
      <DialogTitle>{tr.SubmissionInfoDialog.title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" className={classes.paragraph}>
          {emailRequired
            ? tr.SubmissionInfoDialog.textRequired
            : tr.SubmissionInfoDialog.text}
        </Typography>
        <TextField
          aria-label={
            emailRequired
              ? tr.SubmissionInfoDialog.emailRequired
              : tr.SubmissionInfoDialog.email
          }
          label={
            emailRequired
              ? tr.SubmissionInfoDialog.emailRequired
              : tr.SubmissionInfoDialog.email
          }
          error={(emailDirty && !email?.length) || !emailValid}
          value={email ?? ''}
          inputProps={{
            type: 'email',
            pattern: '[a-zA-Z0-9\\+._%\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
          }}
          style={{ width: '25rem', maxWidth: '100%' }}
          onChange={(event) => {
            setEmailValid(
              event.target.value.length > 0 && event.target.validity.valid,
            );
            setEmail(event.target.value.length > 0 ? event.target.value : null);
          }}
          onBlur={() => {
            setEmailDirty(true);
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{tr.commands.cancel}</Button>
        <Button
          disabled={!emailValid}
          variant="contained"
          onClick={() => {
            onSubmit({ email });
          }}
        >
          {tr.SurveyStepper.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
