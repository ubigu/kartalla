import { createTheme } from '@mui/material/styles';
import { colors } from './colors';
import { commonOverrides } from './overrides';

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    mainHeader: true;
    secondaryHeader: true;
    questionTitle: true;
    followUpSectionTitle: true;
    published: true;
  }
}

declare module '@mui/material/styles' {
  interface Palette {
    disabled: Palette['primary'];
    borderPrimary: Palette['primary'];
    borderSecondary: Palette['primary'];
    borderSubtle: Palette['primary'];
    brandYellow: Palette['primary'];
    havu: Palette['primary'];
    harmaa: Palette['primary'];
    surfaceError: Palette['primary'];
    surfaceInfo: Palette['primary'];
    surfaceInput: Palette['primary'];
    surfacePrimary: Palette['primary'];
    surfaceSubtle: Palette['primary'];
    surfaceSuccess: Palette['primary'];
    surfaceWarning: Palette['primary'];
    textError: Palette['primary'];
    textWarning: Palette['primary'];
    textlink: Palette['primary'];
    textSecondary: Palette['primary'];
    textSubtle: Palette['primary'];
  }

  interface PaletteOptions {
    disabled?: PaletteOptions['primary'];
    borderPrimary?: PaletteOptions['primary'];
    borderSecondary?: PaletteOptions['primary'];
    borderSubtle?: PaletteOptions['primary'];
    brandYellow?: PaletteOptions['primary'];
    havu?: PaletteOptions['primary'];
    harmaa?: PaletteOptions['primary'];
    surfaceError?: PaletteOptions['primary'];
    surfaceInfo?: PaletteOptions['primary'];
    surfaceInput?: PaletteOptions['primary'];
    surfacePrimary?: PaletteOptions['primary'];
    surfaceSubtle?: PaletteOptions['primary'];
    surfaceSuccess?: PaletteOptions['primary'];
    surfaceWarning?: PaletteOptions['primary'];
    textError?: PaletteOptions['primary'];
    textWarning?: PaletteOptions['primary'];
    textlink?: PaletteOptions['primary'];
    textSecondary?: PaletteOptions['primary'];
    textSubtle?: PaletteOptions['primary'];
  }
}

const baseTheme = createTheme({});

function augment(name: keyof typeof colors) {
  return baseTheme.palette.augmentColor({
    color: { main: colors[name] },
    name,
  });
}

/** Use this common theme as baseline for all themes */
export const ubiTheme = createTheme({
  palette: {
    primary: { main: colors.primary },
    brandYellow: augment('brandYellow'),
    havu: augment('havu'),
    harmaa: augment('harmaa'),
    borderPrimary: augment('borderPrimary'),
    borderSecondary: augment('borderSecondary'),
    borderSubtle: augment('borderSubtle'),
    textlink: augment('textlink'),
    textSecondary: augment('textSecondary'),
    textSubtle: augment('textSubtle'),
    surfacePrimary: augment('surfacePrimary'),
    surfaceSubtle: baseTheme.palette.augmentColor({
      color: { main: colors.surfaceSubtle, dark: colors.surfaceSubtleDark },
      name: 'surfaceSubtle',
    }),
    surfaceError: augment('surfaceError'),
    surfaceInfo: augment('surfaceInfo'),
    surfaceInput: augment('surfaceInput'),
    surfaceSuccess: augment('surfaceSuccess'),
    surfaceWarning: augment('surfaceWarning'),
    textError: augment('textError'),
    textWarning: augment('textWarning'),
  },
  typography: { fontFamily: 'Nunito' },
  components: commonOverrides,
});
