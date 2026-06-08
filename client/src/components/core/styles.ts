import { SxProps, Theme } from '@mui/material';
import { CSSProperties } from 'react';
import {
  getBackgroundColor,
  getBorderColor,
  getBoxShadow,
} from '@src/themes/colorHelpers';

export const controlBorderRadius = '4px';
export const dropdownBorderRadius = '8px';
export const pillBorderRadius = '9999px';

export const focusStyle = {
  outline: '2px solid',
  outlineColor: getBorderColor('focus'),
  backgroundColor: getBackgroundColor('focus'),
  boxShadow: getBoxShadow('focus'),
};

export const hoverStyle = {
  borderColor: getBorderColor('hover'),
  backgroundColor: getBackgroundColor('hover'),
};

export const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export const loadingPulse: SxProps<Theme> = {
  pointerEvents: 'none',
  animation: 'pulse 1s ease-in infinite',
  '@keyframes pulse': {
    '0%': { opacity: 0.4 },
    '50%': { opacity: 0.7 },
    '100%': { opacity: 0.4 },
  },
};

export const gradientBackground = (theme: Theme) => ({
  background: `linear-gradient(to bottom, ${theme.palette.surfacePrimary.main}, ${theme.palette.surfaceSubtle.main})`,
});
