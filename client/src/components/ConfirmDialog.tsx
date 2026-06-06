import { Button, DialogContentText } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { BaseDialog } from './core/BaseDialog';

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

  return (
    <BaseDialog
      open={props.open}
      onClose={() => props.onClose(false)}
      title={props.title}
      content={<DialogContentText>{props.text}</DialogContentText>}
      actions={
        <>
          <Button
            autoFocus
            variant="outlined"
            onClick={() => props.onClose(false)}
          >
            {tr.options.no}
          </Button>
          <Button
            variant="contained"
            color={props.submitColor}
            onClick={() => props.onClose(true)}
          >
            {tr.options.yes}
          </Button>
        </>
      }
    />
  );
}
