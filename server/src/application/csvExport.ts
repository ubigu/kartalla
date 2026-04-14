import { LanguageCode, LocalizedText } from '@interfaces/survey';
import useTranslations from '@src/translations/useTranslations';
import moment from 'moment';
import {
  ExportJson,
  SubmissionPersonalInfo,
  createExportSubmissions,
  getAnswerDBEntries,
  getHeaderKey,
  getPersonalInfosForSurvey,
  getSectionDetailsForHeader,
  getSectionHeaders,
  joinKeys,
} from './exportUtils';

function parseToCSVText(str: string | null | undefined) {
  return `"${(str ?? '').replace(/"/g, '""')}"`;
}

/**
 * Format headers for the CSV file
 */
function createCSVHeaders(sectionMetadata, lang: LanguageCode) {
  const tr = useTranslations(lang);
  const l = (text: LocalizedText) => text?.[lang] ?? text?.['fi'] ?? '';
  const predecessorIndexes: Record<number, string> = sectionMetadata.reduce(
    (data, section) => {
      if (!section.predecessorSection) {
        return {
          ...data,
          [section.sectionId]: joinKeys(
            section.pageIndex,
            section.sectionIndex,
          ),
        };
      }
      return data;
    },
    {},
  );

  const indexesToSections = sectionMetadata.reduce((group, section) => {
    const { pageIndex, sectionIndex, predecessorSection } = section;
    const key = predecessorSection
      ? joinKeys(
          predecessorIndexes[predecessorSection],
          `followUp${sectionIndex}`,
        )
      : joinKeys(pageIndex, sectionIndex);
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
            )}: ${l(section.title)}${
              section.groupName ? ' - ' + l(section.groupName) : ''
            } - ${l(section.text)}`,
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
            )}: ${l(sectionHead.title)} - ${tr.customAnswerLabel}`,
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
                  )}: ${l(sectionHead.title)} - ${l(subject)} - ${l(className)}`,
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
              )}: ${l(sectionHead.title)} - ${l(subject)}`,
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
            )}: ${l(section.title)} - ${section.optionIndex + 1}.`,
          });
        });
        break;
      case 'budgeting':
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
            )}: ${l(sectionHead.title)} - ${l(target.name)}`,
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
          )}: ${l(sectionHead.title)}`,
        });
    }
  });

  return allHeaders;
}

/**
 * Convert DB query rows into the intermediate format used for CSV rendering
 */
async function entriesToCSVFormat(
  answerEntries,
  surveyId: number,
  lang: LanguageCode,
): Promise<ExportJson> {
  if (!answerEntries) return;

  const sectionMetadata = await getSectionHeaders(surveyId);

  return {
    headers: createCSVHeaders(sectionMetadata, lang),
    submissions: createExportSubmissions(answerEntries, sectionMetadata, lang),
  };
}

/**
 * Parses the intermediate ExportJson format into a CSV string
 */
async function answerEntriesToCSV(
  entries: ExportJson,
  personalInfoRows: SubmissionPersonalInfo[] | null,
  lang: LanguageCode,
): Promise<string> {
  let csvData: string;

  const tr = useTranslations(lang);

  const personalInfoColumns: {
    key: string;
    header: (info: SubmissionPersonalInfo) => string;
    value: (info: SubmissionPersonalInfo) => string;
  }[] = [
    {
      key: 'askName',
      header: () => tr.PersonalInfo.exportName,
      value: (info) => `,${parseToCSVText(info.name)}`,
    },
    {
      key: 'askEmail',
      header: () => tr.PersonalInfo.exportEmail,
      value: (info) => `,${parseToCSVText(info.email)}`,
    },
    {
      key: 'askPhone',
      header: () => tr.PersonalInfo.exportPhone,
      value: (info) => `,${parseToCSVText(info.phone)}`,
    },
    {
      key: 'askAddress',
      header: () => tr.PersonalInfo.exportAddress,
      value: (info) => `,${parseToCSVText(info.address)}`,
    },
    {
      key: 'askCustom',
      header: (info) =>
        info.details?.customLabel?.[lang] ??
        info.details?.customLabel?.['fi'] ??
        '',
      value: (info) => `,${parseToCSVText(info.custom)}`,
    },
  ];

  function getActiveColumns(personalInfo: SubmissionPersonalInfo) {
    return personalInfoColumns.filter((col) => personalInfo.details?.[col.key]);
  }

  function getPersonalInfoHeaders(personalInfo: SubmissionPersonalInfo | null) {
    if (!personalInfo) return '';
    const headerRow = getActiveColumns(personalInfo)
      .map((col) => col.header(personalInfo))
      .join(', ');
    return headerRow.length > 0 ? `,${headerRow}` : '';
  }

  const personalInfoHeaders = getPersonalInfoHeaders(personalInfoRows?.[0]);

  function getPersonalInfoRowValues(
    personalInfo?: SubmissionPersonalInfo | null,
  ) {
    if (!personalInfo) return '';
    return getActiveColumns(personalInfo)
      .map((col) => col.value(personalInfo))
      .join('');
  }

  function getPersonalInfoRow(personalInfo: SubmissionPersonalInfo) {
    const personalInfoValues = getPersonalInfoRowValues(personalInfo);
    return `${personalInfo.submissionId},${moment(
      personalInfo.timeStamp,
    ).format(
      'DD-MM-YYYY HH:mm',
    )},${personalInfo.language}${personalInfoValues}\n`;
  }

  const metaHeader = `${tr.submissionId},${tr.responseTime},${tr.responseLanguage}`;

  // Only personal info answers available
  if (!entries) {
    csvData = `${metaHeader}${personalInfoHeaders}\n`;
    for (const personalInfo of personalInfoRows ?? []) {
      csvData += getPersonalInfoRow(personalInfo);
    }

    // Other than personal info answers available
  } else {
    const { submissions, headers } = entries;

    csvData = `${metaHeader}${personalInfoHeaders},${headers.map(
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

      csvData += `${submissionId},${moment(submissions[i].timeStamp).format(
        'DD-MM-YYYY HH:mm',
      )},${submissions[i].submissionLanguage}${getPersonalInfoRowValues(submissionPersonalInfo)}`;

      headers.forEach((headerObj) => {
        for (const [headerKey] of Object.entries(headerObj)) {
          csvData += Object.values(submissions[i])[0].hasOwnProperty(headerKey)
            ? `,${parseToCSVText(String(Object.values(submissions[i])[0][headerKey]))}`
            : ',';
        }
      });
      csvData += '\n';
    }

    // Add remaining submissions which contain only personal info
    for (const personalInfo of personalInfoRows ?? []) {
      if (!addedPersonalInfo.includes(personalInfo.submissionId)) {
        csvData += getPersonalInfoRow(personalInfo);
      }
    }
  }

  csvData = csvData.substring(0, csvData.length - 1);
  csvData += '\n';

  return csvData;
}

/**
 * Handler function for downloading a CSV file
 */
export async function getCSVFile(
  surveyId: number,
  withPersonalInfo?: boolean,
  lang: LanguageCode = 'fi',
): Promise<string> {
  const rows = await getAnswerDBEntries(surveyId);
  const personalInfoRows = withPersonalInfo
    ? await getPersonalInfosForSurvey(surveyId)
    : null;
  if (!rows && !personalInfoRows) return null;

  return answerEntriesToCSV(
    await entriesToCSVFormat(rows, surveyId, lang),
    personalInfoRows,
    lang,
  );
}
