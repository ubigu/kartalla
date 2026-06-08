import { Language } from '@src/stores/TranslationContext';

export function getNumberFormatter(
  language: Language,
  options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  },
) {
  return new Intl.NumberFormat(
    language === 'fi' ? 'fi-FI' : language === 'sv' ? 'sv-SE' : 'en-US',
    options,
  );
}
