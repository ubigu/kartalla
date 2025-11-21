import { LocalizedText } from '@interfaces/survey';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import React from 'react';

interface Props {
  open: boolean;
  targetName?: LocalizedText;
  targetIcon?: string;
  onDeleteClick: () => void;
  onClose: () => void;
}

export default function GeoBudgetingFeatureDialog({
  open,
  targetName,
  targetIcon,
  onDeleteClick,
  onClose,
}: Props) {
  const { tr, surveyLanguage } = useTranslations();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {targetIcon && (
          <img
            src={`data:image/svg+xml;base64,${btoa(targetIcon)}`}
            alt=""
            style={{ height: '1.5rem', width: '1.5rem' }}
            aria-hidden="true"
          />
        )}
        <span>{targetName?.[surveyLanguage] ?? ''}</span>
      </DialogTitle>
      <DialogContent />
      <DialogActions>
        <Button onClick={onDeleteClick} color="error">
          {tr.MapQuestion.removeAnswer}
        </Button>
        <div style={{ flexGrow: 1 }} />
        <Button onClick={onClose} variant="contained">
          {tr.options.ok}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
