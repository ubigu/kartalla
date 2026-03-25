import { LanguageCode, LocalizedText } from '@interfaces/survey';

/**
 * Interface for answer entry db row
 */
export interface DBAnswerEntry {
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

export interface AnswerEntry {
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

/**
 * Convert db answer row to js format
 */
export function dbAnswerEntryRowsToAnswerEntries(rows: DBAnswerEntry[]) {
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
