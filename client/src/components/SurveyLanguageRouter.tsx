import { useSurveyAnswers } from '@src/stores/SurveyAnswerContext';
import {
  detectBrowserLanguage,
  isLanguage,
  Language,
  useTranslations,
} from '@src/stores/TranslationContext';
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SurveyLanguageRouter(): null {
  const { language, setLanguageQuiet } = useTranslations();
  const { survey } = useSurveyAnswers();
  const query = useQuery();
  const lang = query.get('lang');

  useEffect(() => {
    if (!survey) {
      setLanguageQuiet(isLanguage(lang) ? lang : detectBrowserLanguage());
      return;
    }
    const enabled = Object.entries(survey.enabledLanguages)
      .filter(([, e]) => e)
      .map(([l]) => l as Language);
    const browserLang = detectBrowserLanguage();
    let target: Language | undefined;
    if (
      survey.localisationEnabled &&
      isLanguage(lang) &&
      enabled.includes(lang)
    ) {
      target = lang;
    } else if (enabled.includes(browserLang)) {
      target = browserLang;
    } else {
      target = enabled[0];
    }

    if (target && target !== language) setLanguageQuiet(target);
  }, [lang, survey]);

  return null;
}
