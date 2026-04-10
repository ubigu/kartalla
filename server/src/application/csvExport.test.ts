import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@src/database', () => ({
  getDb: vi.fn(),
  encryptionKey: 'test-key',
}));

vi.mock('@src/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('./exportUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./exportUtils')>();
  return {
    ...actual,
    getAnswerDBEntries: vi.fn(),
    getSectionHeaders: vi.fn(),
    getPersonalInfosForSurvey: vi.fn(),
  };
});

import {
  makeBudgetingRow,
  makeBudgetingSectionHeader,
  makeFreeTextRow,
  makeFreeTextSectionHeader,
  makeMatrixRow,
  makeMatrixSectionHeader,
  makeMultiMatrixRow,
  makeMultiMatrixSectionHeader,
  makeNumericRow,
  makeNumericSectionHeader,
  makePersonalInfo,
  makeRadioRow,
  makeRadioSectionHeader,
  makeSortingRow,
  makeSortingSectionHeader,
  multiLangClass,
  multiLangOption,
  multiLangSubject,
  multiLangTarget,
  multiLangTitle,
} from './answerExportHelpers';
import { getCSVFile } from './csvExport';
import {
  getAnswerDBEntries,
  getPersonalInfosForSurvey,
  getSectionHeaders,
} from './exportUtils';

describe('getCSVFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when there are no answers and no personal info', async () => {
    vi.mocked(getAnswerDBEntries).mockResolvedValueOnce(null);
    const result = await getCSVFile(1, false);
    expect(result).toBeNull();
  });

  describe('meta column headers', () => {
    it.each([
      ['fi', 'Vastaustunniste', 'Tallennusaika', 'Vastauskieli'],
      [
        'en',
        'Submission identifier',
        'Time of the response',
        'Response language',
      ],
      ['se', 'Svarsid', 'Svarstid', 'Svarsspråk'],
    ] as const)(
      'uses translated meta column headers for lang=%s',
      async (lang, submissionId, responseTime, responseLanguage) => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeFreeTextRow(1, 10, 'Hello'),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeFreeTextSectionHeader(10, 'Q'),
        ]);

        const csv = await getCSVFile(1, false, lang);
        const header = csv.split('\n')[0];

        expect(header).toContain(submissionId);
        expect(header).toContain(responseTime);
        expect(header).toContain(responseLanguage);
      },
    );
  });

  describe('question title language', () => {
    it.each([
      ['fi', 'Suomalainen kysymys', 'Vaihtoehto A'],
      ['en', 'English question', 'Option A'],
      ['se', 'Svensk fråga', 'Alternativ A'],
    ] as const)(
      'uses the correct language for question titles and option labels for lang=%s',
      async (lang, expectedTitle, expectedOption) => {
        const header = {
          ...makeRadioSectionHeader(10, 99, 'fallback', 'fallback'),
          title: {
            fi: 'Suomalainen kysymys',
            en: 'English question',
            se: 'Svensk fråga',
          },
          text: { fi: 'Vaihtoehto A', en: 'Option A', se: 'Alternativ A' },
        };
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeRadioRow(1, 10, 99),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([header]);

        const csv = await getCSVFile(1, false, lang);
        const headerLine = csv.split('\n')[0];

        expect(headerLine).toContain(expectedTitle);
        expect(headerLine).toContain(expectedOption);
      },
    );
  });

  describe('sorting question', () => {
    it.each(['fi', 'en', 'se'] as const)(
      'header and data use correct language for lang=%s',
      async (lang) => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeSortingRow(1, 10),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeSortingSectionHeader(10, 0, multiLangTitle, multiLangOption),
        ]);

        const csv = await getCSVFile(1, false, lang);
        expect(csv.split('\n')[0]).toContain(multiLangTitle[lang]);
        expect(csv.split('\n')[1]).toContain(multiLangOption[lang]);
      },
    );
  });

  describe('matrix question', () => {
    it.each(['fi', 'en', 'se'] as const)(
      'header uses correct language for title and subject for lang=%s',
      async (lang) => {
        const header = {
          ...makeMatrixSectionHeader(10, '', [], []),
          title: multiLangTitle,
          type: 'matrix',
          details: { subjects: [multiLangSubject], classes: [{ fi: 'Bad' }] },
        };
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeMatrixRow(1, 10, [0]),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([header]);

        const csv = await getCSVFile(1, false, lang);
        const headerLine = csv.split('\n')[0];
        expect(headerLine).toContain(multiLangTitle[lang]);
        expect(headerLine).toContain(multiLangSubject[lang]);
      },
    );

    it('includes a header column for each subject', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeMatrixRow(1, 20, [1, 0]),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeMatrixSectionHeader(
          20,
          'Rate it',
          ['Subject A', 'Subject B'],
          ['Bad', 'Good'],
        ),
      ]);

      const csv = await getCSVFile(1);
      const headerLine = csv.split('\n')[0];

      expect(headerLine).toContain('Subject A');
      expect(headerLine).toContain('Subject B');
    });

    it('shows class label for classIndex 0 (not treated as falsy)', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeMatrixRow(1, 20, [0]),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeMatrixSectionHeader(20, 'Rate it', ['Subject A'], ['Bad', 'Good']),
      ]);

      const csv = await getCSVFile(1);
      const dataRow = csv.split('\n')[1];

      expect(dataRow).toContain('"Bad"');
    });
  });

  describe('multi-matrix question', () => {
    it.each(['fi', 'en', 'se'] as const)(
      'header uses correct language for title, subject and class for lang=%s',
      async (lang) => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeMultiMatrixRow(1, 10),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeMultiMatrixSectionHeader(
            10,
            multiLangTitle,
            [multiLangSubject],
            [multiLangClass],
          ),
        ]);

        const csv = await getCSVFile(1, false, lang);
        const headerLine = csv.split('\n')[0];
        expect(headerLine).toContain(multiLangTitle[lang]);
        expect(headerLine).toContain(multiLangSubject[lang]);
        expect(headerLine).toContain(multiLangClass[lang]);
      },
    );
  });

  describe('budgeting question', () => {
    it.each(['fi', 'en', 'se'] as const)(
      'header uses correct language for title and target name for lang=%s',
      async (lang) => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeBudgetingRow(1, 10),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeBudgetingSectionHeader(10, multiLangTitle, [
            { name: multiLangTarget },
          ]),
        ]);

        const csv = await getCSVFile(1, false, lang);
        const headerLine = csv.split('\n')[0];
        expect(headerLine).toContain(multiLangTitle[lang]);
        expect(headerLine).toContain(multiLangTarget[lang]);
      },
    );
  });

  describe('free-text answers', () => {
    it('preserves commas in a free-text answer by quoting the field', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'Hello, world'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeFreeTextSectionHeader(10, 'My question'),
      ]);

      const csv = await getCSVFile(1);
      const lines = csv.trim().split('\n');

      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('"Hello, world"');
    });

    it('preserves multiple commas in a free-text answer', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'a, b, c, d'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeFreeTextSectionHeader(10, 'My question'),
      ]);

      const csv = await getCSVFile(1);
      const lines = csv.trim().split('\n');

      expect(lines[1]).toContain('"a, b, c, d"');
    });

    it('escapes double quotes in a free-text answer', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'Say "hello"'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeFreeTextSectionHeader(10, 'My question'),
      ]);

      const csv = await getCSVFile(1);
      const lines = csv.trim().split('\n');

      expect(lines[1]).toContain('"Say ""hello"""');
    });

    it('produces a parseable CSV row when free-text contains commas', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(42, 10, 'Yes, please'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeFreeTextSectionHeader(10, 'Question'),
      ]);

      const csv = await getCSVFile(1);
      const lines = csv.trim().split('\n');

      // Header: Vastaustunniste, Aikaleima, Vastauskieli, "s1k1: Question"
      // Row:    42, <date>, fi, "Yes, please"
      // The answer field is quoted so splitting naively gives more fields on the row —
      // use a quoted-field-aware check instead
      expect(lines[0]).toContain('"s1k1: Question"');
      expect(lines[1]).toContain('"Yes, please"');
    });
  });

  describe('numeric answers', () => {
    it('writes the numeric value in the data row', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeNumericRow(1, 10, 42),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeNumericSectionHeader(10, 'How many?'),
      ]);

      const csv = await getCSVFile(1);
      const dataRow = csv.split('\n')[1];

      expect(dataRow).toContain('"42"');
    });
  });

  describe('radio answers', () => {
    it('includes a selected radio option as 1 wrapped in double quotes', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeRadioRow(1, 10, 99),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeRadioSectionHeader(10, 99, 'Choose one', 'Option A'),
      ]);

      const csv = await getCSVFile(1);
      const lines = csv.trim().split('\n');

      expect(lines[1]).toContain(',"1"');
    });

    it('quotes header text that contains a comma', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeRadioRow(1, 10, 99),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeRadioSectionHeader(10, 99, 'Question', 'Yes, please'),
      ]);

      const csv = await getCSVFile(1);
      const headerLine = csv.trim().split('\n')[0];

      // Option text with comma must be inside double quotes in the header
      expect(headerLine).toContain('"s1k1: Question - Yes, please"');
    });

    it('wraps custom radio answer (free text) in double quotes', async () => {
      // Custom answer: no valueOptionId, valueText contains comma
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeRadioRow(1, 10, null, 'My own, answer'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeRadioSectionHeader(10, -1, 'Question', 'other'),
      ]);

      const csv = await getCSVFile(1);
      const lines = csv.trim().split('\n');

      // Custom answer goes directly into the cell wrapped in double quotes
      expect(lines[1]).toContain('"My own, answer"');
    });
  });

  describe('follow-up questions', () => {
    it('uses an alphabetic suffix in the header code for follow-up questions', async () => {
      const followUpRow = {
        ...makeFreeTextRow(1, 20, 'follow-up answer'),
        sectionId: 20,
        sectionIndex: 1,
      };
      const mainHeader = makeFreeTextSectionHeader(10, 'Main question');
      const followUpHeader = {
        ...makeFreeTextSectionHeader(20, 'Follow-up question'),
        sectionId: 20,
        sectionIndex: 1,
        predecessorSection: 10,
        questionOrderIndex: 0,
      };

      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'main'),
        followUpRow,
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        mainHeader,
        followUpHeader,
      ]);

      const csv = await getCSVFile(1);
      const headerLine = csv.split('\n')[0];

      // Follow-up headers use an alphabetic suffix, e.g. "s1k1b: ..."
      expect(headerLine).toMatch(/s\dk\d[a-z]:/);
    });
  });

  describe('multiple submissions', () => {
    it('produces a separate data row for each submission', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'First answer'),
        makeFreeTextRow(2, 10, 'Second answer'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeFreeTextSectionHeader(10, 'Q'),
      ]);

      const csv = await getCSVFile(1);
      const lines = csv.trim().split('\n');

      expect(lines).toHaveLength(3);
      expect(lines[1]).toContain('"First answer"');
      expect(lines[2]).toContain('"Second answer"');
    });
  });

  describe('personal info fields', () => {
    it('preserves commas in name field by quoting the field', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce(null);
      vi.mocked(getPersonalInfosForSurvey).mockResolvedValueOnce([
        makePersonalInfo('1', {
          name: 'Doe, John',
          details: {
            isRequired: false,
            askName: true,
            askEmail: false,
            askPhone: false,
            askAddress: false,
            askCustom: false,
            customLabel: { fi: '', en: '', se: '' },
          },
        }),
      ]);

      const csv = await getCSVFile(1, true);

      expect(csv).toContain('"Doe, John"');
    });

    it('preserves commas in address field by quoting the field', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce(null);
      vi.mocked(getPersonalInfosForSurvey).mockResolvedValueOnce([
        makePersonalInfo('2', {
          address: 'Main Street, 12, Helsinki',
          details: {
            isRequired: false,
            askName: false,
            askEmail: false,
            askPhone: false,
            askAddress: true,
            askCustom: false,
            customLabel: { fi: '', en: '', se: '' },
          },
        }),
      ]);

      const csv = await getCSVFile(1, true);

      expect(csv).toContain('"Main Street, 12, Helsinki"');
    });

    it('preserves commas in custom field by quoting the field', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce(null);
      vi.mocked(getPersonalInfosForSurvey).mockResolvedValueOnce([
        makePersonalInfo('3', {
          custom: 'Option A, Option B',
          details: {
            isRequired: false,
            askName: false,
            askEmail: false,
            askPhone: false,
            askAddress: false,
            askCustom: true,
            customLabel: { fi: 'Extra info', en: '', se: '' },
          },
        }),
      ]);

      const csv = await getCSVFile(1, true);

      expect(csv).toContain('"Option A, Option B"');
    });

    it('preserves commas in phone field by quoting the field', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce(null);
      vi.mocked(getPersonalInfosForSurvey).mockResolvedValueOnce([
        makePersonalInfo('4', {
          phone: '+358,40,1234567',
          details: {
            isRequired: false,
            askName: false,
            askEmail: false,
            askPhone: true,
            askAddress: false,
            askCustom: false,
            customLabel: { fi: '', en: '', se: '' },
          },
        }),
      ]);

      const csv = await getCSVFile(1, true);

      expect(csv).toContain('"+358,40,1234567"');
    });

    it('combines answer columns and personal info in the same row', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'My answer'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeFreeTextSectionHeader(10, 'Q'),
      ]);
      vi.mocked(getPersonalInfosForSurvey).mockResolvedValueOnce([
        makePersonalInfo('1', {
          name: 'Alice',
          details: {
            isRequired: false,
            askName: true,
            askEmail: false,
            askPhone: false,
            askAddress: false,
            askCustom: false,
            customLabel: { fi: '', en: '', se: '' },
          },
        }),
      ]);

      const csv = await getCSVFile(1, true);
      const dataRow = csv.trim().split('\n')[1];

      expect(dataRow).toContain('"Alice"');
      expect(dataRow).toContain('"My answer"');
    });
  });
});
