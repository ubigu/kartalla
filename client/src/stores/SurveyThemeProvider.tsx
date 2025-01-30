import { Survey } from '@interfaces/survey';
import { createTheme, Theme } from '@mui/material';
import { fiFI } from '@mui/material/locale';
import { ThemeProvider } from '@mui/material/styles';

import {
  buttonOverrides,
  defaultSurveyTheme,
  inputOverrides,
  stepperOverrides,
} from '@src/themes/survey';
import React, { ReactNode, useContext, useMemo, useReducer } from 'react';

/**
 * Reducer state type
 */
type State = {
  theme: Theme;
};

/**
 * Reducer action type
 */
type Action = {
  type: 'SET_THEME';
  value: Theme;
};

/**
 * Type of stored context (state & reducer returned from useReducer)
 */
type Context = [State, React.Dispatch<Action>];

/**
 * Type of provider props
 */
interface Props {
  children: ReactNode;
}

/** Theme context initial values */
const stateDefaults: State = {
  theme: defaultSurveyTheme,
};

export const SurveyThemeContext = React.createContext<Context>(null);

/** Custom hook for accessing the theme context */
export function useSurveyTheme() {
  const context = useContext(SurveyThemeContext);
  if (!context) {
    throw new Error(
      'useSurveyTheme must be used within the SurveyThemeProvider',
    );
  }
  const [state, dispatch] = context;

  return {
    ...state,
    /**
     * Sets an application wide survey theme from given survey.
     * @param survey Survey
     */
    setThemeFromSurvey(survey: Survey) {
      const theme = survey.theme?.data
        ? createTheme(
            {
              ...survey.theme?.data,
              components: {
                ...buttonOverrides,
                ...inputOverrides,
                ...stepperOverrides,
              },
            },
            fiFI,
          )
        : defaultSurveyTheme;
      dispatch({ type: 'SET_THEME', value: theme });
    },
  };
}

/** Reducer function for dispatching actions and changing the state provided by the SurveyThemeContext */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_THEME':
      return {
        ...state,
        theme: action.value,
      };
    default:
      throw new Error('Invalid action type');
  }
}

export default function SurveyThemeProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, stateDefaults);
  /**
   * Use React.useMemo here to avoid unnecessary rerenders
   * @see https://reactjs.org/docs/hooks-reference.html#usememo
   */
  const value = useMemo<Context>(() => [state, dispatch], [state]);

  return (
    <SurveyThemeContext.Provider value={value}>
      <ThemeProvider theme={state.theme}>{children}</ThemeProvider>
    </SurveyThemeContext.Provider>
  );
}
