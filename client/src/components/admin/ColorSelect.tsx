import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTranslations } from '@src/stores/TranslationContext';
import { useMemo } from 'react';
import ColorIndicator from './ColorIndicator';

interface Props {
  label?: string;
  value: string;
  onChange: (color: string) => void;
}

const useStyles = makeStyles({
  select: {
    minWidth: '10rem',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default function ColorSelect({ label, value, onChange }: Props) {
  const { tr } = useTranslations();
  const classes = useStyles();

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

  return (
    <FormControl>
      <InputLabel id="color-select-label">
        {label ?? tr.ColorSelect.color}
      </InputLabel>
      <Select
        labelId="color-select-label"
        id="color"
        label={label ?? tr.ColorSelect.color}
        className={classes.select}
        classes={{
          select: classes.select,
        }}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {colors.map((color) => (
          <MenuItem key={color.value} value={color.value}>
            {color.name}
            <div style={{ flexGrow: 1 }} />
            <ColorIndicator color={color.value} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
