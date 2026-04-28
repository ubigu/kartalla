import { Box } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { useMemo } from 'react';
import { Select } from '../core/Select';
import ColorIndicator from './ColorIndicator';

interface Props {
  label?: string;
  value: string | null;
  onChange: (color: string) => void;
}

export default function ColorSelect({ label, value, onChange }: Props) {
  const { tr } = useTranslations();

  const colors = useMemo<{ name: string; value: string }[]>(
    () => [
      { name: tr.ColorSelect.colors.teal, value: '#00a393' },
      { name: tr.ColorSelect.colors.sea, value: '#17607f' },
      { name: tr.ColorSelect.colors.sprig, value: '#1a776d' },
      { name: tr.ColorSelect.colors.grey, value: '#515b68' },
      { name: tr.ColorSelect.colors.night, value: '#001e39' },
      { name: tr.ColorSelect.colors.blue, value: '#0065BD' },
      { name: tr.ColorSelect.colors.earthRed, value: '#C84436' },
      { name: tr.ColorSelect.colors.tar, value: '#312322' },
    ],
    [tr],
  );

  const options = colors.map((color) => ({
    value: color.value,
    label: color.name,
  }));

  return (
    <Select<string>
      id="color"
      label={label ?? tr.ColorSelect.color}
      value={value ?? ''}
      onChange={onChange}
      renderLabel={(opt) => (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'space-between',
          }}
        >
          {opt.label}
          <ColorIndicator color={opt.value} />
        </Box>
      )}
      renderDisplayLabel={(opt) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'space-between',
          }}
        >
          {opt?.label}
          <ColorIndicator color={opt?.value} />
        </Box>
      )}
      options={options}
    />
  );
}
