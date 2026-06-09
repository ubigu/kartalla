import { LanguageCode } from '@interfaces/survey';
import en from './en.json';
import fi from './fi.json';
import sv from './sv.json';

export const LANGUAGE_CODES: LanguageCode[] = ['fi', 'en', 'sv'];

export function isLanguageCode(value: unknown): value is LanguageCode {
  return LANGUAGE_CODES.includes(value as LanguageCode);
}

export default function useTranslations(lang: LanguageCode) {
  if (lang === 'fi') return fi;
  if (lang === 'en') return en;
  if (lang === 'sv') return sv;

  return fi;
}
