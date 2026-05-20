import { LanguageCode, LocalizedSurveyMapLayer } from '@interfaces/survey';

/** Helper to transform se to sv */
function surveyLangToOskariLang(lang: LanguageCode): 'fi' | 'sv' | 'en' {
  switch (lang) {
    case 'fi':
      return 'fi';
    case 'se':
      return 'sv';
    case 'en':
      return 'en';
    default:
      throw new Error(`Unsupported language: ${lang}`);
  }
}

export function getLayerName(
  layer: LocalizedSurveyMapLayer,
  surveyLanguage: LanguageCode,
  fallBackText: string,
) {
  return typeof layer.name === 'string'
    ? layer.name
    : (layer.name[surveyLangToOskariLang(surveyLanguage)] ?? fallBackText);
}
