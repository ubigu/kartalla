import {
  createMockRadioQuestion,
  createMockSurvey,
  createMockTextSection,
} from '@src/tests/data/survey';
import { describe, expect, it } from 'vitest';
import {
  clearSurveyLanguage,
  copySurveyLanguage,
  isLocalizedText,
  walkLocalizedTexts,
} from './surveyTranslations';

describe('isLocalizedText', () => {
  it('accepts objects keyed only by language codes with string values', () => {
    expect(isLocalizedText({ fi: 'a', en: 'b', se: 'c' })).toBe(true);
    expect(isLocalizedText({ fi: 'a' })).toBe(true);
  });

  it('rejects non-localized objects', () => {
    expect(isLocalizedText({ fi: 'a', xx: 'b' })).toBe(false);
    expect(isLocalizedText({ fi: true, en: false })).toBe(false);
    expect(isLocalizedText({})).toBe(false);
    expect(isLocalizedText(['fi', 'en'])).toBe(false);
    expect(isLocalizedText('fi')).toBe(false);
    expect(isLocalizedText(null)).toBe(false);
  });
});

describe('walkLocalizedTexts', () => {
  it('yields every localized node nested in objects and arrays', () => {
    const tree = {
      title: { fi: 'a', en: 'b', se: '' },
      meta: { id: 1, label: { fi: 'c', en: 'd', se: '' } },
      options: [{ text: { fi: 'e', en: 'f', se: '' } }],
    };
    const nodes = [...walkLocalizedTexts(tree)];
    expect(nodes).toEqual([
      { fi: 'a', en: 'b', se: '' },
      { fi: 'c', en: 'd', se: '' },
      { fi: 'e', en: 'f', se: '' },
    ]);
  });

  it('skips denylisted keys such as localizedMapUrls', () => {
    const tree = {
      title: { fi: 'a', en: 'b', se: '' },
      localizedMapUrls: { fi: 'url', en: 'url', se: 'url' },
    };
    expect([...walkLocalizedTexts(tree)]).toEqual([
      { fi: 'a', en: 'b', se: '' },
    ]);
  });
});

describe('clearSurveyLanguage', () => {
  it('empties only the given language in every localized node', () => {
    const obj = {
      title: { fi: 'otsikko', en: 'title', se: 'rubrik' },
      nested: { label: { fi: 'a', en: 'b', se: 'c' } },
      options: [{ text: { fi: 'x', en: 'y', se: 'z' } }],
    };
    clearSurveyLanguage(obj, 'en');
    expect(obj).toEqual({
      title: { fi: 'otsikko', en: '', se: 'rubrik' },
      nested: { label: { fi: 'a', en: '', se: 'c' } },
      options: [{ text: { fi: 'x', en: '', se: 'z' } }],
    });
  });

  it('adds the language as empty when the node lacks it', () => {
    const obj = { title: { fi: 'otsikko' } as Record<string, string> };
    clearSurveyLanguage(obj, 'en');
    expect(obj.title).toEqual({ fi: 'otsikko', en: '' });
  });

  it('leaves localizedMapUrls and non-localized values untouched', () => {
    const obj = {
      title: { fi: 'a', en: 'b', se: 'c' },
      localizedMapUrls: { fi: 'url', en: 'url', se: 'url' },
      enabledLanguages: { fi: true, en: true, se: false },
      author: 'Tester',
    };
    clearSurveyLanguage(obj, 'en');
    expect(obj.localizedMapUrls).toEqual({ fi: 'url', en: 'url', se: 'url' });
    expect(obj.enabledLanguages).toEqual({ fi: true, en: true, se: false });
    expect(obj.author).toBe('Tester');
  });

  it('mutates in place and returns the same reference', () => {
    const obj = { title: { fi: 'a', en: 'b', se: 'c' } };
    expect(clearSurveyLanguage(obj, 'en')).toBe(obj);
  });
});

describe('copySurveyLanguage', () => {
  it('moves the source onto the target by default, clearing the source', () => {
    const obj = {
      title: { fi: 'otsikko', en: 'old', se: '' },
      options: [{ text: { fi: 'vaihtoehto', en: 'old', se: '' } }],
    };
    copySurveyLanguage(obj, 'fi', 'en');
    expect(obj).toEqual({
      title: { fi: '', en: 'otsikko', se: '' },
      options: [{ text: { fi: '', en: 'vaihtoehto', se: '' } }],
    });
  });

  it('keeps the source intact when clearFrom is false', () => {
    const obj = {
      title: { fi: 'otsikko', en: 'old', se: '' },
      options: [{ text: { fi: 'vaihtoehto', en: 'old', se: '' } }],
    };
    copySurveyLanguage(obj, 'fi', 'en', false);
    expect(obj).toEqual({
      title: { fi: 'otsikko', en: 'otsikko', se: '' },
      options: [{ text: { fi: 'vaihtoehto', en: 'vaihtoehto', se: '' } }],
    });
  });

  it('clears the target when the source is empty or missing', () => {
    const obj = {
      empty: { fi: '', en: 'keep-me', se: '' },
      missing: { fi: 'x', en: 'keep-me' } as Record<string, string>,
    };
    copySurveyLanguage(obj, 'se', 'en', false);
    expect(obj.empty.en).toBe('');
    expect(obj.missing.en).toBe('');
  });

  it('leaves localizedMapUrls and non-localized values untouched', () => {
    const obj = {
      title: { fi: 'a', en: 'b', se: 'c' },
      localizedMapUrls: { fi: 'fi-url', en: 'en-url', se: 'se-url' },
      enabledLanguages: { fi: true, en: false, se: false },
    };
    copySurveyLanguage(obj, 'fi', 'en');
    expect(obj.localizedMapUrls).toEqual({
      fi: 'fi-url',
      en: 'en-url',
      se: 'se-url',
    });
    expect(obj.enabledLanguages).toEqual({ fi: true, en: false, se: false });
  });

  it('mutates in place and returns the same reference', () => {
    const obj = { title: { fi: 'a', en: 'b', se: 'c' } };
    expect(copySurveyLanguage(obj, 'fi', 'en')).toBe(obj);
  });
});

describe('on a realistic survey', () => {
  const buildSurvey = () => {
    const survey = createMockSurvey(1, 10);
    survey.pages[0].sections = [
      createMockTextSection(100),
      createMockRadioQuestion(101),
    ];
    return survey;
  };

  it('clears every Finnish translation including nested section options', () => {
    const survey = buildSurvey();
    clearSurveyLanguage(survey, 'fi');

    expect(survey.title.fi).toBe('');
    expect(survey.thanksPage.title.fi).toBe('');
    const radio = survey.pages[0].sections[1];
    if (radio.type !== 'radio') throw new Error('expected radio section');
    expect(radio.title.fi).toBe('');
    expect(radio.options[0].text.fi).toBe('');
    expect(radio.options[0].info?.fi).toBe('');
    // Other languages are preserved
    expect(radio.options[0].text.en).toBe('Option 1');
  });

  it('moves Finnish translations onto English across the survey', () => {
    const survey = buildSurvey();
    copySurveyLanguage(survey, 'fi', 'en');

    expect(survey.title.en).toBe('Testikysely');
    expect(survey.title.fi).toBe('');
    const radio = survey.pages[0].sections[1];
    if (radio.type !== 'radio') throw new Error('expected radio section');
    expect(radio.options[0].text.en).toBe('Vaihtoehto 1');
    expect(radio.options[0].text.fi).toBe('');
    expect(radio.options[1].text.en).toBe('Vaihtoehto 2');
    // Map urls remain untouched
    expect(survey.localizedMapUrls).toEqual({ fi: '', en: '', se: '' });
  });

  it('copies Finnish onto English without clearing Finnish when clearFrom is false', () => {
    const survey = buildSurvey();
    copySurveyLanguage(survey, 'fi', 'en', false);

    expect(survey.title.en).toBe('Testikysely');
    expect(survey.title.fi).toBe('Testikysely');
    const radio = survey.pages[0].sections[1];
    if (radio.type !== 'radio') throw new Error('expected radio section');
    expect(radio.options[0].text.en).toBe('Vaihtoehto 1');
    expect(radio.options[0].text.fi).toBe('Vaihtoehto 1');
  });
});
