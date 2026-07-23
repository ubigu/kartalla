import { DEFAULT_SRID } from '@src/constants';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMockDb, mockLogger } from '@src/tests/helpers';

vi.mock('@src/database', () => ({
  getDb: vi.fn(),
  getColumnSet: vi.fn(),
  getGeoJSONColumn: vi.fn(),
  getMultiInsertQuery: vi.fn(),
  encryptionKey: 'test-key',
}));

vi.mock('@src/logger', () => ({ default: mockLogger() }));

vi.mock('@src/fileValidation', () => ({
  bufferFromDataUrl: vi.fn(),
  validateBinaryFile: vi.fn(),
  validateDataUrl: vi.fn(),
  validateTextFile: vi.fn(),
}));

vi.mock('@src/malwareScan', () => ({
  scanBuffer: vi.fn(),
}));

vi.mock('./survey', () => ({
  getSurvey: vi.fn(),
}));

// Keep getSurveyTargetSrid running naturally, but mock getOskariMapSrid within it
vi.mock('./map', async () => {
  const getOskariMapSrid = vi.fn();
  return {
    getSurveyTargetSrid: async (survey: {
      mapProvider: string;
      mapUrl: string;
    }) => {
      if (survey.mapProvider === 'openlayers') return 3857;
      return getOskariMapSrid(survey.mapUrl);
    },
    getOskariMapSrid,
    getAvailableOskariMapLayers: vi.fn().mockResolvedValue([]),
  };
});

import { SubmissionAnswerEntry } from '@interfaces/survey';
import { getDb } from '@src/database';
import { bufferFromDataUrl } from '@src/fileValidation';
import { scanBuffer } from '@src/malwareScan';
import { mockOlSurvey, mockOskariSurvey } from '@src/tests/data/survey';
import { getOskariMapSrid } from './map';
import {
  createSurveySubmission,
  getAnswerEntries,
  getSubmissionsForSurvey,
  getUnfinishedAnswerEntries,
} from './submission';
import { getSurvey } from './survey';

describe('getSurveyTargetSrid SRID propagation', () => {
  let mockDb: ReturnType<typeof buildMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = buildMockDb();
    vi.mocked(getDb).mockReturnValue(mockDb as any);
  });

  describe('getAnswerEntries', () => {
    beforeEach(() => {
      mockDb.oneOrNone.mockResolvedValue({ survey_id: 1 });
    });

    it('passes oskari SRID (3067) to the DB query', async () => {
      vi.mocked(getSurvey).mockResolvedValue(mockOskariSurvey as any);
      vi.mocked(getOskariMapSrid).mockResolvedValue(3067);

      await getAnswerEntries(1);

      expect(getOskariMapSrid).toHaveBeenCalledWith(mockOskariSurvey.mapUrl);
      expect(mockDb.manyOrNone).toHaveBeenCalledWith(
        expect.any(String),
        [1, 3067],
      );
    });

    it('passes DEFAULT_SRID when mapProvider is openlayers', async () => {
      vi.mocked(getSurvey).mockResolvedValue(mockOlSurvey as any);

      await getAnswerEntries(1);

      expect(getOskariMapSrid).not.toHaveBeenCalled();
      expect(mockDb.manyOrNone).toHaveBeenCalledWith(expect.any(String), [
        1,
        DEFAULT_SRID,
      ]);
    });
  });

  describe('getUnfinishedAnswerEntries', () => {
    const token = 'test-token';

    beforeEach(() => {
      // 1st call: submission row, 2nd call: personal info (getPersonalInfo)
      mockDb.oneOrNone
        .mockResolvedValueOnce({ id: 42, survey_id: 1 })
        .mockResolvedValueOnce(null);
    });

    it('passes oskari SRID (3067) to the DB query', async () => {
      vi.mocked(getSurvey).mockResolvedValue(mockOskariSurvey as any);
      vi.mocked(getOskariMapSrid).mockResolvedValue(3067);

      await getUnfinishedAnswerEntries(token);

      expect(getOskariMapSrid).toHaveBeenCalledWith(mockOskariSurvey.mapUrl);
      expect(mockDb.manyOrNone).toHaveBeenCalledWith(expect.any(String), [
        token,
        3067,
      ]);
    });

    it('passes DEFAULT_SRID when mapProvider is openlayers', async () => {
      vi.mocked(getSurvey).mockResolvedValue(mockOlSurvey as any);

      await getUnfinishedAnswerEntries(token);

      expect(getOskariMapSrid).not.toHaveBeenCalled();
      expect(mockDb.manyOrNone).toHaveBeenCalledWith(expect.any(String), [
        token,
        DEFAULT_SRID,
      ]);
    });
  });

  describe('getSubmissionsForSurvey', () => {
    it('passes oskari SRID (3067) to the DB query', async () => {
      vi.mocked(getSurvey).mockResolvedValue(mockOskariSurvey as any);
      vi.mocked(getOskariMapSrid).mockResolvedValue(3067);

      await getSubmissionsForSurvey(1);

      expect(getOskariMapSrid).toHaveBeenCalledWith(mockOskariSurvey.mapUrl);
      expect(mockDb.manyOrNone).toHaveBeenCalledWith(expect.any(String), {
        surveyId: 1,
        targetSrid: 3067,
      });
    });

    it('passes DEFAULT_SRID when mapProvider is openlayers', async () => {
      vi.mocked(getSurvey).mockResolvedValue(mockOlSurvey as any);

      await getSubmissionsForSurvey(1);

      expect(getOskariMapSrid).not.toHaveBeenCalled();
      expect(mockDb.manyOrNone).toHaveBeenCalledWith(expect.any(String), {
        surveyId: 1,
        targetSrid: DEFAULT_SRID,
      });
    });
  });
});

describe('createSurveySubmission budgeting validation', () => {
  let mockDb: ReturnType<typeof buildMockDb>;

  const sectionId = 10;

  const budgetingQuestionRow = {
    id: sectionId,
    title: { fi: 'Budjetti', en: 'Budget', sv: 'Budget' },
    totalBudget: '100',
    requireFullAllocation: true,
    inputMode: 'absolute',
    type: 'budgeting' as const,
    targets: [{ name: { fi: 'A', en: 'A', sv: 'A' }, price: 10 }],
  };

  function primeQueries(budgetingRows: unknown[]) {
    mockDb.manyOrNone
      .mockResolvedValueOnce([]) // validateEntriesByAnswerLimits
      .mockResolvedValueOnce([]) // validateEntriesByIsRequired
      .mockResolvedValueOnce(budgetingRows) // validateBudgetingEntries
      .mockResolvedValueOnce([{ id: 101 }]); // inserted answer_entry ids
    mockDb.oneOrNone.mockResolvedValueOnce(null); // no existing unfinished submission
    mockDb.one.mockResolvedValueOnce({
      id: 1,
      unfinished_token: null,
      updated_at: new Date('2024-01-01'),
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = buildMockDb();
    vi.mocked(getDb).mockReturnValue(mockDb);
  });

  it('allows a partially allocated "pieces" mode budget even when requireFullAllocation is set', async () => {
    primeQueries([{ ...budgetingQuestionRow, budgetingMode: 'pieces' }]);

    // 1 piece bought out of a possible 10 (price 10, totalBudget 100) - not fully allocated
    const answerEntries: SubmissionAnswerEntry[] = [
      { sectionId, type: 'budgeting', value: [1] },
    ];

    await expect(
      createSurveySubmission(1, answerEntries, null, false, 'fi'),
    ).resolves.toMatchObject({ id: 1 });
  });

  it('rejects a partially allocated "direct" mode budget when requireFullAllocation is set', async () => {
    primeQueries([{ ...budgetingQuestionRow, budgetingMode: 'direct' }]);

    // Only 40 of the 100 total budget allocated
    const answerEntries: SubmissionAnswerEntry[] = [
      { sectionId, type: 'budgeting', value: [40] },
    ];

    await expect(
      createSurveySubmission(1, answerEntries, null, false, 'fi'),
    ).rejects.toMatchObject({
      status: 400,
      message_code: 'BUDGET_NOT_FULLY_ALLOCATED',
    });
  });
});

describe('createSurveySubmission attachment malware scanning', () => {
  let mockDb: ReturnType<typeof buildMockDb>;

  const sectionId = 20;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = buildMockDb();
    vi.mocked(getDb).mockReturnValue(mockDb);
  });

  it('scans each attachment file buffer before it can be persisted', async () => {
    const fileBuffer = Buffer.from('file contents');
    vi.mocked(bufferFromDataUrl).mockReturnValue(fileBuffer);
    vi.mocked(scanBuffer).mockResolvedValue(undefined);
    // Fail fast on the next step so the test doesn't need to mock the rest
    // of the submission-creation transaction.
    mockDb.tx.mockRejectedValue(new Error('stop after validation'));

    const answerEntries: SubmissionAnswerEntry[] = [
      {
        sectionId,
        type: 'attachment',
        value: [
          {
            fileName: 'file.pdf',
            fileString: 'data:application/pdf;base64,AAAA',
          },
        ],
      },
    ];

    await expect(
      createSurveySubmission(1, answerEntries, null, false, 'fi'),
    ).rejects.toThrow('stop after validation');

    expect(scanBuffer).toHaveBeenCalledWith(fileBuffer);
  });

  it('rejects the submission when malware is detected in an attachment', async () => {
    const fileBuffer = Buffer.from('infected contents');
    vi.mocked(bufferFromDataUrl).mockReturnValue(fileBuffer);
    vi.mocked(scanBuffer).mockRejectedValue(
      Object.assign(new Error('File failed malware scan'), {
        status: 400,
        message_code: 'malware_detected',
      }),
    );

    const answerEntries: SubmissionAnswerEntry[] = [
      {
        sectionId,
        type: 'attachment',
        value: [
          {
            fileName: 'file.pdf',
            fileString: 'data:application/pdf;base64,AAAA',
          },
        ],
      },
    ];

    await expect(
      createSurveySubmission(1, answerEntries, null, false, 'fi'),
    ).rejects.toMatchObject({
      status: 400,
      message_code: 'malware_detected',
    });

    // The DB transaction must never start if the malware scan rejects.
    expect(mockDb.tx).not.toHaveBeenCalled();
  });
});
