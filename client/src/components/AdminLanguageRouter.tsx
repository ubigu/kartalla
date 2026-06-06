import {
  detectBrowserLanguage,
  isLanguage,
  useTranslations,
} from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function AdminLanguageRouter(): null {
  const { language, setLanguageQuiet } = useTranslations();
  const { activeUser } = useUser();
  const query = useQuery();
  const lang = query.get('lang');

  useEffect(() => {
    if (!activeUser) return;
    const userDefaultLang = activeUser?.defaultLanguage;
    if (isLanguage(lang)) {
      if (lang !== language) setLanguageQuiet(lang);
    } else if (isLanguage(userDefaultLang)) {
      if (userDefaultLang !== language) setLanguageQuiet(userDefaultLang);
    } else {
      setLanguageQuiet(detectBrowserLanguage());
    }
  }, [lang, activeUser]);

  return null;
}
