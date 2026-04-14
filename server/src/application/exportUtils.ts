import { LanguageCode, LocalizedText } from '@interfaces/survey';
import { encryptionKey, getDb } from '@src/database';
import { indexToAlpha } from '@src/utils';
import {
  AnswerEntry,
  DBAnswerEntry,
  dbAnswerEntryRowsToAnswerEntries,
} from './answerTypes';

const COMMON_SEPARATOR = '-';

/**
 * Single cell on the CSV/Excel export
 */
export interface TextCell {
  [key: string]: string;
}

/**
 * Interface for the intermediate format from which exports are created
 */
export interface ExportJson {
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
export interface TypeDetails {
  type: string;
  details: Record<string, unknown>;
  optionTexts?: TextCell;
  pageIndex: number;
  predecessorSection?: number;
}

/**
 * Interface for section header
 */
export interface SectionHeader {
  optionId: number | null;
  optionIndex: number | null;
  text: LocalizedText | null;
  sectionId: number;
  title: LocalizedText;
  type: string;
  details: Record<string, unknown>;
  parentSection: number | null;
  predecessorSection: number | null;
  groupName: LocalizedText | null;
  groupIndex: number | null;
  pageIndex: number;
  sectionIndex: number;
  questionIndex: number;
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
 */
export async function getAnswerDBEntries(
  surveyId: number,
): Promise<AnswerEntry[]> {
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
        AND ps.type <> 'geo-budgeting'
        AND sub.unfinished_token IS NULL
        AND ps.parent_section IS NULL AND sub.survey_id = $1;
    `,
    [surveyId],
  )) as DBAnswerEntry[];

  if (!rows || rows.length === 0) return null;
  return dbAnswerEntryRowsToAnswerEntries(rows);
}

/**
 * Get survey section, options and optiongroups for export headers
 */
export async function getSectionHeaders(surveyId: number) {
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
      AND ps.type <> 'geo-budgeting'
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
      // but shouldn't be printed to export
      .filter((e) => e && e.type !== 'map')
  );
}

/**
 * Create key for export headers and submissions
 */
export function getHeaderKey(
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

  const parts: (string | number)[] = [pageIndex, sectionIndex];
  if (groupIndex != null) parts.push(groupIndex);
  if (optionIndex != null) parts.push(optionIndex);
  key += joinKeys(...parts);

  return key;
}

export function joinKeys(...args: (string | number)[]) {
  return args.map((arg) => arg.toString()).join(COMMON_SEPARATOR);
}

export function getSectionDetailsForHeader(
  section: SectionHeader,
  predecessorIndexes: Record<number, string>,
) {
  if (section.predecessorSection) {
    const [pageIndex, _sectionIndex] =
      predecessorIndexes[section.predecessorSection].split(COMMON_SEPARATOR);
    return `s${Number(pageIndex) + 1}k${
      Number(section.questionIndex) + 1
    }${indexToAlpha(section.sectionIndex)}`;
  }

  return `s${section.pageIndex + 1}k${section.questionIndex + 1}`;
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
 * Create export submissions from grouped submission data
 */
export function createExportSubmissions(
  answerEntries: AnswerEntry[],
  sectionMetadata: SectionHeader[],
  lang: LanguageCode = 'fi',
) {
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
  const sectionIdToDetails = sectionMetadata.reduce((group, section) => {
    const { sectionId, optionId, text } = section;
    group[sectionId] = {
      type: section.type,
      details: section.details,
      optionTexts: {
        ...(group[sectionId]?.optionTexts ?? {}),
        [optionId]: text?.[lang] ?? text?.['fi'] ?? '',
      },
      pageIndex: section.pageIndex,
      predecessorSection: section?.predecessorSection ?? null,
    } as TypeDetails;
    return group;
  }, {});

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
        lang,
      ),
      timeStamp: value[0].createdAt,
      submissionLanguage: value[0].submissionLanguage,
    });
  });

  return allAnswers;
}

/**
 * Create JSON formatted answers for each answer under a submission
 */
function submissionAnswersToJson(
  answerEntries: AnswerEntry[],
  sectionIdToDetails,
  predecessorIndexes,
  lang: LanguageCode = 'fi',
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
          const classIndexes = answer.valueJson?.[index];
          if (!Array.isArray(classIndexes)) return;
          classIndexes.forEach((optionIndex) => {
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
          ] =
            classIndex == null
              ? ''
              : Number(classIndex) === -1
                ? 'EOS'
                : (sectionDetails.details.classes[Number(classIndex)][lang] ??
                  sectionDetails.details.classes[Number(classIndex)]['fi']);
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
        const budgetValues = answer.valueJson ?? [];
        sectionDetails.details.targets?.forEach(
          (_target: unknown, index: number) => {
            const key = getHeaderKey(
              sectionDetails.pageIndex,
              answer.sectionIndex,
              index + 1,
              null,
              sectionDetails.predecessorSection,
              predecessorIndexes,
            );
            const value = budgetValues[index] || 0;
            ret[key] = value;
          },
        );
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
