import { DEFAULT_SRID } from '@src/constants';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@src/database', () => ({
  getDb: vi.fn(),
}));

vi.mock('./survey', () => ({
  getSurvey: vi.fn(),
}));

vi.mock('./map', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./map')>();
  return {
    ...actual,
    getSurveyTargetSrid: vi.fn(),
    getAvailableOskariMapLayers: vi.fn().mockResolvedValue([]),
  };
});

import { getDb } from '@src/database';
import { getGeometryDBEntriesAsGeoJSON } from './answerGeometry';
import { getSurveyTargetSrid } from './map';
import { getSurvey } from './survey';
import { buildMockDb } from '@src/tests/helpers';
import { mockOlSurvey, mockOskariSurvey } from '@src/tests/data/survey';

describe('getGeometryDBEntriesAsGeoJSON', () => {
  let mockDb: ReturnType<typeof buildMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = buildMockDb();
    vi.mocked(getDb).mockReturnValue(mockDb);
  });

  it('passes oskari SRID (3067) to the geometry DB query', async () => {
    vi.mocked(getSurvey).mockResolvedValue(mockOskariSurvey as any);
    vi.mocked(getSurveyTargetSrid).mockResolvedValue(3067);

    await getGeometryDBEntriesAsGeoJSON(1);

    expect(getSurveyTargetSrid).toHaveBeenCalledWith(mockOskariSurvey);
    expect(mockDb.manyOrNone).toHaveBeenCalledWith(
      expect.any(String),
      [1, 3067],
    );
  });

  it('passes DEFAULT_SRID when mapProvider is openlayers', async () => {
    vi.mocked(getSurvey).mockResolvedValue(mockOlSurvey as any);
    vi.mocked(getSurveyTargetSrid).mockResolvedValue(DEFAULT_SRID);

    await getGeometryDBEntriesAsGeoJSON(1);

    expect(getSurveyTargetSrid).toHaveBeenCalledWith(mockOlSurvey);
    expect(mockDb.manyOrNone).toHaveBeenCalledWith(expect.any(String), [
      1,
      DEFAULT_SRID,
    ]);
  });
});
