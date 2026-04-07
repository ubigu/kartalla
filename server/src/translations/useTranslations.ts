import { LanguageCode } from '@interfaces/survey';
import en from './en.json';
import fi from './fi.json';
import se from './se.json';

export default function useTranslations(lang: LanguageCode) {
  if (lang === 'fi') return fi;
  if (lang === 'en') return en;
  if (lang === 'se') return se;

  return fi;
}
