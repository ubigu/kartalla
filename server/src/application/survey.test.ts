import { Survey } from '@interfaces/survey';
import { User } from '@interfaces/user';
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

vi.mock('@src/user', () => ({
  dbOrganizationIdToOrganization: vi.fn((id: string) => ({ id, name: id })),
  isAdmin: vi.fn().mockReturnValue(false),
  isSuperUser: vi.fn().mockReturnValue(false),
}));

import { getDb } from '@src/database';
import { createSurvey, updateSurvey } from './survey';

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

describe('createSurvey', () => {
  let mockDb: any;

  const mockSurveyRow = {
    id: 1,
    name: '',
    title: { fi: '' },
    subtitle: { fi: '' },
    description: { fi: '' },
    author: '',
    author_unit: '',
    author_id: 'user-1',
    editors: [],
    viewers: [],
    map_url: '',
    start_date: null,
    end_date: null,
    allow_test_survey: false,
    display_privacy_statement: false,
    created_at: new Date(),
    updated_at: new Date(),
    thanks_page_title: { fi: '' },
    thanks_page_text: { fi: '' },
    thanks_page_image_url: null,
    background_image_url: null,
    top_margin_image_url: null,
    bottom_margin_image_url: null,
    section_title_color: '#000000',
    email_enabled: false,
    email_auto_send_to: [],
    email_subject: { fi: '' },
    email_body: { fi: '' },
    email_info: [],
    email_include_personal_info: false,
    email_include_margin_images: false,
    email_required: false,
    allow_saving_unfinished: false,
    localisation_enabled: false,
    organization: 'org-1',
    tags: [],
    is_archived: false,
  };

  const mockPageRow = {
    id: 10,
    survey_id: 1,
    idx: 0,
    title: { fi: '' },
    sidebar_type: 'none',
    sidebar_map_layers: '[]',
    sidebar_image_url: null,
    sidebar_image_alt_text: { fi: '' },
    sidebar_image_size: 'fitted',
    sidebar_image_attributions: '',
  };

  const baseUser: User = {
    id: 'user-1',
    fullName: 'Test User',
    email: 'test@test.com',
    organizations: [{ id: 'org-1', name: 'Test Org' }],
    roles: ['organization_user'],
    groups: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      one: vi.fn(),
      none: vi.fn().mockResolvedValue(undefined),
      manyOrNone: vi.fn().mockResolvedValue([]),
      oneOrNone: vi.fn().mockResolvedValue(null),
      any: vi.fn().mockResolvedValue([]),
      tx: vi.fn().mockImplementation(async (callback: any) => callback(mockDb)),
    };

    (getDb as ReturnType<typeof vi.fn>).mockReturnValue(mockDb);
  });

  it('should use user defaultLanguage when set', async () => {
    const user: User = { ...baseUser, defaultLanguage: 'en' };
    mockDb.one
      .mockResolvedValueOnce({ ...mockSurveyRow, languages: ['en'] })
      .mockResolvedValueOnce(mockPageRow);

    await createSurvey(user);

    const insertParams = mockDb.one.mock.calls[0][1];
    expect(insertParams[2]).toEqual(['en']);
  });

  it('should fall back to DEFAULT_LANGUAGE when user has no defaultLanguage', async () => {
    mockDb.one
      .mockResolvedValueOnce({ ...mockSurveyRow, languages: ['fi'] })
      .mockResolvedValueOnce(mockPageRow);

    await createSurvey(baseUser);

    const insertParams = mockDb.one.mock.calls[0][1];
    expect(insertParams[2]).toEqual(['fi']);
  });
});
