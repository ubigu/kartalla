import {
  AnswerEntry,
  LanguageCode,
  PersonalInfoAnswer,
  SectionOption,
  Survey,
  SurveyFollowUpSection,
  SurveyMapQuestion,
  SurveyMatrixQuestion,
  SurveyPageSection,
} from '@interfaces/survey';
import logger from '@src/logger';
import useTranslations from '@src/translations/useTranslations';
import moment from 'moment';
import PDFDocument from 'pdfkit';
import PdfPrinter from 'pdfmake';
import { Content } from 'pdfmake/interfaces';

import {
  ScreenshotJobData,
  ScreenshotJobReturnData,
  getScreenshots,
} from './screenshot';
import { getFile, getOptionsForSurvey } from './survey';
import { formatPhoneNumber } from '@src/utils';

const fonts = {
  Courier: {
    normal: 'Courier',
    bold: 'Courier-Bold',
    italics: 'Courier-Oblique',
    bolditalics: 'Courier-BoldOblique',
  },
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
  Times: {
    normal: 'Times-Roman',
    bold: 'Times-Bold',
    italics: 'Times-Italic',
    bolditalics: 'Times-BoldItalic',
  },
  Symbol: {
    normal: 'Symbol',
  },
  ZapfDingbats: {
    normal: 'ZapfDingbats',
  },
};

/**
 * Converts a PDFDocument to a Buffer
 * @param pdf The PDFDocument to convert
 * @returns The Buffer containing the PDF
 */
async function convertPdfToBuffer(pdf: typeof PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdf.on('data', (chunk) => {
      chunks.push(chunk);
    });
    pdf.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    pdf.on('error', reject);
    pdf.end();
  });
}

function findFollowUpMapQuestion(
  sections: SurveyPageSection[],
  entryId: number,
): SurveyMapQuestion {
  let followUpSectionIndex: number;
  const sectionIndex = sections.findIndex((section) =>
    section.followUpSections?.some((followUpSection, followUpIndex) => {
      if (followUpSection.id === entryId) {
        followUpSectionIndex = followUpIndex;
        return true;
      }
      return false;
    }),
  );

  // Entry id is already only for map questions
  return sections[sectionIndex].followUpSections[
    followUpSectionIndex
  ] as SurveyMapQuestion;
}

function prepareMapAnswers(
  survey: Survey,
  answerEntries: AnswerEntry[],
): ScreenshotJobData {
  return answerEntries
    .filter(
      (entry): entry is AnswerEntry & { type: 'map' } => entry.type === 'map',
    )
    .reduce(
      (jobData, entry) => {
        const page = survey.pages.find((page) =>
          page.sections.some(
            (section) =>
              section.id === entry.sectionId ||
              section.followUpSections?.some(
                (followUpSection) => followUpSection.id === entry.sectionId,
              ),
          ),
        );
        return {
          ...jobData,
          answers: [
            ...jobData.answers,
            ...entry.value.map((answer, index) => ({
              sectionId: entry.sectionId,
              index,
              feature: answer.geometry,
              visibleLayerIds: answer.mapLayers ?? page.sidebar.mapLayers,
              question:
                page.sections.find(
                  (section): section is SurveyMapQuestion =>
                    section.id === entry.sectionId,
                ) ?? findFollowUpMapQuestion(page.sections, entry.sectionId),
            })),
          ],
        };
      },
      {
        mapUrl: survey.mapUrl,
        answers: [],
      } as ScreenshotJobData,
    );
}

async function getFrontPage(
  survey: Survey,
  submissionId: number,
  timestamp: Date,
  answerEntries: AnswerEntry[],
  language: LanguageCode,
): Promise<Content> {
  const tr = useTranslations(language);

  const personalInfoQuestion = survey.pages
    .map((page) =>
      page.sections.find((section) => section.type === 'personal-info'),
    )
    .find(Boolean);

  const personalInfoAnswer = answerEntries.find(
    (entry) => entry.type === 'personal-info',
  );

  function getPersonalInfoLabels(personalInfoQuestion) {
    if (!personalInfoQuestion || !personalInfoAnswer) {
      return [];
    }
    const labelMap = {
      askName: tr.PersonalInfo.name,
      askEmail: tr.PersonalInfo.email,
      askPhone: tr.PersonalInfo.phone,
    };

    const answerValuesForLabelsMap = {
      askName: (personalInfoAnswer.value as PersonalInfoAnswer).name,
      askEmail: (personalInfoAnswer.value as PersonalInfoAnswer).email,
      askPhone: formatPhoneNumber(
        (personalInfoAnswer.value as PersonalInfoAnswer).phone,
      ),
    };

    const labels: Content[] = [
      {
        text: `${tr.PersonalInfo.label}:`,
        fontSize: 12,
        bold: true,
        margin: [0, 10, 0, 8],
      },
    ];

    Object.entries(personalInfoQuestion).forEach(
      ([personalInfoProperty, isIncluded]) => {
        if (personalInfoProperty in labelMap && isIncluded) {
          labels.push({
            text: `${labelMap[personalInfoProperty]}: ${answerValuesForLabelsMap[personalInfoProperty]}`,
            fontSize: 12,
            margin: [0, 0, 0, 8],
          });
        }
      },
    );

    return labels;
  }

  const [logo, banner] = await Promise.all([
    survey.marginImages.top.imageUrl
      ? (await getFile(survey.marginImages.top.imageUrl)).data.toString()
      : null,
    survey.marginImages.bottom.imageUrl
      ? (await getFile(survey.marginImages.bottom.imageUrl)).data.toString()
      : null,
  ]);

  const attachmentFileNames = answerEntries
    .filter(
      (entry): entry is AnswerEntry & { type: 'attachment' } =>
        entry.type === 'attachment',
    )
    .map((entry) => entry.value[0]?.fileName)
    .filter(Boolean);
  return [
    logo && {
      svg: logo,
      fit: [220, 150],
      absolutePosition: { x: 360, y: 20 },
    },
    banner && {
      svg: banner,
      fit: [250, 100],
      absolutePosition: { x: 40, y: 700 },
    },
    {
      text: '',
      margin: [0, 300, 0, 0],
    },
    {
      headlineLevel: 1,
      text: survey.title?.[language]?.toLocaleUpperCase(),
      fontSize: 15,
      bold: true,
      margin: [0, 0, 0, 10],
    },
    {
      headlineLevel: 2,
      text: survey.subtitle?.[language],
      fontSize: 12,
      bold: true,
      margin: [0, 0, 0, 10],
    },
    // Add the remaining "info fields" from one array as they have identical styling
    [
      ...(survey.email?.info ?? []).map(
        (item) => `${item.name?.[language]}: ${item.value?.[language]}`,
      ),
      `${tr.submissionId}: ${submissionId}`,
      `${tr.responseTime}: ${moment(timestamp).format('DD.MM.YYYY HH:mm')}`,
      attachmentFileNames.length > 0 &&
        `${tr.attachments}: ${attachmentFileNames.join(', ')}`,
    ]
      .filter(Boolean)
      .map((text) => ({
        text,
        fontSize: 12,
        margin: [0, 0, 0, 10],
      })),
    getPersonalInfoLabels(personalInfoQuestion),
    { text: '', pageBreak: 'after' },
  ];
}

function getOptionSelectionText(
  value: string | number,
  options: SectionOption[],
  language: LanguageCode,
) {
  const tr = useTranslations(language);

  if (typeof value === 'string') {
    return `${tr.somethingElse}: ${value}`;
  }
  const option = options.find((option) => option.id === value);
  return option?.text[language] ?? '-';
}

function getContent(
  answerEntry: AnswerEntry,
  sections: SurveyPageSection[],
  screenshots: ScreenshotJobReturnData[],
  options: SectionOption[],
  isSubQuestion = false,
  isFollowUpSection = false,
  language: LanguageCode,
): Content[] {
  if (!answerEntry) {
    return [];
  }
  const tr = useTranslations(language);
  const sectionIndex = sections.findIndex(
    (section) => answerEntry.sectionId === section.id,
  );
  const section = sections[sectionIndex];

  const heading: Content = {
    text: section.title?.[language],
    style: isSubQuestion
      ? 'subQuestionTitle'
      : isFollowUpSection
        ? 'followUpSectionTitle'
        : 'questionTitle',
  };

  const style = isSubQuestion
    ? 'subQuestionAnswer'
    : isFollowUpSection
      ? 'followUpSectionAnswer'
      : 'answer';

  switch (answerEntry.type) {
    case 'free-text':
      return [
        heading,
        {
          text: answerEntry.value,
          style,
        },
      ];
    case 'radio': {
      return [
        heading,
        {
          text: getOptionSelectionText(answerEntry.value, options, language),
          style,
        },
      ];
    }
    case 'checkbox': {
      return [
        heading,
        ...answerEntry.value.map((value) => ({
          text: getOptionSelectionText(value, options, language),
          style,
        })),
      ];
    }
    case 'grouped-checkbox': {
      return [
        heading,
        ...answerEntry.value.map((value) => ({
          text: getOptionSelectionText(value, options, language),
          style,
        })),
      ];
    }
    case 'numeric':
    case 'slider': {
      return [
        heading,
        {
          text: answerEntry.value == null ? '-' : String(answerEntry.value),
          style,
        },
      ];
    }
    case 'matrix': {
      const question = section as SurveyMatrixQuestion;
      return [
        heading,
        {
          ul: question.subjects.map((subject, index) => ({
            text: `${subject?.[language]}: ${
              answerEntry.value[index] === '-1'
                ? tr.dontKnow
                : answerEntry.value[index] == null
                  ? '-'
                  : question.classes[Number(answerEntry.value[index])]?.[
                      language
                    ] ?? '-'
            }`,
            style,
          })),
        },
      ];
    }
    case 'multi-matrix': {
      const question = section as SurveyMatrixQuestion;

      return [
        heading,
        {
          ul: question.subjects.map((subject, index) => ({
            text: `${subject?.[language]}: ${
              answerEntry.value[index].length > 0
                ? answerEntry.value[index]
                    .map((classIndex: string) =>
                      classIndex === '-1'
                        ? tr.dontKnow
                        : question.classes[Number(classIndex)]?.[language],
                    )
                    .join(', ')
                : '-'
            }`,
            style,
          })),
        },
      ];
    }
    case 'sorting': {
      return [
        heading,
        !answerEntry.value
          ? {
              text: '-',
              style,
            }
          : {
              ol: answerEntry.value.map((value) => ({
                text: `${getOptionSelectionText(value, options, language)}`,
                style,
              })),
            },
      ];
    }
    case 'map': {
      if (!answerEntry.value.length) {
        return [heading, { text: '-', style }];
      }
      return [
        heading,
        ...answerEntry.value.map((answer, index) => {
          const screenshot = screenshots.find(
            (screenshot) =>
              screenshot.sectionId === answerEntry.sectionId &&
              screenshot.index === index,
          );
          return {
            columns: [
              {
                image:
                  'data:image/png;base64,' +
                  screenshot.image.toString('base64'),
                width: 200,
                style,
              },
              [
                { text: 'Merkintä:', style: 'subQuestionTitle' },
                {
                  text: `${index + 1}/${answerEntry.value.length}`,
                  style: 'subQuestionAnswer',
                },
                { text: 'Näkyvät tasot:', style: 'subQuestionTitle' },
                {
                  text: !screenshot.layerNames.length
                    ? '-'
                    : screenshot.layerNames.join(', '),
                  style: 'subQuestionAnswer',
                },
                ...answer.subQuestionAnswers.map((subQuestionAnswer) => {
                  const mapQuestion = section as SurveyMapQuestion;
                  return getContent(
                    subQuestionAnswer,
                    mapQuestion.subQuestions,
                    [],
                    options,
                    true,
                    false,
                    language,
                  );
                }),
              ],
            ],
          };
        }),
      ];
    }
    // Unlisted types are ignored in the PDF
    default:
      return [];
  }
}

/**
 * Generates a PDF for a single submission.
 * @param survey Survey
 * @param submission Info about the newly created submission
 * @param answerEntries Answer entries for the submission
 * @returns
 */
export async function generatePdf(
  survey: Survey,
  submission: { id: number; timestamp: Date },
  answerEntries: AnswerEntry[],
  language: LanguageCode,
) {
  const start = Date.now();
  const options = await getOptionsForSurvey(survey.id);

  const sections = survey.pages.reduce(
    (sections, page) => [...sections, ...page.sections],
    [] as SurveyPageSection[],
  );

  const followUpSections = sections.reduce(
    (followUps, section) => [
      ...followUps,
      ...(section?.followUpSections ?? []),
    ],
    [] as SurveyFollowUpSection[],
  );

  const screenshotJobData = prepareMapAnswers(survey, answerEntries);
  const screenshots = await getScreenshots(screenshotJobData);

  logger.debug(
    `Fetched ${screenshots.length} screenshots in ${Date.now() - start}ms`,
  );
  const content: Content = [
    await getFrontPage(
      survey,
      submission.id,
      submission.timestamp,
      answerEntries,
      language,
    ),
    ...sections.map((section) => [
      ...getContent(
        answerEntries.find((entry) => entry.sectionId === section.id),
        sections,
        screenshots,
        options,
        false,
        false,
        language,
      ),
      ...(section?.followUpSections?.map((section) =>
        getContent(
          answerEntries.find((entry) => entry.sectionId === section.id),
          followUpSections,
          screenshots,
          options,
          false,
          true,
          language,
        ),
      ) ?? []),
    ]),
  ];

  const document = new PdfPrinter(fonts).createPdfKitDocument({
    content,
    defaultStyle: {
      font: 'Helvetica',
    },
    styles: {
      questionTitle: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      answer: {
        fontSize: 12,
        margin: [0, 0, 0, 20],
      },
      subQuestionTitle: {
        fontSize: 12,
        bold: true,
        margin: [5, 0, 0, 5],
      },
      subQuestionAnswer: {
        margin: [5, 0, 0, 5],
        fontSize: 12,
      },
      followUpSectionTitle: {
        fontSize: 15,
        color: '#696969',
        bold: true,
        margin: [0, 0, 0, 10],
      },
      followUpSectionAnswer: {
        margin: [0, 0, 0, 15],
        fontSize: 12,
      },
    },
  });
  return convertPdfToBuffer(document);
}
