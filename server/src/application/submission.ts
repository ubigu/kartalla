import {
  AnswerEntry,
  LanguageCode,
  MapQuestionAnswer,
  PersonalInfoAnswer,
  Submission,
  SurveyMapSubQuestionAnswer,
  SurveyPageSection,
} from '@interfaces/survey';
import { CredentialsEntry } from '@interfaces/submission';
import {
  encryptionKey,
  getColumnSet,
  getDb,
  getGeoJSONColumn,
  getMultiInsertQuery,
} from '@src/database';
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from '@src/error';
import logger from '@src/logger';
import { assertNever } from '@src/utils';
import { LineString, Point, Polygon } from 'geojson';

/**
 * DB row of table data.answer_entry
 */
interface DBAnswerEntry {
  id?: number;
  submission_id: number;
  section_id: number;
  value_text: string;
  value_numeric: number;
  value_option_id: number;
  value_geometry: GeoJSON.Geometry;
  value_json: unknown;
  parent_entry_id: number;
  value_file: string;
  value_file_name: string;
  map_layers: number[];
}

/** DB row of special personal info question */
interface DBPersonalInfo {
  id?: number;
  submission_id: number;
  section_id: number;
  name: string;
  email: string;
  phone: string;
}

interface DBSubmission {
  id: number;
  created_at: Date;
  updated_at: Date;
}

interface DBCredentialsEntry {
  id: number;
  survey_id: number;
  username: string;
  alphanumeric_included: boolean;
  geospatial_included: boolean;
  personal_included: boolean;
}

/**
 * Temporary entry row object for inserting subquestion answers properly attached to the parent entry
 */
type DBAnswerEntryWithSubQuestionAnswers = DBAnswerEntry & {
  subQuestionAnswers?: SurveyMapSubQuestionAnswer[];
};

/**
 * Helper function for creating answer entry column set for database queries
 */
const answerEntryColumnSet = (inputSRID: number) =>
  getColumnSet<DBAnswerEntry>('answer_entry', [
    'submission_id',
    'section_id',
    'value_text',
    'value_option_id',
    getGeoJSONColumn('value_geometry', inputSRID),
    'value_numeric',
    {
      name: 'value_json',
      cast: 'json',
    },
    'parent_entry_id',
    'value_file',
    'value_file_name',
    'map_layers',
  ]);

/**
 * Validates given answer entries. Rejects the request if any of the entries is invalid, i.e. exceeds answer limits.
 * @param answerEntries Answer entries to validate
 */
async function validateEntriesByAnswerLimits(answerEntries: AnswerEntry[]) {
  // Get all questions that have answer limits from db
  const limitedQuestions = await getDb().manyOrNone<{
    id: number;
    min: number;
    max: number;
  }>(
    `SELECT
      id,
      details->'answerLimits'->'min' as min,
      details->'answerLimits'->'max' as max
    FROM data.page_section
    WHERE
      id = ANY ($1) AND
      details->'answerLimits' IS NOT NULL AND
      predecessor_section = NULL`,
    [answerEntries.map((entry) => entry.sectionId)],
  );
  // Validate each entry against the question answer limits
  answerEntries.forEach((entry) => {
    const question = limitedQuestions.find((q) => q.id === entry.sectionId);
    if (question) {
      const min = question.min;
      const max = question.max;
      if (entry.type === 'multi-matrix') {
        entry.value.some((answerRowValues) => {
          // Don't validate if empty answer is allowed and used
          if (answerRowValues.length === 1 && answerRowValues[0] === '-1') {
            return false;
          }
          const answerCount = answerRowValues.length;
          return (
            (min != null && answerCount < min) ||
            (max != null && answerCount > max)
          );
        });
      } else {
        const answerCount: number = (entry.value as (number | string)[]).length;
        if (
          (min != null && answerCount < min) ||
          (max != null && answerCount > max)
        ) {
          throw new BadRequestError(
            `Answer for question ${entry.sectionId} must have between ${min} and ${max} selections`,
          );
        }
      }
    }
  });
}

/**
 * Validate answer entries to contain answers required questions
 * Disregard follow-up questions as they are conditionally answered
 * @param answerEntries Answer entries to validate
 */
async function validateEntriesByIsRequired(answerEntries: AnswerEntry[]) {
  // Get all questions that are required from db
  const requiredQuestions = await getDb().manyOrNone<{
    id: number;
  }>(
    `SELECT
      id
    FROM data.page_section
    WHERE
      id = ANY ($1) AND
      (details->>'isRequired')::boolean AND
      predecessor_section = NULL`,
    [answerEntries.map((entry) => entry.sectionId)],
  );

  // Check if there is a non-null answer for each required question
  requiredQuestions.forEach((question) => {
    if (
      !answerEntries.find(
        (entry) =>
          entry.value != null &&
          (typeof entry.value !== 'string' || entry.value !== '') &&
          entry.sectionId === question.id,
      )
    ) {
      throw new BadRequestError(
        `Answer for question ${question.id} is required`,
      );
    }
  });
}

/**
 * Check if given answer entries are valid.
 * @param answerEntries Answer entries to validate
 */
async function validateEntries(answerEntries: AnswerEntry[]) {
  await Promise.all([
    validateEntriesByAnswerLimits(answerEntries),
    validateEntriesByIsRequired(answerEntries),
  ]);
}

/** Encrypt and save personal info question answers to database */
async function savePersonalInfo(personalInfo: DBPersonalInfo) {
  await getDb().any(
    `
    INSERT INTO data.personal_info (submission_id, section_id, name, email, phone)
    VALUES 
      ($(submission_id), 
      $(section_id),
      pgp_sym_encrypt($(name), $(encryptionKey)), 
      pgp_sym_encrypt($(email), $(encryptionKey)), 
      pgp_sym_encrypt($(phone), $(encryptionKey))
  );`,
    { ...personalInfo, encryptionKey },
  );
}

/** Get decrypted personal info question answer from database */
async function getPersonalInfo(submissionId: number) {
  const result = await getDb().oneOrNone<DBPersonalInfo>(
    `
    SELECT
      submission_id,
      section_id,
      pgp_sym_decrypt(name, $(encryptionKey)) as name,
      pgp_sym_decrypt(email, $(encryptionKey)) as email,
      pgp_sym_decrypt(phone, $(encryptionKey)) as phone
    FROM data.personal_info
    WHERE submission_id = $(submissionId);
  `,
    { submissionId, encryptionKey },
  );

  if (!result) {
    return null;
  }

  return {
    type: 'personal-info',
    sectionId: result.section_id,
    value: { name: result.name, email: result.email, phone: result.phone },
  } as AnswerEntry;
}

/**
 * Create a submission and related answer entries
 * @param surveyID Survey ID
 * @param answerEntries Answer entries
 * @param unfinishedToken Token for previous unfinished submission
 * @param unfinished Save as unfinished?
 * @param language Language used when answering the survey
 */
export async function createSurveySubmission(
  surveyID: number,
  answerEntries: AnswerEntry[],
  unfinishedToken: string,
  unfinished = false,
  language: LanguageCode,
) {
  // Only validate the entries if saving the final submission (not unfinished)
  if (!unfinished) {
    await validateEntries(answerEntries);
  }
  // If unfinished token was provided, delete the old submission and pick the old "created at" timestamp
  const oldRow = unfinishedToken
    ? await getDb().oneOrNone<{ created_at: Date }>(
        'DELETE FROM data.submission WHERE unfinished_token = $1 RETURNING created_at',
        [unfinishedToken],
      )
    : null;

  // Create a new submission row - if unfinished, create a new unfinished token or use the old one if it exists
  const submissionRow = await getDb().one<{
    id: number;
    unfinished_token?: string;
    updated_at: Date;
  }>(
    !unfinished
      ? `
    INSERT INTO data.submission (survey_id, created_at, language) VALUES (
      $1,
      COALESCE($2, NOW()),
      $4
    ) RETURNING id, updated_at;
  `
      : `
    INSERT INTO data.submission (survey_id, created_at, unfinished_token, language) VALUES (
        $1,
        COALESCE($2, NOW()),
        COALESCE($3, gen_random_uuid()),
        $4
    ) RETURNING id, unfinished_token, updated_at;`,
    [surveyID, oldRow?.created_at ?? null, unfinishedToken ?? null, language],
  );

  if (!submissionRow) {
    logger.error(
      `Error while creating submission for survey with id: ${surveyID}, answer entries: ${answerEntries}`,
    );
    throw new InternalServerError(`Error while creating submission for survey`);
  }

  const { id, unfinished_token, updated_at } = submissionRow;

  // Save personal info separately
  const personalInfo = answerEntries.find(
    (entry) => entry.type === 'personal-info',
  );
  if (personalInfo) {
    await savePersonalInfo({
      ...(personalInfo.value as PersonalInfoAnswer),
      submission_id: id,
      section_id: personalInfo.sectionId,
    });
  }

  const entryRows = answerEntriesToRows(id, answerEntries);
  const inputSRID = getSRIDFromEntries(answerEntries);
  const submissionStatus = {
    id,
    // Timestamp of the submission = timestamp of the last update
    timestamp: updated_at,
    // If the submission was unfinished, return the newly created token
    unfinishedToken: unfinished ? unfinished_token : null,
  };

  if (entryRows.length === 0) {
    if (personalInfo) {
      return submissionStatus;
    }
    throw new BadRequestError(`Invalid submission with no answers.`);
  }

  // While inserting the entries, pick all entry IDs for linking subquestion answers where needed
  const entryIds = await getDb().manyOrNone<{ id: number }>(
    `${getMultiInsertQuery(
      entryRows,
      answerEntryColumnSet(inputSRID),
    )} RETURNING id;`,
  );

  // Insert subquestion answers for the newly created entries
  await Promise.all(
    entryRows.map(async (entry, index) => {
      // Skip all entries that don't have subquestion answers
      if (!entry.subQuestionAnswers?.length) {
        return;
      }
      // Find the parent answer entry ID
      const entryId = entryIds[index].id;
      // Generate rows for subquestion answers with the parent entry ID
      const subQuestionAnswerRows = answerEntriesToRows(
        id,
        entry.subQuestionAnswers as AnswerEntry[],
        entryId,
      );
      // Insert the rows
      await getDb().manyOrNone<{ id: number }>(
        getMultiInsertQuery(
          subQuestionAnswerRows,
          answerEntryColumnSet(inputSRID),
        ),
      );
    }),
  );

  return submissionStatus;
}

/**
 * Parse SRID information from geometry entries
 * @param submissionEntries
 * @returns SRID describing the coordinate reference system in which the geometry entries are described in
 */
function getSRIDFromEntries(submissionEntries: AnswerEntry[]) {
  const geometryEntry = submissionEntries.find(
    (entry) => entry.type === 'map' && entry.value.length > 0,
  );
  if (!geometryEntry) return null;

  const crsName =
    geometryEntry?.value[0]?.geometry?.crs?.properties?.name ??
    geometryEntry?.value[0]?.geometry?.geometry?.crs?.properties?.name;
  return crsName ? parseInt(crsName.split(':')[1]) : null;
}

/**
 * Convert array of entries into db row entries
 * @param submissionID
 * @param submission
 * @returns DBAnswerEntry, object describing a single row of the table data.answer_entry
 */
function answerEntriesToRows(
  submissionID: number,
  submissionEntries: AnswerEntry[],
  parentEntryId: number = null,
) {
  return submissionEntries.reduce((entries, entry) => {
    let newEntries: DBAnswerEntryWithSubQuestionAnswers[];

    switch (entry.type) {
      case 'free-text':
        newEntries = [
          {
            submission_id: submissionID,
            section_id: entry.sectionId,
            parent_entry_id: parentEntryId,
            value_text: entry.value,
            value_option_id: null,
            value_geometry: null,
            value_numeric: null,
            value_json: null,
            value_file: null,
            value_file_name: null,
            map_layers: null,
          },
        ];
        break;
      case 'radio':
        newEntries = [
          {
            submission_id: submissionID,
            section_id: entry.sectionId,
            parent_entry_id: parentEntryId,
            value_text: typeof entry.value === 'string' ? entry.value : null,
            value_option_id:
              typeof entry.value === 'number' ? entry.value : null,
            value_geometry: null,
            value_numeric: null,
            value_json: null,
            value_file: null,
            value_file_name: null,
            map_layers: null,
          },
        ];
        break;
      case 'checkbox':
      case 'grouped-checkbox':
        newEntries =
          entry.value.length !== 0
            ? [
                ...entry.value.map((value) => {
                  return {
                    submission_id: submissionID,
                    section_id: entry.sectionId,
                    parent_entry_id: parentEntryId,
                    value_text: typeof value === 'string' ? value : null,
                    value_option_id: typeof value === 'number' ? value : null,
                    value_geometry: null,
                    value_numeric: null,
                    value_json: null,
                    value_file: null,
                    value_file_name: null,
                    map_layers: null,
                  };
                }),
              ]
            : [
                {
                  submission_id: submissionID,
                  section_id: entry.sectionId,
                  parent_entry_id: parentEntryId,
                  value_text: null,
                  value_option_id: null,
                  value_geometry: null,
                  value_numeric: null,
                  value_json: null,
                  value_file: null,
                  value_file_name: null,
                  map_layers: null,
                },
              ];
        break;
      case 'numeric':
        newEntries = [
          {
            submission_id: submissionID,
            section_id: entry.sectionId,
            parent_entry_id: parentEntryId,
            value_text: null,
            value_option_id: null,
            value_geometry: null,
            value_numeric: entry.value,
            value_json: null,
            value_file: null,
            value_file_name: null,
            map_layers: null,
          },
        ];
        break;
      case 'map':
        newEntries = entry.value.map((value) => {
          return {
            submission_id: submissionID,
            section_id: entry.sectionId,
            parent_entry_id: parentEntryId,
            value_text: null,
            value_option_id: null,
            value_geometry: value.geometry?.geometry,
            value_numeric: null,
            value_json: null,
            value_file: null,
            value_file_name: null,
            map_layers: value.mapLayers,
            // Save subquestion answers under the entry for inserting them with correct parent entry ID later on
            subQuestionAnswers: value.subQuestionAnswers,
          };
        }, []);

        break;
      case 'sorting':
        newEntries = [
          {
            submission_id: submissionID,
            section_id: entry.sectionId,
            parent_entry_id: parentEntryId,
            value_text: null,
            value_option_id: null,
            value_geometry: null,
            value_numeric: null,
            value_json: JSON.stringify(entry.value),
            value_file: null,
            value_file_name: null,
            map_layers: null,
          },
        ];
        break;
      case 'slider':
        newEntries = [
          {
            submission_id: submissionID,
            section_id: entry.sectionId,
            parent_entry_id: parentEntryId,
            value_text: null,
            value_option_id: null,
            value_geometry: null,
            value_numeric: entry.value,
            value_json: null,
            value_file: null,
            value_file_name: null,
            map_layers: null,
          },
        ];
        break;
      case 'matrix':
        newEntries = [
          {
            submission_id: submissionID,
            section_id: entry.sectionId,
            parent_entry_id: parentEntryId,
            value_text: null,
            value_option_id: null,
            value_geometry: null,
            value_numeric: null,
            value_json: JSON.stringify(entry.value),
            value_file: null,
            value_file_name: null,
            map_layers: null,
          },
        ];
        break;
      case 'multi-matrix':
        newEntries = [
          {
            submission_id: submissionID,
            section_id: entry.sectionId,
            parent_entry_id: parentEntryId,
            value_text: null,
            value_option_id: null,
            value_geometry: null,
            value_numeric: null,
            value_json: JSON.stringify(entry.value),
            value_file: null,
            value_file_name: null,
            map_layers: null,
          },
        ];
        break;
      case 'attachment':
        newEntries =
          entry.value?.map((value) => ({
            submission_id: submissionID,
            section_id: entry.sectionId,
            parent_entry_id: parentEntryId,
            value_text: null,
            value_option_id: null,
            value_geometry: null,
            value_numeric: null,
            value_json: null,
            value_file: value.fileString,
            value_file_name: value.fileName,
            map_layers: null,
          })) ?? [];
        break;
      case 'personal-info':
        break;
      default:
        assertNever(entry);
    }

    return [...entries, ...(newEntries ?? [])];
  }, [] as DBAnswerEntryWithSubQuestionAnswers[]);
}

function dbAnswerEntriesToAnswerEntries(
  rows: (DBAnswerEntry & {
    section_type: SurveyPageSection['type'];
    // value_feature: GeoJSONWithCRS<Feature<Point | LineString | Polygon>>;
    value_geometry: Point | LineString | Polygon;
  })[],
  parentEntryId: number = null,
) {
  return rows
    .filter((row) => row.parent_entry_id === parentEntryId)
    .reduce((entries, row) => {
      switch (row.section_type) {
        case 'free-text': {
          entries.push({
            sectionId: row.section_id,
            type: 'free-text',
            value: row.value_text,
          });
          break;
        }
        case 'radio': {
          entries.push({
            sectionId: row.section_id,
            type: 'radio',
            value: row.value_text || row.value_option_id,
          });
          break;
        }
        case 'checkbox': {
          // Try to find an existing entry for this section
          let entry = entries.find(
            (entry): entry is AnswerEntry & { type: 'checkbox' } =>
              entry.sectionId === row.section_id,
          );
          // If the entry doesn't exist, create it
          if (
            !entry &&
            (entry = { sectionId: row.section_id, type: 'checkbox', value: [] })
          ) {
            entries.push(entry);
          }
          const value = row.value_text || row.value_option_id;
          if (value != null) {
            entry.value.push(value);
          }
          break;
        }
        case 'grouped-checkbox': {
          // Try to find an existing entry for this section
          let entry = entries.find(
            (entry): entry is AnswerEntry & { type: 'grouped-checkbox' } =>
              entry.sectionId === row.section_id,
          );
          // If the entry doesn't exist, create it
          if (
            !entry &&
            (entry = {
              sectionId: row.section_id,
              type: 'grouped-checkbox',
              value: [],
            })
          ) {
            entries.push(entry);
          }
          if (row.value_option_id) {
            entry.value.push(row.value_option_id);
          }
          break;
        }
        case 'numeric': {
          entries.push({
            sectionId: row.section_id,
            type: 'numeric',
            value: row.value_numeric,
          });
          break;
        }
        case 'map': {
          // Try to find an existing entry for this section
          let entry = entries.find(
            (entry): entry is AnswerEntry & { type: 'map' } =>
              entry.sectionId === row.section_id,
          );
          // If the entry doesn't exist, create it
          if (
            !entry &&
            (entry = {
              sectionId: row.section_id,
              type: 'map',
              value: [],
            })
          ) {
            entries.push(entry);
          }
          const value: MapQuestionAnswer = {
            selectionType:
              row.value_geometry.type === 'Point'
                ? 'point'
                : row.value_geometry.type === 'LineString'
                  ? 'line'
                  : 'area',
            geometry: {
              type: 'Feature',
              geometry: row.value_geometry,
              properties: {},
            },
            mapLayers: row.map_layers,
            // The function should only return map subquestion answers because of filtering - assume the type here
            subQuestionAnswers: dbAnswerEntriesToAnswerEntries(
              rows,
              row.id,
            ) as SurveyMapSubQuestionAnswer[],
          };
          if (value != null) {
            entry.value.push(value);
          }
          break;
        }
        case 'sorting':
          entries.push({
            sectionId: row.section_id,
            type: 'sorting',
            value: row.value_json as number[],
          });
          break;
        case 'slider': {
          entries.push({
            sectionId: row.section_id,
            type: 'slider',
            value: row.value_numeric != null ? Number(row.value_numeric) : null,
          });
          break;
        }
        case 'matrix': {
          entries.push({
            sectionId: row.section_id,
            type: 'matrix',
            value: row.value_json as string[],
          });
          break;
        }
        case 'multi-matrix':
          {
            entries.push({
              sectionId: row.section_id,
              type: 'multi-matrix',
              value: row.value_json as string[][],
            });
          }
          break;
        case 'attachment': {
          entries.push({
            sectionId: row.section_id,
            type: 'attachment',
            value: [
              { fileString: row.value_file, fileName: row.value_file_name },
            ],
          });
          break;
        }
        case 'text':
        case 'image':
        case 'document':
        case 'personal-info':
          break;
        default:
          assertNever(row.section_type);
      }
      return entries;
    }, [] as AnswerEntry[]);
}

/**
 * Convert the db row to JS format
 * @param row The row with the column names as in the database
 * @returns An object with attribute names in JS format
 */
function dbCredentialEntryRowToCredentialEntry(
  row: DBCredentialsEntry,
): CredentialsEntry {
  if (!row) return null;

  return {
    username: row.username,
    alphanumericIncluded: row.alphanumeric_included,
    geospatialIncluded: row.geospatial_included,
    personalIncluded: row.personal_included,
  };
}

/**
 * Get the language used for submitting an unfinished survey
 * @param token
 * @returns LanguageCode
 */
export async function getSurveyAnswerLanguage(token: string) {
  const row = await getDb().oneOrNone<{ language: LanguageCode }>(
    `
    SELECT language FROM data.submission WHERE submission.unfinished_token = $1;
  `,
    [token],
  );

  return row?.language;
}

/**
 * Gets unfinished answer entries for given token.
 * @param token Unfinished token
 * @returns Answer entries for the submission
 */
export async function getUnfinishedAnswerEntries(
  token: string,
  withPersonalInfo?: boolean,
) {
  const rows = await getDb()
    .manyOrNone<
      DBAnswerEntry & {
        section_type: SurveyPageSection['type'];
        parent_section?: number;
        value_geometry: Point | LineString | Polygon;
      }
    >(
      `
    SELECT
      ae.id,
      ae.submission_id,
      ae.section_id,
      ae.parent_entry_id,
      ae.value_text,
      ae.value_option_id,
      public.ST_AsGeoJSON(ae.value_geometry)::json as value_geometry,
      ae.value_numeric,
      ae.value_json,
      ae.value_file,
      ae.value_file_name,
      ae.map_layers,
      ps.type AS section_type,
      ps.parent_section AS parent_section
    FROM
      data.submission s
      INNER JOIN data.answer_entry ae ON ae.submission_id = s.id
      INNER JOIN data.page_section ps ON ps.id = ae.section_id
    WHERE s.unfinished_token = $1
  `,
      [token],
    )
    .catch(() => {
      throw new BadRequestError(`Invalid token`);
    });
  if (!rows.length) {
    throw new NotFoundError(`Token not found`);
  }

  if (withPersonalInfo) {
    const personalInfo = await getPersonalInfo(rows[0].submission_id);
    return [...dbAnswerEntriesToAnswerEntries(rows), personalInfo];
  }

  return dbAnswerEntriesToAnswerEntries(rows);
}

/**
 * Gets answer entries for given submission ID.
 * @param submissionId Submission ID
 * @returns Answer entries
 */
export async function getAnswerEntries(
  submissionId: number,
  withPersonalInfo?: boolean,
) {
  const rows = await getDb().manyOrNone<
    DBAnswerEntry & {
      section_type: SurveyPageSection['type'];
      parent_section?: number;
      value_geometry: Point | LineString | Polygon;
    }
  >(
    `
    SELECT
      ae.id,
      ae.submission_id,
      ae.section_id,
      ae.parent_entry_id,
      ae.value_text,
      ae.value_option_id,
      public.ST_AsGeoJSON(ae.value_geometry)::json as value_geometry,
      ae.value_numeric,
      ae.value_json,
      ae.value_file,
      ae.value_file_name,
      ae.map_layers,
      ps.type AS section_type,
      ps.parent_section AS parent_section
    FROM
      data.submission s
      INNER JOIN data.answer_entry ae ON ae.submission_id = s.id
      INNER JOIN data.page_section ps ON ps.id = ae.section_id
      INNER JOIN data.survey_page sp ON sp.id = ps.survey_page_id
    WHERE s.id = $1
    ORDER BY sp.idx, ps.idx ASC
  `,
    [submissionId],
  );

  if (rows.length === 0) {
    if (withPersonalInfo) {
      const personalInfo = await getPersonalInfo(submissionId);
      return [personalInfo];
    }
    return [];
  }

  if (withPersonalInfo) {
    const personalInfo = await getPersonalInfo(submissionId);
    return [...dbAnswerEntriesToAnswerEntries(rows), personalInfo];
  }

  return dbAnswerEntriesToAnswerEntries(rows);
}

/**
 * Get timestamp of the given submission (=updated at)
 * @param submissionId Submission ID
 * @returns Timestamp
 */
export async function getTimestamp(submissionId: number) {
  const { updated_at } = await getDb().one<{ updated_at: Date }>(
    `SELECT updated_at FROM data.submission WHERE id = $1`,
    [submissionId],
  );
  return updated_at;
}

/**
 * Gets all finished submissions (with all answer entries) for a given survey ID
 * @param surveyId Survey ID
 * @returns Submissions
 */
export async function getSubmissionsForSurvey(
  surveyId: number,
  alphanumeric: boolean = true,
  geospatial: boolean = true,
  attachments: boolean = true,
  withPersonalInfo?: boolean,
) {
  const rows = await getDb().manyOrNone<DBSubmission & DBAnswerEntry>(
    `SELECT
      s.updated_at,
      ae.id,
      ae.submission_id,
      ae.section_id,
      ae.parent_entry_id,
      ae.value_text,
      ae.value_option_id,
      public.ST_AsGeoJSON(public.ST_Transform(ae.value_geometry, 3067))::json as value_geometry,
      ae.value_numeric,
      ae.value_json,
      ae.value_file,
      ae.value_file_name,
      ae.map_layers,
      ps.type AS section_type,
      ps.parent_section AS parent_section
    FROM
      data.submission s
      INNER JOIN data.answer_entry ae ON ae.submission_id = s.id
      INNER JOIN data.page_section ps ON ps.id = ae.section_id
      INNER JOIN data.survey_page sp ON sp.id = ps.survey_page_id
    WHERE s.survey_id = $(surveyId) AND s.unfinished_token IS NULL
    ${
      !alphanumeric
        ? `AND ps.type NOT IN (
      'free-text',
      'radio',
      'checkbox',
      'grouped-checkbox',
      'numeric',
      'sorting',
      'slider',
      'matrix',
      'multi-matrix'
    )`
        : ''
    }
    ${!geospatial ? `AND ps.type != 'map'` : ''}
    ${!withPersonalInfo ? `AND ps.type != 'personal-info'` : ''}
    ${!attachments ? `AND ps.type != 'attachment'` : ''}
    ORDER BY updated_at, sp.idx, ps.idx;`,
    { surveyId },
  );

  const personalInfoRows = withPersonalInfo
    ? await getDb().manyOrNone<DBPersonalInfo & DBSubmission>(
        `SELECT 
          s.updated_at,
          s.id as submission_id,
          pi.section_id,
          pgp_sym_decrypt(pi.name, $(encryptionKey)) as name,
          pgp_sym_decrypt(pi.email, $(encryptionKey)) as email,
          pgp_sym_decrypt(pi.phone, $(encryptionKey)) as phone
        FROM data.submission s
        INNER JOIN data.personal_info pi ON pi.submission_id = s.id
        WHERE s.survey_id = $(surveyId) AND s.unfinished_token IS NULL
      `,
        { surveyId, encryptionKey },
      )
    : [];

  const result = [];
  let currentSubmission: {
    id: number;
    timestamp: Date;
    entries: DBAnswerEntry[];
    personalInfo: Omit<DBPersonalInfo, 'submission_id'> | null;
  } | null = null;

  // First push all answer entries to the correct submission object
  for (const row of rows) {
    if (currentSubmission?.id !== row.submission_id) {
      currentSubmission = {
        id: row.submission_id,
        timestamp: row.updated_at,
        entries: [],
        personalInfo: null,
      };
      result.push(currentSubmission);
    }
    currentSubmission.entries.push(row);
  }

  // Then add the personal info to the correct submission object
  for (const personalInfoRow of personalInfoRows) {
    const submission = result.find(
      (sub) => sub.id === personalInfoRow.submission_id,
    );

    if (submission) {
      submission.personalInfo = {
        type: 'personal-info',
        sectionId: personalInfoRow.section_id,
        value: {
          name: personalInfoRow.name,
          email: personalInfoRow.email,
          phone: personalInfoRow.phone,
        },
      };
    } else {
      result.push({
        id: personalInfoRow.submission_id,
        timestamp: personalInfoRow.updated_at,
        entries: [],
        personalInfo: {
          type: 'personal-info',
          sectionId: personalInfoRow.section_id,
          value: {
            name: personalInfoRow.name,
            email: personalInfoRow.email,
            phone: personalInfoRow.phone,
          },
        },
      });
    }
  }

  return result.map(
    (sub) =>
      ({
        id: sub.id,
        timestamp: sub.timestamp,
        answerEntries: withPersonalInfo
          ? [...dbAnswerEntriesToAnswerEntries(sub.entries), sub.personalInfo]
          : dbAnswerEntriesToAnswerEntries(sub.entries),
      }) as Submission,
  );
}

/**
 * Inserts or updates the credentials so the survey submissions can be accessed using basic auth
 * @param surveyId Survey ID
 * @param username Username for basic auth
 * @param password Password for basic auth
 * @param alphanumericIncluded
 * @param geospatialIncluded
 * @param personalIncluded
 * @returns Inserted row, if successful
 */
export async function upsertPublicationCredentials(
  surveyId: number,
  username: string,
  password: string,
  alphanumericIncluded: boolean = true,
  geospatialIncluded: boolean = true,
  personalIncluded: boolean = true,
): Promise<CredentialsEntry> {
  const row = await getDb().oneOrNone<DBCredentialsEntry>(
    `
    INSERT INTO
      data.publications (
        survey_id,
        username,
        password,
        alphanumeric_included,
        geospatial_included,
        personal_included
      )
    VALUES (
      $(surveyId),
      $(username),
      crypt($(password), gen_salt('bf', 8)),
      $(alphanumericIncluded),
      $(geospatialIncluded),
      $(personalIncluded)
    )
    ON CONFLICT(survey_id)
    DO UPDATE SET
      username = $(username),
      password = crypt($(password), gen_salt('bf', 8)),
      alphanumeric_included = $(alphanumericIncluded),
      geospatial_included = $(geospatialIncluded),
      personal_included = $(personalIncluded)
    RETURNING
      id,
      survey_id,
      username,
      alphanumeric_included,
      geospatial_included,
      personal_included;
    `,
    {
      surveyId,
      username,
      password,
      alphanumericIncluded,
      geospatialIncluded,
      personalIncluded,
    },
  );

  if (!row) {
    throw new InternalServerError(
      `Error while publishing submissions with the survey ID: ${surveyId}`,
    );
  }
  return dbCredentialEntryRowToCredentialEntry(row);
}

/**
 * Returns the credentials for the published survey submissions. Should
 * currently return only one or no credentials per survey, however, the
 * array format ensures support for multiple publications in the future
 * @param surveyId Survey ID
 * @returns The publications as a list of objects of length 0-n
 */
export async function getPublicationCredentials(
  surveyId: number,
): Promise<CredentialsEntry[]> {
  const rows = await getDb().manyOrNone<{ id: number; survey_id: number }>(
    `
    SELECT
      id,
      survey_id,
      username,
      alphanumeric_included,
      geospatial_included,
      personal_included
    FROM data.publications
    WHERE survey_id = $1;
    `,
    [surveyId],
  );

  return rows.map((row: DBCredentialsEntry) =>
    dbCredentialEntryRowToCredentialEntry(row),
  );
}

/**
 * Deletes the credentials for the survey submissions
 * @param surveyId Survey ID
 * @returns The deleted row, if successful
 */
export async function deletePublicationCredentials(
  surveyId: number,
): Promise<CredentialsEntry> {
  const row = await getDb().oneOrNone<DBCredentialsEntry>(
    `
    DELETE FROM data.publications
    WHERE survey_id = $1
    RETURNING
      id,
      survey_id,
      username,
      alphanumeric_included,
      geospatial_included,
      personal_included
    `,
    [surveyId],
  );

  if (!row) {
    throw new NotFoundError(`
      Publication with the survey ID ${surveyId} not found
    `);
  }

  return dbCredentialEntryRowToCredentialEntry(row);
}
