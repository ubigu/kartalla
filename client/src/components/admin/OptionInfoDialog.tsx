import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import QuestionmarkSmallIcon from '@src/components/icons/QuestionmarkSmallIcon';
import { useTranslations } from '@src/stores/TranslationContext';
import { useState } from 'react';
import RichTextEditor from '../RichTextEditor';

interface Props {
  infoText: string;
  onChangeOptionInfo: (newInfoText: string) => void;
}

export default function OptionInfoDialog({
  infoText,
  onChangeOptionInfo,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const { tr } = useTranslations();
  return (
    <div>
      <Tooltip title={tr.SurveySections.optionInfo}>
        <IconButton
          aria-label="option-info"
          size="small"
          onClick={() => setDialogOpen((prev) => !prev)}
          color={infoText ? 'secondary' : 'default'}
        >
          <QuestionmarkSmallIcon />
        </IconButton>
      </Tooltip>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="option-info-dialog"
      >
        <DialogTitle id="option-info-dialog">
          {tr.SurveySections.optionInfo}
        </DialogTitle>
        <DialogContent>
          <RichTextEditor
            value={infoText}
            onChange={(value) => onChangeOptionInfo(value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {tr.commands.close}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
