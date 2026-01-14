import { FeatureStrokeStyle } from '@interfaces/survey';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';

interface Props {
  value: FeatureStrokeStyle;
  onChange: (value: FeatureStrokeStyle) => void;
}

export default function StrokeStyleSelect({ value, onChange }: Props) {
  const { tr } = useTranslations();

  return (
    <FormControl style={{ minWidth: '7rem' }}>
      <InputLabel id="marker-icon-select-label">
        {tr.StrokeStyleSelect.strokeStyle}
      </InputLabel>
      <Select
        id="id"
        labelId="marker-icon-select-label"
        label={tr.StrokeStyleSelect.strokeStyle}
        value={value || 'solid'}
        onChange={(event) => {
          onChange(
            event.target.value == null
              ? null
              : (event.target.value as FeatureStrokeStyle),
          );
        }}
      >
        <MenuItem value="solid">{tr.StrokeStyleSelect.solid}</MenuItem>
        <MenuItem value="dashed">{tr.StrokeStyleSelect.dashed}</MenuItem>
        <MenuItem value="dotted">{tr.StrokeStyleSelect.dotted}</MenuItem>
      </Select>
    </FormControl>
  );
}
