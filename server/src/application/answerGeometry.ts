import { LanguageCode, LocalizedSurveyMapLayer } from '@interfaces/survey';
import { getDb } from '@src/database';
import useTranslations from '@src/translations/useTranslations';
import fs, { readFileSync, rmSync } from 'fs';
import moment from 'moment';
import ogr2ogr from 'ogr2ogr';
import path from 'path';
import {
  AnswerEntry,
  DBAnswerEntry,
  dbAnswerEntryRowsToAnswerEntries,
} from './answerTypes';
import { getAvailableOskariMapLayers, getSurveyTargetSrid } from './map';
import { getSurvey } from './survey';

function localize(
  text: Record<string, string> | undefined | null,
  lang: LanguageCode,
  fallback = '',
) {
  return text?.[lang] ?? text?.['fi'] ?? fallback;
}

interface CheckboxOptions {
  text: { [key: string]: string };
  sectionId: number;
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
 * Type-safe representation of page section details stored in database
 * Used for geometry answer processing (GPKG generation, etc.)
 */
interface PageSectionDetails {
  unit?: string;
  targets?: Array<{
    name: { [key: string]: string };
    price?: number;
    icon?: string;
  }>;
  [key: string]: any; // Allow additional fields for extensibility
}

/**
 * Helper function for converting answer entries into a GeoJSON Feature
 * @param answer
 * @param mapLayers
 * @param questionDetails - Full page section details for accessing question configuration
 * @param answerType - Type of the answer (map or geo-budgeting)
 * @returns
 */
function geometryAnswerToFeature(
  answer: AnswerEntry,
  mapLayers: LocalizedSurveyMapLayer[],
  lang: LanguageCode,
  questionDetails?: PageSectionDetails,
  answerType?: string,
) {
  // Some erroneous data might not have a geometry - return null for them to avoid further errors
  if (!answer.valueGeometry) {
    return null;
  }
  const tr = useTranslations(lang);
  const mapLayerNames = answer.mapLayers
    .map((layerId) => mapLayers.find((layer) => layer.id === layerId))
    .filter(Boolean)
    .map((layer) =>
      typeof layer?.name === 'string'
        ? layer.name
        : localize(layer?.name, lang),
    )
    .filter(Boolean);

  const properties = {
    [tr.submissionId]: answer.submissionId,
    [tr.timestamp]: moment(answer.createdAt).format('DD-MM-YYYY, HH:mm'),
    [tr.responseLanguage]: tr[answer?.submissionLanguage ?? 'fi'],
    [tr.question]: `${tr.page} ${answer.pageIndex + 1} / ${tr.question} ${
      answer.sectionIndex + 1
    }: ${localize(answer.title, lang)}`,
    [tr.MapQuestion.visibleLayers]: mapLayerNames.join(', '),
  };

  // Add target information for geobudgeting answers
  if (
    answerType === 'geo-budgeting' &&
    questionDetails?.targets &&
    answer.valueNumeric !== null &&
    answer.valueNumeric !== undefined
  ) {
    const targetIndex = answer.valueNumeric;
    const target = questionDetails.targets[targetIndex];
    if (target) {
      properties[tr.GeoBudgetingQuestion.target] = localize(
        target.name,
        lang,
        `${tr.GeoBudgetingQuestion.target} ${targetIndex}`,
      );
      if (target.price !== undefined && target.price !== null) {
        properties[tr.GeoBudgetingQuestion.price] = target.price;
        if (questionDetails.unit) {
          properties[tr.GeoBudgetingQuestion.unit] = questionDetails.unit;
        }
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
  mapLayers: LocalizedSurveyMapLayer[],
  lang: LanguageCode,
) {
  // Sort entries first by submission, then by sectionId
  // Each sectionId instance (separated by submission) will represent a single Feature
  const tr = useTranslations(lang);

  const answersToSubmissions = entries.reduce((submissionGroup, answer) => {
    const { submissionId } = answer;
    submissionGroup[submissionId] = submissionGroup[submissionId] ?? {};
    // If answer doesn't have parentEntryId, it is the parent itself. Store following answers under the parent
    if (!answer.parentEntryId) {
      // Pass full page section details for both map and geobudgeting answers
      const questionDetails = answer.details as PageSectionDetails;
      submissionGroup[submissionId][answer.answerId] = geometryAnswerToFeature(
        answer,
        mapLayers,
        lang,
        questionDetails,
        answer.type,
      );
    } else if (submissionGroup[submissionId][answer.parentEntryId]) {
      // Add subquestion answer
      let newAnswer: string | number;
      let key: string = `${tr.subquestion} ${answer.sectionIndex + 1}: ${localize(
        answer.title,
        lang,
        tr.unnamedSubquestion,
      )}`;
      const keyOther: string = `${key} - ${tr.customAnswerLabel}`;

      switch (answer.type) {
        case 'checkbox':
          // initialize subquestion headers for checkbox question
          checkboxOptions
            .filter((opt) => opt.sectionId === answer.sectionId)
            .forEach((opt) => {
              const questionKey = `${key} - ${localize(opt.text, lang)}`;
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
          } else if (localize(answer.optionText, lang)) {
            key = `${key} - ${localize(answer.optionText, lang)}`;
            submissionGroup[submissionId][answer.parentEntryId].properties[
              key
            ] = 'true';
          }

          break;
        default:
          newAnswer =
            answer.valueNumeric ??
            answer.valueText ??
            localize(answer.optionText, lang);

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

/**
 * Get all DB geometry answer entries for the given survey id
 * @param surveyId
 * @returns
 */
async function getGeometryDBEntries(
  surveyId: number,
  targetSrid: number,
): Promise<AnswerEntry[]> {
  const rows = (await getDb().manyOrNone(
    `SELECT
      ae.submission_id,
      ae.id as answer_id,
      ae.section_id,
      ae.value_text,
      ae.value_option_id,
      opt.text as option_text,
      public.ST_AsGeoJSON(public.ST_Transform(ae.value_geometry, $2))::json as value_geometry,
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
    [surveyId, targetSrid],
  )) as DBAnswerEntry[];

  if (!rows || rows.length === 0) return null;
  return dbAnswerEntryRowsToAnswerEntries(rows);
}

/**
 * Get geometry DB entries for the survey as GeoJSON FeatureCollections
 * @param surveyId
 * @returns An object of FeatureCollections grouped by the question
 */
export async function getGeometryDBEntriesAsGeoJSON(
  surveyId: number,
  lang: LanguageCode = 'fi',
): Promise<{ [key: string]: FeatureCollection }> {
  const survey = await getSurvey({ id: surveyId });
  const [targetSrid, checkboxOptions, mapLayers] = await Promise.all([
    getSurveyTargetSrid(survey),
    getCheckboxOptionsFromDB(surveyId),
    getAvailableOskariMapLayers(survey.mapUrl),
  ]);
  const rows = await getGeometryDBEntries(surveyId, targetSrid);

  if (!rows) return null;

  const features = dbEntriesToFeatures(rows, checkboxOptions, mapLayers, lang);
  /* There could be rows where the parent map answer (erroneously) has null geometry
  - if there are no valid map answers, return null from here too */
  if (!features.length) return null;

  const tr = useTranslations(lang);

  // Group features by question to add them to separate layers
  return features.reduce((questions, feature) => {
    const { properties } = feature;
    const questionTitle = properties[tr.question];

    questions[questionTitle] = questions[questionTitle] ?? {
      type: 'FeatureCollection',
      features: [],
      crs: {
        type: 'name',
        properties: { name: `urn:ogc:def:crs:EPSG::${targetSrid}` },
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
export async function getGeoPackageFile(
  surveyId: number,
  lang: LanguageCode = 'fi',
): Promise<Buffer> {
  const featuresByQuestion = await getGeometryDBEntriesAsGeoJSON(
    surveyId,
    lang,
  );

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
