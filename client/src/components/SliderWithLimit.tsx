import { Slider, SliderProps, useTheme } from '@mui/material';
import React from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  max: number;
  limit: number;
  sliderProps?: SliderProps;
  valueLabelFormat?: (value: number) => string;
}

export function SliderWithLimit({
  value,
  onChange,
  max,
  limit,
  sliderProps,
  valueLabelFormat,
}: Props) {
  const theme = useTheme();
  const limitPct = (limit * 100) / max;

  return (
    <Slider
      {...sliderProps}
      value={value}
      min={0}
      max={max}
      step={1}
      marks={[{ value: limit }]}
      onChange={(_, value) => {
        const clampedValue = Math.max(0, Math.min(value as number, limit));
        onChange(clampedValue);
      }}
      valueLabelDisplay="auto"
      valueLabelFormat={valueLabelFormat}
      sx={{
        '& .MuiSlider-rail': {
          opacity: 1,
          background: `linear-gradient(
          to right,
          ${theme.palette.primary.main} ${limitPct}%,
          ${theme.palette.action.disabledBackground} ${limitPct}%
        )`,
        },
        '& .MuiSlider-track': {
          color: theme.palette.primary.main,
        },
        '& .MuiSlider-mark': {
          width: 2,
          height: 14,
          borderRadius: 1,
          backgroundColor: theme.palette.text.secondary,
          top: '50%',
          transform: 'translateY(-50%)',
        },
        '& .MuiSlider-markLabel': { display: 'none' },
      }}
    />
  );
}
