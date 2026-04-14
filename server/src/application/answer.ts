import { FileAnswer } from '@interfaces/survey';
import { getDb } from '@src/database';

export { getCSVFile } from './csvExport';
export { getExcelFile } from './excelExport';
export { getPersonalInfosForSurvey } from './exportUtils';
export {
  getGeometryDBEntriesAsGeoJSON,
  getGeoPackageFile,
} from './answerGeometry';

interface FileEntry {
  valueFile: string;
  valueFileName: string;
  submissionId: number;
  sectionId: number;
  pageIndex: number;
  sectionIndex: number;
}

async function getAttachmentDBEntries(surveyId: number) {
  const rows = await getDb().manyOrNone(
    `
      SELECT
        ae.submission_id as "submissionId",
        ae.section_id as "sectionId",
        ae.value_file as "valueFile",
        ae.value_file_name as "valueFileName",
        sp.idx as "pageIndex",
        ps.idx as "sectionIndex" FROM data.answer_entry ae
      LEFT JOIN data.submission sub ON ae.submission_id = sub.id
      LEFT JOIN data.page_section ps ON ae.section_id = ps.id
      LEFT JOIN data.survey_page sp ON sp.id = ps.survey_page_id
      WHERE ae.value_file IS NOT NULL AND sub.unfinished_token IS NULL AND sub.survey_id = $1;
    `,
    [surveyId],
  );

  if (!rows || rows.length === 0) return null;
  return rows;
}

/**
 * Convert DB rows to file objects
 * @param rows
 * @returns
 */
function attachmentEntriesToFiles(rows: FileEntry[]) {
  return rows.map((row) => ({
    fileName: `vastausnro_${row.submissionId}.sivunro_${
      row.pageIndex + 1
    }.kysymysnro_${row.sectionIndex + 1}.${row.valueFileName}`,
    fileString: row.valueFile,
  }));
}

/**
 * Handler function for downloading survey attachments
 * @param surveyId
 */
export async function getAttachments(surveyId: number): Promise<FileAnswer[]> {
  const rows = await getAttachmentDBEntries(surveyId);

  if (!rows) return null;

  return attachmentEntriesToFiles(rows);
}

export async function getAnswerCounts(surveyId: number) {
  const result = await getDb().one<{
    alphaNumericAnswers: string;
    attachmentAnswers: string;
    mapAnswers: string;
    personalInfoAnswers: string;
  }>(
    `
    WITH answer_entries AS (
      SELECT sub.id AS submission_id, ae.id, ps.type, ps.parent_section FROM DATA.submission sub
      LEFT JOIN DATA.answer_entry ae ON sub.id = ae.submission_id
      LEFT JOIN DATA.survey s ON s.id = sub.survey_id
      LEFT JOIN DATA.page_section ps ON ps.id = ae.section_id
      WHERE s.id = $1
    ), personal_info_entries AS (
      SELECT * FROM DATA.personal_info
      WHERE submission_id =  ANY(SELECT submission_id FROM answer_entries)
    )
    SELECT
        COUNT(*) FILTER (WHERE type <> 'map' AND TYPE <> 'attachment' AND type <> 'geo-budgeting' AND parent_section IS NULL) AS "alphaNumericAnswers",
        COUNT(*) FILTER (WHERE type = 'attachment') AS "attachmentAnswers",
        COUNT(*) FILTER (WHERE type IN ('map', 'geo-budgeting')) AS "mapAnswers",
        (SELECT COUNT(*) FROM personal_info_entries) AS "personalInfoAnswers"
    FROM answer_entries;
  `,
    [surveyId],
  );
  return {
    alphaNumericAnswers: Number(result.alphaNumericAnswers),
    attachmentAnswers: Number(result.attachmentAnswers),
    mapAnswers: Number(result.mapAnswers),
    personalInfoAnswers: Number(result.personalInfoAnswers),
  };
}
