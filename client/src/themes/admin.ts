import { fiFI } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';
import { CSSProperties } from 'react';
import { ubiTheme } from './common';
import { adminOverrides } from './overrides';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    published: CSSProperties;
  }

  interface TypographyVariantsOptions {
    published?: CSSProperties;
  }
}
export const theme = createTheme(
  ubiTheme,
  {
    // TODO: should be checked if this extra augmentation is really needed.
    palette: {
      disabled: ubiTheme.palette.augmentColor({
        color: { main: '#858585' },
        name: 'disabled',
      }),
    },
    typography: {
      fontSize: 14,
      htmlFontSize: 14,
    },
    components: adminOverrides,
  },
  fiFI,
);
