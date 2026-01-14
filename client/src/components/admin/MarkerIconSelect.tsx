import { MapMarkerIcon } from '@interfaces/survey';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import { useEffect, useState } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkerIconSelect({ value, onChange }: Props) {
  const [icons, setIcons] = useState<MapMarkerIcon[]>();
  const [loading, setLoading] = useState(true);

  const { tr } = useTranslations();
  const { showToast } = useToasts();

  useEffect(() => {
    async function loadIcons() {
      setLoading(true);
      try {
        const icons = await request<MapMarkerIcon[]>(
          '/api/feature-styles/marker-icons',
        );
        setIcons(icons);
      } catch (error) {
        setIcons([]);
        showToast({
          message: tr.MarkerIconSelect.errorFetchingIcons,
          severity: 'error',
        });
      }
      setLoading(false);
    }
    loadIcons();
  }, []);

  return (
    <FormControl style={{ minWidth: '7rem' }}>
      <InputLabel id="marker-icon-select-label">
        {tr.MarkerIconSelect.icon}
      </InputLabel>
      <Select
        id="id"
        labelId="marker-icon-select-label"
        label={tr.MarkerIconSelect.icon}
        disabled={loading}
        value={loading || value == null ? '' : value}
        onChange={(event) => {
          onChange(event.target.value == null ? null : event.target.value);
        }}
      >
        <MenuItem value="">
          <em>{tr.MarkerIconSelect.selectIcon}</em>
        </MenuItem>
        {icons?.map((icon) => (
          <MenuItem key={icon.id} value={icon.svg}>
            <img
              style={{ height: '1.5rem' }}
              src={`data:image/svg+xml;utf8,${encodeURIComponent(icon.svg)}`}
              alt={icon.name}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
