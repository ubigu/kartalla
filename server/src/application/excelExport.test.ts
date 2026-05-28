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

import ExcelJS from 'exceljs';
import {
  makeBudgetingRow,
  makeBudgetingSectionHeader,
  makeCheckboxSectionHeader,
  makeFreeTextRow,
  makeFreeTextSectionHeader,
  makeGroupedCheckboxRow,
  makeGroupedCheckboxSectionHeader,
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
} from '../tests/answerExportHelpers';
import { getExcelFile } from './excelExport';
import {
  getAnswerDBEntries,
  getPersonalInfosForSurvey,
  getSectionHeaders,
} from './exportUtils';

describe('getExcelFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function loadSheet(
    buffer: ExcelJS.Buffer,
    sheetName = 'Vastaukset (laaja)',
  ) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    return wb.getWorksheet(sheetName);
  }

  describe('sheet structure', () => {
    it('returns null when no answers exist', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce(null);
      const result = await getExcelFile(1);
      expect(result).toBeNull();
    });

    it('writes a data row for each submission', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'First'),
        makeFreeTextRow(2, 10, 'Second'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeFreeTextSectionHeader(10, 'Q'),
      ]);

      const buffer = await getExcelFile(1);
      const ws = await loadSheet(buffer);
      expect(ws.getRow(3).getCell(4).value).toBe('First');
      expect(ws.getRow(4).getCell(4).value).toBe('Second');
    });

    it.each([
      ['fi', 'Vastaukset (laaja)'],
      ['en', 'Responses (detailed)'],
      ['se', 'Svar (detaljerade)'],
    ] as const)(
      'creates a sheet with the correct name for lang=%s',
      async (lang, expectedName) => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeFreeTextRow(1, 10, 'Hello'),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeFreeTextSectionHeader(10, 'My question'),
        ]);

        const buffer = await getExcelFile(1, false, lang);
        const ws = await loadSheet(buffer, expectedName);
        expect(ws).toBeTruthy();
      },
    );

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
      'has translated meta column labels in row 1 for lang=%s',
      async (lang, submissionId, responseTime, responseLanguage) => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeFreeTextRow(1, 10, 'Hello'),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeFreeTextSectionHeader(10, 'My question'),
        ]);

        const buffer = await getExcelFile(1, false, lang);
        const ws = await loadSheet(
          buffer,
          {
            fi: 'Vastaukset (laaja)',
            en: 'Responses (detailed)',
            se: 'Svar (detaljerade)',
          }[lang],
        );
        expect(ws.getRow(1).getCell(1).value).toBe(submissionId);
        expect(ws.getRow(1).getCell(2).value).toBe(responseTime);
        expect(ws.getRow(1).getCell(3).value).toBe(responseLanguage);
      },
    );
  });

  describe('free-text answers', () => {
    it('writes free-text value as string in data row', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'Hello world'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeFreeTextSectionHeader(10, 'My question'),
      ]);

      const buffer = await getExcelFile(1);
      const ws = await loadSheet(buffer);
      expect(ws.getRow(3).getCell(4).value).toBe('Hello world');
    });

    it('writes question group label in row 1', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'Answer'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeFreeTextSectionHeader(10, 'Open question'),
      ]);

      const buffer = await getExcelFile(1);
      const ws = await loadSheet(buffer);
      expect(String(ws.getRow(1).getCell(4).value)).toContain('Open question');
    });

    it('leaves row 2 option label empty for single-column questions', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'Answer'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeFreeTextSectionHeader(10, 'Q'),
      ]);

      const buffer = await getExcelFile(1);
      const ws = await loadSheet(buffer);
      const cell = ws.getRow(2).getCell(4).value;
      expect(cell == null || cell === '').toBeTruthy();
    });
  });

  describe('numeric answers', () => {
    it('writes numeric value as a number in the data cell', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeNumericRow(1, 10, 42),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeNumericSectionHeader(10, 'How many?'),
      ]);

      const buffer = await getExcelFile(1);
      const ws = await loadSheet(buffer);
      expect(ws.getRow(3).getCell(4).value).toBe(42);
    });
  });

  describe('radio answers', () => {
    it('writes ✓ for a selected option', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeRadioRow(1, 10, 99),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeRadioSectionHeader(10, 99, 'Choose one', 'Option A'),
      ]);

      const buffer = await getExcelFile(1);
      const ws = await loadSheet(buffer);
      const cell = ws.getRow(3).getCell(4);
      expect(cell.value).toBe('✓');
    });

    it('writes option text in row 2', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeRadioRow(1, 10, 99),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeRadioSectionHeader(10, 99, 'Choose one', 'Option A'),
      ]);

      const buffer = await getExcelFile(1);
      const ws = await loadSheet(buffer);
      expect(ws.getRow(2).getCell(4).value).toBe('Option A');
    });

    it('leaves cells for unselected options empty', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeRadioRow(1, 10, 99),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeRadioSectionHeader(10, 99, 'Choose one', 'Option A'),
        makeRadioSectionHeader(10, 100, 'Choose one', 'Option B'),
      ]);

      const buffer = await getExcelFile(1);
      const ws = await loadSheet(buffer);
      const unselectedCell = ws.getRow(3).getCell(5).value;
      expect(unselectedCell).toBeNull();
    });
  });

  describe('follow-up questions', () => {
    it.each([
      ['fi', 'Jatkokysymys'],
      ['en', 'Follow-up'],
      ['se', 'Följdfråga'],
    ] as const)(
      'prefixes follow-up question group label with the translated prefix for lang=%s',
      async (lang, expectedPrefix) => {
        const followUpRow = {
          ...makeFreeTextRow(1, 20, 'follow-up answer'),
          sectionId: 20,
          sectionIndex: 1,
          type: 'free-text',
        };

        const mainHeader = makeFreeTextSectionHeader(10, 'Main question');
        const followUpHeader = {
          ...makeFreeTextSectionHeader(20, 'Follow-up question'),
          sectionId: 20,
          sectionIndex: 1,
          predecessorSection: 10,
          predecessorSectionIndex: 0,
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

        const buffer = await getExcelFile(1, false, lang);
        const ws = await loadSheet(
          buffer,
          {
            fi: 'Vastaukset (laaja)',
            en: 'Responses (detailed)',
            se: 'Svar (detaljerade)',
          }[lang],
        );

        const row1Values = [];
        ws.getRow(1).eachCell((cell) =>
          row1Values.push(String(cell.value ?? '')),
        );
        expect(row1Values.some((v) => v.includes(expectedPrefix))).toBe(true);
      },
    );
  });

  describe('submitted answer language', () => {
    it.each(['fi', 'en', 'se'] as const)(
      'is written to the response language column for lang=%s',
      async (lang) => {
        const row = {
          ...makeFreeTextRow(1, 10, 'Answer'),
          submissionLanguage: lang,
        };
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([row]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeFreeTextSectionHeader(10, 'Q'),
        ]);

        const buffer = await getExcelFile(1);
        const ws = await loadSheet(buffer);
        expect(ws.getRow(3).getCell(3).value).toBe(lang);
      },
    );
  });

  describe('question title and option label language', () => {
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

        const buffer = await getExcelFile(1, false, lang);
        const ws = await loadSheet(
          buffer,
          {
            fi: 'Vastaukset (laaja)',
            en: 'Responses (detailed)',
            se: 'Svar (detaljerade)',
          }[lang],
        );
        expect(String(ws.getRow(1).getCell(4).value)).toContain(expectedTitle);
        expect(ws.getRow(2).getCell(4).value).toBe(expectedOption);
      },
    );
  });

  describe('sorting question', () => {
    it.each(['fi', 'en', 'se'] as const)(
      'row 1 uses correct title and row 3 uses correct option text for lang=%s',
      async (lang) => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeSortingRow(1, 10),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeSortingSectionHeader(10, 0, multiLangTitle, multiLangOption),
        ]);

        const buffer = await getExcelFile(1, false, lang);
        const ws = await loadSheet(
          buffer,
          {
            fi: 'Vastaukset (laaja)',
            en: 'Responses (detailed)',
            se: 'Svar (detaljerade)',
          }[lang],
        );
        expect(String(ws.getRow(1).getCell(4).value)).toContain(
          multiLangTitle[lang],
        );
        expect(ws.getRow(3).getCell(4).value).toBe(multiLangOption[lang]);
      },
    );

    it('produces a separate column for each sorted position', async () => {
      const sortingRow = {
        ...makeFreeTextRow(1, 10, null),
        type: 'sorting',
        valueJson: [99, 100],
      };
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([sortingRow]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeSortingSectionHeader(
          10,
          0,
          multiLangTitle,
          { fi: 'First', en: 'First', se: 'First' },
          99,
        ),
        makeSortingSectionHeader(
          10,
          1,
          multiLangTitle,
          { fi: 'Second', en: 'Second', se: 'Second' },
          100,
        ),
      ]);

      const buffer = await getExcelFile(1);
      const ws = await loadSheet(buffer);
      expect(ws.getRow(3).getCell(4).value).toBe('First');
      expect(ws.getRow(3).getCell(5).value).toBe('Second');
    });
  });

  describe('matrix question', () => {
    it.each(['fi', 'en', 'se'] as const)(
      'row 1 uses correct title and row 2 uses correct subject label for lang=%s',
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

        const buffer = await getExcelFile(1, false, lang);
        const ws = await loadSheet(
          buffer,
          {
            fi: 'Vastaukset (laaja)',
            en: 'Responses (detailed)',
            se: 'Svar (detaljerade)',
          }[lang],
        );
        expect(String(ws.getRow(1).getCell(4).value)).toContain(
          multiLangTitle[lang],
        );
        expect(ws.getRow(2).getCell(4).value).toBe(multiLangSubject[lang]);
      },
    );

    it('shows class label when classIndex is 0 (not treated as falsy)', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeMatrixRow(1, 10, [0]),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeMatrixSectionHeader(10, 'Rate it', ['Subject A'], ['Bad', 'Good']),
      ]);

      const buffer = await getExcelFile(1);
      const ws = await loadSheet(buffer);
      expect(ws.getRow(3).getCell(4).value).toBe('Bad');
    });
  });

  describe('multi-matrix question', () => {
    it.each(['fi', 'en', 'se'] as const)(
      'row 1 uses correct subject group label and row 2 uses correct class label for lang=%s',
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

        const buffer = await getExcelFile(1, false, lang);
        const ws = await loadSheet(
          buffer,
          {
            fi: 'Vastaukset (laaja)',
            en: 'Responses (detailed)',
            se: 'Svar (detaljerade)',
          }[lang],
        );
        expect(String(ws.getRow(1).getCell(4).value)).toContain(
          multiLangTitle[lang],
        );
        expect(String(ws.getRow(1).getCell(4).value)).toContain(
          multiLangSubject[lang],
        );
        expect(ws.getRow(2).getCell(4).value).toBe(multiLangClass[lang]);
      },
    );
  });

  describe('budgeting question', () => {
    it.each(['fi', 'en', 'se'] as const)(
      'row 1 uses correct title and row 2 uses correct target name for lang=%s',
      async (lang) => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeBudgetingRow(1, 10),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeBudgetingSectionHeader(10, multiLangTitle, [
            { name: multiLangTarget },
          ]),
        ]);

        const buffer = await getExcelFile(1, false, lang);
        const ws = await loadSheet(
          buffer,
          {
            fi: 'Vastaukset (laaja)',
            en: 'Responses (detailed)',
            se: 'Svar (detaljerade)',
          }[lang],
        );
        expect(String(ws.getRow(1).getCell(4).value)).toContain(
          multiLangTitle[lang],
        );
        expect(ws.getRow(2).getCell(4).value).toBe(multiLangTarget[lang]);
      },
    );
  });

  describe('timestamp', () => {
    it('writes timestamp as a Date object', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'Hi'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeFreeTextSectionHeader(10, 'Q'),
      ]);

      const buffer = await getExcelFile(1);
      const ws = await loadSheet(buffer);
      const tsCell = ws.getRow(3).getCell(2);
      expect(tsCell.value instanceof Date).toBe(true);
    });
  });

  describe('personal info fields', () => {
    it('adds personal info columns after the three meta columns', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'Answer'),
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

      const buffer = await getExcelFile(1, true);
      const ws = await loadSheet(buffer);
      // PI column header follows the 3 meta columns
      expect(ws.getRow(1).getCell(4).value).toBe('Vastaajan nimi');
      // PI value in data row
      expect(ws.getRow(3).getCell(4).value).toBe('Alice');
      // Question column is pushed to column 5
      expect(String(ws.getRow(1).getCell(5).value)).toContain('Q');
    });
  });

  describe('compact sheet', () => {
    const COMPACT_NAMES = {
      fi: 'Vastaukset (tiivis)',
      en: 'Responses (compact)',
      se: 'Svar (kompakta)',
    } as const;

    async function loadCompact(
      buffer: ExcelJS.Buffer,
      lang: 'fi' | 'en' | 'se' = 'fi',
    ) {
      return loadSheet(buffer, COMPACT_NAMES[lang]);
    }

    it('exists in the workbook', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'x'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeFreeTextSectionHeader(10, 'Q'),
      ]);
      const buffer = await getExcelFile(1);
      const ws = await loadCompact(buffer);
      expect(ws).toBeTruthy();
    });

    it.each([
      ['fi', 'Vastaukset (tiivis)'],
      ['en', 'Responses (compact)'],
      ['se', 'Svar (kompakta)'],
    ] as const)(
      'has correct sheet name for lang=%s',
      async (lang, expectedName) => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeFreeTextRow(1, 10, 'x'),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeFreeTextSectionHeader(10, 'Q'),
        ]);
        const buffer = await getExcelFile(1, false, lang);
        const ws = await loadSheet(buffer, expectedName);
        expect(ws).toBeTruthy();
      },
    );

    it('has the same three meta columns as the main sheet', async () => {
      vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
        makeFreeTextRow(1, 10, 'x'),
      ]);
      vi.mocked(getSectionHeaders).mockResolvedValueOnce([
        makeFreeTextSectionHeader(10, 'Q'),
      ]);
      const buffer = await getExcelFile(1);
      const ws = await loadCompact(buffer);
      expect(ws.getRow(1).getCell(1).value).toBe('Vastaustunniste');
      expect(ws.getRow(1).getCell(2).value).toBe('Tallennusaika');
      expect(ws.getRow(1).getCell(3).value).toBe('Vastauskieli');
    });

    describe('free-text', () => {
      it('writes value in data cell', async () => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeFreeTextRow(1, 10, 'Hello'),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeFreeTextSectionHeader(10, 'Q'),
        ]);
        const buffer = await getExcelFile(1);
        const ws = await loadCompact(buffer);
        expect(ws.getRow(3).getCell(4).value).toBe('Hello');
      });
    });

    describe('radio', () => {
      it('writes selected option text (not a checkmark) in a single column', async () => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeRadioRow(1, 10, 99),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeRadioSectionHeader(10, 99, 'Choose one', 'Option A'),
          makeRadioSectionHeader(10, 100, 'Choose one', 'Option B'),
        ]);
        const buffer = await getExcelFile(1);
        const ws = await loadCompact(buffer);
        expect(ws.getRow(3).getCell(4).value).toBe('Option A');
        expect(ws.getRow(3).getCell(5).value).toBeNull();
      });

      it('all options share one column — row 2 secondary header is empty', async () => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeRadioRow(1, 10, 99),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeRadioSectionHeader(10, 99, 'Choose one', 'Option A'),
          makeRadioSectionHeader(10, 100, 'Choose one', 'Option B'),
        ]);
        const buffer = await getExcelFile(1);
        const ws = await loadCompact(buffer);
        const secondaryHeader = ws.getRow(2).getCell(4).value;
        expect(secondaryHeader == null || secondaryHeader === '').toBeTruthy();
      });
    });

    describe('checkbox', () => {
      it('comma-separates multiple selected options in one column', async () => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeRadioRow(1, 10, 99),
          makeRadioRow(1, 10, 100),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeCheckboxSectionHeader(10, 99, 'Pick any', 'Alpha'),
          makeCheckboxSectionHeader(10, 100, 'Pick any', 'Beta'),
          makeCheckboxSectionHeader(10, 101, 'Pick any', 'Gamma'),
        ]);
        const buffer = await getExcelFile(1);
        const ws = await loadCompact(buffer);
        expect(ws.getRow(3).getCell(4).value).toBe('Alpha, Beta');
      });
    });

    describe('grouped-checkbox', () => {
      it('creates one column per group with the group name in row 2', async () => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeGroupedCheckboxRow(1, 10, 99, 1),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeGroupedCheckboxSectionHeader(
            10,
            99,
            'Items',
            'Option A',
            1,
            'Group 1',
          ),
          makeGroupedCheckboxSectionHeader(
            10,
            100,
            'Items',
            'Option B',
            1,
            'Group 1',
          ),
          makeGroupedCheckboxSectionHeader(
            10,
            101,
            'Items',
            'Option C',
            2,
            'Group 2',
          ),
        ]);
        const buffer = await getExcelFile(1);
        const ws = await loadCompact(buffer);
        expect(ws.getRow(2).getCell(4).value).toBe('Group 1');
        expect(ws.getRow(2).getCell(5).value).toBe('Group 2');
      });

      it('lists only selected options within each group', async () => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeGroupedCheckboxRow(1, 10, 99, 1),
          makeGroupedCheckboxRow(1, 10, 101, 2),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeGroupedCheckboxSectionHeader(
            10,
            99,
            'Items',
            'Option A',
            1,
            'Group 1',
          ),
          makeGroupedCheckboxSectionHeader(
            10,
            100,
            'Items',
            'Option B',
            1,
            'Group 1',
          ),
          makeGroupedCheckboxSectionHeader(
            10,
            101,
            'Items',
            'Option C',
            2,
            'Group 2',
          ),
        ]);
        const buffer = await getExcelFile(1);
        const ws = await loadCompact(buffer);
        expect(ws.getRow(3).getCell(4).value).toBe('Option A');
        expect(ws.getRow(3).getCell(5).value).toBe('Option C');
      });
    });

    describe('sorting', () => {
      it('writes items in their sorted order comma-separated', async () => {
        const sortingRow = {
          ...makeFreeTextRow(1, 10, null),
          type: 'sorting',
          valueJson: [99, 100],
        };
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([sortingRow]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeSortingSectionHeader(
            10,
            0,
            { fi: 'Rank', en: 'Rank', se: 'Rank' },
            { fi: 'First', en: 'First', se: 'First' },
            99,
          ),
          makeSortingSectionHeader(
            10,
            1,
            { fi: 'Rank', en: 'Rank', se: 'Rank' },
            { fi: 'Second', en: 'Second', se: 'Second' },
            100,
          ),
        ]);
        const buffer = await getExcelFile(1);
        const ws = await loadCompact(buffer);
        expect(ws.getRow(3).getCell(4).value).toBe('1. First, 2. Second');
      });
    });

    describe('matrix', () => {
      it('shows subject name in row 2', async () => {
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([
          makeMatrixRow(1, 10, [0]),
        ]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeMatrixSectionHeader(10, 'Rate', ['Subject A'], ['Bad', 'Good']),
        ]);
        const buffer = await getExcelFile(1);
        const ws = await loadCompact(buffer);
        expect(ws.getRow(2).getCell(4).value).toBe('Subject A');
      });
    });

    describe('multi-matrix', () => {
      it('shows subject name in row 2 (not included in row 1)', async () => {
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
        const buffer = await getExcelFile(1);
        const ws = await loadCompact(buffer);
        expect(String(ws.getRow(1).getCell(4).value)).toContain(
          multiLangTitle.fi,
        );
        expect(String(ws.getRow(1).getCell(4).value)).not.toContain(
          multiLangSubject.fi,
        );
        expect(ws.getRow(2).getCell(4).value).toBe(multiLangSubject.fi);
      });

      it('comma-separates selected class names in the subject column', async () => {
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
        const buffer = await getExcelFile(1);
        const ws = await loadCompact(buffer);
        expect(ws.getRow(3).getCell(4).value).toBe(multiLangClass.fi);
      });

      it('creates one column per subject', async () => {
        const twoSubjectRow = {
          ...makeMultiMatrixRow(1, 10),
          valueJson: [[0], [0]],
        };
        vi.mocked(getAnswerDBEntries).mockResolvedValueOnce([twoSubjectRow]);
        vi.mocked(getSectionHeaders).mockResolvedValueOnce([
          makeMultiMatrixSectionHeader(
            10,
            multiLangTitle,
            [
              { fi: 'Subject 1', en: 'Subject 1', se: 'Subject 1' },
              { fi: 'Subject 2', en: 'Subject 2', se: 'Subject 2' },
            ],
            [multiLangClass],
          ),
        ]);
        const buffer = await getExcelFile(1);
        const ws = await loadCompact(buffer);
        expect(ws.getRow(2).getCell(4).value).toBe('Subject 1');
        expect(ws.getRow(2).getCell(5).value).toBe('Subject 2');
      });
    });
  });
});
