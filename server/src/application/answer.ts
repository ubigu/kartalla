import {
  FileAnswer,
  LanguageCode,
  LocalizedText,
  MapLayer,
} from '@interfaces/survey';
import { encryptionKey, getDb } from '@src/database';
import useTranslations from '@src/translations/useTranslations';
import { indexToAlpha } from '@src/utils';
import fs, { readFileSync, rmSync } from 'fs';
import moment from 'moment';
import ogr2ogr from 'ogr2ogr';
import path from 'path';
import { getAvailableMapLayers } from './map';
import { getSurvey } from './survey';

const tr = useTranslations('fi');

/**
 * Interface for answer entry db row
 */
interface DBAnswerEntry {
  answer_id: number;
  page_index: number;
  details: {
    subjects?: LocalizedText[];
    classes?: LocalizedText[];
  };
  section_id: number;
  parent_section?: number;
  parent_entry_id?: number;
  section_index: number;
  submission_id: number;
  language: LanguageCode;
  title: LocalizedText;
  type: string;
  geometry_srid?: number;
  value_geometry: GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon;
  value_text: string;
  value_json: JSON[];
  value_option_id: number;
  value_numeric: number;
  created_at: Date;
  option_text: string;
  option_group_index: number;
  map_layers: (number | string)[];
}

/**
 * Interface for data.answer_entry file -entries
 */
interface FileEntry {
  valueFile: string;
  valueFileName: string;
  submissionId: number;
  sectionId: number;
  pageIndex: number;
  sectionIndex: number;
}

interface AnswerEntry {
  answerId: number;
  pageIndex: number;
  details: {
    subjects?: LocalizedText[];
    classes?: LocalizedText[];
    allowCustomAnswer?: boolean;
  };
  sectionId: number;
  parentSectionId?: number;
  parentEntryId?: number;
  sectionIndex: number;
  submissionId: number;
  submissionLanguage: LanguageCode;
  title: LocalizedText;
  type: string;
  geometrySRID: number;
  valueGeometry: GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon;
  valueText: string;
  valueJson: JSON[];
  valueOptionId: number;
  valueNumeric: number;
  createdAt: Date;
  groupIndex: number;
  optionIndex: number;
  optionText?: string;
  mapLayers: (number | string)[];
}

interface CheckboxOptions {
  text: LocalizedText;
  sectionId: number;
}

/**
 * Single cell on the CSV
 */
interface TextCell {
  [key: string]: string;
}

/**
 * GeoJSON Feature interface
 */
interface Feature {
  type: string;
  geometry: JSON;
  properties: JSON;
}

/**
 * GeoJSON FeatureCollection interface
 */
interface FeatureCollection {
  type: string;
  features: Feature[];
  crs: {
    type: string;
    properties: {
      name: string;
    };
  };
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

interface SubmissionPersonalInfo {
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

/**
 * Convert db answer row to js format
 * @param rows
 * @returns
 */
function dbAnswerEntryRowsToAnswerEntries(rows: DBAnswerEntry[]) {
  if (!rows) return null;

  return rows.map((row) => ({
    answerId: row.answer_id,
    pageIndex: row.page_index,
    details: row.details,
    sectionId: row.section_id,
    parentSectionId: row?.parent_section,
    parentEntryId: row?.parent_entry_id,
    sectionIndex: row.section_index,
    submissionId: row.submission_id,
    submissionLanguage: row?.language,
    title: row.title,
    type: row.type,
    geometrySRID: row.geometry_srid,
    valueGeometry: row.value_geometry,
    valueText: row.value_text,
    valueJson: row.value_json,
    valueOptionId: row.value_option_id,
    valueNumeric: row.value_numeric,
    optionText: row?.option_text,
    createdAt: row.created_at,
    groupIndex: row.option_group_index,
    mapLayers: row.map_layers ?? [],
  })) as AnswerEntry[];
}

/**
 * Helper function for converting answer entries into a GeoJSON Feature
 * @param answer
 * @param mapLayers
 * @param questionDetails - Optional question details needed for geobudgeting target info
 * @returns
 */
function geometryAnswerToFeature(
  answer: AnswerEntry,
  mapLayers: MapLayer[],
  questionDetails?: {
    type: string;
    targets?: { name: { [key: string]: string }; price?: number }[];
  },
) {
  // Some erroneous data might not have a geometry - return null for them to avoid further errors
  if (!answer.valueGeometry) {
    return null;
  }
  const mapLayerNames = answer.mapLayers
    .map((layerId) => mapLayers.find((layer) => layer.id === layerId))
    .filter(Boolean)
    .map((layer) =>
      typeof layer?.name === 'string'
        ? layer.name
        : (layer?.name?.['fi'] ?? ''),
    )
    .filter(Boolean);

  const properties = {
    ['Vastaustunniste']: answer.submissionId,
    ['Aikaleima']: moment(answer.createdAt).format('DD-MM-YYYY, HH:mm'),
    ['Vastauskieli']: tr[answer?.submissionLanguage ?? 'fi'],
    ['Kysymys']: `Sivu ${answer.pageIndex + 1} / Kysymys ${
      answer.sectionIndex + 1
    }: ${answer.title?.['fi'] ?? ''}`,
    ['Näkyvät tasot']: mapLayerNames.join(', '),
  };

  // Add target information for geobudgeting answers
  if (
    questionDetails?.type === 'geo-budgeting' &&
    questionDetails?.targets &&
    answer.valueNumeric !== null &&
    answer.valueNumeric !== undefined
  ) {
    const targetIndex = answer.valueNumeric;
    const target = questionDetails.targets[targetIndex];
    if (target) {
      properties['Kohde'] = target.name?.['fi'] ?? `Target ${targetIndex}`;
      if (target.price !== undefined && target.price !== null) {
        properties['Hinta'] = target.price;
      }
    }
  }

  return {
    type: 'Feature',
    geometry: {
      type: answer.valueGeometry.type,
      coordinates: answer.valueGeometry.coordinates,
    },
    properties,
  };
}

/**
 * Reduce DB query rows to GeoJSON features
 * @param entries DB answer entry rows
 * @returns
 */
function dbEntriesToFeatures(
  entries: AnswerEntry[],
  checkboxOptions: CheckboxOptions[],
  mapLayers: MapLayer[],
) {
  // Sort entries first by submission, then by sectionId
  // Each sectionId instance (separated by submission) will represent a single Feature

  const answersToSubmissions = entries.reduce((submissionGroup, answer) => {
    const { submissionId } = answer;
    submissionGroup[submissionId] = submissionGroup[submissionId] ?? {};
    // If answer doesn't have parentEntryId, it is the parent itself. Store following answers under the parent
    if (!answer.parentEntryId) {
      const questionDetails =
        answer.type === 'geo-budgeting'
          ? {
              type: answer.type,
              targets: (
                answer.details as unknown as {
                  targets?: {
                    name: { [key: string]: string };
                    price?: number;
                  }[];
                }
              )?.targets,
            }
          : undefined;
      submissionGroup[submissionId][answer.answerId] = geometryAnswerToFeature(
        answer,
        mapLayers,
        questionDetails,
      );
    } else if (submissionGroup[submissionId][answer.parentEntryId]) {
      // Add subquestion answer
      let newAnswer: string;
      let key: string = `Alikysymys ${answer.sectionIndex + 1}: ${
        answer.title?.['fi'] ?? 'Nimetön alikysymys'
      }`;
      const keyOther: string = `${key} - jokin muu, mikä?`;

      switch (answer.type) {
        case 'checkbox':
          // initialize subquestion headers for checkbox question
          checkboxOptions
            .filter((opt) => opt.sectionId === answer.sectionId)
            .forEach((opt) => {
              const questionKey = `${key} - ${opt.text['fi']}`;
              if (
                !submissionGroup[submissionId][answer.parentEntryId].properties[
                  questionKey
                ]
              ) {
                submissionGroup[submissionId][answer.parentEntryId].properties[
                  questionKey
                ] = 'false';
              }
            });
          // initialize subquestion custom answer header if it exists
          if (
            answer.details.allowCustomAnswer &&
            !submissionGroup[submissionId][answer.parentEntryId].properties[
              keyOther
            ]
          ) {
            submissionGroup[submissionId][answer.parentEntryId].properties[
              keyOther
            ] = null;
          }

          // insert subquestion answer under respective header
          if (answer.valueText) {
            submissionGroup[submissionId][answer.parentEntryId].properties[
              keyOther
            ] = answer.valueText;
          } else if (answer.optionText?.['fi']) {
            key = `${key} - ${answer?.optionText?.['fi']}`;
            submissionGroup[submissionId][answer.parentEntryId].properties[
              key
            ] = 'true';
          }

          break;
        default:
          newAnswer =
            answer.valueNumeric ??
            answer.valueText ??
            answer.optionText?.['fi'] ??
            '';

          submissionGroup[submissionId][answer.parentEntryId].properties[key] =
            newAnswer;
      }
    }

    return submissionGroup;
  }, {});

  return Object.values(answersToSubmissions).reduce<Feature[]>(
    (featuresArray, submissionObj) => {
      return [
        ...featuresArray,
        ...Object.values(submissionObj).filter(Boolean),
      ];
    },
    [],
  );
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
      askName: `,${personalInfo?.name}`,
      askEmail: `,${personalInfo?.email}`,
      askPhone: `,${personalInfo?.phone}`,
      askAddress: `,${personalInfo?.address}`,
      askCustom: `,${personalInfo?.custom}`,
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

      headers.forEach((headerObj, index) => {
        for (const [headerKey, headerValue] of Object.entries(headerObj)) {
          csvData += Object.values(submissions[i])[0].hasOwnProperty(headerKey)
            ? `,"${Object.values(submissions[i])[0][headerKey]}"`
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

/**
 * Get geometry DB entries for the survey as GeoJSON FeatureCollections
 * @param surveyId
 * @returns An object of FeatureCollections grouped by the question
 */
export async function getGeometryDBEntriesAsGeoJSON(
  surveyId: number,
): Promise<{ [key: string]: FeatureCollection }> {
  const rows = await getGeometryDBEntries(surveyId);
  const srid = rows?.find((row) => row.geometrySRID)?.geometrySRID ?? '3857';
  const checkboxOptions = await getCheckboxOptionsFromDB(surveyId);
  const mapLayers = await getSurvey({ id: surveyId }).then((survey) =>
    getAvailableMapLayers(survey.mapUrl),
  );

  if (!rows) return null;

  const features = dbEntriesToFeatures(rows, checkboxOptions, mapLayers);
  /* There could be rows where the parent map answer (erroneously) has null geometry
  - if there are no valid map answers, return null from here too */
  if (!features.length) return null;

  // Group features by question to add them to separate layers
  return features.reduce((questions, feature) => {
    const { properties } = feature;
    const questionTitle = properties['Kysymys'];

    questions[questionTitle] = questions[questionTitle] ?? {
      type: 'FeatureCollection',
      features: [],
      crs: {
        type: 'name',
        properties: { name: `urn:ogc:def:crs:EPSG::${srid}` },
      },
    };
    questions[questionTitle].features.push(feature);
    return questions;
  }, {});
}

/**
 * Handler function for downloading geopackage file
 * @param surveyId
 * @returns Promise resolving to readable stream streaming geopackage data
 */
export async function getGeoPackageFile(surveyId: number): Promise<Buffer> {
  const featuresByQuestion = await getGeometryDBEntriesAsGeoJSON(surveyId);

  const tmpFilePath = `/tmp/geopackage_${Date.now()}.gpkg`;

  const [[firstQuestion, firstFeatures], ...rest] =
    Object.entries(featuresByQuestion);

  // The first question needs to be created first - the remaining questions will be added to it via -update
  // Tried to conditionally add the "-update" flag but there was some race condition and I couldn't figure it out
  const firstFeaturesPath = path.join(
    '/tmp',
    `first_features_${Date.now()}.json`,
  );
  fs.writeFileSync(firstFeaturesPath, JSON.stringify(firstFeatures));

  await ogr2ogr(firstFeaturesPath, {
    format: 'GPKG',
    destination: tmpFilePath,
    options: ['-nln', firstQuestion],
  });

  fs.unlinkSync(firstFeaturesPath);

  let index = 1;
  for (const [question, features] of rest) {
    const featuresPath = path.join(
      '/tmp',
      `features_${index}_${Date.now()}.json`,
    );
    fs.writeFileSync(featuresPath, JSON.stringify(features));

    await ogr2ogr(featuresPath, {
      format: 'GPKG',
      destination: tmpFilePath,
      options: ['-nln', question, '-update'],
    });

    fs.unlinkSync(featuresPath);
    index++;
  }

  // Read the file contents and remove it from the disk
  const file = readFileSync(tmpFilePath);
  rmSync(tmpFilePath);
  return file;
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

async function getCheckboxOptionsFromDB(surveyId: number) {
  const rows = await getDb().manyOrNone(
    `SELECT
        opt.TEXT,
        opt.section_id as "sectionId"
      FROM data.option opt
        LEFT JOIN data.page_section ps ON opt.section_id = ps.id
        LEFT JOIN data.survey_page sp ON ps.survey_page_id = sp.id
        LEFT JOIN data.survey s ON sp.survey_id = s.id
      WHERE s.id = $1
      ORDER BY opt.idx;`,
    [surveyId],
  );
  if (!rows || rows.length === 0) return null;
  return rows;
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
 * Get all DB geometry answer entries for the given survey id
 * @param surveyId
 * @returns
 */
async function getGeometryDBEntries(surveyId: number): Promise<AnswerEntry[]> {
  const rows = (await getDb().manyOrNone(
    `SELECT
      ae.submission_id,
      ae.id as answer_id,
      ae.section_id,
      ae.value_text,
      ae.value_option_id,
      opt.text as option_text,
      public.ST_AsGeoJSON(ae.value_geometry)::json as value_geometry,
      public.ST_SRID(ae.value_geometry) AS geometry_srid,
      ae.value_numeric,
      ae.value_json,
      ae.parent_entry_id,
      ae.map_layers,
      sp.idx as page_index,
      ps.idx as section_index,
      ps.type,
      ps.title,
      ps.details,
      ps.parent_section,
      sub.created_at,
      sub.language
        FROM data.answer_entry ae
        LEFT JOIN data.submission sub ON ae.submission_id = sub.id
        LEFT JOIN data.page_section ps ON ps.id = ae.section_id
        LEFT JOIN data.survey_page sp ON ps.survey_page_id = sp.id
        LEFT JOIN data.survey s ON sp.survey_id = s.id
        LEFT JOIN data.option opt ON opt.id = ae.value_option_id
        WHERE (type = 'map' OR type = 'geo-budgeting' OR parent_section IS NOT NULL)
          AND sub.unfinished_token IS NULL
          AND sub.survey_id = $1
          ORDER BY submission_id, ae.parent_entry_id ASC NULLS FIRST, section_index, opt.idx`,
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
    const [pageIndex, sectionIndex] =
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
        sectionDetails.details.subjects.forEach((subject, index) => {
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
        sectionDetails.details.targets?.forEach((target, index) => {
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
      return answer.valueText.replace(/\r?\n/g, '').replace(/,/g, '');
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

export async function getAnswerCounts(surveyId: number) {
  const result = await getDb().one<{
    alphaNumericAnswers: string;
    attachmentAnswers: string;
    mapAnswers: string;
    geoBudgetingAnswers: string;
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
        COUNT(*) FILTER (WHERE type = 'map') AS "mapAnswers",
        COUNT(*) FILTER (WHERE type = 'geo-budgeting') AS "geoBudgetingAnswers",
        (SELECT COUNT(*) FROM personal_info_entries) AS "personalInfoAnswers"
    FROM answer_entries;
  `,
    [surveyId],
  );
  return {
    alphaNumericAnswers: Number(result.alphaNumericAnswers),
    attachmentAnswers: Number(result.attachmentAnswers),
    mapAnswers: Number(result.mapAnswers),
    geoBudgetingAnswers: Number(result.geoBudgetingAnswers),
    personalInfoAnswers: Number(result.personalInfoAnswers),
  };
}
