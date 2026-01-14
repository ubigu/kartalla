import { MapStrokeColor } from '@interfaces/survey';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import { useEffect, useState } from 'react';
import ColorIndicator from './ColorIndicator';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const useStyles = makeStyles({
  select: {
    minWidth: '10rem',
    width: 'fit-content',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default function StrokeColorSelect({ value, onChange }: Props) {
  const [colors, setColors] = useState<MapStrokeColor[]>();
  const [loading, setLoading] = useState(true);

  const { tr } = useTranslations();
  const classes = useStyles();
  const { showToast } = useToasts();

  useEffect(() => {
    async function loadColors() {
      setLoading(true);
      try {
        const colors = await request<MapStrokeColor[]>(
          '/api/feature-styles/stroke-colors',
        );
        setColors(colors);
      } catch (error) {
        setColors([]);
        showToast({
          message: tr.StrokeColorSelect.errorFetchingColors,
          severity: 'error',
        });
      }
      setLoading(false);
    }
    loadColors();
  }, []);

  return (
    <FormControl style={{ minWidth: '10rem' }}>
      <InputLabel id="stroke-color-select-label">
        {tr.StrokeColorSelect.strokeColor}
      </InputLabel>
      <Select
        id="id"
        labelId="stroke-color-select-label"
        label={tr.StrokeColorSelect.strokeColor}
        disabled={loading}
        value={loading || value == null ? '' : value}
        onChange={(event) => {
          onChange(event.target.value == null ? null : event.target.value);
        }}
        classes={{
          select: classes.select,
        }}
      >
        <MenuItem value="">
          <em>{tr.StrokeColorSelect.selectStrokeColor}</em>
        </MenuItem>
        {colors?.map((color) => (
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
