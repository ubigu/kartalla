import { TextField } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';

interface Props {
  value: string;
  onChange: (event: any) => void;
  variant?: 'standard' | 'filled' | 'outlined';
  color?: 'error' | 'primary' | 'secondary' | 'warning' | 'info' | 'success';
}

export default function TranslationField({
  value,
  onChange,
  variant,
  color,
}: Props) {
  const { tr } = useTranslations();

  return (
    <TextField
      color={color}
      variant={variant}
      value={value ?? ''}
      onChange={onChange}
      error={!value}
      placeholder={!value ? tr.EditSurveyTranslations.missingTranslation : ''}
      sx={{
        '& .MuiInputBase-input': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      }}
      style={{ paddingBottom: '0.5rem', width: '100%' }}
    />
  );
}
