import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SRID } from '@src/constants';

vi.mock('@src/database', () => ({
  getDb: vi.fn(),
  getColumnSet: vi.fn(),
  getGeoJSONColumn: vi.fn(),
  getMultiInsertQuery: vi.fn(),
  encryptionKey: 'test-key',
}));

vi.mock('@src/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@src/fileValidation', () => ({
  bufferFromDataUrl: vi.fn(),
  validateBinaryFile: vi.fn(),
  validateDataUrl: vi.fn(),
  validateTextFile: vi.fn(),
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

import { getDb } from '@src/database';
import { getOskariMapSrid } from './map';
import { getSurvey } from './survey';
import { buildMockDb } from '@src/tests/helpers';
import {
  getAnswerEntries,
  getSubmissionsForSurvey,
  getUnfinishedAnswerEntries,
} from './submission';

const oskariSurvey = {
  mapProvider: 'oskari',
  mapUrl: 'https://oskari.example.com',
};
const olSurvey = { mapProvider: 'openlayers', mapUrl: '' };

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
      vi.mocked(getSurvey).mockResolvedValue(oskariSurvey as any);
      vi.mocked(getOskariMapSrid).mockResolvedValue(3067);

      await getAnswerEntries(1);

      expect(getOskariMapSrid).toHaveBeenCalledWith(oskariSurvey.mapUrl);
      expect(mockDb.manyOrNone).toHaveBeenCalledWith(
        expect.any(String),
        [1, 3067],
      );
    });

    it('passes DEFAULT_SRID when mapProvider is openlayers', async () => {
      vi.mocked(getSurvey).mockResolvedValue(olSurvey as any);

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
      vi.mocked(getSurvey).mockResolvedValue(oskariSurvey as any);
      vi.mocked(getOskariMapSrid).mockResolvedValue(3067);

      await getUnfinishedAnswerEntries(token);

      expect(getOskariMapSrid).toHaveBeenCalledWith(oskariSurvey.mapUrl);
      expect(mockDb.manyOrNone).toHaveBeenCalledWith(expect.any(String), [
        token,
        3067,
      ]);
    });

    it('passes DEFAULT_SRID when mapProvider is openlayers', async () => {
      vi.mocked(getSurvey).mockResolvedValue(olSurvey as any);

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
      vi.mocked(getSurvey).mockResolvedValue(oskariSurvey as any);
      vi.mocked(getOskariMapSrid).mockResolvedValue(3067);

      await getSubmissionsForSurvey(1);

      expect(getOskariMapSrid).toHaveBeenCalledWith(oskariSurvey.mapUrl);
      expect(mockDb.manyOrNone).toHaveBeenCalledWith(expect.any(String), {
        surveyId: 1,
        targetSrid: 3067,
      });
    });

    it('passes DEFAULT_SRID when mapProvider is openlayers', async () => {
      vi.mocked(getSurvey).mockResolvedValue(olSurvey as any);

      await getSubmissionsForSurvey(1);

      expect(getOskariMapSrid).not.toHaveBeenCalled();
      expect(mockDb.manyOrNone).toHaveBeenCalledWith(expect.any(String), {
        surveyId: 1,
        targetSrid: DEFAULT_SRID,
      });
    });
  });
});
