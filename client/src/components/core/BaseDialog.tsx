import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  SxProps,
  Theme,
  useTheme,
} from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { ReactNode } from 'react';
import ClearIcon from '../icons/ClearIcon';
import { VisualSeparator } from './VisualSeparator';

const dialogPadding = '12px';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  content: ReactNode;
  actions: ReactNode;
  sx?: SxProps<Theme>;
}

export function BaseDialog({
  open,
  onClose,
  title,
  content,
  actions,
  sx,
}: Props) {
  const { tr } = useTranslations();
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={title ? 'base-dialog-title' : undefined}
      aria-describedby="base-dialog-description"
      PaperProps={{ sx }}
    >
      {title && (
        <DialogTitle
          sx={{
            padding: dialogPadding,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'primary.main',
            fontSize: '20px',
            borderBottom: `0.5px solid ${theme.palette.surfaceSubtle.dark}`,
          }}
          id="base-dialog-title"
        >
          {title}
          <IconButton aria-label={tr.commands.close} onClick={onClose}>
            <ClearIcon htmlColor={theme.palette.primary.main} />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent sx={{ '&&': { padding: dialogPadding } }}>
        <div id="base-dialog-description">{content}</div>
      </DialogContent>
      <VisualSeparator height="4px" />
      <DialogActions
        sx={{
          padding: dialogPadding,
        }}
      >
        {actions}
      </DialogActions>
    </Dialog>
  );
}
