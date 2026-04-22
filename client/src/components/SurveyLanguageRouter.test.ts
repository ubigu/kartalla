import { describe, expect, it } from 'vitest';
import { resolveLanguageSettings } from './SurveyLanguageRouter';

const baseSurvey = {
  localisationEnabled: true,
  primaryLanguage: 'fi' as const,
};

describe('resolveLanguageSettings', () => {
  it('falls back to primaryLanguage when localisation is disabled', () => {
    const result = resolveLanguageSettings({
      survey: { ...baseSurvey, localisationEnabled: false },
      queryLang: 'en',
      languages: ['fi', 'en'],
      currentLanguage: 'fi',
    });
    expect(result).toEqual({ surveyLanguage: 'fi', uiLanguage: 'fi' });
  });

  it('falls back to primaryLanguage when lang is not in available languages', () => {
    const result = resolveLanguageSettings({
      survey: baseSurvey,
      queryLang: 'se',
      languages: ['fi', 'en'],
      currentLanguage: 'fi',
    });
    expect(result).toEqual({ surveyLanguage: 'fi', uiLanguage: 'fi' });
  });

  it('falls back to primaryLanguage when lang is null', () => {
    const result = resolveLanguageSettings({
      survey: baseSurvey,
      queryLang: null,
      languages: ['fi', 'en'],
      currentLanguage: 'fi',
    });
    expect(result).toEqual({ surveyLanguage: 'fi', uiLanguage: 'fi' });
  });

  it('sets both surveyLanguage and uiLanguage when lang is valid and differs from current', () => {
    const result = resolveLanguageSettings({
      survey: baseSurvey,
      queryLang: 'en',
      languages: ['fi', 'en'],
      currentLanguage: 'fi',
    });
    expect(result).toEqual({ surveyLanguage: 'en', uiLanguage: 'en' });
  });

  it('sets surveyLanguage but not uiLanguage when lang matches current language', () => {
    const result = resolveLanguageSettings({
      survey: baseSurvey,
      queryLang: 'fi',
      languages: ['fi', 'en'],
      currentLanguage: 'fi',
    });
    expect(result).toEqual({ surveyLanguage: 'fi', uiLanguage: null });
  });
});
