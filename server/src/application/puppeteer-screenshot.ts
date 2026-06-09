import { Page } from 'puppeteer';
import { Cluster } from 'puppeteer-cluster';
import { getAvailableOskariMapLayers } from './map';
import {
  ScreenshotJobData,
  ScreenshotJobReturnData,
  defaultFeatureStyle,
  getFeatureStyle,
} from './screenshot';

/**
 * Oskari needs to be declared, because it is available as a global variable inside
 * Puppeteer's evaluation context.
 */
declare const Oskari: any;

interface GenericCluster {
  execute<TData, TReturn>(
    data: TData,
    task: (args: { page: Page; data: TData }) => Promise<TReturn>,
  ): Promise<TReturn>;
  execute<TReturn>(data: ScreenshotJobData): Promise<TReturn>;
  task(
    fn: (args: {
      page: Page;
      data: ScreenshotJobData;
    }) => Promise<ScreenshotJobReturnData[]>,
  ): Promise<void>;
}

let cluster: GenericCluster;

const networkIdleTimeout = process.env.PUPPETEER_NETWORK_IDLE_TIMEOUT
  ? Number(process.env.PUPPETEER_NETWORK_IDLE_TIMEOUT)
  : 10000;

async function generateScreenshots({
  page,
  data,
}: {
  page: Page;
  data: ScreenshotJobData;
}) {
  const { mapUrl, answers, language } = data;
  const returnData: ScreenshotJobReturnData[] = [];

  const availableMapLayers = await getAvailableOskariMapLayers(
    mapUrl,
    language,
  );

  await page.setUserAgent({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
  });

  page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
  await page.goto(mapUrl, { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    // @ts-ignore
    document.querySelector('.indexmapToggle button')?.click();
    document.querySelector('.indexmapToggle')?.remove();
  });

  for (const answer of answers) {
    await page.evaluate(
      ({ visibleLayerIds, feature, featureStyle, markerIcon }) => {
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
        sandbox.postRequestByName(
          'MapModulePlugin.RemoveFeaturesFromMapRequest',
          [],
        );
        sandbox.postRequestByName('MapModulePlugin.RemoveMarkersRequest', []);

        if (feature.geometry.type === 'Point') {
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
                answer.question as any,
              )
            : defaultFeatureStyle,
        question: answer.question as any,
        markerIcon:
          answer.question.type === 'map'
            ? (answer.question as any).featureStyles.point.markerIcon
            : answer.markerIcon,
      },
    );
    try {
      await page.waitForNetworkIdle({ timeout: networkIdleTimeout });
    } catch {
      // Ignore timeout errors
    }

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
            : (layer?.name?.[language] ?? layer?.name?.['fi'] ?? null);
        })
        .filter(Boolean),
    });
  }

  return returnData;
}

export async function initializePuppeteerCluster() {
  if (cluster) {
    return;
  }

  const maxConcurrency = process.env.PUPPETEER_CLUSTER_MAX_CONCURRENCY
    ? Number(process.env.PUPPETEER_CLUSTER_MAX_CONCURRENCY)
    : 2;

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
  await cluster.task(generateScreenshots);
}

export async function getPuppeteerScreenshots(
  jobData: ScreenshotJobData,
): Promise<ScreenshotJobReturnData[]> {
  if (!cluster) {
    throw new Error('Puppeteer cluster not initialized');
  }
  return cluster.execute(jobData);
}

export async function svgToPng(svgContent: string): Promise<Buffer> {
  if (!cluster) {
    throw new Error('Puppeteer cluster not initialized');
  }
  return cluster.execute(
    svgContent,
    async ({ page, data }: { page: Page; data: string }) => {
      await page.setContent(
        `<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent">${data}</body></html>`,
        { waitUntil: 'load' },
      );
      const element = await page.$('svg');
      const screenShot = await element.screenshot({
        type: 'png',
        omitBackground: true,
      });
      return Buffer.from(screenShot);
    },
  );
}
