import { Survey } from '@interfaces/survey';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { isLanguage, Language, useTranslations } from './TranslationContext';

type WorkingLanguageContextType = {
  workingLanguage: Language;
  setWorkingLanguage: (lang: Language) => void;
  resetWorkingLanguage: (survey: Survey) => void;
};

export const WorkingLanguageContext =
  createContext<WorkingLanguageContextType | null>(null);

export function useWorkingLanguage() {
  const ctx = useContext(WorkingLanguageContext);
  if (!ctx)
    throw new Error(
      'useWorkingLanguage must be used within a WorkingLanguageContext.Provider',
    );
  return ctx;
}

export function useWorkingLanguageInlineDescription() {
  const { workingLanguage } = useWorkingLanguage();
  const { tr } = useTranslations();
  return {
    visible: workingLanguage,
    screenReader: `${tr.SurveyLanguageMenu.workingLanguageInputLabel} ${tr.SurveyLanguageMenu.languageNames[workingLanguage]}`,
  };
}

function getStoredLanguage(surveyId: number): Language | null {
  const stored = localStorage.getItem(`surveyLanguage:${surveyId}`);
  if (stored && isLanguage(stored)) return stored;
  return null;
}

export function resolveWorkingLanguage(
  survey: Survey,
  uiLanguage: Language,
): Language {
  const enabled = Object.entries(survey.enabledLanguages)
    .filter(([, e]) => e)
    .map(([l]) => l as Language);
  const stored = getStoredLanguage(survey.id);
  if (stored && enabled.includes(stored)) return stored;
  if (enabled.includes(uiLanguage)) return uiLanguage;
  return enabled[0] ?? uiLanguage;
}

interface Props {
  survey: Survey;
  uiLanguage: Language;
  children: ReactNode;
}

export function WorkingLanguageProvider({
  survey,
  uiLanguage,
  children,
}: Props) {
  const [workingLanguage, setWorkingLanguageState] = useState<Language>(() =>
    resolveWorkingLanguage(survey, uiLanguage),
  );

  const setWorkingLanguage = useCallback(
    (lang: Language) => {
      setWorkingLanguageState(lang);
      localStorage.setItem(`surveyLanguage:${survey.id}`, lang);
    },
    [survey.id],
  );

  const resetWorkingLanguage = useCallback(
    (originalSurvey: Survey) => {
      setWorkingLanguageState(
        resolveWorkingLanguage(originalSurvey, uiLanguage),
      );
    },
    [uiLanguage],
  );

  useEffect(() => {
    setWorkingLanguageState(resolveWorkingLanguage(survey, uiLanguage));
  }, [survey.id]);

  return (
    <WorkingLanguageContext.Provider
      value={{ workingLanguage, setWorkingLanguage, resetWorkingLanguage }}
    >
      {children}
    </WorkingLanguageContext.Provider>
  );
}
