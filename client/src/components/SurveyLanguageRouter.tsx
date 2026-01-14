import { LanguageCode } from '@interfaces/survey';
import { useSurveyAnswers } from '@src/stores/SurveyAnswerContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();

  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SurveyLanguageRouter(): null {
  const { language, setLanguage, languages, setSurveyLanguage } =
    useTranslations();
  const { survey } = useSurveyAnswers();

  const query = useQuery();
  const lang = query.get('lang') as LanguageCode;

  useEffect(() => {
    if (!survey) return;
    if (survey?.localisationEnabled && lang) setSurveyLanguage(lang);
    if (survey?.localisationEnabled && !languages.includes(lang)) {
      setSurveyLanguage(languages[0] as LanguageCode);
      setLanguage(languages[0] as LanguageCode);
    }

    if (!languages.includes(lang) || lang === language) return;

    setLanguage(lang);
  }, [lang, survey, languages]);

  return null;
}
