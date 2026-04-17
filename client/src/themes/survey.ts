import { fiFI } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';
import { ubiTheme } from './common';
import { surveyOverrides } from './overrides';

/**
 * Default theme - used only when survey doesn't have a theme at all set in DB
 */
export let defaultSurveyTheme = createTheme(
  ubiTheme,
  { components: surveyOverrides },
  fiFI,
);

defaultSurveyTheme = createTheme(defaultSurveyTheme, {
  palette: {
    // TODO: should be checked if this extra augmentation is really needed.
    disabled: defaultSurveyTheme.palette.augmentColor({
      color: { main: '#858585' },
    }),
  },
});
