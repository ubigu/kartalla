import { Components, CSSInterpolation, Theme } from '@mui/material/styles';
import React from 'react';
import AlertErrorIcon from '../components/icons/AlertErrorIcon';
import AlertInfoIcon from '../components/icons/AlertInfoIcon';
import AlertSuccessIcon from '../components/icons/AlertSuccessIcon';
import AlertWarningIcon from '../components/icons/AlertWarningIcon';
import { colors } from './colors';

const ubiElevated =
  '0px 2px 4px rgba(63, 111, 127, 0.09), 0px 10px 20px rgba(10, 104, 129, 0.15)';

const idleOutlineStyle: CSSInterpolation = {
  outlineOffset: 0,
  outlineColor: 'rgba(0,0,0,.0);',
  transition: 'outline-offset 400ms, outline-color 400ms',
};

const disabledColor = '#636363';
const focusBackground = '#40aeff2e';
const defaultFocusOutlineShorthand = '2px solid black';

const defaultFocusOutlineStyles: CSSInterpolation = {
  outline: defaultFocusOutlineShorthand,
  outlineOffset: '2px',
};

const defaultFocusStyles: CSSInterpolation = {
  backgroundColor: focusBackground,
  color: colors.harmaa,
  ...defaultFocusOutlineStyles,
};

const defaultFocus: CSSInterpolation = {
  ...idleOutlineStyle,
  '&.Mui-focusVisible': defaultFocusStyles,
};

const buttonOverrides: Components<Omit<Theme, 'components'>> = {
  MuiButtonBase: {
    styleOverrides: {
      root: {
        ...idleOutlineStyle,
        '&.Mui-focusVisible:not(.MuiButton-contained)': defaultFocusStyles,
        '&.Mui-focusVisible.MuiButton-contained': defaultFocusOutlineStyles,
        textTransform: 'none',
        '&.Mui-disabled': {
          color: disabledColor,
        },
      },
    },
    defaultProps: {
      disableRipple: true,
    },
  },
  MuiButton: {
    variants: [
      {
        props: { variant: 'contained', color: 'error' },
        style: {
          backgroundColor: colors.surfaceError,
          color: colors.surfacePrimary,
          '&:hover': { backgroundColor: colors.textError },
        },
      },
      {
        props: { variant: 'outlined', color: 'error' },
        style: {
          color: colors.textError,
          borderColor: colors.textError,
          '&:hover': { borderColor: colors.textError },
        },
      },
      {
        props: { variant: 'text', color: 'error' },
        style: { color: colors.textError },
      },
    ],
    styleOverrides: {
      contained: {
        backgroundColor: colors.textInteractive,
        color: colors.surfacePrimary,
        '&:hover': { backgroundColor: colors.havu },
      },
      outlined: {
        color: colors.textInteractive,
        borderColor: colors.textInteractive,
        '&:hover': { borderColor: colors.textInteractive },
      },
      text: {
        color: colors.textInteractive,
      },
      root: {
        boxShadow: 'none',
        textTransform: 'none',
        padding: '2px 8px',
        display: 'flex',
        gap: '6px',
        '& .MuiButton-icon': {
          margin: 0,
          '& svg': { fontSize: '12px' },
        },
        '&.Mui-disabled': {
          color: disabledColor,
        },
        '&:hover': {
          boxShadow: 'none',
        },
        '&.Mui-focusVisible': {
          boxShadow: 'none',
        },
        '&:active': {
          boxShadow: 'none',
        },
      },
    },
  },
  MuiFab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
      },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: {
        backgroundColor: colors.textInteractive,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        '&.Mui-selected': {
          color: colors.textInteractive,
        },
      },
    },
  },
};

const inputOverrides: Components<Omit<Theme, 'components'>> = {
  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        '&.Mui-focusVisible': {
          background: focusBackground,
          zIndex: 100,
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        ...idleOutlineStyle,
        '&.Mui-focused': {
          backgroundColor: focusBackground,
          ...defaultFocusOutlineStyles,
        },
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: { borderRadius: '2px', ...defaultFocus },
    },
  },
  MuiSlider: {
    styleOverrides: {
      thumb: {
        ...idleOutlineStyle,
        '&.Mui-focusVisible': {
          outlineOffset: '10px',
          outline: defaultFocusOutlineShorthand,
        },
      },
    },
  },
  MuiFormControlLabel: {
    styleOverrides: {
      label: {
        '&.Mui-disabled': {
          color: 'rgba(0, 0, 0, 0.54)',
        },
      },
    },
  },
};

const stepperOverrides: Components<Omit<Theme, 'components'>> = {
  MuiStepLabel: {
    styleOverrides: {
      root: {
        '& .Mui-disabled circle': {
          fill: '#e9e9e9',
        },
        '& .Mui-disabled text': {
          fill: colors.harmaa,
        },
      },
    },
  },
};

const surveyCardOverrides: Components<Omit<Theme, 'components'>> = {
  MuiCard: {
    styleOverrides: {
      root: {
        boxShadow: ubiElevated,
        border: `0.5px solid ${colors.borderPrimary};`,
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        color: colors.textlink,
      },
    },
  },
};

export const commonOverrides: Components<Omit<Theme, 'components'>> = {
  MuiCssBaseline: {
    styleOverrides: {
      color: colors.harmaa,
      body: { color: colors.harmaa },
      input: { color: colors.harmaa },
    },
  },
  MuiAccordion: { styleOverrides: { root: { color: colors.harmaa } } },
  MuiInputBase: { styleOverrides: { root: { color: colors.harmaa } } },
  MuiList: { styleOverrides: { root: { color: colors.harmaa } } },
  MuiTypography: {
    variants: [
      {
        props: { variant: 'mainHeader' },
        style: {
          fontWeight: 700,
          fontFamily: 'Comfortaa Variable',
          fontSize: '24px',
          lineHeight: '100%',
          letterSpacing: '0%',
          color: colors.primary,
        },
      },
      {
        props: { variant: 'secondaryHeader' },
        style: {
          fontWeight: 700,
          fontSize: '16px',
          lineHeight: '100%',
          letterSpacing: '0%',
          color: colors.textSecondary,
        },
      },
      {
        props: { variant: 'questionTitle' },
        style: {
          fontWeight: 700,
          fontSize: '1.2em',
          margin: '1em 0',
        },
      },
      {
        props: { variant: 'followUpSectionTitle' },
        style: {
          fontWeight: 700,
          fontSize: '1em',
          margin: '0.5em 0',
        },
      },
      {
        props: { variant: 'published' },
        style: {
          fontStyle: 'italic',
        },
      },
      { props: { color: 'havu' }, style: { color: colors.havu } },
      { props: { color: 'brandYellow' }, style: { color: colors.brandYellow } },
      { props: { color: 'harmaa' }, style: { color: colors.harmaa } },
      { props: { color: 'textlink' }, style: { color: colors.textlink } },
      {
        props: { color: 'textSecondary' },
        style: { color: colors.textSecondary },
      },
      { props: { color: 'textSubtle' }, style: { color: colors.textSubtle } },
      { props: { color: 'textWarning' }, style: { color: colors.textWarning } },
      { props: { color: 'textError' }, style: { color: colors.textError } },
      {
        props: { color: 'textInteractive' },
        style: { color: colors.textInteractive },
      },
    ],
    styleOverrides: {
      root: {
        color: colors.harmaa,
        textTransform: 'none',
      },
    },
  },
  MuiFormLabel: { styleOverrides: { root: { color: colors.harmaa } } },
  MuiTableCell: { styleOverrides: { root: { color: colors.harmaa } } },
  MuiAlert: {
    defaultProps: {
      iconMapping: {
        info: React.createElement(AlertInfoIcon, {
          fontSize: 'small',
          stroke: 'currentColor',
        }),
        success: React.createElement(AlertSuccessIcon, {
          fontSize: 'small',
          stroke: 'currentColor',
        }),
        warning: React.createElement(AlertWarningIcon, {
          fontSize: 'small',
          stroke: 'currentColor',
        }),
        error: React.createElement(AlertErrorIcon, {
          fontSize: 'small',
          stroke: 'currentColor',
        }),
      },
    },
    styleOverrides: {
      root: {
        alignItems: 'center',
        borderRadius: '6px',
      },
      action: {
        paddingTop: 0,
      },
      filledInfo: {
        backgroundColor: colors.textlink,
        color: colors.surfacePrimary,
        '& .MuiAlert-icon': { color: colors.surfacePrimary },
        '& .MuiAlert-action .MuiButtonBase-root': {
          color: colors.surfacePrimary,
        },
      },
      filledSuccess: {
        backgroundColor: colors.surfaceSuccess,
        color: colors.surfacePrimary,
        '& .MuiAlert-icon': { color: colors.surfacePrimary },
        '& .MuiAlert-action .MuiButtonBase-root': {
          color: colors.surfacePrimary,
        },
      },
      filledWarning: {
        backgroundColor: colors.surfaceWarning,
        color: colors.harmaa,
        '& .MuiAlert-icon': { color: colors.surfacePrimary },
        '& .MuiAlert-action .MuiButtonBase-root': { color: colors.harmaa },
      },
      filledError: {
        backgroundColor: colors.surfaceError,
        color: colors.surfacePrimary,
        '& .MuiAlert-icon': { color: colors.surfacePrimary },
        '& .MuiAlert-action .MuiButtonBase-root': {
          color: colors.surfacePrimary,
        },
      },
    },
  },
};

export const surveyOverrides: Components<Omit<Theme, 'components'>> = {
  ...buttonOverrides,
  ...inputOverrides,
  ...stepperOverrides,
};

export const adminOverrides: Components<Omit<Theme, 'components'>> = {
  ...surveyCardOverrides,
  ...buttonOverrides,
  MuiCssBaseline: {
    styleOverrides: {
      html: { fontSize: '14px' },
    },
  },
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
};
