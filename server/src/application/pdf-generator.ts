import {
  AnswerEntry,
  LanguageCode,
  PersonalInfoAnswer,
  SectionImageOption,
  SectionOption,
  Survey,
  SurveyBudgetingQuestion,
  SurveyFollowUpSection,
  SurveyGeoBudgetingQuestion,
  SurveyMapQuestion,
  SurveyMatrixQuestion,
  SurveyPageSection,
  SurveyPersonalInfoQuestion,
} from '@interfaces/survey';
import logger from '@src/logger';
import useTranslations from '@src/translations/useTranslations';
import moment from 'moment';
import PDFDocument from 'pdfkit';
import PdfPrinter from 'pdfmake';
import { Content } from 'pdfmake/interfaces';

import { formatPhoneNumber } from '@src/utils';
import {
  ScreenshotJobData,
  ScreenshotJobReturnData,
  getScreenshots,
} from './screenshot';
import {
  getFile,
  getImageOptionsForSurvey,
  getOptionsForSurvey,
} from './survey';

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

function prepareMapAndGeoBudgetingAnswers(
  survey: Survey,
  answerEntries: AnswerEntry[],
  language: LanguageCode,
): ScreenshotJobData {
  return answerEntries
    .filter(
      (entry): entry is AnswerEntry & { type: 'map' | 'geo-budgeting' } =>
        entry.type === 'map' || entry.type === 'geo-budgeting',
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
            ...entry.value.map((answer, index) => {
              const question =
                entry.type === 'map'
                  ? (page.sections.find(
                      (section): section is SurveyMapQuestion =>
                        section.id === entry.sectionId,
                    ) ??
                    findFollowUpMapQuestion(page.sections, entry.sectionId))
                  : page.sections.find(
                      (section): section is SurveyGeoBudgetingQuestion =>
                        section.id === entry.sectionId,
                    );

              // Get marker icon for geobudgeting questions
              let markerIcon: string | undefined;
              if (
                entry.type === 'geo-budgeting' &&
                question &&
                'targets' in question
              ) {
                const geoBudgetingQuestion =
                  question as SurveyGeoBudgetingQuestion;
                const targetIndex = (answer as any).targetIndex;
                const target = geoBudgetingQuestion.targets[targetIndex];
                if (target && target.icon) {
                  markerIcon = target.icon;
                }
              }

              return {
                sectionId: entry.sectionId,
                index,
                feature: answer.geometry,
                visibleLayerIds:
                  entry.type === 'map' && (answer as any).mapLayers
                    ? (answer as any).mapLayers
                    : page.sidebar.mapLayers,
                question,
                markerIcon,
              };
            }),
          ],
        };
      },
      {
        mapUrl: survey.localizedMapUrls[language],
        language,
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
    .find<SurveyPersonalInfoQuestion>(
      (section): section is SurveyPersonalInfoQuestion => Boolean(section),
    );

  const personalInfoAnswer = answerEntries.find(
    (entry) => entry.type === 'personal-info',
  );

  function getPersonalInfoLabels(
    personalInfoQuestion: SurveyPersonalInfoQuestion,
  ) {
    if (!personalInfoQuestion || !personalInfoAnswer) {
      return [];
    }

    const labelMap = {
      askName: tr.PersonalInfo.name,
      askEmail: tr.PersonalInfo.email,
      askPhone: tr.PersonalInfo.phone,
      askAddress: tr.PersonalInfo.address,
      askCustom: personalInfoQuestion.customLabel?.[language],
    };

    const answerValuesForLabelsMap = {
      askName: (personalInfoAnswer.value as PersonalInfoAnswer).name,
      askEmail: (personalInfoAnswer.value as PersonalInfoAnswer).email,
      askPhone: formatPhoneNumber(
        (personalInfoAnswer.value as PersonalInfoAnswer).phone,
      ),
      askAddress: (personalInfoAnswer.value as PersonalInfoAnswer).address,
      askCustom: (personalInfoAnswer.value as PersonalInfoAnswer).custom,
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

  const [logo, banner] = survey.email.includeMarginImages
    ? await Promise.all([
        survey.marginImages.top.imageUrl
          ? (await getFile(survey.marginImages.top.imageUrl)).data.toString()
          : null,
        survey.marginImages.bottom.imageUrl
          ? (await getFile(survey.marginImages.bottom.imageUrl)).data.toString()
          : null,
      ])
    : [];

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

function getOptionSelectionImage(
  value: string | number,
  options: (SectionImageOption & { image?: string })[],
) {
  const option = options.find((option) => option.id === value);
  return option?.image;
}

function getContent(
  answerEntry: AnswerEntry,
  sections: SurveyPageSection[],
  screenshots: ScreenshotJobReturnData[],
  options: SectionOption[],
  optionsWithImages: (SectionImageOption & { image?: string })[],
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
    case 'radio-image': {
      const image = getOptionSelectionImage(
        answerEntry.value,
        optionsWithImages,
      );
      return [
        heading,
        {
          columns: [
            [
              {
                text: getOptionSelectionText(
                  answerEntry.value,
                  optionsWithImages,
                  language,
                ),
                style,
              },
              ...(image
                ? [
                    {
                      image,
                      width: 200,
                      style,
                    },
                  ]
                : []),
            ],
          ],
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
                  : (question.classes[Number(answerEntry.value[index])]?.[
                      language
                    ] ?? '-')
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
                    optionsWithImages,
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
    case 'budgeting': {
      const question = section as SurveyBudgetingQuestion;
      const inputMode = question.inputMode ?? 'absolute';

      // Helper function to convert stored values to monetary amounts for display
      const getMonetaryValue = (storedValue: number, index: number): number => {
        if (question.budgetingMode === 'pieces') {
          // Pieces mode: multiply piece count by price
          return storedValue * (question.targets[index]?.price || 0);
        }
        if (inputMode === 'percentage') {
          // Percentage mode: convert percentage to monetary value
          return Math.round((storedValue / 100) * question.totalBudget);
        }
        // Absolute mode: value is already monetary
        return storedValue;
      };

      // Calculate total used budget in monetary terms
      const totalUsedBudget = question.targets.reduce((sum, _target, index) => {
        const storedValue = answerEntry.value[index] || 0;
        return sum + getMonetaryValue(storedValue, index);
      }, 0);

      // For 'pieces' mode: show 3 columns (Target, Amount in pieces, Total in money)
      // For 'direct' mode: show 2 columns (Target, Amount in money)
      const isPiecesMode = question.budgetingMode === 'pieces';

      return [
        heading,
        {
          table: {
            headerRows: 1,
            widths: isPiecesMode ? ['*', 'auto', 'auto'] : ['*', 'auto'],
            body: [
              // Header row
              isPiecesMode
                ? [
                    { text: tr.BudgetingQuestion.targetName, bold: true },
                    { text: tr.BudgetingQuestion.amount, bold: true },
                    { text: tr.BudgetingQuestion.total, bold: true },
                  ]
                : [
                    { text: tr.BudgetingQuestion.targetName, bold: true },
                    { text: tr.BudgetingQuestion.amount, bold: true },
                  ],
              // Data rows
              ...question.targets.map((target, index) => {
                const storedValue = answerEntry.value[index] || 0;
                const monetary = getMonetaryValue(storedValue, index);

                if (isPiecesMode) {
                  return [
                    target.name[language],
                    `${storedValue} ${tr.BudgetingQuestion.perPiece}`,
                    `${monetary} ${question.unit || ''}`,
                  ];
                } else {
                  return [
                    target.name[language],
                    `${monetary} ${question.unit || ''}`,
                  ];
                }
              }),
              // Total row
              isPiecesMode
                ? [
                    {
                      text: tr.BudgetingQuestion.total,
                      bold: true,
                      colSpan: 2,
                    },
                    {},
                    {
                      text: `${totalUsedBudget} / ${question.totalBudget} ${question.unit || ''}`,
                      bold: true,
                    },
                  ]
                : [
                    { text: tr.BudgetingQuestion.total, bold: true },
                    {
                      text: `${totalUsedBudget} / ${question.totalBudget} ${question.unit || ''}`,
                      bold: true,
                    },
                  ],
            ],
          },
          style,
          margin: [0, 0, 0, 10],
        },
      ];
    }
    case 'geo-budgeting': {
      if (!answerEntry.value.length) {
        return [heading, { text: '-', style }];
      }

      const question = section as SurveyGeoBudgetingQuestion;

      // Group placements by target and calculate counts/totals
      const targetSummary = question.targets.map((target, targetIndex) => {
        const placements = (answerEntry.value as any[]).filter(
          (answer) => answer.targetIndex === targetIndex,
        );
        return {
          targetIndex,
          targetName: target.name[language],
          price: target.price ?? 0,
          count: placements.length,
          total: placements.length * (target.price ?? 0),
        };
      });

      // Calculate total budget used
      const totalUsedBudget = targetSummary.reduce(
        (sum, target) => sum + target.total,
        0,
      );

      const summaryContent: Content[] = [
        {
          text: 'Yhteenveto',
          style: 'subQuestionTitle',
          margin: [0, 0, 0, 5] as [number, number, number, number],
        },
        ...targetSummary
          .filter((target) => target.count > 0)
          .map(
            (target) =>
              ({
                text: `${target.targetName}: ${target.count} × ${target.price} ${question.unit || ''} = ${target.total} ${question.unit || ''}`,
                style: 'subQuestionAnswer',
                margin: [0, 0, 0, 3] as [number, number, number, number],
              }) as Content,
          ),
        {
          text: `Yhteensä: ${totalUsedBudget} / ${question.totalBudget} ${question.unit || ''}`,
          style: 'subQuestionAnswer',
          bold: true,
          margin: [0, 5, 0, 10] as [number, number, number, number],
        } as Content,
      ];

      // Individual placement screenshots
      const placementContent: Content[] = (answerEntry.value as any[]).map(
        (answer, index) => {
          const targetIndex = answer.targetIndex;
          const target = question.targets[targetIndex];
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
                {
                  text: `Merkintä: ${index + 1}/${answerEntry.value.length}`,
                  style: 'subQuestionAnswer',
                } as Content,
                {
                  text: `${target.name[language]} (${target.price ?? 0} ${question.unit || ''})`,
                  style: 'subQuestionAnswer',
                } as Content,
                {
                  text: 'Näkyvät tasot:',
                  style: 'subQuestionTitle',
                } as Content,
                {
                  text: !screenshot.layerNames.length
                    ? '-'
                    : screenshot.layerNames.join(', '),
                  style: 'subQuestionAnswer',
                  margin: [0, 0, 0, 10] as [number, number, number, number],
                } as Content,
              ],
            ],
            margin: [0, 0, 0, 15] as [number, number, number, number],
          } as Content;
        },
      );

      return [heading, ...summaryContent, ...placementContent];
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
  const imageOptions = await getImageOptionsForSurvey(survey.id);
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

  const screenshotJobData = prepareMapAndGeoBudgetingAnswers(
    survey,
    answerEntries,
    language,
  );
  const screenshots = await getScreenshots(screenshotJobData);
  const optionsWithImages = await Promise.all(
    imageOptions.map(async (option) => {
      if (!option.imageUrl) {
        return { ...option, image: null };
      }
      const file = await getFile(option.imageUrl);
      return {
        ...option,
        image: `data:${file.mimeType};base64,${file.data.toString('base64')}`,
      };
    }),
  );

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
        optionsWithImages,
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
          optionsWithImages,
          false,
          true,
          language,
        ),
      ) ?? []),
    ]),
  ];
  const personalInfo = answerEntries.find(
    (entry) => entry.type === 'personal-info',
  );
  const document = new PdfPrinter(fonts).createPdfKitDocument({
    content,
    pageMargins: [40, 20, 40, 60],
    footer: (currentPage, pageCount): Content => {
      if (currentPage === 1) {
        return {
          margin: [40, 0, 40, 0],
          columns: [
            {
              alignment: 'right',
              text: `${currentPage}/${pageCount}`,
              color: '#5e5e5e',
              fontSize: 10,
            },
          ],
        } as Content;
      }
      return {
        margin: [40, 0, 40, 0],
        columns: [
          {
            width: '90%',
            stack: [
              {
                alignment: 'left',
                text: `${survey.title?.[language]}`,
                color: '#5e5e5e',
                fontSize: 10,
                marginBottom: 2,
              },
              ...(personalInfo?.value
                ? [
                    {
                      alignment: 'left',
                      text: `${(personalInfo.value as PersonalInfoAnswer)?.name}`,
                      color: '#5e5e5e',
                      fontSize: 10,
                      marginBottom: 2,
                    },
                  ]
                : []),
              {
                alignment: 'left',
                text: submission.id,
                color: '#5e5e5e',
                fontSize: 10,
              },
            ],
          },
          {
            alignment: 'right',
            text: `${currentPage}/${pageCount}`,
            color: '#5e5e5e',
            fontSize: 10,
          },
        ],
      } as Content;
    },
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
