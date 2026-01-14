import { Help as HelpIcon } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import useId from '@mui/material/utils/useId';
import { useTranslations } from '@src/stores/TranslationContext';
import {
  CSSProperties,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import { MarkdownView } from './MarkdownView';

interface Props {
  subject: string;
  infoText: string;
  style?: CSSProperties;
  hiddenFromScreenReader?: boolean;
}

export default forwardRef(function SectionInfo(
  { subject, infoText, style, hiddenFromScreenReader = false }: Props,
  ref,
) {
  const { tr } = useTranslations();
  const dialogId = useId();

  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  useImperativeHandle(ref, () => {
    return { infoDialogOpen };
  });

  return (
    <div style={style ?? {}} aria-hidden={hiddenFromScreenReader}>
      <Tooltip title={tr.SurveyQuestion.showInfo}>
        <IconButton
          aria-label={`${tr.SurveyQuestion.showInfo}: ${subject}`}
          onClick={() => setInfoDialogOpen(true)}
        >
          <HelpIcon color="primary" fontSize="medium" />
        </IconButton>
      </Tooltip>
      <Dialog
        aria-describedby={`${dialogId}-dialog-content`}
        onClose={() => setInfoDialogOpen(false)}
        open={infoDialogOpen}
      >
        <DialogContent id={`${dialogId}-dialog-content`}>
          <MarkdownView>{infoText}</MarkdownView>
        </DialogContent>
        <DialogActions>
          <Button
            className="close-section-info-button"
            autoFocus
            color="primary"
            variant="contained"
            onClick={() => setInfoDialogOpen(false)}
          >
            {tr.commands.close}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});
