import {
  Conditions,
  EnabledLanguages,
  File,
  LanguageCode,
  LocalizedText,
  SectionOption,
  SectionOptionGroup,
  Survey,
  SurveyCheckboxQuestion,
  SurveyEmailInfoItem,
  SurveyFollowUpSection,
  SurveyImage,
  SurveyMapQuestion,
  SurveyMapSubQuestion,
  SurveyPage,
  SurveyPageConditions,
  SurveyPageSection,
  SurveyPageSidebarImageSize,
  SurveyPageSidebarType,
  SurveyRadioQuestion,
  SurveyTheme,
  APISurvey,
} from '@interfaces/survey';

import { User } from '@interfaces/user';
import {
  getColumnSet,
  getDb,
  getGeoJSONColumn,
  getMultiInsertQuery,
  getMultiUpdateQuery,
} from '@src/database';
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from '@src/error';
import { isAdmin, isSuperUser } from '@src/user';

import { geometryToGeoJSONFeatureCollection } from '@src/utils';
import { Geometry } from 'geojson';

const sectionTypesWithOptions: SurveyPageSection['type'][] = [
  'radio',
  'checkbox',
  'sorting',
];

/**
 * Survey's DB model
 */
interface DBSurvey {
  id: number;
  name: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  author: string;
  author_unit: string;
  author_id: string;
  editors: string[];
  viewers: string[];
  map_url: string;
  start_date: Date;
  end_date: Date;
  allow_test_survey: boolean;
  display_privacy_statement: boolean;
  created_at: Date;
  updated_at: Date;
  thanks_page_title: LocalizedText;
  thanks_page_text: LocalizedText;
  thanks_page_image_url: string;
  background_image_url: string;
  top_margin_image_url: string;
  bottom_margin_image_url: string;
  section_title_color: string;
  email_enabled: boolean;
  email_auto_send_to: string[];
  email_subject: LocalizedText;
  email_body: LocalizedText;
  email_info: SurveyEmailInfoItem[];
  email_include_personal_info: boolean;
  allow_saving_unfinished: boolean;
  localisation_enabled: boolean;
  submission_count?: number;
  organization: string;
  tags: string[];
  languages: LanguageCode[];
}

/**
 * DB row of the data.survey_page table
 */
interface DBSurveyPage {
  id: number;
  survey_id: number;
  idx: number;
  title: LocalizedText;
  sidebar_type: SurveyPageSidebarType;
  /**
   * IDs of the map layers visible on the page
   * For some reason, pg won't be able to cast number[] to json - the array should be JSON.stringified
   */
  sidebar_map_layers: string;
  sidebar_image_url: string;
  sidebar_image_alt_text: LocalizedText;
  sidebar_image_size: SurveyPageSidebarImageSize;
}

/**
 * DB row of the data.page_section
 */
interface DBSurveyPageSection {
  id: number;
  survey_page_id: number;
  type: string;
  title: LocalizedText;
  body: LocalizedText;
  idx: number;
  details: object;
  parent_section: number;
  info: LocalizedText;
  file_url: string;
  predecessor_section: number;
}

/**
 * DB row of table data.option
 */
interface DBSectionOption {
  id?: number;
  idx: number;
  text: LocalizedText;
  section_id: number;
  info?: LocalizedText;
  group_id: number;
}

interface DBSectionCondition {
  id?: number;
  section_id: number;
  survey_page_id: number;
  equals: string;
  less_than: number;
  greater_than: number;
}

/**
 * DB row of table data.option_group
 */
interface DBOptionGroup {
  id?: number;
  idx: number;
  name: LocalizedText;
  section_id: number;
}

/**
 * DB condition row of table data.section_conditions
 */
interface DBAllConditions {
  id: number;
  section_id: number;
  survey_page_id: number;
  equals: string;
  less_than: number;
  greater_than: number;
}

/**
 * Type for join DB query containing survey row and selected page, section & option columns.
 */
type DBSurveyJoin = DBSurvey & {
  page_id: number;
  page_title: LocalizedText;
  page_sidebar_type: SurveyPageSidebarType;
  page_sidebar_map_layers: number[];
  page_sidebar_image_url: string;
  page_sidebar_image_alt_text: LocalizedText;
  page_sidebar_image_size: SurveyPageSidebarImageSize;
  section_id: number;
  section_title: LocalizedText;
  section_title_color: string;
  section_body: LocalizedText;
  section_type: string;
  section_details: object;
  section_parent_section: number;
  section_predecessor_section: number;
  section_info: LocalizedText;
  section_file_url: string;
  option_id: number;
  option_text: LocalizedText;
  option_group_id: number;
  option_info: LocalizedText;
  theme_id: number;
  theme_name: string;
  theme_data: SurveyTheme;
  default_map_view: Geometry;
  mapViewSRID: number;
};

/**
 * DB row indicating whether the user is authorized with an
 * entered username and password and which materials they can be accessed
 */
interface DBPublicationAccesses {
  authorized: boolean;
  alphanumeric_included: boolean;
  geospatial_included: boolean;
  personal_included: boolean;
}

/**
 * The publication accesses in a JS format
 */
interface PublicationAccesses {
  authorized: boolean;
  alphanumericIncluded: boolean;
  geospatialIncluded: boolean;
  personalIncluded: boolean;
}

/**
 * Helper function for creating survey page column set for database queries
 */
const surveyPageColumnSet = (inputSRID: number) =>
  getColumnSet<DBSurveyPage>('survey_page', [
    'id',
    'survey_id',
    'idx',
    {
      name: 'title',
      cast: 'json',
    },
    'sidebar_type',
    {
      name: 'sidebar_map_layers',
      cast: 'json',
    },
    'sidebar_image_url',
    {
      name: 'sidebar_image_alt_text',
      cast: 'json',
    },
    'sidebar_image_size',
    getGeoJSONColumn('default_map_view', inputSRID),
  ]);

/**
 * Helper function for creating section option column set for database queries
 */
const sectionOptionColumnSet = getColumnSet<DBSectionOption>('option', [
  'section_id',
  'idx',
  { name: 'text', cast: 'json' },
  { name: 'info', cast: 'json' },
]);

const conditionColumnSet = getColumnSet<DBSectionCondition>(
  'section_conditions',
  [
    { name: 'section_id', cast: 'int' },
    { name: 'survey_page_id', cast: 'int' },
    { name: 'equals', cast: 'int' },
    { name: 'less_than', cast: 'int' },
    { name: 'greater_than', cast: 'int' },
  ],
);

/**
 * Gets the survey with given ID or name from the database.
 * @param params Query parameter (search by ID or name)
 * @returns Requested survey
 */
export async function getPublishedSurvey(
  params: ({ id: number } | { name: string }) & { organization?: string },
) {
  const rows = await getDb().manyOrNone<DBSurveyJoin>(
    `
    SELECT 
      survey_page_section.*,
      option.id as option_id,
      option.text as option_text,
      option.idx as option_idx,
      option.group_id as option_group_id,
      option.info as option_info
    FROM (
      SELECT
        survey_page.*,
        section.id as section_id,
        section.title as section_title,
        section.body as section_body,
        section.type as section_type,
        section.details as section_details,
        section.idx as section_idx,
        section.parent_section as section_parent_section,
        section.info as section_info,
        section.file_url as section_file_url,
        section.predecessor_section as section_predecessor_section
      FROM (
        SELECT
          survey.id,
          survey.name,
          survey.title,
          survey.subtitle,
          survey.start_date,
          survey.end_date,
          survey.thanks_page_title,
          survey.thanks_page_text,
          survey.map_url,
          survey.section_title_color,
          survey.background_image_url,
          survey.thanks_page_image_url,
          survey.top_margin_image_url,
          survey.bottom_margin_image_url,
          survey.email_enabled,
          survey.allow_saving_unfinished,
          survey.allow_test_survey,
          survey.localisation_enabled,
          survey.display_privacy_statement,
          survey.theme_id as theme_id,
          survey.languages,
          theme_name,
          theme_data,
          page.id as page_id,
          page.title as page_title,
          page.idx as page_idx,
          page.sidebar_type as page_sidebar_type,
          page.sidebar_map_layers as page_sidebar_map_layers,
          page.sidebar_image_url as page_sidebar_image_url,
          page.sidebar_image_alt_text as page_sidebar_image_alt_text,
          page.sidebar_image_size as page_sidebar_image_size,
          public.ST_AsGeoJSON(page.default_map_view)::json as default_map_view,
          public.ST_SRID(page.default_map_view) AS "mapViewSRID"
        FROM
          (
            SELECT
              survey.*,
              theme.id as theme_identifier,
              theme.name as theme_name,
              theme.data as theme_data
            FROM data.survey survey
            LEFT JOIN application.theme theme ON survey.theme_id = theme.id
            ${typeof params.organization === 'string' ? `WHERE survey.organization = $2` : ''}
          ) survey
          LEFT JOIN data.survey_page page ON survey.id = page.survey_id
        WHERE ${'id' in params ? `survey.id = $1` : `survey.name = $1`}
      ) AS survey_page
      LEFT JOIN data.page_section section ON survey_page.page_id = section.survey_page_id
    ) AS survey_page_section
    LEFT JOIN data.option option ON survey_page_section.section_id = option.section_id
    ORDER BY
      section_parent_section ASC NULLS FIRST,
      section_predecessor_section ASC NULLS FIRST,
      page_idx ASC,
      section_idx ASC,
      option_idx ASC;
  `,
    ['id' in params ? params.id : params.name, params.organization],
  );

  if (!rows.length) {
    throw new NotFoundError(
      'id' in params
        ? `Survey with ID ${params.id} not found`
        : `Survey with name ${params.name} not found`,
    );
  }

  // Get all option groups in its own query if needed
  const optionGroupIds = Array.from(
    new Set(rows.map((row) => row.option_group_id).filter(Boolean)),
  );

  const optionGroups = !optionGroupIds.length
    ? []
    : await getDb().manyOrNone<DBOptionGroup>(
        `SELECT * FROM data.option_group WHERE id = ANY ($1) ORDER BY idx ASC`,
        [optionGroupIds],
      );

  // Get all follow-up section and survey page conditions from the database
  const allConditions = await getSectionConditions(
    rows.map((row) => row.section_id).filter(Boolean),
  );
  return rows.reduce((survey, row) => {
    // Try to find the pre-existing page object
    let page = survey.pages.find((page) => page.id === row.page_id);
    if (!page && (page = dbSurveyJoinToPage(row))) {
      // Page not yet added - add converted row to survey
      survey.pages.push(getPageWithConditions(page, allConditions));
    }

    // Try to find the pre-existing page section object
    let section = page.sections.find(
      (section) => section.id === row.section_id,
    );
    if (!section && (section = dbSurveyJoinToSection(row))) {
      // Section not yet added - add converted row to survey page

      if (
        row.section_parent_section != null ||
        row.section_predecessor_section != null
      ) {
        const column =
          row.section_parent_section != null
            ? 'section_parent_section'
            : 'section_predecessor_section';
        const key =
          row.section_parent_section != null
            ? 'subQuestions'
            : 'followUpSections';

        // Parent section should already exist because of the ordering by parent section rule
        const parentSection =
          page.sections.find((section) => section.id === row[column]) ??
          page.sections
            .find(
              (section) =>
                section.followUpSections?.some(
                  (followUpSection) => followUpSection.id === row[column],
                ) ?? false,
            )
            .followUpSections.find((section) => section.id === row[column]);

        // Initialize subquestion or follow-up section array if it doesn't yet exist

        if (!parentSection[key]) {
          parentSection[key] = [];
        }

        // Try to find the pre-existing subquestion or follow-up section - if none is found, create it from the row
        let linkedSection =
          key === 'subQuestions'
            ? (parentSection as SurveyMapQuestion)[key].find(
                (linkedSection) => linkedSection.id === section.id,
              )
            : parentSection[key].find(
                (linkedSection) => linkedSection.id === section.id,
              );
        if (!linkedSection) {
          if (
            key === 'subQuestions' &&
            (linkedSection = dbSurveyJoinToSection(row) as SurveyMapSubQuestion)
          ) {
            // Subquestion didn't yet exist - add it to the parent section
            parentSection[key].push(linkedSection);
          } else if (
            key === 'followUpSections' &&
            (linkedSection = dbSurveyJoinToSection(
              row,
            ) as SurveyFollowUpSection)
          ) {
            linkedSection = {
              ...linkedSection,
              conditions: dbSectionConditionsToConditions(
                allConditions.filter(
                  (cond) => cond.section_id === linkedSection.id,
                ),
              ),
            } as SurveyFollowUpSection;
            // Follow-up question didn't yet exist - add it to the parent section
            parentSection[key].push(linkedSection as SurveyFollowUpSection);
          }
        }

        // If question contains options, add the option in the current row there
        if ('options' in linkedSection) {
          const option = dbSurveyJoinToOption(row);
          if (option) {
            linkedSection.options.push(option);
          }
        }
      } else {
        page.sections.push(section);
      }
    }

    // Only look for options if the section type allows options
    if (sectionTypesWithOptions.includes(section?.type)) {
      // For some reason TS cannot infer the section here correctly from the if above - assume the type in the new variable
      const question = section as SurveyRadioQuestion | SurveyCheckboxQuestion;
      // Try to find the pre-existing question option object
      let option = question.options.find(
        (option) => option.id === row.option_id,
      );
      if (!option && (option = dbSurveyJoinToOption(row))) {
        // Option not yet added - add converted row to section
        question.options.push(option);
      }
    }

    // Gather grouped options only for grouped checkbox questions
    if (section?.type === 'grouped-checkbox') {
      let group = section.groups.find(
        (group) => group?.id === row.option_group_id,
      );

      // If the group wasn't added yet, add it from the different query result
      if (!group) {
        const dbGroup = optionGroups.find(
          (group) => group.id === row.option_group_id,
        );
        // Add option group if it was found (otherwise ignore)
        if (dbGroup) {
          group = {
            id: dbGroup?.id,
            name: dbGroup?.name,
            options: [],
          };
          // Groups may be out of order, so use the index from the other query
          section.groups[dbGroup.idx] = group;
        }
      }

      // Only add options if the group exists - otherwise there are no options saved for this group
      if (group) {
        // Add the single option to the group
        group.options.push(dbSurveyJoinToOption(row));
      }
    }

    return survey;
  }, dbSurveyToSurvey(rows[0])) as Survey;
}

/**
 * Gets the survey with given ID or name from the database.
 * @param params Query parameter (search by ID or name)
 * @returns Requested survey
 */
export async function getSurvey(
  params: ({ id: number } | { name: string }) & { organization?: string },
) {
  const rows = await getDb().manyOrNone<DBSurveyJoin>(
    `
    SELECT 
      survey_page_section.*,
      option.id as option_id,
      option.text as option_text,
      option.idx as option_idx,
      option.group_id as option_group_id,
      option.info as option_info
    FROM (
      SELECT
        survey_page.*,
        section.id as section_id,
        section.title as section_title,
        section.body as section_body,
        section.type as section_type,
        section.details as section_details,
        section.idx as section_idx,
        section.parent_section as section_parent_section,
        section.info as section_info,
        section.file_url as section_file_url,
        section.predecessor_section as section_predecessor_section
      FROM (
        SELECT
          survey.*,
          page.id as page_id,
          page.title as page_title,
          page.idx as page_idx,
          page.sidebar_type as page_sidebar_type,
          page.sidebar_map_layers as page_sidebar_map_layers,
          page.sidebar_image_url as page_sidebar_image_url,
          page.sidebar_image_alt_text as page_sidebar_image_alt_text,
          page.sidebar_image_size as page_sidebar_image_size,
          public.ST_AsGeoJSON(page.default_map_view)::json as default_map_view,
          public.ST_SRID(page.default_map_view) AS "mapViewSRID"
        FROM
          (
            SELECT
              survey.*,
              theme.id as theme_id,
              theme.name as theme_name,
              theme.data as theme_data
            FROM data.survey survey
            LEFT JOIN application.theme theme ON survey.theme_id = theme.id
            ${typeof params.organization === 'string' ? `WHERE survey.organization = $2` : ''}
          ) survey
          LEFT JOIN data.survey_page page ON survey.id = page.survey_id
        WHERE ${'id' in params ? `survey.id = $1` : `survey.name = $1`}
      ) AS survey_page
      LEFT JOIN data.page_section section ON survey_page.page_id = section.survey_page_id
    ) AS survey_page_section
    LEFT JOIN data.option option ON survey_page_section.section_id = option.section_id
    ORDER BY
      section_parent_section ASC NULLS FIRST,
      section_predecessor_section ASC NULLS FIRST,
      page_idx ASC,
      section_idx ASC,
      option_idx ASC;
  `,
    ['id' in params ? params.id : params.name, params.organization],
  );

  if (!rows.length) {
    throw new NotFoundError(
      'id' in params
        ? `Survey with ID ${params.id} not found`
        : `Survey with name ${params.name} not found`,
    );
  }

  // Get all option groups in its own query if needed
  const optionGroupIds = Array.from(
    new Set(rows.map((row) => row.option_group_id).filter(Boolean)),
  );

  const optionGroups = !optionGroupIds.length
    ? []
    : await getDb().manyOrNone<DBOptionGroup>(
        `SELECT * FROM data.option_group WHERE id = ANY ($1) ORDER BY idx ASC`,
        [optionGroupIds],
      );

  // Get all follow-up section and survey page conditions from the database
  const allConditions = await getSectionConditions(
    rows.map((row) => row.section_id).filter(Boolean),
  );
  return rows.reduce((survey, row) => {
    // Try to find the pre-existing page object
    let page = survey.pages.find((page) => page.id === row.page_id);
    if (!page && (page = dbSurveyJoinToPage(row))) {
      // Page not yet added - add converted row to survey
      survey.pages.push(getPageWithConditions(page, allConditions));
    }

    // Try to find the pre-existing page section object
    let section = page.sections.find(
      (section) => section.id === row.section_id,
    );
    if (!section && (section = dbSurveyJoinToSection(row))) {
      // Section not yet added - add converted row to survey page

      if (
        row.section_parent_section != null ||
        row.section_predecessor_section != null
      ) {
        const column =
          row.section_parent_section != null
            ? 'section_parent_section'
            : 'section_predecessor_section';
        const key =
          row.section_parent_section != null
            ? 'subQuestions'
            : 'followUpSections';

        // Parent section should already exist because of the ordering by parent section rule
        const parentSection =
          page.sections.find((section) => section.id === row[column]) ??
          page.sections
            .find(
              (section) =>
                section.followUpSections?.some(
                  (followUpSection) => followUpSection.id === row[column],
                ) ?? false,
            )
            .followUpSections.find((section) => section.id === row[column]);

        // Initialize subquestion or follow-up section array if it doesn't yet exist

        if (!parentSection[key]) {
          parentSection[key] = [];
        }

        // Try to find the pre-existing subquestion or follow-up section - if none is found, create it from the row
        let linkedSection =
          key === 'subQuestions'
            ? (parentSection as SurveyMapQuestion)[key].find(
                (linkedSection) => linkedSection.id === section.id,
              )
            : parentSection[key].find(
                (linkedSection) => linkedSection.id === section.id,
              );
        if (!linkedSection) {
          if (
            key === 'subQuestions' &&
            (linkedSection = dbSurveyJoinToSection(row) as SurveyMapSubQuestion)
          ) {
            // Subquestion didn't yet exist - add it to the parent section
            parentSection[key].push(linkedSection);
          } else if (
            key === 'followUpSections' &&
            (linkedSection = dbSurveyJoinToSection(
              row,
            ) as SurveyFollowUpSection)
          ) {
            linkedSection = {
              ...linkedSection,
              conditions: dbSectionConditionsToConditions(
                allConditions.filter(
                  (cond) => cond.section_id === linkedSection.id,
                ),
              ),
            } as SurveyFollowUpSection;
            // Follow-up question didn't yet exist - add it to the parent section
            parentSection[key].push(linkedSection as SurveyFollowUpSection);
          }
        }

        // If question contains options, add the option in the current row there
        if ('options' in linkedSection) {
          const option = dbSurveyJoinToOption(row);
          if (option) {
            linkedSection.options.push(option);
          }
        }
      } else {
        page.sections.push(section);
      }
    }

    // Only look for options if the section type allows options
    if (sectionTypesWithOptions.includes(section?.type)) {
      // For some reason TS cannot infer the section here correctly from the if above - assume the type in the new variable
      const question = section as SurveyRadioQuestion | SurveyCheckboxQuestion;
      // Try to find the pre-existing question option object
      let option = question.options.find(
        (option) => option.id === row.option_id,
      );
      if (!option && (option = dbSurveyJoinToOption(row))) {
        // Option not yet added - add converted row to section
        question.options.push(option);
      }
    }

    // Gather grouped options only for grouped checkbox questions
    if (section?.type === 'grouped-checkbox') {
      let group = section.groups.find(
        (group) => group?.id === row.option_group_id,
      );

      // If the group wasn't added yet, add it from the different query result
      if (!group) {
        const dbGroup = optionGroups.find(
          (group) => group.id === row.option_group_id,
        );
        // Add option group if it was found (otherwise ignore)
        if (dbGroup) {
          group = {
            id: dbGroup?.id,
            name: dbGroup?.name,
            options: [],
          };
          // Groups may be out of order, so use the index from the other query
          section.groups[dbGroup.idx] = group;
        }
      }

      // Only add options if the group exists - otherwise there are no options saved for this group
      if (group) {
        // Add the single option to the group
        group.options.push(dbSurveyJoinToOption(row));
      }
    }

    return survey;
  }, dbSurveyToSurvey(rows[0])) as Survey;
}

/**
 * Get all surveys from the db
 * @returns Array of Surveys
 */
export async function getSurveys(
  authorId?: string | null,
  filterByPublished?: boolean,
  organization?: string | null,
) {
  const rows = await getDb().manyOrNone<DBSurvey>(
    `SELECT
    COUNT(sub) AS submission_count,
    survey.*
  FROM
    data.survey survey
    LEFT JOIN data.submission sub ON sub.survey_id = survey.id
  WHERE
    ($1 IS NULL OR author_id = $1)
    ${typeof organization === 'string' ? `AND survey.organization = $3` : ''}
  GROUP BY survey.id
  ORDER BY updated_at DESC`,
    [authorId, filterByPublished, organization],
  );

  return rows
    .map((row) => dbSurveyToSurvey(row))
    .filter((survey) =>
      filterByPublished
        ? isPublished({ startDate: survey.startDate, endDate: survey.endDate })
        : survey,
    );
}

export async function getSurveyOrganization(id: number) {
  const rows = await getDb().one<{ organization: string }>(
    `SELECT organization FROM data.survey WHERE id = $1`,
    [id],
  );
  return rows.organization;
}

/**
 * Checks whether the user is authorized with an entered username
 * and password and which publication materials they can be accessed
 * @param id The ID of the survey
 * @param username The given username
 * @param password The given password
 */
export async function getPublicationAccesses(
  id: number,
  username: string,
  password: string,
): Promise<PublicationAccesses> {
  const row = await getDb().oneOrNone<DBPublicationAccesses>(
    `SELECT
      password = crypt($(password), password) as authorized,
      alphanumeric_included,
      geospatial_included,
      personal_included
    FROM data.publications
    WHERE survey_id = $(id)
    AND username = $(username);`,
    { password, id, username },
  );
  return {
    authorized: row?.authorized ?? false,
    alphanumericIncluded: row?.alphanumeric_included ?? false,
    geospatialIncluded: row?.geospatial_included ?? false,
    personalIncluded: row?.personal_included ?? false,
  };
}

/**
 * Creates a new survey entry into the database
 * @param user Author
 */
export async function createSurvey(user: User) {
  const surveyRow = await getDb().one<DBSurvey>(
    `INSERT INTO data.survey (author_id, organization)
    VALUES ($1, $2)
    RETURNING *`,
    [user.id, user.organizations[0]], // For now, use the first organization
  );

  if (!surveyRow) {
    throw new InternalServerError(`Error while creating a new survey`);
  }

  const survey = dbSurveyToSurvey(surveyRow);
  const page = await createSurveyPage(survey.id);

  return { ...survey, pages: [page] };
}

/**
 * Upserts (updates or inserts) given survey page section with given index.
 * @param section Section
 * @param index Index
 * @returns Updated DB section
 */
async function upsertSection(section: DBSurveyPageSection, index: number) {
  // Negative IDs can be assigned as temporary IDs for e.g. drag and drop - change them to null
  return await getDb().one<DBSurveyPageSection>(
    `
    INSERT INTO data.page_section (id, survey_page_id, idx, title, type, body, details, parent_section, info, file_url, predecessor_section)
    VALUES (
      COALESCE(
        CASE
          WHEN $(id) < 0 THEN NULL
          ELSE $(id)::integer
        END,
        NEXTVAL('data.page_section_id_seq')
      ),
      $(surveyPageId),
      $(index),
      $(title)::json,
      $(type),
      $(body)::json,
      $(details)::json,
      $(parentSection),
      $(info),
      $(fileUrl),
      $(predecessorSection)
    )
    ON CONFLICT (id) DO
      UPDATE SET
        survey_page_id = $(surveyPageId),
        idx = $(index),
        title = $(title)::json,
        body = $(body)::json,
        details = $(details)::json,
        parent_section = $(parentSection),
        info = $(info),
        file_url = $(fileUrl),
        predecessor_section = $(predecessorSection)
    RETURNING *
  `,
    {
      id: section.id,
      surveyPageId: section.survey_page_id,
      index,
      title: section.title,
      type: section.type,
      body: section.body,
      details: section.details,
      parentSection: section.parent_section,
      info: section.info,
      fileUrl: section.file_url,
      predecessorSection: section.predecessor_section,
    },
  );
}

/**
 * Upserts (updates or inserts) given question option with given index.
 * @param option Option
 * @param index Index
 * @returns Updated DB option
 */
async function upsertOption(option: DBSectionOption, index: number) {
  // Negative IDs can be assigned as temporary IDs for e.g. drag and drop - change them to null
  return await getDb().one<DBSectionOption>(
    `
    INSERT INTO data.option (id, text, section_id, idx, group_id, info)
    VALUES (
      COALESCE(
        CASE
          WHEN $(id) < 0 THEN NULL
          ELSE $(id)::integer
        END,
        NEXTVAL('data.option_id_seq')
      ),
      $(text)::json,
      $(sectionId),
      $(index),
      $(groupId),
      $(info)::json
    )
    ON CONFLICT (id) DO
      UPDATE SET
        text = $(text)::json,
        section_id = $(sectionId),
        idx = $(index),
        group_id = $(groupId),
        info = $(info)::json
    RETURNING *
  `,
    {
      id: option.id,
      text: option.text,
      sectionId: option.section_id,
      index,
      groupId: option.group_id,
      info: option.info,
    },
  );
}

/**
 * Upserts (updates or inserts) given option group with given index.
 * @param group Option group
 * @param index Index
 * @returns Updated DB option group
 */
async function upsertOptionGroup(group: DBOptionGroup, index: number) {
  // Negative IDs can be assigned as temporary IDs for e.g. drag and drop - change them to null
  return await getDb().one<DBOptionGroup>(
    `
    INSERT INTO data.option_group (id, name, idx, section_id)
    VALUES (
      COALESCE(
        CASE
          WHEN $(id) < 0 THEN NULL
          ELSE $(id)::integer
        END,
        NEXTVAL('data.option_group_id_seq')
      ),
      $(name)::json,
      $(index),
      $(sectionId)
    )
    ON CONFLICT (id) DO
      UPDATE SET
        name = $(name)::json,
        idx = $(index),
        section_id = $(sectionId)
    RETURNING *
  `,
    {
      id: group.id,
      name: group.name,
      sectionId: group.section_id,
      index,
    },
  );
}

/**
 * Inserts new conditions and updates existing conditions in the database
 * @param sectionId
 * @param conditions
 */
async function upsertSectionConditions(
  sectionId: number,
  pageId: number,
  conditions: Conditions,
) {
  const conditionRows = conditionsToRows(conditions, sectionId, pageId);

  if (conditionRows.length === 0) return;

  const upsertQuery =
    getMultiInsertQuery(conditionRows, conditionColumnSet) +
    ` ON CONFLICT (id) DO UPDATE SET 
        equals = excluded.equals, 
        less_than = excluded.less_than, 
        greater_than = excluded.greater_than
      RETURNING *`;

  const rows = await getDb().manyOrNone(upsertQuery);

  if (Object.values(conditions).some((values) => values?.length > 0) && !rows)
    throw new Error('Unable to upsert conditions');
  return rows;
}

/**
 *
 * @param conditions
 * @returns
 */
async function deleteSectionConditions(
  pageIds: number[],
  sectionIds: number[],
) {
  let rows: { id: number }[];

  if (pageIds && pageIds.length > 0) {
    rows = await getDb().manyOrNone<{ id: number }>(
      'DELETE FROM data.section_conditions WHERE survey_page_id = ANY ($1) RETURNING id',
      [pageIds],
    );
  } else {
    rows = await getDb().manyOrNone<{ id: number }>(
      'DELETE FROM data.section_conditions WHERE section_id = ANY ($1) RETURNING id',
      [sectionIds],
    );
  }

  if (!rows) throw new Error('Error deleting conditions');
  return rows;
}

async function getSectionConditions(sectionIds: number[]) {
  return await getDb().manyOrNone<DBAllConditions>(
    'SELECT id, section_id, survey_page_id, equals, less_than, greater_than FROM data.section_conditions WHERE section_id = ANY ($1)',
    [sectionIds],
  );
}

/**
 * When updating a survey, deletes all sections (and subsections linked to them) that should be removed from DB.
 * @param surveyId Survey ID
 * @param newSections New sections
 */
async function deleteRemovedSections(
  surveyId: number,
  newSections: DBSurveyPageSection[],
) {
  // Get all existing sections
  const rows = await getDb().manyOrNone<{ id: number }>(
    `SELECT id FROM data.page_section WHERE parent_section IS NULL AND predecessor_section IS NULL AND survey_page_id IN (
       SELECT id FROM data.survey_page WHERE survey_id = $1
    )`,
    [surveyId],
  );
  const existingSectionIds = rows.map((row) => row.id);

  // All existing sections that aren't included in new sections should be removed
  const removedSectionIds = existingSectionIds.filter((id) =>
    (newSections ?? []).every((newSection) => newSection.id !== id),
  );
  if (removedSectionIds.length) {
    await getDb().none(
      `DELETE FROM data.page_section WHERE id = ANY ($1) OR parent_section = ANY ($1) OR predecessor_section = ANY($1)`,
      [removedSectionIds],
    );
  }
}

/**
 * When updating a section, deletes all follow-up sections or subquestions that should be removed from DB.
 * @param parentSectionId Parent section ID
 * @param newFollowUpSections New follow-up sections
 */
async function deleteRemovedLinkedSections(
  parentSectionId: number,
  newSubQuestions: SurveyMapSubQuestion[],
  newFollowUpSections: SurveyPageSection[],
) {
  // Get all existing sections
  const rows = await getDb().manyOrNone<{ id: number }>(
    `SELECT id FROM data.page_section WHERE predecessor_section = $1 OR parent_section = $1`,
    [parentSectionId],
  );

  const existingQuestionIds = rows.map((row) => row.id);

  const newSections = [
    ...(newSubQuestions ?? []),
    ...(newFollowUpSections ?? []),
  ];

  // All existing sections that aren't included in new sections should be removed
  const removedQuestionIds = existingQuestionIds.filter((id) =>
    (newSections ?? []).every((newQuestion) => newQuestion.id !== id),
  );
  if (removedQuestionIds.length) {
    await getDb().none(`DELETE FROM data.page_section WHERE id = ANY ($1)`, [
      removedQuestionIds,
    ]);
  }
}

/**
 * When updating a page section, deletes all options that should be removed from DB.
 * @param sectionId Section ID
 * @param newOptions New options
 * @param optionGroupId Option group ID
 */
async function deleteRemovedOptions(
  sectionId: number,
  newOptions: SectionOption[],
  optionGroupId?: number,
) {
  // Get all existing options
  const rows =
    optionGroupId != null
      ? await getDb().manyOrNone<{ id: number }>(
          `SELECT id FROM data.option WHERE section_id = $1 AND group_id = $2`,
          [sectionId, optionGroupId],
        )
      : await getDb().manyOrNone<{ id: number }>(
          `SELECT id FROM data.option WHERE section_id = $1 AND group_id IS NULL`,
          [sectionId],
        );
  const existingOptionIds = rows.map((row) => row.id);

  // All existing options that aren't included in new options should be removed
  const removedOptionIds = existingOptionIds.filter((id) =>
    (newOptions ?? []).every((newOption) => newOption.id !== id),
  );
  if (removedOptionIds.length) {
    await getDb().none(`DELETE FROM data.option WHERE id = ANY ($1)`, [
      removedOptionIds,
    ]);
  }
}

/**
 * When updating a page section, deletes all option groups that should be removed from DB.
 * @param sectionId Section ID
 * @param newGroups New option groups
 * @param optionGroupId Option group ID
 */
async function deleteRemovedOptionGroups(
  sectionId: number,
  newGroups: SectionOptionGroup[],
) {
  // Get all existing option groups
  const rows = await getDb().manyOrNone<{ id: number }>(
    `SELECT id FROM data.option_group WHERE section_id = $1`,
    [sectionId],
  );
  const existingGroupIds = rows.map((row) => row.id);

  // All existing groups that aren't included in new groups should be removed
  const removedGroupIds = existingGroupIds.filter((id) =>
    (newGroups ?? []).every((newGroup) => newGroup.id !== id),
  );
  if (removedGroupIds.length) {
    await getDb().none(`DELETE FROM data.option_group WHERE id = ANY ($1)`, [
      removedGroupIds,
    ]);
  }
}

/**
 * Updates a premade survey entry
 * @param survey
 */
export async function updateSurvey(survey: Survey) {
  // Update the survey itself
  const surveyRow = await getDb()
    .one<DBSurvey>(
      `UPDATE data.survey SET
        name = $2,
        title = $3,
        subtitle = $4,
        author = $5,
        author_unit = $6,
        map_url = $7,
        start_date = $8,
        end_date = $9,
        allow_test_survey = $10,
        thanks_page_title = $11,
        thanks_page_text = $12,
        background_image_url = $13,
        thanks_page_image_url = $14,
        editors = $15,
        viewers = $16,
        theme_id = $17,
        section_title_color = $18,
        email_enabled = $19,
        email_auto_send_to = $20,
        email_subject = $21,
        email_body = $22,
        email_info = $23::json,
        allow_saving_unfinished = $24,
        localisation_enabled = $25,
        display_privacy_statement = $26,
        top_margin_image_url = $27,
        bottom_margin_image_url = $28,
        organization = $29,
        tags = $30,
        languages = $31,
        email_include_personal_info = $32
      WHERE id = $1 RETURNING *`,
      [
        survey.id,
        survey.name,
        survey.title,
        survey.subtitle,
        survey.author,
        survey.authorUnit,
        survey.mapUrl,
        survey.startDate,
        survey.endDate,
        survey.allowTestSurvey,
        survey.thanksPage.title,
        survey.thanksPage.text,
        survey.backgroundImageUrl ?? null,
        survey.thanksPage.imageUrl ?? null,
        survey.editors,
        survey.viewers,
        survey.theme?.id ?? null,
        survey.sectionTitleColor,
        survey.email.enabled,
        survey.email.autoSendTo,
        survey.email.subject,
        survey.email.body,
        JSON.stringify(survey.email.info),
        survey.allowSavingUnfinished,
        survey.localisationEnabled,
        survey.displayPrivacyStatement,
        survey.marginImages.top.imageUrl ?? null,
        survey.marginImages.bottom.imageUrl ?? null,
        survey.organization,
        survey.tags,
        Object.entries(survey.enabledLanguages)
          .filter(([, isEnabled]) => isEnabled)
          .map(([lang]) => lang),
        survey.email.includePersonalInfo,
      ],
    )
    .catch((error) => {
      throw error.constraint === 'survey_name_key'
        ? new BadRequestError(
            `Survey name ${survey.name} already exists`,
            'duplicate_survey_name',
          )
        : error;
    });

  if (!surveyRow) {
    throw new NotFoundError(`Survey with ID ${survey.id} not found`);
  }

  // Find out what coordinate system was used for the default map view
  const pageWithDefaultMapView = survey.pages.find(
    (page) => page.sidebar.defaultMapView,
  );
  const defaultMapViewSRID = pageWithDefaultMapView
    ? parseInt(pageWithDefaultMapView.sidebar.defaultMapView.crs.split(':')[1])
    : null;

  // Update the survey pages
  await getDb().none(
    getMultiUpdateQuery(
      surveyPagesToRows(survey.pages, survey.id),
      surveyPageColumnSet(defaultMapViewSRID),
    ) + ' WHERE t.id = v.id',
  );

  // Update survey page conditions
  await Promise.all(
    survey.pages.map(async (page) => {
      // TODO combine these into a transaction

      const sectionIds = Object.keys(page.conditions).map((sectionId) => {
        return Number(sectionId);
      });

      await deleteSectionConditions([page.id], sectionIds);
      Object.entries(page.conditions).map(async ([sectionId, conditions]) => {
        // Filter out null values from conditions caused by trying to save "-" as numeric condition
        const validConditions = {
          equals: conditions.equals.filter((value) => value != null),
          lessThan: conditions.lessThan.filter((value) => value != null),
          greaterThan: conditions.greaterThan.filter((value) => value != null),
        };
        await upsertSectionConditions(
          Number(sectionId),
          page.id,
          validConditions,
        );
      });
    }),
  );

  // Form a flat array of all new section rows under each page
  const sections = survey.pages.reduce(
    (result, page) => {
      return [...result, ...surveySectionsToRows(page.sections, page.id)];
    },
    [] as ReturnType<typeof surveySectionsToRows>,
  );

  // Delete sections that were removed from the updated survey
  await deleteRemovedSections(survey.id, sections);

  // Update all sections
  await Promise.all(
    sections.map(async (section) => {
      const sectionRow = await upsertSection(section, section.idx);

      // Delete options that were removed
      await deleteRemovedOptions(section.id, section.options);

      // Update/insert the remaining options
      if (section.options?.length) {
        const options = optionsToRows(section.options, sectionRow.id);
        await Promise.all(options.map(upsertOption));
      }

      // Delete removed subquestion and follow-up sections
      await deleteRemovedLinkedSections(
        section.id,
        section.subQuestions,
        section.followUpSections,
      );

      // If there are subquestions or follow-up sections, update them
      if (section.subQuestions?.length || section.followUpSections?.length) {
        const linkedSections = [
          ...surveySectionsToRows(
            section?.subQuestions ?? [],
            section.survey_page_id,
            sectionRow.id,
          ),
          ...surveySectionsToRows(
            section?.followUpSections ?? [],
            section.survey_page_id,
            null,
            sectionRow.id,
          ),
        ];

        // Update each subquestion and follow-up section in its own block
        await Promise.all(
          linkedSections.map(async (linkedSection, index) => {
            const sectionRow = await upsertSection(linkedSection, index);

            // Refresh conditions for a follow-up section
            if (linkedSection.predecessor_section) {
              // Upsert follow-up section subquestions if applicable

              if (linkedSection?.subQuestions) {
                const subQuestionRows = surveySectionsToRows(
                  linkedSection.subQuestions,
                  linkedSection.survey_page_id,
                  sectionRow.id,
                );

                await Promise.all(
                  subQuestionRows.map(async (question, index) => {
                    const sectionRow = await upsertSection(question, index);

                    // Delete options that were removed

                    await deleteRemovedOptions(question.id, question.options);

                    // Update/insert the remaining options
                    if (question.options?.length) {
                      const options = optionsToRows(
                        question.options,
                        sectionRow.id,
                      );
                      await Promise.all(options.map(upsertOption));
                    }
                  }),
                );
              }

              // use sectionRow id that was generated when saving follow-up section to db
              await deleteSectionConditions(null, [sectionRow.id]);
              // Filter out null values from conditions caused by trying to save "-" as numeric condition
              const validConditions = {
                equals: linkedSection.conditions.equals.filter(
                  (value) => value != null,
                ),
                lessThan: linkedSection.conditions.lessThan.filter(
                  (value) => value != null,
                ),
                greaterThan: linkedSection.conditions.greaterThan.filter(
                  (value) => value != null,
                ),
              };
              await upsertSectionConditions(
                sectionRow.id,
                null,
                validConditions,
              );
            }

            // Delete options that were removed
            await deleteRemovedOptions(linkedSection.id, linkedSection.options);

            // Update/insert the remaining options
            if (linkedSection.options?.length) {
              const options = optionsToRows(
                linkedSection.options,
                sectionRow.id,
              );
              await Promise.all(options.map(upsertOption));
            }
          }),
        );
      }

      // Delete removed option groups
      await deleteRemovedOptionGroups(section.id, section.groups);

      // If there are option groups, update them
      if (section.groups?.length) {
        await Promise.all(
          section.groups.map(async (group, index) => {
            const groupRow = await upsertOptionGroup(
              {
                id: group.id,
                name: group.name,
                section_id: sectionRow.id,
                idx: index,
              },
              index,
            );

            // Delete removed options from the group
            await deleteRemovedOptions(section.id, group.options, groupRow.id);

            // Upsert all options
            const options = optionsToRows(
              group.options,
              sectionRow.id,
              groupRow.id,
            );
            await Promise.all(options.map(upsertOption));
          }),
        );
      }
    }),
  );

  return await getSurvey({ id: survey.id, organization: survey.organization });
}

/**
 * Delete a survey
 * @param survey
 */
export async function deleteSurvey(id: Number) {
  const row = await getDb().tx(async (t) => {
    const submissions = await t.manyOrNone(
      `SELECT id FROM data.submission WHERE survey_id = $1`,
      [id],
    );

    if (submissions.length > 0) {
      const submissionIds = submissions.map((s) => s.id);
      await t.any(
        `DELETE FROM data.answer_entry WHERE submission_id = ANY ($1)`,
        [submissionIds],
      );
      await t.any(
        `DELETE FROM data.personal_info WHERE submission_id = ANY ($1)`,
        [submissionIds],
      );
    }

    return t.oneOrNone(`DELETE FROM data.survey WHERE id = $1 RETURNING *`, [
      id,
    ]);
  });

  if (!row) {
    throw new NotFoundError(`Survey with ID ${id} not found`);
  }
}

/**
 * Calculates publish status from survey start and end dates.
 * Survey is considered published when:
 * 1) `startDate` is defined and in the past, and
 * 2) `endDate` is not defined or in the future
 * @param survey Survey
 * @returns Is survey published?
 */
function isPublished(survey: Pick<Survey, 'startDate' | 'endDate'>) {
  const now = new Date();
  return Boolean(
    survey.startDate &&
      now > survey.startDate &&
      (!survey.endDate || now < survey.endDate),
  );
}

/**
 * Function to map survey's db type into the application type
 * @param dbSurvey
 * @returns Survey containing the database entries
 */
function dbSurveyToSurvey(dbSurvey: DBSurvey | DBSurveyJoin): APISurvey {
  const survey = {
    id: dbSurvey.id,
    name: dbSurvey.name,
    title: dbSurvey.title,
    subtitle: dbSurvey.subtitle,
    author: dbSurvey.author,
    authorUnit: dbSurvey.author_unit,
    authorId: dbSurvey.author_id,
    editors: dbSurvey.editors,
    viewers: dbSurvey.viewers,
    mapUrl: dbSurvey.map_url,
    startDate: dbSurvey.start_date,
    endDate: dbSurvey.end_date,
    allowTestSurvey: dbSurvey.allow_test_survey,
    displayPrivacyStatement: dbSurvey.display_privacy_statement,
    thanksPage: {
      title: dbSurvey.thanks_page_title,
      text: dbSurvey.thanks_page_text,
      imageUrl: dbSurvey.thanks_page_image_url,
    },
    backgroundImageUrl: dbSurvey.background_image_url,
    sectionTitleColor: dbSurvey.section_title_color,
    email: {
      enabled: dbSurvey.email_enabled,
      autoSendTo: dbSurvey.email_auto_send_to,
      subject: dbSurvey.email_subject,
      body: dbSurvey.email_body,
      info: dbSurvey.email_info,
      includePersonalInfo: dbSurvey.email_include_personal_info,
    },
    allowSavingUnfinished: dbSurvey.allow_saving_unfinished,
    localisationEnabled: dbSurvey.localisation_enabled,
    // Single survey row won't contain pages - they get aggregated from a join query
    pages: [],
    marginImages: {
      top: {
        imageUrl: dbSurvey.top_margin_image_url,
      },
      bottom: {
        imageUrl: dbSurvey.bottom_margin_image_url,
      },
    },
    organization: dbSurvey.organization,
    tags: dbSurvey.tags,
    enabledLanguages: dbSurvey.languages,
  };

  const enabledLanguages = dbSurvey.languages.reduce(
    (languages, lang) => {
      languages[lang] = true;
      return languages;
    },
    { fi: false, en: false, se: false } as EnabledLanguages,
  );
  return {
    ...survey,
    submissionCount: Number(dbSurvey.submission_count),
    isPublished: isPublished(survey),
    ...('theme_id' in dbSurvey && {
      theme: dbSurveyJoinToTheme(dbSurvey),
    }),
    enabledLanguages,
  };
}

/**
 * Converts a DB survey join query row into a survey theme.
 */
function dbSurveyJoinToTheme(dbSurveyJoin: DBSurveyJoin): SurveyTheme {
  return dbSurveyJoin.theme_id == null
    ? null
    : {
        id: dbSurveyJoin.theme_id,
        name: dbSurveyJoin.theme_name,
        data: dbSurveyJoin.theme_data,
      };
}

/**
 * Converts a DB survey join query row into a survey page.
 * @param dbSurveyJoin Join query row
 * @returns Survey page
 */
function dbSurveyJoinToPage(dbSurveyJoin: DBSurveyJoin): SurveyPage {
  return dbSurveyJoin.page_id == null
    ? null
    : {
        id: dbSurveyJoin.page_id,
        title: dbSurveyJoin.page_title,
        sections: [],
        sidebar: {
          type: dbSurveyJoin.page_sidebar_type,
          mapLayers: dbSurveyJoin.page_sidebar_map_layers ?? [],
          imageUrl: dbSurveyJoin.page_sidebar_image_url,
          imageAltText: dbSurveyJoin.page_sidebar_image_alt_text,
          imageSize: dbSurveyJoin.page_sidebar_image_size,
          defaultMapView: dbSurveyJoin.default_map_view
            ? geometryToGeoJSONFeatureCollection(
                dbSurveyJoin.default_map_view,
                {},
                dbSurveyJoin.mapViewSRID,
              )
            : null,
        },
        conditions: {},
      };
}

/**
 * Converts a DB survey join query row into a survey page section.
 * @param dbSurveyJoin Join query row
 * @returns Survey page section
 */
function dbSurveyJoinToSection(dbSurveyJoin: DBSurveyJoin): SurveyPageSection {
  const type = dbSurveyJoin.section_type as SurveyPageSection['type'];
  return dbSurveyJoin.section_id == null
    ? null
    : {
        id: dbSurveyJoin.section_id,
        title: dbSurveyJoin.section_title,
        type: dbSurveyJoin.section_type as SurveyPageSection['type'],
        body: dbSurveyJoin.section_body,
        info: dbSurveyJoin.section_info,
        fileUrl: dbSurveyJoin.section_file_url,
        // Trust that the JSON in the DB fits the rest of the detail fields
        ...(dbSurveyJoin.section_details as any),
        // Add an initial empty option array if the type allows options
        ...(sectionTypesWithOptions.includes(type) && { options: [] }),
        // Add an initial empty group array if the type allows option groups
        ...(type === 'grouped-checkbox' && { groups: [] }),
      };
}

/**
 * Converts a DB survey join query row into a question option.
 * @param dbSurveyJoin Join query row
 * @returns Question option
 */
function dbSurveyJoinToOption(dbSurveyJoin: DBSurveyJoin): SectionOption {
  return dbSurveyJoin.option_id == null
    ? null
    : {
        id: dbSurveyJoin.option_id,
        text: dbSurveyJoin.option_text,
        info: dbSurveyJoin.option_info,
      };
}

/**
 * Converts a DB condition query row(s) for a single section into section conditions
 * @param dbSectionConditions
 * @returns
 */

function dbSectionConditionsToConditions(
  dbSectionConditions: DBSectionCondition[],
): Conditions {
  return dbSectionConditions.reduce(
    (conditions, condition) => {
      if (condition.equals != null) {
        return {
          ...conditions,
          equals: [...conditions.equals, condition.equals],
        };
      } else if (condition.less_than != null) {
        return {
          ...conditions,
          lessThan: [...conditions.lessThan, condition.less_than],
        };
      } else if (condition.greater_than != null) {
        return {
          ...conditions,
          greaterThan: [...conditions.greaterThan, condition.greater_than],
        };
      }
    },
    {
      equals: [],
      lessThan: [],
      greaterThan: [],
    },
  );
}

/**
 * Appends conditions to a survey page
 * @param page
 * @param dbSectionConditions
 */

function getPageWithConditions(
  page: SurveyPage,
  dbSectionConditions: DBSectionCondition[],
) {
  const pageConditions = dbSectionConditions
    .filter((row) => row.survey_page_id === page.id)
    .reduce((pageConditions, conditionRow) => {
      const newConditions = dbSectionConditionsToConditions([conditionRow]);

      if (!pageConditions[conditionRow.section_id]) {
        pageConditions[conditionRow.section_id] = newConditions;
      } else {
        const oldSectionConditions = pageConditions[conditionRow.section_id];

        pageConditions[conditionRow.section_id] = {
          equals: [...oldSectionConditions.equals, ...newConditions.equals],
          lessThan: [
            ...oldSectionConditions.lessThan,
            ...newConditions.lessThan,
          ],
          greaterThan: [
            ...oldSectionConditions.greaterThan,
            ...newConditions.greaterThan,
          ],
        };
      }

      return pageConditions;
    }, {} as SurveyPageConditions);

  return { ...page, conditions: pageConditions };
}

/**
 * Create a new survey page (database row)
 * @returns SurveyPage
 */
export async function createSurveyPage(
  surveyId: number,
  partialPage?: Partial<SurveyPage>,
) {
  const row = await getDb().one<DBSurveyPage>(
    `INSERT INTO data.survey_page (survey_id, idx, title, sidebar_map_layers)
     SELECT
       $1 as survey_id,
       COALESCE(MAX(idx) + 1, 0) as idx,
       '{"fi": ""}'::json,
       $2::json
     FROM data.survey_page WHERE survey_id = $1
     RETURNING *;`,
    [surveyId, JSON.stringify(partialPage?.sidebar?.mapLayers ?? [])],
  );

  if (!row) {
    throw new InternalServerError(`Error while creating a new survey page`);
  }

  return {
    id: row.id,
    title: row.title,
    sections: [],
    sidebar: {
      type: row.sidebar_type,
      mapLayers: partialPage?.sidebar?.mapLayers ?? [],
      imageUrl: null,
      defaultMapView: null,
    },
    conditions: {},
  } as SurveyPage;
}

/**
 * Delete a survey page with given id
 * @param id
 * @returns SurveyPage
 */
export async function deleteSurveyPage(id: number) {
  const row = await getDb().one<SurveyPage>(
    `DELETE FROM data.survey_page WHERE id = $1 RETURNING *`,
    [id],
  );

  if (!row) {
    throw new InternalServerError(
      `Error while deleting survey page with id: ${id}`,
    );
  }

  return row;
}

/**
 * Function for converting an array of survey pages into an array of survey page db rows
 * @param surveyPages
 * @param surveyId
 * @returns DBSurveyPage[]
 */
function surveyPagesToRows(
  surveyPages: SurveyPage[],
  surveyId: number,
): DBSurveyPage[] {
  return surveyPages.map((surveyPage, index) => {
    return {
      id: surveyPage.id,
      idx: index,
      survey_id: surveyId,
      title: surveyPage.title,
      sidebar_type: surveyPage.sidebar.type,
      sidebar_map_layers: JSON.stringify(surveyPage.sidebar.mapLayers),
      sidebar_image_url: surveyPage.sidebar.imageUrl,
      sidebar_image_alt_text: surveyPage.sidebar.imageAltText,
      sidebar_image_size: surveyPage.sidebar.imageSize,
      default_map_view:
        surveyPage.sidebar.defaultMapView?.features[0]?.geometry ?? null,
    } as DBSurveyPage;
  });
}

/**
 * Function for converting an array of survey page sections into an array of survey page section db rows.
 * If section contains options and/or subquestions or follow-up sections, they are returned as unmodified.
 * @param surveySections
 * @param pageId
 * @param parentSectionId
 * @returns
 */
function surveySectionsToRows(
  surveySections: SurveyPageSection[],
  pageId: number,
  parentSectionId?: number,
  predecessorSectionId?: number,
) {
  return surveySections.filter(Boolean).map((surveySection, index) => {
    const {
      id,
      type,
      title,
      body = undefined,
      options = undefined,
      subQuestions = undefined,
      followUpSections = undefined,
      info = undefined,
      groups = undefined,
      fileUrl = undefined,
      conditions = undefined,
      ...details
    } = { ...surveySection };
    return {
      id,
      survey_page_id: pageId,
      idx: index,
      type: type,
      title: title,
      body: body,
      details,
      options,
      subQuestions,
      followUpSections,
      groups,
      parent_section: parentSectionId ?? null,
      predecessor_section: predecessorSectionId ?? null,
      info: info,
      file_url: fileUrl,
      conditions,
    } as DBSurveyPageSection & {
      options: SectionOption[];
      subQuestions: SurveyMapSubQuestion[];
      followUpSections: SurveyFollowUpSection[];
      groups: SectionOptionGroup[];
      conditions: Conditions;
    };
  });
}

/**
 *
 * @param conditions
 * @param sectionId
 * @returns
 */

function conditionsToRows(
  conditions: Conditions,
  sectionId: number,
  pageId: number,
) {
  return [
    ...conditions.equals.map((val) => ({
      section_id: sectionId,
      survey_page_id: pageId,
      equals: val,
      less_than: null,
      greater_than: null,
    })),
    ...conditions.greaterThan.map((val) => ({
      section_id: sectionId,
      survey_page_id: pageId,
      greater_than: val,
      equals: null,
      less_than: null,
    })),
    ...conditions.lessThan.map((val) => ({
      section_id: sectionId,
      survey_page_id: pageId,
      less_than: val,
      equals: null,
      greater_than: null,
    })),
  ];
}

/**
 * Convert section options to db rows
 * @param sectionOptions
 * @param sectionId
 * @param optionGroupId
 * @returns DBSectionOption[]
 */
function optionsToRows(
  sectionOptions: SectionOption[],
  sectionId: number,
  optionGroupId?: number,
): DBSectionOption[] {
  return sectionOptions.map((option, index) => {
    return {
      section_id: sectionId,
      id: option.id ?? null,
      idx: index,
      text: option.text,
      info: option.info,
      group_id: optionGroupId ?? null,
    } as DBSectionOption;
  });
}

/**
 * Publish survey by setting its start date to 'now'.
 * If end date is in the past, reset it to null.
 * @param surveyId
 */
export async function publishSurvey(surveyId: number) {
  const row = await getDb().oneOrNone<DBSurvey>(
    `
    UPDATE data.survey
      SET start_date = NOW(),
      end_date = CASE
        WHEN end_date < NOW() THEN NULL
        ELSE end_date
      END
      WHERE id = $1 RETURNING *;
  `,
    [surveyId],
  );

  if (!row) {
    throw new InternalServerError(
      `Error while publishing survey with id:${surveyId}`,
    );
  }

  return dbSurveyToSurvey(row);
}

/**
 * End survey by setting its end date to 'now'
 * @param surveyId
 */
export async function unpublishSurvey(surveyId: number) {
  const row = await getDb().oneOrNone(
    `
    UPDATE data.survey SET end_date = NOW() WHERE id = $1 RETURNING *;
  `,
    [surveyId],
  );

  if (!row) {
    throw new InternalServerError(
      `Error while publishing survey with id:${surveyId}`,
    );
  }

  return dbSurveyToSurvey(row);
}

/**
 * Store file to database table 'data.files'
 * @param fileBuffer
 * @param filePath
 * @param fileName
 * @param mimeType
 * @param details
 * @param surveyId
 * @param fileOrganization
 * @returns Database row id of the uploaded image
 */

/**
 * Store file to database table 'data.files'
 * @param param0 File info
 * @returns Path and name of the uploaded file
 */
export async function storeFile({
  buffer,
  path,
  name,
  mimetype,
  details,
  surveyId,
  organization,
}: {
  buffer: Buffer;
  path: string[];
  name: string;
  mimetype: string;
  details: { [key: string]: any };
  surveyId: number;
  organization: string;
}) {
  const fileString = `\\x${buffer.toString('hex')}`;
  const fileUrl = `${organization}/${path.join('/')}/${name}`;
  const row = await getDb().oneOrNone<{ path: string[]; name: string }>(
    `
    INSERT INTO data.files (file, details, mime_type, survey_id, url, organization)
    VALUES ($(fileString), $(details), $(mimetype), $(surveyId), $(fileUrl), $(organization))
    ON CONFLICT ON CONSTRAINT pk_files DO UPDATE SET
      file = $(fileString),
      details = $(details),
      mime_type = $(mimetype),
      survey_id = $(surveyId),
      url = $(fileUrl),
      organization = $(organization)
    RETURNING url as url;
    `,
    {
      fileString,
      details,
      mimetype,
      surveyId,
      fileUrl,
      organization,
    },
  );

  if (!row) {
    throw new InternalServerError(`Error while inserting file to db`);
  }

  return row;
}

/**
 * Get a single file with id from the database
 * @param fileUrl
 * @returns File
 */
export async function getFile(fileUrl: string) {
  const row = await getDb().oneOrNone<{
    file: Buffer;
    mime_type: string;
    details: { [key: string]: any };
  }>(
    `
    SELECT file, mime_type, details FROM data.files WHERE url = $1;
  `,
    [fileUrl],
  );

  if (!row) {
    throw new NotFoundError(`File with URL ${fileUrl} not found`);
  }

  return {
    data: row.file,
    mimeType: row.mime_type,
    details: row.details,
  } as File;
}

/**
 * Get all survey images from the database
 * @returns SurveyImage[]
 */
export async function getImages(imagePath: string[], organization: string) {
  const filePattern = `${organization}/${imagePath.join('/')}%`;
  const rows = await getDb().manyOrNone(
    `
    SELECT 
      id, 
      details, 
      file, 
      url
    FROM data.files 
    WHERE url LIKE $1;
  `,
    [filePattern],
  );

  return rows.map((row) => ({
    id: row.id,
    data: row.file.toString('base64'),
    attributions: row.details?.attributions,
    altText: row.details?.imageAltText,
    fileUrl: row.url,
  })) as SurveyImage[];
}

/**
 * Delete a single file from the db
 * @param fileUrl url of the file
 * @returns
 */
export async function removeFile(fileUrl: string) {
  return await getDb().none(
    `
    DELETE FROM data.files 
    WHERE url = $1;
  `,
    [fileUrl],
  );
}

/**
 * Checks if given user is allowed to edit the survey with given ID
 * @param user User
 * @param surveyId Survey ID
 * @returns Can the user edit the survey?
 */
export async function userCanEditSurvey(user: User, surveyId: number) {
  const { author_id: authorId, editors } = await getDb().oneOrNone<{
    author_id: string;
    editors: string[];
  }>(`SELECT author_id, editors FROM data.survey WHERE id = $1`, [surveyId]);
  return (
    isSuperUser(user) ||
    isAdmin(user) ||
    user.id === authorId ||
    editors.includes(user.id)
  );
}

/**
 * Check if user is allowed to view the survey with given ID
 * @param user User
 * @param surveyId Survey ID
 * @returns Can the user view the survey?
 */
export async function userCanViewSurvey(user: User, surveyId: number) {
  const {
    author_id: authorId,
    editors,
    viewers,
  } = await getDb().oneOrNone<{
    author_id: string;
    editors: string[];
    viewers: string[];
  }>(`SELECT author_id, editors, viewers FROM data.survey WHERE id = $1`, [
    surveyId,
  ]);
  return (
    isSuperUser(user) ||
    isAdmin(user) ||
    user.id === authorId ||
    editors.includes(user.id) ||
    viewers.includes(user.id)
  );
}

/**
 * Get all options for a given survey
 * @param surveyId Survey ID
 * @returns Options
 */
export async function getOptionsForSurvey(surveyId: number) {
  const rows = await getDb().manyOrNone<DBSectionOption>(
    `
    SELECT o.* FROM
      data.option o
      INNER JOIN data.page_section ps ON ps.id = o.section_id
      INNER JOIN data.survey_page sp ON sp.id = ps.survey_page_id
    WHERE sp.survey_id = $1
  `,
    [surveyId],
  );

  return rows.map(
    (row): SectionOption => ({
      id: row.id,
      text: row.text,
      info: row.info,
    }),
  );
}

/**
 * Get all distinct email addresses used for report auto sending
 * @returns Distinct email addresses
 */
export async function getDistinctAutoSendToEmails() {
  const rows = await getDb().manyOrNone<{ email: string }>(`
    SELECT DISTINCT UNNEST(email_auto_send_to) AS email FROM data.survey
  `);
  return rows.map((row) => row.email);
}

/**
 * get all distinct tags used by the organisation
 * @param organizations array of organizations. Likely to be of length 1 for now
 * @returns array of distinct tags
 */
export async function getTagsByOrganizations(organizations: string[]) {
  const rows = await getDb().manyOrNone<{ tag: string }>(
    `
    SELECT
      DISTINCT UNNEST(tags) AS tag
    FROM
      data.survey AS s
    WHERE
      s.organization = ANY($1)
  `,
    [organizations],
  );
  return rows.map((row) => row.tag);
}
