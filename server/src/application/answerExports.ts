import { LanguageCode, LocalizedText } from '@interfaces/survey';
import { encryptionKey, getDb } from '@src/database';
import { indexToAlpha } from '@src/utils';
import moment from 'moment';
import {
  AnswerEntry,
  DBAnswerEntry,
  dbAnswerEntryRowsToAnswerEntries,
} from './answerTypes';

/**
 * Single cell on the CSV
 */
interface TextCell {
  [key: string]: string;
}

/**
 * Interface for the custom JSON format from which the CSV is created
 */
interface CSVJson {
  headers: TextCell[];
  submissions: {
    [key: number]: TextCell[];
    timeStamp: Date;
    submissionLanguage: LanguageCode;
  }[];
}

export interface SubmissionPersonalInfo {
  submissionId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  custom: string | null;
  timeStamp: Date;
  language: LanguageCode;
  details: {
    isRequired: boolean;
    askName: boolean;
    askEmail: boolean;
    askPhone: boolean;
    askAddress: boolean;
    askCustom: boolean;
    customLabel: LocalizedText;
  };
}

/**
 * Interface for section details
 */
interface TypeDetails {
  type: string;
  details: JSON;
  optionTexts?: TextCell;
  pageIndex: number;
  predecessorSection?: number;
}

/**
 * Interface for section header
 */
interface SectionHeader {
  optionId: number;
  optionIndex: number;
  text: LocalizedText;
  sectionId: number;
  title: LocalizedText;
  type: string;
  details: JSON;
  parentSection: number;
  predecessorSection: number;
  groupName: LocalizedText;
  groupIndex: number;
  pageIndex: number;
  sectionIndex: number;
  questionIndex: number;
}

function parseToCSVText(str: string | null | undefined) {
  return `"${(str ?? '').replace(/"/g, '""')}"`;
}

/** Get decrypted personal info question answers entries for the given survey id */
export async function getPersonalInfosForSurvey(surveyId: number) {
  return getDb().manyOrNone<SubmissionPersonalInfo>(
    `
    SELECT
      pi.submission_id AS "submissionId",
      pgp_sym_decrypt(pi.name, $(encryptionKey)) AS name,
      pgp_sym_decrypt(pi.email, $(encryptionKey)) AS email,
      pgp_sym_decrypt(pi.phone, $(encryptionKey)) AS phone,
      pgp_sym_decrypt(pi.address, $(encryptionKey)) AS address,
      pgp_sym_decrypt(pi.custom, $(encryptionKey)) AS custom,
      sub.created_at as "timeStamp",
      sub.language,
      ps.details
    FROM data.personal_info pi
    LEFT JOIN data.submission sub ON pi.submission_id = sub.id
    LEFT JOIN data.page_section ps ON pi.section_id = ps.id
    WHERE sub.unfinished_token IS NULL AND sub.survey_id = $(surveyId);
  `,
    { surveyId, encryptionKey },
  );
}

/**
 * Get all DB answer entries for the given survey id
 * @param surveyId
 * @returns
 */
async function getAnswerDBEntries(surveyId: number): Promise<AnswerEntry[]> {
  const rows = (await getDb().manyOrNone(
    `
    SELECT
      ae.submission_id,
      ae.section_id,
      ae.value_text,
      ae.value_option_id,
      ae.value_numeric,
      ae.value_json,
      ps.type,
      ps.idx as section_index,
      og.idx as option_group_index,
      sub.created_at,
      sub.language
        FROM data.answer_entry ae
        LEFT JOIN data.submission sub ON ae.submission_id = sub.id
        LEFT JOIN data.page_section ps ON ps.id = ae.section_id
        LEFT JOIN data.option opt ON ps.id = opt.section_id
        LEFT JOIN data.option_group og ON opt.group_id = og.id
        LEFT JOIN data.survey_page sp ON ps.survey_page_id = sp.id
        LEFT JOIN data.survey s ON sp.survey_id = s.id
      WHERE ps.type <> 'map'
        AND ps.type <> 'attachment'
        AND ps.type <> 'document'
        AND ps.type <> 'text'
        AND ps.type <> 'image'
        AND ps.type <> 'personal-info'
        AND sub.unfinished_token IS NULL
        AND ps.parent_section IS NULL AND sub.survey_id = $1;
    `,
    [surveyId],
  )) as DBAnswerEntry[];

  if (!rows || rows.length === 0) return null;
  return dbAnswerEntryRowsToAnswerEntries(rows);
}

/**
 * Get survey section, options and optiongroups for CSV headers
 * @param surveyId
 * @returns
 */
async function getSectionHeaders(surveyId: number) {
  const res = await getDb().manyOrNone<
    SectionHeader & { questionOrderIndex: number }
  >(
    `
  SELECT
    opt.id as "optionId",
    opt.idx as "optionIndex",
    opt.text,
    ps.id as "sectionId",
    ps.idx as "sectionIndex",
    ps2.idx as "predecessorSectionIndex",
    ps.title,
    ps.type,
    ps.details,
    ps.parent_section as "parentSection",
    ps.predecessor_section as "predecessorSection",
    og.name as "groupName",
    og.idx as "groupIndex",
    sp.idx as "pageIndex",
    coalesce(ps2.idx, ps.idx) as "questionOrderIndex"
  FROM data.page_section ps
    LEFT JOIN data.option opt ON ps.id = opt.section_id
    LEFT JOIN data.option_group og ON opt.group_id = og.id
    LEFT JOIN data.survey_page sp ON ps.survey_page_id = sp.id
    LEFT JOIN data.survey s ON sp.survey_id = s.id
    LEFT JOIN data.page_section ps2 ON ps.predecessor_section = ps2.id
    WHERE s.id = $1
      AND ps.type <> 'attachment'
      AND ps.type <> 'document'
      AND ps.type <> 'text'
      AND ps.type <> 'image'
      AND ps.type <> 'personal-info'
      AND ps.parent_section IS NULL
      ORDER BY "pageIndex", "questionOrderIndex", "predecessorSectionIndex" nulls first, ps.idx, og.idx NULLS FIRST, opt.idx NULLS first;
`,
    [surveyId],
  );

  let questionIndex = 0;
  let lastSectionIndex = -1;
  let lastHandledPage = -1;
  return (
    res
      .map<SectionHeader>((section) => {
        if (lastHandledPage !== section.pageIndex) {
          questionIndex = 0;
          lastHandledPage = section.pageIndex;
          lastSectionIndex = section.sectionIndex;
        } else if (
          section.predecessorSection === null &&
          lastSectionIndex !== section.questionOrderIndex
        ) {
          questionIndex++;
          lastSectionIndex = section.sectionIndex;
        }

        return { ...section, questionIndex };
      })
      // Map elements should be taken into account when numbering,
      // but shouldn't be printed to CSV-report
      .filter((e) => e && e.type !== 'map')
  );
}

/**
 * Create key for CSV headers and submissions
 * @pageIndex pageIndex
 * @param sectionIndex
 * @param groupIndex
 * @param optionIndex
 * @returns
 */
function getHeaderKey(
  pageIndex: number,
  sectionIndex: number,
  groupIndex?: number,
  optionIndex?: number,
  predecessorSection?: number,
  predecessorPageAndIndex?: Record<number, string>,
) {
  let key = '';
  if (predecessorSection) {
    key += `${predecessorPageAndIndex[predecessorSection]}?`;
  }

  key += `${pageIndex}-${sectionIndex}${groupIndex ? '-' + groupIndex : ''}${
    optionIndex ? '-' + optionIndex : ''
  }`;

  return key;
}

function getSectionDetailsForHeader(section, predecessorIndexes) {
  if (section.predecessorSection) {
    const [pageIndex, _sectionIndex] =
      predecessorIndexes[section.predecessorSection].split('-');
    return `s${Number(pageIndex) + 1}k${
      Number(section.questionIndex) + 1
    }${indexToAlpha(section.sectionIndex)}`;
  }

  return `s${section.pageIndex + 1}k${section.questionIndex + 1}`;
}

/**
 * Format headers for the CSV file
 * @param sectionMetadata
 * @returns
 */
function createCSVHeaders(sectionMetadata: SectionHeader[]) {
  // Used to get indexes of follow-up section parents
  const predecessorIndexes: Record<number, string> = sectionMetadata.reduce(
    (data, section) => {
      if (!section.predecessorSection) {
        return {
          ...data,
          [section.sectionId]: `${section.pageIndex}-${section.sectionIndex}`,
        };
      }
      return data;
    },
    {},
  );

  const indexesToSections = sectionMetadata.reduce((group, section) => {
    const { pageIndex, sectionIndex, predecessorSection } = section;
    let key = `${pageIndex}-${sectionIndex}`;
    if (predecessorSection) {
      key = `${predecessorIndexes[predecessorSection]}-f${sectionIndex}`;
    }
    group[key] = group[key] ?? [];
    group[key].push(section);
    return group;
  }, {});

  const allHeaders = [];
  Object.keys(indexesToSections).map((indexKey) => {
    const sectionGroup = indexesToSections[indexKey];

    const sectionHead = sectionGroup[0];
    switch (sectionHead.type) {
      case 'radio':
      case 'radio-image':
      case 'checkbox':
      case 'grouped-checkbox':
        sectionGroup.forEach((section) => {
          const key = getHeaderKey(
            section.pageIndex,
            section.sectionIndex,
            section.groupIndex,
            section.optionId,
            section.predecessorSection,
            predecessorIndexes,
          );

          allHeaders.push({
            [key]: `${getSectionDetailsForHeader(
              section,
              predecessorIndexes,
            )}: ${section.title?.['fi'] ?? ''}${
              section.groupName ? ' - ' + section.groupName['fi'] : ''
            } - ${section.text?.['fi'] ?? ''}`,
          });
        });
        if (sectionHead.details.allowCustomAnswer) {
          const key = getHeaderKey(
            sectionHead.pageIndex,
            sectionHead.sectionIndex,
            null,
            -1,
            sectionHead.predecessorSection,
            predecessorIndexes,
          );
          allHeaders.push({
            [key]: `${getSectionDetailsForHeader(
              sectionHead,
              predecessorIndexes,
            )}: ${sectionHead.title['fi']} - joku muu mikä?`,
          });
        }

        break;
      case 'multi-matrix':
        sectionHead.details.subjects.forEach(
          (subject: LocalizedText, idx: number) => {
            sectionHead.details.classes.forEach(
              (className: LocalizedText, index: number) => {
                const key = getHeaderKey(
                  sectionHead.pageIndex,
                  sectionHead.sectionIndex,
                  idx + 1,
                  index + 1,
                  sectionHead.predecessorSection,
                  predecessorIndexes,
                );
                allHeaders.push({
                  [key]: `${getSectionDetailsForHeader(
                    sectionHead,
                    predecessorIndexes,
                  )}: ${sectionHead.title['fi']} - ${subject['fi']} - ${
                    className['fi']
                  }`,
                });
              },
            );
          },
        );
        break;
      case 'matrix':
        sectionHead.details.subjects.forEach(
          (subject: LocalizedText, idx: number) => {
            const key = getHeaderKey(
              sectionHead.pageIndex,
              sectionHead.sectionIndex,
              idx + 1,
              null,
              sectionHead.predecessorSection,
              predecessorIndexes,
            );
            allHeaders.push({
              [key]: `${getSectionDetailsForHeader(
                sectionHead,
                predecessorIndexes,
              )}: ${sectionHead.title['fi']} - ${subject['fi']}`,
            });
          },
        );
        break;
      case 'sorting':
        sectionGroup.forEach((section) => {
          const key = getHeaderKey(
            section.pageIndex,
            section.sectionIndex,
            null,
            section.optionIndex + 1,
            section.predecessorSection,
            predecessorIndexes,
          );
          allHeaders.push({
            [key]: `${getSectionDetailsForHeader(
              section,
              predecessorIndexes,
            )}: ${section.title['fi']} - ${section.optionIndex + 1}.`,
          });
        });
        break;
      case 'budgeting':
        // Create one column per target
        sectionHead.details.targets?.forEach((target, idx: number) => {
          const key = getHeaderKey(
            sectionHead.pageIndex,
            sectionHead.sectionIndex,
            idx + 1,
            null,
            sectionHead.predecessorSection,
            predecessorIndexes,
          );
          allHeaders.push({
            [key]: `${getSectionDetailsForHeader(
              sectionHead,
              predecessorIndexes,
            )}: ${sectionHead.title['fi']} - ${target.name['fi']}`,
          });
        });
        break;
      // numeric, free-text, slider
      default:
        allHeaders.push({
          [getHeaderKey(
            sectionHead.pageIndex,
            sectionHead.sectionIndex,
            null,
            null,
            sectionHead.predecessorSection,
            predecessorIndexes,
          )]: `${getSectionDetailsForHeader(
            sectionHead,
            predecessorIndexes,
          )}: ${sectionHead.title?.['fi']}`,
        });
    }
  });

  return allHeaders;
}

/**
 * Create CSV submissions from grouped submission data
 * @param answerEntries
 * @param sectionMetadata
 * @returns
 */
function createCSVSubmissions(
  answerEntries: AnswerEntry[],
  sectionMetadata: SectionHeader[],
) {
  // Used to get indexes of follow-up section parents
  const predecessorIndexes: Record<number, string> = sectionMetadata.reduce(
    (data, section) => {
      if (!section.predecessorSection) {
        return {
          ...data,
          [section.sectionId]: `${section.pageIndex}-${section.sectionIndex}`,
        };
      }
      return data;
    },
    {},
  );
  const sectionIdToDetails = sectionMetadata.reduce((group, section) => {
    const { sectionId, optionId, text } = section;
    group[sectionId] = {
      type: section.type,
      details: section.details,
      optionTexts: {
        ...(group[sectionId]?.optionTexts ?? {}),
        [optionId]: text?.['fi'] ?? '',
      },
      pageIndex: section.pageIndex,
      predecessorSection: section?.predecessorSection ?? null,
    } as TypeDetails;
    return group;
  }, {});

  // Group answer entries by submissionId
  const answersToSubmissionId = answerEntries.reduce((group, answer) => {
    const { submissionId } = answer;
    group[submissionId] = group[submissionId] ?? [];
    group[submissionId].push(answer);
    return group;
  }, {});

  const allAnswers = [];

  Object.entries(answersToSubmissionId).forEach(([key, value]) => {
    allAnswers.push({
      [key]: submissionAnswersToJson(
        value as AnswerEntry[],
        sectionIdToDetails,
        predecessorIndexes,
      ),
      timeStamp: value[0].createdAt,
      submissionLanguage: value[0].submissionLanguage,
    });
  });

  return allAnswers;
}

/**
 * Create JSON formatted answers for each answer under a submission
 * @param answerEntries
 * @param sectionIdToDetails
 * @returns
 */
function submissionAnswersToJson(
  answerEntries: AnswerEntry[],
  sectionIdToDetails,
  predecessorIndexes,
) {
  const ret = {};

  answerEntries.forEach((answer) => {
    const sectionDetails = sectionIdToDetails[answer.sectionId];

    switch (sectionDetails.type) {
      case 'radio':
      case 'radio-image':
      case 'checkbox':
      case 'grouped-checkbox':
        ret[
          getHeaderKey(
            sectionDetails.pageIndex,
            answer.sectionIndex,
            answer.groupIndex,
            answer.valueOptionId ?? -1,
            sectionDetails.predecessorSection,
            predecessorIndexes,
          )
        ] = answer.valueOptionId ? 1 : (answer.valueText ?? '');
        break;
      case 'multi-matrix':
        sectionDetails.details.subjects.forEach((_subject, index) => {
          const classIndexes = JSON.stringify(answer.valueJson?.[index]);
          JSON.parse(classIndexes).forEach((optionIndex: string) => {
            const optionIdx = Number(optionIndex);
            ret[
              getHeaderKey(
                sectionDetails.pageIndex,
                answer.sectionIndex,
                index + 1,
                optionIdx >= 0 ? optionIdx + 1 : optionIdx,
                sectionDetails.predecessorSection,
                predecessorIndexes,
              )
            ] = 1;
          });
        });

        break;
      case 'matrix':
        sectionDetails.details.subjects.forEach((_subject, index) => {
          const classIndex = answer.valueJson?.[index];
          ret[
            getHeaderKey(
              sectionDetails.pageIndex,
              answer.sectionIndex,
              index + 1,
              null,
              sectionDetails.predecessorSection,
              predecessorIndexes,
            )
          ] = !classIndex
            ? ''
            : Number(classIndex) === -1
              ? 'EOS'
              : sectionDetails.details.classes[Number(classIndex)]['fi'];
        });
        break;
      case 'sorting':
        answer.valueJson?.forEach((optionId, index) => {
          ret[
            getHeaderKey(
              sectionDetails.pageIndex,
              answer.sectionIndex,
              null,
              index + 1,
              sectionDetails.predecessorSection,
              predecessorIndexes,
            )
          ] = optionId ? sectionDetails?.optionTexts[String(optionId)] : '';
        });
        break;
      case 'budgeting': {
        // Parse budget values from JSON
        const budgetValues = answer.valueJson
          ? JSON.parse(JSON.stringify(answer.valueJson))
          : [];
        sectionDetails.details.targets?.forEach((_target, index) => {
          const key = getHeaderKey(
            sectionDetails.pageIndex,
            answer.sectionIndex,
            index + 1,
            null,
            sectionDetails.predecessorSection,
            predecessorIndexes,
          );

          const value = budgetValues[index] || 0;
          // Export raw stored values:
          // - 'pieces' mode: piece count
          // - 'direct' mode with 'percentage' inputMode: percentage (0-100)
          // - 'direct' mode with 'absolute' inputMode: monetary amount
          ret[key] = value;
        });
        break;
      }
      // numeric, free-text, slider
      default:
        ret[
          getHeaderKey(
            sectionDetails.pageIndex,
            answer.sectionIndex,
            null,
            null,
            sectionDetails.predecessorSection,
            predecessorIndexes,
          )
        ] = getValue(answer, sectionDetails.type);
        break;
    }
  });

  return ret;
}

function getValue(answer: AnswerEntry, answerType: string) {
  switch (answerType) {
    case 'slider':
    case 'numeric':
      return answer.valueNumeric;
    case 'free-text':
      return (answer.valueText ?? '').replace(/\r?\n/g, '');
  }
}

/**
 * Convert DB query rows into json format to be used for the CSV parser
 * @param answerEntries
 * @returns
 */
async function entriesToCSVFormat(
  answerEntries: AnswerEntry[],
  surveyId: number,
): Promise<CSVJson> {
  if (!answerEntries) return;

  const sectionMetadata = await getSectionHeaders(surveyId);

  return {
    headers: createCSVHeaders(sectionMetadata),
    submissions: createCSVSubmissions(answerEntries, sectionMetadata),
  };
}

/**
 * Parses custom CSVJson format into csv
 * @param entries
 * @returns Promise resolving to csv formatted string
 */
async function answerEntriesToCSV(
  entries: CSVJson,
  personalInfoRows: SubmissionPersonalInfo[] | null,
): Promise<string> {
  let csvData: string;

  function getPersonalInfoHeaders(personalInfo: SubmissionPersonalInfo | null) {
    const headerMap = {
      askName: 'Vastaajan nimi',
      askEmail: 'Vastaajan sähköposti',
      askPhone: 'Vastaajan puhelinnumero',
      askAddress: 'Vastaajan osoite',
      askCustom: personalInfo?.details?.customLabel?.['fi'],
    };

    if (!personalInfo) {
      return '';
    }

    const headerRow = Object.entries(personalInfo?.details ?? {})
      .filter(
        ([key, value]) =>
          key !== 'isRequired' && key !== 'customLabel' && value,
      )
      .map(([key, _value]) => headerMap[key])
      .join(', ');

    if (headerRow.length > 0) {
      return `,${headerRow}`;
    }
    return '';
  }

  const personalInfoHeaders = getPersonalInfoHeaders(personalInfoRows?.[0]);

  function getPersonalInfoRowValues(
    personalInfo?: SubmissionPersonalInfo | null,
  ) {
    const personalInfoRowMap = {
      askName: `,${parseToCSVText(personalInfo?.name)}`,
      askEmail: `,${parseToCSVText(personalInfo?.email)}`,
      askPhone: `,${parseToCSVText(personalInfo?.phone)}`,
      askAddress: `,${parseToCSVText(personalInfo?.address)}`,
      askCustom: `,${parseToCSVText(personalInfo?.custom)}`,
    };

    return Object.entries(personalInfo?.details ?? {})
      .filter(([key, value]) => key !== 'isRequired' && value)
      .map(([key, _value]) => personalInfoRowMap[key])
      .join('');
  }

  /** Gets row values for a submission with only personal info answer */
  function getPersonalInfoRow(personalInfo: SubmissionPersonalInfo) {
    const personalInfoValues = getPersonalInfoRowValues(personalInfo);
    return `${personalInfo.submissionId},${moment(
      personalInfo.timeStamp,
    ).format(
      'DD-MM-YYYY HH:mm',
    )},${personalInfo.language}${personalInfoValues}\n`;
  }

  // Only personal info answers available
  if (!entries) {
    csvData = `Vastaustunniste,Aikaleima,Vastauskieli${personalInfoHeaders}\n`;
    for (const personalInfo of personalInfoRows ?? []) {
      csvData += getPersonalInfoRow(personalInfo);
    }

    // Other than personal info answers available
  } else {
    const { submissions, headers } = entries;

    csvData = `Vastaustunniste,Aikaleima,Vastauskieli${personalInfoHeaders},${headers.map(
      (header) => `"${Object.values(header)[0].replace(/"/g, '""')}"`,
    )}\n`;

    const addedPersonalInfo = [];
    for (let i = 0; i < submissions.length; ++i) {
      const submissionId = Object.keys(submissions[i])[0];
      const submissionPersonalInfo = personalInfoRows?.find(
        (pi) => String(pi.submissionId) === String(submissionId),
      );

      if (submissionPersonalInfo)
        addedPersonalInfo.push(submissionPersonalInfo.submissionId);

      // Timestamp + submission language + personal info
      csvData += `${submissionId},${moment(submissions[i].timeStamp).format(
        'DD-MM-YYYY HH:mm',
      )},${submissions[i].submissionLanguage}${getPersonalInfoRowValues(submissionPersonalInfo)}`;

      headers.forEach((headerObj, _index) => {
        for (const [headerKey, _headerValue] of Object.entries(headerObj)) {
          csvData += Object.values(submissions[i])[0].hasOwnProperty(headerKey)
            ? `,${parseToCSVText(String(Object.values(submissions[i])[0][headerKey]))}`
            : ',';
        }
      });
      csvData += '\n';
    }

    // Add remaining question submissions which contain only personal info if available
    for (const personalInfo of personalInfoRows ?? []) {
      if (!addedPersonalInfo.includes(personalInfo.submissionId)) {
        csvData += getPersonalInfoRow(personalInfo);
      }
    }
  }

  csvData = csvData.substring(0, csvData.length - 1);

  // Newline
  csvData += '\n';

  return csvData;
}

/**
 * Handler function for downloading csv file
 * @param surveyId
 * @returns Promise resolving to csv formatted string
 */
export async function getCSVFile(
  surveyId: number,
  withPersonalInfo?: boolean,
): Promise<string> {
  const rows = await getAnswerDBEntries(surveyId);
  const personalInfoRows = withPersonalInfo
    ? await getPersonalInfosForSurvey(surveyId)
    : null;
  if (!rows && !personalInfoRows) return null;

  return answerEntriesToCSV(
    await entriesToCSVFormat(rows, surveyId),
    personalInfoRows,
  );
}
