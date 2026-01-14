import { LanguageCode } from '@interfaces/survey';
import { useTranslations } from '@src/stores/TranslationContext';
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();

  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function LanguageRouter(): null {
  const { language, setLanguage, languages } = useTranslations();

  const query = useQuery();
  const lang = query.get('lang') as LanguageCode;

  useEffect(() => {
    if (!languages.includes(lang) || lang === language) return;

    setLanguage(lang);
  }, [lang]);

  return null;
}
