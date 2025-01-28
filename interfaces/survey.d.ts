import { GeoJSONWithCRS } from './geojson';

/**
 * Section of a survey page
 */
export type SurveyPageSection =
  | SurveyQuestion
  | SurveyTextSection
  | SurveyImageSection
  | SurveyDocumentSection;

/**
 * Survey page section which can have follow-up sections
 */
export type SurveyFollowUpSectionParent = Extract<
  SurveyPageSection,
  { type: 'numeric' | 'slider' | 'checkbox' | 'radio' }
>;

/**
 * Question section of a survey page
 */
export type SurveyQuestion =
  | SurveyPersonalInfoQuestion
  | SurveyCheckboxQuestion
  | SurveyRadioQuestion
  | SurveyNumericQuestion
  | SurveyFreeTextQuestion
  | SurveyMapQuestion
  | SurveySortingQuestion
  | SurveySliderQuestion
  | SurveyMultiMatrixQuestion
  | SurveyMatrixQuestion
  | SurveyGroupedCheckboxQuestion
  | SurveyAttachmentQuestion;

/**
 * Subquestion type for map questions.
 *
 * Same as SurveyQuestion, but exclude recursive map questions.
 */
export type SurveyMapSubQuestion = Exclude<SurveyQuestion, SurveyMapQuestion>;

/**
 * Common fields for survey page sectionsx
 */
interface CommonSurveyPageSection {
  /**
   * Section ID
   */
  id?: number;
  /**
   * Section title
   */
  title: LocalizedText;
  /**
   * Additional information related to the section
   */
  info?: LocalizedText;
  /**
   * Toggler whether the section info should be shown
   */
  showInfo?: boolean;
  /**
   * Follow-up sections
   */
  followUpSections?: SurveyFollowUpSection[];
}

type SurveyFollowUpSection = SurveyPageSection & {
  conditions: Conditions;
};

type SurveyFollowUpQuestion = SurveyQuestion & {
  conditions: Conditions;
};

/**
 * Common fields for survey page questions
 */
interface CommonSurveyPageQuestion extends CommonSurveyPageSection {
  /**
   * Is an answer required for the question?
   */
  isRequired: boolean;
}

/**
 * Section file
 */
interface SectionFile {
  fileUrl: string;
}

/**
 * File attachment answers
 */
interface FileAnswer {
  fileName: string;
  fileString: string;
}

/**
 * Personal info anwers
 */
interface PersonalInfoAnswer {
  name: string | null;
  email: string | null;
  phone: string | null;
}

/**
 * Checkbox question
 */
export interface SurveyCheckboxQuestion extends CommonSurveyPageQuestion {
  type: 'checkbox';
  options: SectionOption[];
  answerLimits: {
    min?: number;
    max?: number;
  };
  allowCustomAnswer: boolean;
}

/**
 * Personal info question
 */
export interface SurveyPersonalInfoQuestion extends CommonSurveyPageQuestion {
  type: 'personal-info';
  askName: boolean;
  askEmail: boolean;
  askPhone: boolean;
}

/**
 * Radio question
 */
export interface SurveyRadioQuestion extends CommonSurveyPageQuestion {
  type: 'radio';
  options: SectionOption[];
  allowCustomAnswer: boolean;
}

/**
 * Text section
 */
export interface SurveyTextSection extends CommonSurveyPageSection {
  type: 'text';
  body: LocalizedText;
  bodyColor: string;
}

/**
 * Image section
 */
export interface SurveyImageSection
  extends CommonSurveyPageSection,
    SectionFile {
  type: 'image';
  altText: LocalizedText;
}

/**
 * Document section
 */
export interface SurveyDocumentSection
  extends CommonSurveyPageSection,
    SectionFile {
  type: 'document';
}

/**
 * Numeric question
 */
export interface SurveyNumericQuestion extends CommonSurveyPageQuestion {
  type: 'numeric';
  minValue: number;
  maxValue: number;
}

/**
 * Free text question
 */
export interface SurveyFreeTextQuestion extends CommonSurveyPageQuestion {
  type: 'free-text';
  maxLength?: number;
}

/**
 * Map question selection type
 */
export type MapQuestionSelectionType = 'point' | 'line' | 'area';

/**
 * Stroke style of map features
 */
export type FeatureStrokeStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Map question
 */
export interface SurveyMapQuestion extends CommonSurveyPageQuestion {
  type: 'map';
  selectionTypes: MapQuestionSelectionType[];
  featureStyles: {
    point: {
      /**
       * Marker icon in SVG format
       */
      markerIcon: string;
    };
    line: { strokeStyle: FeatureStrokeStyle; strokeColor: string };
    area: {
      strokeStyle: FeatureStrokeStyle;
      strokeColor: string;
    };
  };
  subQuestions: SurveyMapSubQuestion[];
}

/**
 * Sorting question
 */
export interface SurveySortingQuestion extends CommonSurveyPageQuestion {
  type: 'sorting';
  options: SectionOption[];
}

/**
 * Slider question
 */
export interface SurveySliderQuestion extends CommonSurveyPageQuestion {
  type: 'slider';
  presentationType: 'literal' | 'numeric';
  minValue: number;
  maxValue: number;
  minLabel: LocalizedText;
  maxLabel: LocalizedText;
}

/**
 * Matrix question
 */
export interface SurveyMatrixQuestion extends CommonSurveyPageQuestion {
  type: 'matrix';
  classes: LocalizedText[];
  subjects: LocalizedText[];
  allowEmptyAnswer: boolean;
}

/**
 * Multiple choice matrix question
 */

export interface SurveyMultiMatrixQuestion extends CommonSurveyPageQuestion {
  type: 'multi-matrix';
  classes: LocalizedText[];
  subjects: LocalizedText[];
  allowEmptyAnswer: boolean;
  answerLimits: {
    min?: number;
    max?: number;
  };
}

/**
 * Grouped checkbox question
 */
export interface SurveyGroupedCheckboxQuestion
  extends CommonSurveyPageQuestion {
  type: 'grouped-checkbox';
  answerLimits: {
    min?: number;
    max?: number;
  };
  groups: SectionOptionGroup[];
}

/**
 * Attachment "question"
 */
export interface SurveyAttachmentQuestion extends CommonSurveyPageQuestion {
  type: 'attachment';
}

/**
 * Type of the survey page sidebar
 */
export type SurveyPageSidebarType = 'none' | 'map' | 'image';
/**
 * Survey page sidebar image size
 */
export type SurveyPageSidebarImageSize = 'original' | 'fitted';

/**
 * Survey page side bar
 */
export interface SurveyPageSidebar {
  /**
   * Type of the sidebar
   */
  type: SurveyPageSidebarType;
  /**
   * IDs of the visible map layers for the page
   */
  mapLayers: number[];
  /**
   * Geometry for the default map view
   */
  defaultMapView: Geometry;
  /**
   * Url of the sidebar image
   */
  imageUrl: string;
  /**
   * Alternative text for the sidebar image
   */
  imageAltText: LocalizedText;
  /**
   * Information how the picture is displayed
   */
  imageSize: SurveyPageSidebarImageSize;
}

/**
 * Survey page
 */
export interface SurveyPage {
  /**
   * ID of the survey page
   */
  id: number;
  /**
   * Title of the survey page
   */
  title: LocalizedText;
  /**
   * Side bar definition for the survey page
   */
  sidebar: SurveyPageSidebar;
  /**
   * Page sections
   */
  sections: SurveyPageSection[];
  /**
   * Conditions to display the page in the survey
   */
  conditions?: SurveyPageConditions;

  /**
   * Are conditional page conditions fulfilled
   */
  isVisible?: boolean;
}

export interface Survey {
  /**
   * ID of the survey (unique)
   */
  id: number;
  /**
   * Name of the survey (unique): used to generate the public URL of the survey
   */
  name: string;
  /**
   * Title of the survey
   */
  title: LocalizedText;
  /**
   * Subtitle of the survey
   */
  subtitle: LocalizedText;
  /**
   * Author of the survey
   */
  author: string;
  /**
   * Unit under which the author works
   */
  authorUnit: string;
  /**
   * ID of the author (referencing the user table)
   */
  authorId: string;
  /**
   * Array of editor user IDs
   */
  editors: string[];
  /**
   * Array of viewer user IDs
   */
  viewers: string[];
  /**
   * URL of the embedded map component
   */
  mapUrl: string;
  /**
   * Date when the survey is planned to start and go public
   */
  startDate: Date;
  /**
   * Date when the survey is planned to end
   */
  endDate: Date;
  /**
   * Publish a "dummy" test survey on save?
   */
  allowTestSurvey: boolean;
  /**
   * Is the survey currently published?
   * Computed server-side from startDate and endDate timestamp values - cannot be updated.
   */
  readonly isPublished?: boolean;
  /**
   * Date when the survey was initially created
   */
  createdAt: Date;
  /**
   * Date when the survey was modified last time
   */
  updatedAt: Date;
  /**
   * Survey pages
   */
  pages?: SurveyPage[];
  /**
   * Url of the survey background image
   */
  backgroundImageUrl?: string;
  /**
   * Thanks page
   */
  thanksPage: {
    /**
     * Title of the thanks page
     */
    title: LocalizedText;
    /**
     * Text in markdown format
     */
    text: LocalizedText;
    /**
     * Url of the thanks page image
     */
    imageUrl?: string;
  };
  /**
   * Theme of the survey
   */
  theme: SurveyTheme;
  /**
   * Color of the section titles
   */
  sectionTitleColor: string;
  /**
   * Mail configurations
   */
  email: {
    /**
     * Is email reporting for single submissions enabled?
     */
    enabled: boolean;
    /**
     * Fixed recipient addresses for the automatic sending
     */
    autoSendTo: string[];
    /**
     * Subject of the email
     */
    subject: LocalizedText;
    /**
     * Body of the email
     */
    body: LocalizedText;
    /**
     * Optional free-form information to be shown on the front page of the report
     */
    info: SurveyEmailInfoItem[];
    /**
     * Should personal info be included in the email
     */
    includePersonalInfo: boolean;
  };
  /**
   * Should the survey be able to be saved as unfinished
   */
  allowSavingUnfinished?: boolean;
  /**
   * Allow publishing surveys with different languages
   */
  localisationEnabled: boolean;
  /**
   * Should a link for the privacy statement be displayed
   */
  displayPrivacyStatement: boolean;
  /**
   * Number of submissions for the survey
   */
  submissionCount: number;
  /**
   * Margin images displayed on the landing and thanks pages
   */
  marginImages: {
    top: {
      imageUrl: string;
      altText?: string;
    };
    bottom: {
      imageUrl: string;
      altText?: string;
    };
  };
  /**
   * User organization that can access the survey
   */
  organization: string;
  /**
   * Survey tags
   */
  tags: string[];
  /**
   * Survey languages
   */
  enabledLanguages: EnabledLanguages;
}

export type APISurvey = Omit<Survey, 'createdAt' | 'updatedAt'>;

export type EnabledLanguages = Record<LanguageCode, boolean>;

/**
 * A single option of a multichoise question
 */
export interface SectionOption {
  /**
   * id of the option
   */
  id?: number;
  /**
   * Localized text field of the option
   */
  text: LocalizedText;
  /**
   * Localized text field of the option's info
   */
  info?: LocalizedText;
}

/**
 * A group of options of a grouped checkbox question
 */
export interface SectionOptionGroup {
  /**
   * Group ID
   */
  id: number;
  /**
   * Name of the group
   */
  name: LocalizedText;
  /**
   * Options of the group
   */
  options: SectionOption[];
}

/**
 * Supported language codes
 */
type LanguageCode = 'fi' | 'en' | 'se';

/**
 * Type for localization typing
 */
type LocalizedText = Record<LanguageCode, string>;

/**
 * Intersected subset of answers for map subquestions.
 */
export type SurveyMapSubQuestionAnswer = AnswerEntry & {
  type: SurveyMapSubQuestion['type'];
};

/**
 * Answer value for a single map question.
 * Contains selected geometry/geometries as GeoJSON and subquestion answer entries.
 */
export interface MapQuestionAnswer {
  selectionType: MapQuestionSelectionType;
  mapLayers: number[];
  geometry: GeoJSONWithCRS<
    GeoJSON.Feature<GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon>
  >;
  // Only allow answers to pre-defined types of subquestions
  subQuestionAnswers: SurveyMapSubQuestionAnswer[];
}

/**
 * Submission entry interface
 */
export type AnswerEntry = {
  /**
   * ID of the page section
   */
  sectionId: number;
  /**
   * Error status of the answer if validation is performed on component level
   */
  hasError?: boolean;
} & /**
 * Type of the section
 */ (
  | {
      type: 'personal-info';
      value: PersonalInfoAnswer;
    }
  | {
      type: 'free-text';
      value: string;
    }
  | {
      type: 'checkbox';
      value: (string | number)[];
    }
  | {
      type: 'radio';
      value: string | number;
    }
  | {
      type: 'numeric';
      value: number;
    }
  | {
      type: 'map';
      value: MapQuestionAnswer[];
    }
  | {
      type: 'sorting';
      value: number[];
    }
  | {
      type: 'slider';
      value: number;
    }
  | {
      type: 'matrix';
      value: string[];
    }
  | {
      type: 'multi-matrix';
      value: string[][];
    }
  | {
      type: 'grouped-checkbox';
      value: number[];
    }
  | {
      type: 'attachment';
      value: { fileString: string; fileName: string }[];
    }
);

/**
 * Oskari map layer
 */
export interface MapLayer {
  /**
   * ID of the map layer
   */
  id: number;
  /**
   * Name of the map layer
   */
  name: string;
}

/**
 * File interface
 */
export interface File {
  /**
   * ID of the file
   */
  id: number;
  /**
   * File data as a base64 encoded string
   */
  data: Buffer;
  /**
   * Additional file details
   */
  details?: { [key: string]: any };
  /**
   * Image url
   */
  fileUrl: string;
  /**
   * File mime type
   */
  mimeType: string;
}

/**
 * Image used as the background of the survey landing page or in the thank you page
 */
export interface SurveyImage extends File {
  /**
   * Image attributions (= who owns the image rights)
   */
  attributions: string;
  /**
   * Alternative text for the picture entered by the user
   */
  altText: string;
}

/**
 * Survey theme
 */
export interface SurveyTheme<T extends {} = {}> {
  /**
   * ID of the theme
   */
  id: number;
  /**
   * Optional name for the theme
   */
  name?: string;
  /**
   * Survey configuration object
   */
  data: T;
}

/**
 * Info about the submitter
 */
export interface SubmissionInfo {
  /**
   * Email address
   */
  email: string;
}

/**
 * Map marker icon
 */
export interface MapMarkerIcon {
  id: number;
  name: string;
  svg: string;
}

/**
 * Map stroke color
 */
export interface MapStrokeColor {
  name: string;
  value: string;
}

/**
 * A single item in survey email info
 */
export interface SurveyEmailInfoItem {
  name: LocalizedText;
  value: LocalizedText;
}

/**
 * Submission
 */
export interface Submission {
  id: number;
  timestamp: Date;
  answerEntries?: AnswerEntry[];
}

export type ImageType =
  | 'backgroundImage'
  | 'thanksPageImage'
  | 'topMarginImage'
  | 'bottomMarginImage';

/**
 * Conditions to display follow-up section
 */

export interface Conditions {
  equals: number[];
  lessThan: number[];
  greaterThan: number[];
}

export type SurveyPageConditions = Record<SurveyPageSection['id'], Conditions>;
