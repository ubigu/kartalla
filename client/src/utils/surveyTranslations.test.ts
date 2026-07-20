import { Theme } from '@mui/material';
import {
  createMockRadioQuestion,
  createMockSurvey,
  createMockTextSection,
} from '@src/tests/data/survey';
import { describe, expect, it } from 'vitest';
import {
  clearSurveyLanguage,
  copySurveyLanguage,
  getFrontPageTabColor,
  getLangBadgeStatus,
  getPageTabColor,
  getTabColor,
  getThanksPageTabColor,
  isLocalizedText,
  walkLocalizedTexts,
} from './surveyTranslations';

const theme = {
  palette: {
    textError: { main: 'red' },
    textWarning: { main: 'yellow' },
  },
} as Theme;

describe('isLocalizedText', () => {
  it('accepts objects keyed only by language codes with string values', () => {
    expect(isLocalizedText({ fi: 'a', en: 'b', sv: 'c' })).toBe(true);
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
      title: { fi: 'a', en: 'b', sv: '' },
      meta: { id: 1, label: { fi: 'c', en: 'd', sv: '' } },
      options: [{ text: { fi: 'e', en: 'f', sv: '' } }],
    };
    const nodes = [...walkLocalizedTexts(tree)];
    expect(nodes).toEqual([
      { fi: 'a', en: 'b', sv: '' },
      { fi: 'c', en: 'd', sv: '' },
      { fi: 'e', en: 'f', sv: '' },
    ]);
  });

  it('skips denylisted keys such as localizedMapUrls', () => {
    const tree = {
      title: { fi: 'a', en: 'b', sv: '' },
      localizedMapUrls: { fi: 'url', en: 'url', sv: 'url' },
    };
    expect([...walkLocalizedTexts(tree)]).toEqual([
      { fi: 'a', en: 'b', sv: '' },
    ]);
  });
});

describe('clearSurveyLanguage', () => {
  it('empties only the given language in every localized node', () => {
    const obj = {
      title: { fi: 'otsikko', en: 'title', sv: 'rubrik' },
      nested: { label: { fi: 'a', en: 'b', sv: 'c' } },
      options: [{ text: { fi: 'x', en: 'y', sv: 'z' } }],
    };
    clearSurveyLanguage(obj, 'en');
    expect(obj).toEqual({
      title: { fi: 'otsikko', en: '', sv: 'rubrik' },
      nested: { label: { fi: 'a', en: '', sv: 'c' } },
      options: [{ text: { fi: 'x', en: '', sv: 'z' } }],
    });
  });

  it('adds the language as empty when the node lacks it', () => {
    const obj = { title: { fi: 'otsikko' } as Record<string, string> };
    clearSurveyLanguage(obj, 'en');
    expect(obj.title).toEqual({ fi: 'otsikko', en: '' });
  });

  it('leaves localizedMapUrls and non-localized values untouched', () => {
    const obj = {
      title: { fi: 'a', en: 'b', sv: 'c' },
      localizedMapUrls: { fi: 'url', en: 'url', sv: 'url' },
      enabledLanguages: { fi: true, en: true, sv: false },
      author: 'Tester',
    };
    clearSurveyLanguage(obj, 'en');
    expect(obj.localizedMapUrls).toEqual({ fi: 'url', en: 'url', sv: 'url' });
    expect(obj.enabledLanguages).toEqual({ fi: true, en: true, sv: false });
    expect(obj.author).toBe('Tester');
  });

  it('mutates in place and returns the same reference', () => {
    const obj = { title: { fi: 'a', en: 'b', sv: 'c' } };
    expect(clearSurveyLanguage(obj, 'en')).toBe(obj);
  });
});

describe('copySurveyLanguage', () => {
  it('moves the source onto the target by default, clearing the source', () => {
    const obj = {
      title: { fi: 'otsikko', en: 'old', sv: '' },
      options: [{ text: { fi: 'vaihtoehto', en: 'old', sv: '' } }],
    };
    copySurveyLanguage(obj, 'fi', 'en');
    expect(obj).toEqual({
      title: { fi: '', en: 'otsikko', sv: '' },
      options: [{ text: { fi: '', en: 'vaihtoehto', sv: '' } }],
    });
  });

  it('keeps the source intact when clearFrom is false', () => {
    const obj = {
      title: { fi: 'otsikko', en: 'old', sv: '' },
      options: [{ text: { fi: 'vaihtoehto', en: 'old', sv: '' } }],
    };
    copySurveyLanguage(obj, 'fi', 'en', false);
    expect(obj).toEqual({
      title: { fi: 'otsikko', en: 'otsikko', sv: '' },
      options: [{ text: { fi: 'vaihtoehto', en: 'vaihtoehto', sv: '' } }],
    });
  });

  it('clears the target when the source is empty or missing', () => {
    const obj = {
      empty: { fi: '', en: 'keep-me', sv: '' },
      missing: { fi: 'x', en: 'keep-me' } as Record<string, string>,
    };
    copySurveyLanguage(obj, 'sv', 'en', false);
    expect(obj.empty.en).toBe('');
    expect(obj.missing.en).toBe('');
  });

  it('leaves localizedMapUrls and non-localized values untouched', () => {
    const obj = {
      title: { fi: 'a', en: 'b', sv: 'c' },
      localizedMapUrls: { fi: 'fi-url', en: 'en-url', sv: 'se-url' },
      enabledLanguages: { fi: true, en: false, sv: false },
    };
    copySurveyLanguage(obj, 'fi', 'en');
    expect(obj.localizedMapUrls).toEqual({
      fi: 'fi-url',
      en: 'en-url',
      sv: 'se-url',
    });
    expect(obj.enabledLanguages).toEqual({ fi: true, en: false, sv: false });
  });

  it('mutates in place and returns the same reference', () => {
    const obj = { title: { fi: 'a', en: 'b', sv: 'c' } };
    expect(copySurveyLanguage(obj, 'fi', 'en')).toBe(obj);
  });
});

describe('on a realistic survey', () => {
  const buildSurvey = () => {
    const survey = createMockSurvey(1, 10);
    survey.pages![0].sections = [
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
    const radio = survey.pages![0].sections[1];
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
    const radio = survey.pages![0].sections[1];
    if (radio.type !== 'radio') throw new Error('expected radio section');
    expect(radio.options[0].text.en).toBe('Vaihtoehto 1');
    expect(radio.options[0].text.fi).toBe('');
    expect(radio.options[1].text.en).toBe('Vaihtoehto 2');
    // Map urls remain untouched
    expect(survey.localizedMapUrls).toEqual({ fi: '', en: '', sv: '' });
  });

  it('copies Finnish onto English without clearing Finnish when clearFrom is false', () => {
    const survey = buildSurvey();
    copySurveyLanguage(survey, 'fi', 'en', false);

    expect(survey.title.en).toBe('Testikysely');
    expect(survey.title.fi).toBe('Testikysely');
    const radio = survey.pages![0].sections[1];
    if (radio.type !== 'radio') throw new Error('expected radio section');
    expect(radio.options[0].text.en).toBe('Vaihtoehto 1');
    expect(radio.options[0].text.fi).toBe('Vaihtoehto 1');
  });
});

describe('getTabColor', () => {
  it('is green (undefined) when every field is filled in every language', () => {
    expect(getTabColor(() => ['a', 'b'], ['fi', 'en'], theme)).toBeUndefined();
  });

  it('is green (undefined) when there are no fields to check at all', () => {
    expect(getTabColor(() => [], ['fi', 'en'], theme)).toBeUndefined();
  });

  it('is yellow when some language has every field filled but another does not', () => {
    expect(
      getTabColor(
        (lang) => (lang === 'fi' ? ['a', 'b'] : ['', '']),
        ['fi', 'en'],
        theme,
      ),
    ).toBe(theme.palette.textWarning.main);
  });

  it('is red when no single language has every field filled, even though every field is filled somewhere', () => {
    expect(
      getTabColor(
        (lang) => (lang === 'fi' ? ['a', ''] : ['', 'b']),
        ['fi', 'en'],
        theme,
      ),
    ).toBe(theme.palette.textError.main);
  });
});

describe('getFrontPageTabColor', () => {
  it('ignores optional fields (subtitle, description) left empty in every language', () => {
    const survey = createMockSurvey(1, 10);
    survey.title = { fi: 'Otsikko', en: 'Title', sv: '' };
    survey.subtitle = { fi: '', en: '', sv: '' };
    survey.description = { fi: '', en: '', sv: '' };

    expect(getFrontPageTabColor(survey, ['fi', 'en'], theme)).toBeUndefined();
  });

  it('is yellow when an optional field is used in one language but not another', () => {
    const survey = createMockSurvey(1, 10);
    survey.title = { fi: 'Otsikko', en: 'Title', sv: '' };
    survey.subtitle = { fi: 'Alaotsikko', en: '', sv: '' };
    survey.description = { fi: '', en: '', sv: '' };

    expect(getFrontPageTabColor(survey, ['fi', 'en'], theme)).toBe(
      theme.palette.textWarning.main,
    );
  });

  it('is red when the mandatory title is missing in every language, even if an optional field is fully translated', () => {
    const survey = createMockSurvey(1, 10);
    survey.title = { fi: '', en: '', sv: '' };
    survey.subtitle = { fi: 'Alaotsikko', en: 'Subtitle', sv: '' };
    survey.description = { fi: '', en: '', sv: '' };

    expect(getFrontPageTabColor(survey, ['fi', 'en'], theme)).toBe(
      theme.palette.textError.main,
    );
  });

  it('is yellow when the mandatory title is filled in one language but not another', () => {
    const survey = createMockSurvey(1, 10);
    survey.title = { fi: 'Otsikko', en: '', sv: '' };
    survey.subtitle = { fi: '', en: '', sv: '' };
    survey.description = { fi: '', en: '', sv: '' };

    expect(getFrontPageTabColor(survey, ['fi', 'en'], theme)).toBe(
      theme.palette.textWarning.main,
    );
  });
});

describe('getThanksPageTabColor', () => {
  it('is green (undefined) when both fields are left empty in every language, since neither is mandatory today', () => {
    const survey = createMockSurvey(1, 10);
    survey.thanksPage = {
      title: { fi: '', en: '', sv: '' },
      text: { fi: '', en: '', sv: '' },
    };

    expect(getThanksPageTabColor(survey, ['fi', 'en'], theme)).toBeUndefined();
  });

  it('is yellow, not red, when a used optional field is only translated in one language', () => {
    const survey = createMockSurvey(1, 10);
    survey.thanksPage = {
      title: { fi: 'Kiitos', en: '', sv: '' },
      text: { fi: '', en: '', sv: '' },
    };

    expect(getThanksPageTabColor(survey, ['fi', 'en'], theme)).toBe(
      theme.palette.textWarning.main,
    );
  });
});

describe('getPageTabColor', () => {
  const buildPage = () => {
    const survey = createMockSurvey(1, 10);
    const page = survey.pages![0];
    page.sections = [createMockTextSection(100)];
    return page;
  };

  it('is green (undefined) when the page title and every section field are filled in every language', () => {
    const page = buildPage();
    page.title = { fi: 'Sivu', en: 'Page', sv: '' };

    expect(getPageTabColor(page, ['fi', 'en'], theme)).toBeUndefined();
  });

  it('is red when the page title is missing in every language, even though a section field is fully translated', () => {
    const page = buildPage();
    page.title = { fi: '', en: '', sv: '' };

    expect(getPageTabColor(page, ['fi', 'en'], theme)).toBe(
      theme.palette.textError.main,
    );
  });
});

describe('getLangBadgeStatus', () => {
  const buildSurvey = () => {
    const survey = createMockSurvey(1, 10);
    survey.pages![0].sections = [createMockTextSection(100)];
    return survey;
  };

  it('is default when the front page, every page, and the thanks page are fully filled in the language', () => {
    const survey = buildSurvey();
    survey.title = { fi: 'Otsikko', en: 'Title', sv: '' };
    survey.subtitle = { fi: '', en: '', sv: '' };
    survey.description = { fi: '', en: '', sv: '' };
    survey.pages![0].title = { fi: 'Sivu', en: 'Page', sv: '' };
    survey.thanksPage = {
      title: { fi: '', en: '', sv: '' },
      text: { fi: '', en: '', sv: '' },
    };

    expect(getLangBadgeStatus(survey, ['fi', 'en'], 'en')).toBe('default');
  });

  it('is warning (not default) when only the front page title is missing in the language, even though every page is complete', () => {
    const survey = buildSurvey();
    survey.title = { fi: 'Otsikko', en: '', sv: '' };
    survey.subtitle = { fi: '', en: '', sv: '' };
    survey.description = { fi: '', en: '', sv: '' };
    survey.pages![0].title = { fi: 'Sivu', en: 'Page', sv: '' };
    survey.thanksPage = {
      title: { fi: '', en: '', sv: '' },
      text: { fi: '', en: '', sv: '' },
    };

    expect(getLangBadgeStatus(survey, ['fi', 'en'], 'en')).toBe('warning');
    expect(getLangBadgeStatus(survey, ['fi', 'en'], 'fi')).toBe('default');
  });

  it('is error when the front page, pages, and a used thanks page field are all missing in the language', () => {
    const survey = buildSurvey();
    survey.title = { fi: 'Otsikko', en: '', sv: '' };
    survey.subtitle = { fi: '', en: '', sv: '' };
    survey.description = { fi: '', en: '', sv: '' };
    survey.pages![0].title = { fi: 'Sivu', en: '', sv: '' };
    survey.thanksPage = {
      title: { fi: 'Kiitos', en: '', sv: '' },
      text: { fi: '', en: '', sv: '' },
    };

    expect(getLangBadgeStatus(survey, ['fi', 'en'], 'en')).toBe('error');
    expect(getLangBadgeStatus(survey, ['fi', 'en'], 'fi')).toBe('default');
  });

  it('does not force error from an unused optional thanks page when everything else is complete', () => {
    const survey = buildSurvey();
    survey.title = { fi: 'Otsikko', en: 'Title', sv: '' };
    survey.subtitle = { fi: '', en: '', sv: '' };
    survey.description = { fi: '', en: '', sv: '' };
    survey.pages![0].title = { fi: 'Sivu', en: 'Page', sv: '' };
    survey.thanksPage = {
      title: { fi: '', en: '', sv: '' },
      text: { fi: '', en: '', sv: '' },
    };

    expect(getLangBadgeStatus(survey, ['fi', 'en'], 'en')).toBe('default');
  });
});
