import { LanguageCode, Survey } from '@interfaces/survey';
import { useSurveyAnswers } from '@src/stores/SurveyAnswerContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();

  return useMemo(() => new URLSearchParams(search), [search]);
}

export function resolveLanguageSettings({
  survey,
  queryLang: lang,
  languages,
  currentLanguage,
}: {
  survey: Pick<Survey, 'localisationEnabled' | 'primaryLanguage'>;
  queryLang: LanguageCode | null;
  languages: LanguageCode[];
  currentLanguage: LanguageCode;
}): { surveyLanguage: LanguageCode; uiLanguage: LanguageCode | null } {
  if (
    !survey.localisationEnabled ||
    !languages.includes(lang as LanguageCode)
  ) {
    return {
      surveyLanguage: survey.primaryLanguage,
      uiLanguage: survey.primaryLanguage,
    };
  }

  return {
    surveyLanguage: lang as LanguageCode,
    uiLanguage: lang !== currentLanguage ? (lang as LanguageCode) : null,
  };
}

export default function SurveyLanguageRouter(): null {
  const { language, setLanguage, languages, setSurveyLanguage } =
    useTranslations();
  const { survey } = useSurveyAnswers();

  const query = useQuery();
  const lang = query.get('lang') as LanguageCode;

  useEffect(() => {
    if (!survey) return;
    const { surveyLanguage, uiLanguage } = resolveLanguageSettings({
      survey,
      queryLang: lang,
      languages,
      currentLanguage: language,
    });
    setSurveyLanguage(surveyLanguage);
    if (uiLanguage) setLanguage(uiLanguage);
  }, [lang, survey, languages]);

  return null;
}
