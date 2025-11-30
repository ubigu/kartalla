import { GeoJSONWithCRS } from '@interfaces/geojson';
import {
  LanguageCode,
  MapQuestionSelectionType,
  SurveyGeoBudgetingQuestion,
  SurveyMapQuestion,
} from '@interfaces/survey';
import { Feature, LineString, Point, Polygon } from 'geojson';
import parseCSSColor from 'parse-css-color';
import { Page } from 'puppeteer';
import { Cluster } from 'puppeteer-cluster';
import { getAvailableMapLayers } from './map';

/**
 * Oskari needs to be declared, because it is available as a global variable inside
 * Puppeteer's evaluation context.
 */
declare const Oskari: any;

let cluster: Cluster<ScreenshotJobData, ScreenshotJobReturnData[]>;

const networkIdleTimeout = process.env.PUPPETEER_NETWORK_IDLE_TIMEOUT
  ? Number(process.env.PUPPETEER_NETWORK_IDLE_TIMEOUT)
  : 10000;

export interface ScreenshotJobData {
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

// Default feature style
const defaultFeatureStyle = {
  stroke: {
    color: 'rgba(0,0,0)',
    width: 10,
  },
  fill: {
    color: 'rgba(0,0,0,0.3)',
  },
};

function getFeatureStyle(
  selectionType: MapQuestionSelectionType,
  question: SurveyMapQuestion,
) {
  // Use default style for points
  if (selectionType === 'point') {
    return defaultFeatureStyle;
  }
  // Get feature style from question
  const style = question.featureStyles?.[selectionType];
  // If no style is defined, use default
  if (!style) {
    return defaultFeatureStyle;
  }
  // Parse & calculate fill color with a fixed opacity from the stroke color
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

async function generateScreenshots({
  page,
  data,
}: {
  page: Page;
  data: ScreenshotJobData;
}) {
  const { mapUrl, answers, language } = data;
  const returnData: ScreenshotJobReturnData[] = [];

  const availableMapLayers = await getAvailableMapLayers(mapUrl, language);

  // Setting a real user agent _might_ make requests flow faster
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
  );

  page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
  await page.goto(mapUrl, { waitUntil: 'networkidle0' });

  // Open the index map if enabled
  await page.evaluate(() => {
    // @ts-ignore
    document.querySelector('.indexmapToggle')?.click();
    document.querySelector('.indexmapToggle')?.remove();
  });

  for (const answer of answers) {
    // Prepare the window for the next screenshot
    await page.evaluate(
      ({ visibleLayerIds, feature, featureStyle, question, markerIcon }) => {
        const sandbox = Oskari.getSandbox();

        sandbox
          .getMap()
          .getLayers()
          .map((layer) => layer.getId())
          .forEach((layerId) => {
            sandbox.postRequestByName(
              'MapModulePlugin.MapLayerVisibilityRequest',
              [layerId, visibleLayerIds.includes(layerId)],
            );
          });
        // Clear any previous features or markers
        sandbox.postRequestByName(
          'MapModulePlugin.RemoveFeaturesFromMapRequest',
          [],
        );
        sandbox.postRequestByName('MapModulePlugin.RemoveMarkersRequest', []);

        if (feature.geometry.type === 'Point') {
          // In case of adding a point, create a marker and zoom to it
          sandbox.postRequestByName('MapModulePlugin.AddMarkerRequest', [
            {
              x: feature.geometry.coordinates[0],
              y: feature.geometry.coordinates[1],
              shape: markerIcon ? markerIcon : 0,
              offsetX: 0,
              offsetY: 0,
              size: markerIcon ? 128 : 12,
            },
          ]);
          sandbox.postRequestByName('MapMoveRequest', [
            feature.geometry.coordinates[0],
            feature.geometry.coordinates[1],
            12,
          ]);
        } else {
          // Otherwise, add the feature to the map and zoom to it
          sandbox.postRequestByName('MapModulePlugin.AddFeaturesToMapRequest', [
            { type: 'FeatureCollection', features: [feature] },
            {
              clearPrevious: true,
              featureStyle,
            },
          ]);
          sandbox.postRequestByName('MapModulePlugin.ZoomToFeaturesRequest', [
            { maxZoomLevel: 12 },
          ]);
        }
      },
      {
        visibleLayerIds: answer.visibleLayerIds,
        feature: answer.feature as any,
        featureStyle:
          answer.question.type === 'map'
            ? getFeatureStyle(
                answer.feature.geometry.type === 'Point'
                  ? 'point'
                  : answer.feature.geometry.type === 'LineString'
                    ? 'line'
                    : 'area',
                answer.question as SurveyMapQuestion,
              )
            : defaultFeatureStyle,
        question: answer.question as any,
        markerIcon:
          answer.question.type === 'map'
            ? answer.question.featureStyles.point.markerIcon
            : answer.markerIcon,
      },
    );
    try {
      await page.waitForNetworkIdle({ timeout: networkIdleTimeout });
    } catch (error) {
      // Ignore timeout errors
    }

    // Make sure the tiles get rendered after network becomes idle
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const image = (await page.screenshot({
      type: 'png',
      captureBeyondViewport: false,
    })) as unknown as Buffer;

    returnData.push({
      sectionId: answer.sectionId,
      index: answer.index,
      image,
      layerNames: answer.visibleLayerIds
        .map((layerId) => {
          const layer = availableMapLayers.find(
            (layer) => layer.id === layerId,
          );
          return typeof layer?.name === 'string'
            ? layer.name
            : (layer?.name?.['fi'] ?? null);
        })
        .filter(Boolean),
    });
  }

  return returnData;
}

/**
 * Initializes Puppeteer cluster for taking screenshots of the map answer entries.
 * @returns
 */
export async function initializePuppeteerCluster() {
  if (cluster) {
    return;
  }

  // How many puppeteer instances to use?
  const maxConcurrency = process.env.PUPPETEER_CLUSTER_MAX_CONCURRENCY
    ? Number(process.env.PUPPETEER_CLUSTER_MAX_CONCURRENCY)
    : 2;

  // Launch and assign the cluster
  cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency,
    timeout: 600000,
    puppeteerOptions: {
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--proxy-server=direct://',
        '--proxy-bypass-list=*',
      ],
    },
  });
  // Assign the screenshot task to the cluster
  await cluster.task(generateScreenshots);
}

/**
 * Get screenshots for given details.
 * @param jobData Job data
 * @returns Screenshot images
 */
export async function getScreenshots(jobData: ScreenshotJobData) {
  if (!cluster) {
    throw new Error('Puppeteer cluster not initialized');
  }
  // Don't bother starting Puppeteer if there are no map answers
  if (!jobData.answers.length) {
    return [];
  }
  const images = await cluster.execute(jobData);
  return images;
}
