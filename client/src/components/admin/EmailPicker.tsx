import { Box, Button } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { useId, useRef, useState } from 'react';
import { Combobox_WIP } from '../core/Combobox';
import { CoreInput } from '../core/Input';
import { InputHelperText } from '../core/InputHelperText';

interface Props {
  label: string;
  value: string[];
  options: string[];
  onChange: (emails: string[]) => void;
  disabled?: boolean;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function EmailPicker({
  label,
  value,
  options,
  onChange,
  disabled,
}: Props) {
  const [newEmail, setNewEmail] = useState('');
  const { tr } = useTranslations();
  const helperId = useId();
  const inputContainerRef = useRef<HTMLDivElement | null>(null);

  const handleAddEmail = () => {
    const trimmedEmail = newEmail.trim();
    if (
      trimmedEmail &&
      isValidEmail(trimmedEmail) &&
      !options.includes(trimmedEmail)
    ) {
      onChange([...value, trimmedEmail]);
      setNewEmail('');
    }
  };

  const handleEmailChange = (newValue: string[]) => {
    onChange(newValue);
  };
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '36px',
      }}
    >
      <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
        <Box sx={{ flex: 1 }} ref={inputContainerRef}>
          <Combobox_WIP
            label={label}
            multiselect
            value={value}
            options={options.map((email) => ({ value: email, label: email }))}
            onMultiChange={handleEmailChange}
            disabled={disabled}
            aria-describedby={helperId}
          />
          <InputHelperText
            id={helperId}
            sx={{
              position: 'absolute',
              width: inputContainerRef.current?.scrollWidth,
            }}
          >
            {tr.EditSurveyEmail.autoSendToHelperText}
          </InputHelperText>
        </Box>
        <Box sx={{ display: 'flex', gap: '8px' }}>
          <CoreInput
            placeholder={tr.EmailPicker.addEmail}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={disabled}
            type="email"
          />
          <Button
            variant="contained"
            onClick={handleAddEmail}
            disabled={
              disabled ||
              !newEmail.trim() ||
              !isValidEmail(newEmail.trim()) ||
              options.includes(newEmail.trim())
            }
            sx={{ height: '28px' }}
          >
            {tr.TagPicker.add ?? 'Add'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
