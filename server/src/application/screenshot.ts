import { GeoJSONWithCRS } from '@interfaces/geojson';
import {
  LanguageCode,
  MapQuestionSelectionType,
  SurveyGeoBudgetingQuestion,
  SurveyMapProvider,
  SurveyMapQuestion,
} from '@interfaces/survey';
import { Feature, LineString, Point, Polygon } from 'geojson';
import parseCSSColor from 'parse-css-color';
import {
  getPuppeteerScreenshots,
  initializePuppeteerCluster as initCluster,
} from './puppeteer-screenshot';
import { getStaticMapsScreenshots } from './staticmaps-screenshot';

export interface ScreenshotJobData {
  mapProvider: SurveyMapProvider;
  mapUrl: string;
  language: LanguageCode;
  answers?: {
    sectionId: number;
    index: number;
    feature: GeoJSONWithCRS<Feature<Point | LineString | Polygon>>;
    visibleLayerIds: (number | string)[];
    question: SurveyMapQuestion | SurveyGeoBudgetingQuestion;
    markerIcon?: string;
  }[];
}

export interface ScreenshotJobReturnData {
  sectionId: number;
  index: number;
  image: Buffer;
  layerNames: string[];
}

export const defaultFeatureStyle = {
  stroke: {
    color: 'rgba(0,0,0)',
    width: 10,
  },
  fill: {
    color: 'rgba(0,0,0,0.3)',
  },
};

export function getFeatureStyle(
  selectionType: MapQuestionSelectionType,
  question: SurveyMapQuestion,
) {
  if (selectionType === 'point') {
    return defaultFeatureStyle;
  }
  const style = question.featureStyles?.[selectionType];
  if (!style) {
    return defaultFeatureStyle;
  }
  const parsedStrokeColor = parseCSSColor(style.strokeColor);
  const fillColor = parsedStrokeColor
    ? `rgba(${parsedStrokeColor.values.join(',')}, 0.3)`
    : defaultFeatureStyle.fill.color;
  return {
    stroke: {
      color: style.strokeColor || defaultFeatureStyle.stroke.color,
      width: 10,
      lineDash:
        style.strokeStyle === 'dashed'
          ? [30, 10]
          : style.strokeStyle === 'dotted'
            ? [0, 14]
            : null,
      lineCap: style.strokeStyle === 'dashed' ? 'butt' : 'round',
    },
    fill: {
      color: fillColor,
    },
  };
}

export async function initializePuppeteerCluster() {
  await initCluster();
}

export async function getScreenshots(
  jobData: ScreenshotJobData,
): Promise<ScreenshotJobReturnData[]> {
  if (!jobData.answers.length) {
    return [];
  }
  if (jobData.mapProvider === 'oskari') {
    return getPuppeteerScreenshots(jobData);
  }
  return getStaticMapsScreenshots(jobData);
}
