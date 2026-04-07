import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('pdfmake', () => {
  const createPdf = vi.fn();
  const setFonts = vi.fn();
  return {
    default: { createPdf, setFonts },
    createPdf,
    setFonts,
  };
});

vi.mock('./screenshot', () => ({
  getScreenshots: vi.fn(),
}));

vi.mock('./survey', () => ({
  getFile: vi.fn(),
  getImageOptionsForSurvey: vi.fn(),
  getOptionsForSurvey: vi.fn(),
}));

vi.mock('@src/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { AnswerEntry, Survey, SurveyPageSection } from '@interfaces/survey';
import { createMockSurvey } from '@src/tests/data/survey';
import { createPdf } from 'pdfmake';
import { generatePdf } from './pdf-generator';
import { getScreenshots } from './screenshot';
import {
  getFile,
  getImageOptionsForSurvey,
  getOptionsForSurvey,
} from './survey';

const LANG = 'fi' as const;
const MOCK_PDF = Buffer.from('mock-pdf');
const SUBMISSION = { id: 42, timestamp: new Date('2024-06-01T12:00:00Z') };

function makeSurveyWithSections(sections: SurveyPageSection[]): Survey {
  const base = createMockSurvey(1, 100);
  return { ...base, pages: [{ ...base.pages![0], sections }] };
}

beforeEach(() => {
  vi.clearAllMocks();
  (createPdf as ReturnType<typeof vi.fn>).mockReturnValue({
    getBuffer: vi.fn().mockResolvedValue(MOCK_PDF),
  });
  (getScreenshots as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (getImageOptionsForSurvey as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (getOptionsForSurvey as ReturnType<typeof vi.fn>).mockResolvedValue([]);
});

describe('generatePdf', () => {
  it('returns a Buffer', async () => {
    const survey = makeSurveyWithSections([]);
    const result = await generatePdf(survey, SUBMISSION, [], LANG);
    expect(result).toBeInstanceOf(Buffer);
  });

  it('handles survey without pages', async () => {
    const survey = { ...createMockSurvey(1, 100), pages: undefined };
    await expect(generatePdf(survey, SUBMISSION, [], LANG)).resolves.toEqual(
      MOCK_PDF,
    );
  });

  it('silently skips answers whose section is not found', async () => {
    const survey = makeSurveyWithSections([]);
    const answers: AnswerEntry[] = [
      { sectionId: 999, type: 'free-text', value: 'orphan answer' },
    ];
    await generatePdf(survey, SUBMISSION, answers, LANG);
    const content = JSON.stringify(
      (createPdf as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]?.content,
    );
    expect(content).not.toContain('orphan answer');
  });

  it('fetches logo and banner when includeMarginImages is true', async () => {
    const survey: Survey = {
      ...makeSurveyWithSections([]),
      marginImages: {
        top: { imageUrl: 'top.svg' },
        bottom: { imageUrl: 'bottom.svg' },
      },
      email: {
        ...createMockSurvey(1, 100).email,
        includeMarginImages: true,
      },
    };
    (getFile as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: Buffer.from('<svg/>'),
      mimeType: 'image/svg+xml',
    });

    await generatePdf(survey, SUBMISSION, [], LANG);
    expect(getFile).toHaveBeenCalledWith('top.svg');
    expect(getFile).toHaveBeenCalledWith('bottom.svg');
  });

  it('does not fetch images when includeMarginImages is false', async () => {
    const survey = makeSurveyWithSections([]);
    await generatePdf(survey, SUBMISSION, [], LANG);
    expect(getFile).not.toHaveBeenCalled();
  });
});
