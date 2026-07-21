import { LocalizedText } from '@interfaces/survey';
import {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import { useHistory } from 'react-router-dom';
import en from '../locales/en.json';
import fi from '../locales/fi.json';
import sv from '../locales/sv.json';

const translations = {
  fi,
  en,
  sv,
};

export type Language = keyof typeof translations;

const localeMap: Record<Language, string> = {
  fi: 'fi-FI',
  en: 'en-GB',
  sv: 'sv-SE',
};

type State = Language;

type Action = {
  type: 'SET_LANGUAGE';
  language: Language;
};

type Context = [Language, Dispatch<Action>];

interface Props {
  children: ReactNode;
}

export const supportedLanguages = Object.keys(translations) as Language[];

export function detectBrowserLanguage(): Language {
  for (const lang of navigator.languages ?? [navigator.language]) {
    const code = lang.split('-')[0];
    if (isLanguage(code)) return code;
  }
  return 'fi';
}

const stateDefaults: State = 'fi';

export function isLanguage(key: unknown): key is Language {
  return typeof key === 'string' && key in translations;
}

export const TranslationContext = createContext<Context | null>(null);

export function useTranslations() {
  const context = useContext(TranslationContext);
  const history = useHistory();

  if (!context) {
    throw new Error(
      'useTranslations must be used within the TranslationProvider',
    );
  }
  const [language, dispatch] = context;

  const setLanguage = useCallback(
    (language: Language) => {
      history.push(`?lang=${language}`);
      dispatch({ type: 'SET_LANGUAGE', language });
    },
    [history],
  );

  /** Sets language without pushing to browser history (used for init/validation). */
  const setLanguageQuiet = useCallback((language: Language) => {
    dispatch({ type: 'SET_LANGUAGE', language });
  }, []);

  const initializeLocalizedObject = useCallback(
    (initialValue: string | null): LocalizedText => {
      return supportedLanguages.reduce((prevValue, currentValue) => {
        return {
          ...prevValue,
          [currentValue]: initialValue,
        };
      }, {} as LocalizedText);
    },
    [],
  );

  return {
    setLanguage,
    setLanguageQuiet,
    language,
    tr: translations[language],
    initializeLocalizedObject,
    activeLanguageLocale: localeMap[language],
  };
}

type ApiTranslationKey = keyof typeof fi.ApiResponses;

function isApiTranslationKey(key: unknown): key is ApiTranslationKey {
  return typeof key === 'string' && key in fi.ApiResponses;
}

export function getApiTranslation(
  key: unknown,
  tr: (typeof translations)[Language],
  replaceX?: string,
): string {
  if (!isApiTranslationKey(key)) return typeof key === 'string' ? key : '';
  return replaceX != null
    ? tr.ApiResponses[key].replace('{x}', replaceX)
    : tr.ApiResponses[key];
}

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return action.language;
    default:
      throw new Error('Invalid action type');
  }
}

export default function TranslationProvider({ children }: Props) {
  const [language, dispatch] = useReducer(reducer, stateDefaults);
  const value = useMemo<Context>(() => [language, dispatch], [language]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}
