import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@src/database', () => ({
  getDb: vi.fn(),
  encryptionKey: 'test-key',
}));

vi.mock('@src/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { getDb } from '@src/database';
import { getCSVFile } from './answerExports';

const mockDate = new Date('2024-01-15T10:00:00Z');

/** Minimal DBAnswerEntry row for a free-text answer */
function makeFreeTextRow(
  submissionId: number,
  sectionId: number,
  valueText: string,
) {
  return {
    answer_id: 1,
    page_index: 0,
    details: {},
    section_id: sectionId,
    section_index: 0,
    submission_id: submissionId,
    language: 'fi',
    type: 'free-text',
    value_text: valueText,
    value_option_id: null,
    value_numeric: null,
    value_json: null,
    created_at: mockDate,
    option_group_index: null,
    map_layers: [],
  };
}

/** Minimal SectionHeader row for a free-text question */
function makeFreeTextSectionHeader(sectionId: number, titleFi: string) {
  return {
    optionId: null,
    optionIndex: null,
    text: null,
    sectionId,
    sectionIndex: 0,
    predecessorSectionIndex: null,
    title: { fi: titleFi },
    type: 'free-text',
    details: {},
    parentSection: null,
    predecessorSection: null,
    groupName: null,
    groupIndex: null,
    pageIndex: 0,
    questionOrderIndex: 0,
  };
}

/** Minimal DBAnswerEntry row for a radio/checkbox answer */
function makeRadioRow(
  submissionId: number,
  sectionId: number,
  valueOptionId: number | null,
  valueText: string | null = null,
) {
  return {
    answer_id: 2,
    page_index: 0,
    details: {},
    section_id: sectionId,
    section_index: 0,
    submission_id: submissionId,
    language: 'fi',
    type: 'radio',
    value_text: valueText,
    value_option_id: valueOptionId,
    value_numeric: null,
    value_json: null,
    created_at: mockDate,
    option_group_index: null,
    map_layers: [],
  };
}

/** Minimal SectionHeader row for a radio option */
function makeRadioSectionHeader(
  sectionId: number,
  optionId: number,
  titleFi: string,
  optionTextFi: string,
) {
  return {
    optionId,
    optionIndex: 0,
    text: { fi: optionTextFi },
    sectionId,
    sectionIndex: 0,
    predecessorSectionIndex: null,
    title: { fi: titleFi },
    type: 'radio',
    details: {},
    parentSection: null,
    predecessorSection: null,
    groupName: null,
    groupIndex: null,
    pageIndex: 0,
    questionOrderIndex: 0,
  };
}

describe('getCSVFile - comma handling', () => {
  let manyOrNone: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    manyOrNone = vi.fn();
    (getDb as ReturnType<typeof vi.fn>).mockReturnValue({ manyOrNone });
  });

  describe('free-text answers', () => {
    it('preserves commas in a free-text answer by quoting the field', async () => {
      manyOrNone
        .mockResolvedValueOnce([makeFreeTextRow(1, 10, 'Hello, world')])
        .mockResolvedValueOnce([makeFreeTextSectionHeader(10, 'My question')]);

      const csv = await getCSVFile(1);
      const lines = csv.trim().split('\n');

      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('"Hello, world"');
    });

    it('preserves multiple commas in a free-text answer', async () => {
      manyOrNone
        .mockResolvedValueOnce([makeFreeTextRow(1, 10, 'a, b, c, d')])
        .mockResolvedValueOnce([makeFreeTextSectionHeader(10, 'My question')]);

      const csv = await getCSVFile(1);
      const lines = csv.trim().split('\n');

      expect(lines[1]).toContain('"a, b, c, d"');
    });

    it('escapes double quotes in a free-text answer', async () => {
      manyOrNone
        .mockResolvedValueOnce([makeFreeTextRow(1, 10, 'Say "hello"')])
        .mockResolvedValueOnce([makeFreeTextSectionHeader(10, 'My question')]);

      const csv = await getCSVFile(1);
      const lines = csv.trim().split('\n');

      expect(lines[1]).toContain('"Say ""hello"""');
    });

    it('produces a parseable CSV row when free-text contains commas', async () => {
      manyOrNone
        .mockResolvedValueOnce([makeFreeTextRow(42, 10, 'Yes, please')])
        .mockResolvedValueOnce([makeFreeTextSectionHeader(10, 'Question')]);

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

  describe('radio answers', () => {
    it('includes a selected radio option as 1 wrapped in double quotes', async () => {
      manyOrNone
        .mockResolvedValueOnce([makeRadioRow(1, 10, 99)])
        .mockResolvedValueOnce([
          makeRadioSectionHeader(10, 99, 'Choose one', 'Option A'),
        ]);

      const csv = await getCSVFile(1);
      const lines = csv.trim().split('\n');

      expect(lines[1]).toContain(',"1"');
    });

    it('quotes header text that contains a comma', async () => {
      manyOrNone
        .mockResolvedValueOnce([makeRadioRow(1, 10, 99)])
        .mockResolvedValueOnce([
          makeRadioSectionHeader(10, 99, 'Question', 'Yes, please'),
        ]);

      const csv = await getCSVFile(1);
      const headerLine = csv.trim().split('\n')[0];

      // Option text with comma must be inside double quotes in the header
      expect(headerLine).toContain('"s1k1: Question - Yes, please"');
    });

    it('wraps custom radio answer (free text) in double quotes', async () => {
      // Custom answer: no valueOptionId, valueText contains comma
      manyOrNone
        .mockResolvedValueOnce([makeRadioRow(1, 10, null, 'My own, answer')])
        .mockResolvedValueOnce([
          makeRadioSectionHeader(10, -1, 'Question', 'other'),
        ]);

      const csv = await getCSVFile(1);
      const lines = csv.trim().split('\n');

      // Custom answer goes directly into the cell wrapped in double quotes
      expect(lines[1]).toContain('"My own, answer"');
    });
  });

  describe('personal info fields', () => {
    it('preserves commas in name field by quoting the field', async () => {
      manyOrNone.mockResolvedValueOnce([]).mockResolvedValueOnce([
        {
          submissionId: '1',
          name: 'Doe, John',
          email: null,
          phone: null,
          address: null,
          custom: null,
          timeStamp: mockDate,
          language: 'fi',
          details: {
            isRequired: false,
            askName: true,
            askEmail: false,
            askPhone: false,
            askAddress: false,
            askCustom: false,
            customLabel: {},
          },
        },
      ]);

      const csv = await getCSVFile(1, true);

      expect(csv).toContain('"Doe, John"');
    });

    it('preserves commas in address field by quoting the field', async () => {
      manyOrNone.mockResolvedValueOnce([]).mockResolvedValueOnce([
        {
          submissionId: '2',
          name: null,
          email: null,
          phone: null,
          address: 'Main Street, 12, Helsinki',
          custom: null,
          timeStamp: mockDate,
          language: 'fi',
          details: {
            isRequired: false,
            askName: false,
            askEmail: false,
            askPhone: false,
            askAddress: true,
            askCustom: false,
            customLabel: {},
          },
        },
      ]);

      const csv = await getCSVFile(1, true);

      expect(csv).toContain('"Main Street, 12, Helsinki"');
    });

    it('preserves commas in custom field by quoting the field', async () => {
      manyOrNone.mockResolvedValueOnce([]).mockResolvedValueOnce([
        {
          submissionId: '3',
          name: null,
          email: null,
          phone: null,
          address: null,
          custom: 'Option A, Option B',
          timeStamp: mockDate,
          language: 'fi',
          details: {
            isRequired: false,
            askName: false,
            askEmail: false,
            askPhone: false,
            askAddress: false,
            askCustom: true,
            customLabel: { fi: 'Extra info' },
          },
        },
      ]);

      const csv = await getCSVFile(1, true);

      expect(csv).toContain('"Option A, Option B"');
    });

    it('preserves commas in phone field by quoting the field', async () => {
      manyOrNone.mockResolvedValueOnce([]).mockResolvedValueOnce([
        {
          submissionId: '4',
          name: null,
          email: null,
          phone: '+358,40,1234567',
          address: null,
          custom: null,
          timeStamp: mockDate,
          language: 'fi',
          details: {
            isRequired: false,
            askName: false,
            askEmail: false,
            askPhone: true,
            askAddress: false,
            askCustom: false,
            customLabel: {},
          },
        },
      ]);

      const csv = await getCSVFile(1, true);

      expect(csv).toContain('"+358,40,1234567"');
    });
  });
});
