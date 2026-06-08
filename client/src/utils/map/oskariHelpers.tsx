import { LanguageCode, LocalizedSurveyMapLayer } from '@interfaces/survey';

export function getLayerName(
  layer: LocalizedSurveyMapLayer,
  surveyLanguage: LanguageCode,
  fallBackText: string,
) {
  return typeof layer.name === 'string'
    ? layer.name
    : (layer.name[surveyLanguage] ?? fallBackText);
}
