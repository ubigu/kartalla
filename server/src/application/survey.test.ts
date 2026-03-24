import { Survey } from '@interfaces/survey';
import {
  createMockPersonalInfoQuestion,
  createMockSurvey,
} from '@src/tests/data/survey';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestError } from '../error';

vi.mock('@src/database', () => ({
  getDb: vi.fn(),
  getColumnSet: vi.fn(),
  getGeoJSONColumn: vi.fn(),
  getMultiInsertQuery: vi.fn(),
  getMultiUpdateQuery: vi.fn(),
  encryptionKey: 'test-key',
}));

vi.mock('@src/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { getDb } from '@src/database';
import { updateSurvey } from './survey';

describe('updateSurvey', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const mockDb = {
      one: vi.fn().mockResolvedValue({}),
      none: vi.fn().mockResolvedValue(undefined),
      manyOrNone: vi.fn().mockResolvedValue([]),
      oneOrNone: vi.fn().mockResolvedValue(null),
      any: vi.fn().mockResolvedValue([]),
      tx: vi.fn().mockImplementation(async (callback: any) => callback(mockDb)),
    };

    (getDb as ReturnType<typeof vi.fn>).mockReturnValue(mockDb);
  });

  it('should throw BadRequestError when trying to add two personal info questions', async () => {
    const survey = createMockSurvey(1, 100);

    const surveyWithTwoPersonalInfoQuestions: Survey = {
      ...survey,
      pages: [
        {
          ...survey.pages![0],
          sections: [
            createMockPersonalInfoQuestion(-1),
            createMockPersonalInfoQuestion(-2),
          ],
          conditions: {},
        },
      ],
    };

    await expect(
      updateSurvey(surveyWithTwoPersonalInfoQuestions),
    ).rejects.toThrow(BadRequestError);
    await expect(
      updateSurvey(surveyWithTwoPersonalInfoQuestions),
    ).rejects.toThrow('Section count limits not respected.');
  });

  it('should throw BadRequestError when trying to add two personal info questions as follow-up questions', async () => {
    const survey = createMockSurvey(1, 100);

    const surveyWithTwoPersonalInfoFollowUps: Survey = {
      ...survey,
      pages: [
        {
          ...survey.pages![0],
          sections: [
            {
              id: -1,
              type: 'radio',
              title: { fi: 'Test radio', en: '', se: '' },
              isRequired: false,
              options: [{ text: { fi: 'first', en: '', se: '' } }],
              allowCustomAnswer: false,
              followUpSections: [
                {
                  ...createMockPersonalInfoQuestion(-2),
                  conditions: { equals: [1], lessThan: [], greaterThan: [] },
                },
                {
                  ...createMockPersonalInfoQuestion(-3),
                  conditions: { equals: [1], lessThan: [], greaterThan: [] },
                },
              ],
            },
          ],
          conditions: {},
        },
      ],
    };

    await expect(
      updateSurvey(surveyWithTwoPersonalInfoFollowUps),
    ).rejects.toThrow(BadRequestError);
    await expect(
      updateSurvey(surveyWithTwoPersonalInfoFollowUps),
    ).rejects.toThrow('Section count limits not respected.');
  });
});
