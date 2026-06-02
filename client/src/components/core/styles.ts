import { SxProps, Theme } from '@mui/material';

export const controlBorderRadius = '4px';
export const dropdownBorderRadius = '8px';
export const pillBorderRadius = '9999px';

export const loadingPulse: SxProps<Theme> = {
  pointerEvents: 'none',
  animation: 'pulse 1s ease-in infinite',
  '@keyframes pulse': {
    '0%': { opacity: 0.4 },
    '50%': { opacity: 0.7 },
    '100%': { opacity: 0.4 },
  },
};
