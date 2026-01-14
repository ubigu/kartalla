import { fiFI } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';
import { CSSProperties } from 'react';
import { surveyCardOverrides, ubiElevated, ubiTheme } from './common';
import { buttonOverrides } from './survey';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    published: CSSProperties;
  }

  interface TypographyVariantsOptions {
    published?: CSSProperties;
  }
}
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    published: true;
  }
}

export const theme = createTheme(
  ubiTheme,
  {
    palette: {
      disabled: ubiTheme.palette.augmentColor({
        color: {
          main: '#858585',
        },
        name: 'disabled',
      }),
    },
    components: {
      ...surveyCardOverrides,
      ...buttonOverrides,
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: ubiElevated,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            '&.Mui-disabled': {
              opacity: 0.8,
            },
          },
        },
      },
    },
  },
  fiFI,
);
