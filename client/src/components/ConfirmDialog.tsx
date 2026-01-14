import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';

type PaletteColor =
  | 'inherit'
  | 'error'
  | 'secondary'
  | 'primary'
  | 'info'
  | 'success'
  | 'warning';

interface Props {
  title?: string;
  text: string;
  open: boolean;
  onClose: (result: boolean) => void;
  submitColor?: PaletteColor;
}

export default function ConfirmDialog(props: Props) {
  const { tr } = useTranslations();

  function handleClose(result: boolean) {
    return function () {
      props.onClose(result);
    };
  }

  return (
    <Dialog
      open={props.open}
      onClose={handleClose(false)}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      {props.title && (
        <DialogTitle id="alert-dialog-title">{props.title}</DialogTitle>
      )}

      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {props.text}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus variant="outlined" onClick={handleClose(false)}>
          {tr.options.no}
        </Button>
        <Button
          variant="contained"
          color={props.submitColor}
          onClick={handleClose(true)}
        >
          {tr.options.yes}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
