import {
  SurveyGeoBudgetingQuestion,
  SurveyMapQuestion,
} from '@interfaces/survey';
import type { Feature, Point, Polygon } from 'geojson';
import type { Page } from 'puppeteer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultFeatureStyle, ScreenshotJobData } from './screenshot';

const { launchMock, getAvailableOskariMapLayersMock, loggerMock } = vi.hoisted(
  () => ({
    launchMock: vi.fn(),
    getAvailableOskariMapLayersMock: vi.fn(),
    loggerMock: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  }),
);

vi.mock('puppeteer-cluster', () => ({
  Cluster: {
    CONCURRENCY_CONTEXT: 'CONCURRENCY_CONTEXT',
    launch: (...args: unknown[]) => launchMock(...args),
  },
}));

vi.mock('./map', () => ({
  getAvailableOskariMapLayers: (...args: unknown[]) =>
    getAvailableOskariMapLayersMock(...args),
}));

vi.mock('@src/logger', () => ({ default: loggerMock }));

function createFakeCluster() {
  return {
    task: vi.fn(),
    execute: vi.fn(),
  };
}

function createFakePage(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    setUserAgent: vi.fn().mockResolvedValue(undefined),
    setViewport: vi.fn(),
    goto: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(undefined),
    waitForNetworkIdle: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(Buffer.from('img')),
    setContent: vi.fn().mockResolvedValue(undefined),
    $: vi.fn(),
    ...overrides,
  } as unknown as Page;
}

// Every test loads a fresh module instance so the internal `cluster` singleton
// doesn't leak state (and mock call counts) across tests.
async function loadModule() {
  vi.resetModules();
  return import('./puppeteer-screenshot.js');
}

const pointFeature = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [24.9, 60.2] },
  properties: {},
} as Feature<Point>;

const polygonFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
      ],
    ],
  },
  properties: {},
} as Feature<Polygon>;

const mapQuestion = {
  id: 100,
  type: 'map',
  featureStyles: { point: { markerIcon: 'point-marker' } },
} as SurveyMapQuestion;

const geoBudgetingQuestion = {
  id: 200,
  type: 'geo-budgeting',
  targets: [],
} as SurveyGeoBudgetingQuestion;

beforeEach(() => {
  launchMock.mockReset();
  getAvailableOskariMapLayersMock.mockReset();
  loggerMock.error.mockClear();
});

describe('before the cluster has been initialized', () => {
  it('getPuppeteerScreenshots rejects', async () => {
    const mod = await loadModule();
    await expect(
      mod.getPuppeteerScreenshots({} as ScreenshotJobData),
    ).rejects.toThrow('Puppeteer cluster not initialized');
  });

  it('svgToPng rejects', async () => {
    const mod = await loadModule();
    await expect(mod.svgToPng('<svg/>')).rejects.toThrow(
      'Puppeteer cluster not initialized',
    );
  });
});

describe('initializePuppeteerCluster', () => {
  afterEach(() => {
    delete process.env.PUPPETEER_CLUSTER_MAX_CONCURRENCY;
  });

  it('launches a cluster with the default concurrency and registers the screenshot task', async () => {
    const fakeCluster = createFakeCluster();
    launchMock.mockResolvedValue(fakeCluster);

    const mod = await loadModule();
    await mod.initializePuppeteerCluster();

    expect(launchMock).toHaveBeenCalledTimes(1);
    const [options] = launchMock.mock.calls[0];
    expect(options.concurrency).toBe('CONCURRENCY_CONTEXT');
    expect(options.maxConcurrency).toBe(2);
    expect(fakeCluster.task).toHaveBeenCalledTimes(1);
    expect(fakeCluster.task.mock.calls[0][0]).toBeInstanceOf(Function);
  });

  it('respects PUPPETEER_CLUSTER_MAX_CONCURRENCY', async () => {
    process.env.PUPPETEER_CLUSTER_MAX_CONCURRENCY = '7';
    const fakeCluster = createFakeCluster();
    launchMock.mockResolvedValue(fakeCluster);

    const mod = await loadModule();
    await mod.initializePuppeteerCluster();

    expect(launchMock.mock.calls[0][0].maxConcurrency).toBe(7);
  });

  it('only launches once, even when called multiple times', async () => {
    const fakeCluster = createFakeCluster();
    launchMock.mockResolvedValue(fakeCluster);

    const mod = await loadModule();
    await mod.initializePuppeteerCluster();
    await mod.initializePuppeteerCluster();
    await mod.initializePuppeteerCluster();

    expect(launchMock).toHaveBeenCalledTimes(1);
  });
});

describe('getPuppeteerScreenshots', () => {
  it('forwards the job data to cluster.execute and returns its result', async () => {
    const fakeCluster = createFakeCluster();
    launchMock.mockResolvedValue(fakeCluster);
    const expected = [{ sectionId: 1, index: 0, image: null, layerNames: [] }];
    fakeCluster.execute.mockResolvedValue(expected);

    const mod = await loadModule();
    await mod.initializePuppeteerCluster();

    const jobData: ScreenshotJobData = {
      mapProvider: 'oskari',
      mapUrl: 'https://maps.example.com',
      language: 'fi',
      answers: [],
    };
    const result = await mod.getPuppeteerScreenshots(jobData);

    expect(fakeCluster.execute).toHaveBeenCalledWith(jobData);
    expect(result).toBe(expected);
  });
});

describe('svgToPng', () => {
  it('renders the SVG element to a PNG buffer via the cluster', async () => {
    const fakeCluster = createFakeCluster();
    launchMock.mockResolvedValue(fakeCluster);
    const svgElementScreenshot = new Uint8Array([1, 2, 3]);
    const svgElement = {
      screenshot: vi.fn().mockResolvedValue(svgElementScreenshot),
    };
    const querySelectorMock = vi.fn().mockResolvedValue(svgElement);
    const page = createFakePage({ $: querySelectorMock });

    fakeCluster.execute.mockImplementation(
      async (
        data: string,
        task: (args: { page: Page; data: string }) => unknown,
      ) => task({ page, data }),
    );

    const mod = await loadModule();
    await mod.initializePuppeteerCluster();

    const result = await mod.svgToPng('<svg><rect/></svg>');

    expect(page.setContent).toHaveBeenCalledWith(
      expect.stringContaining('<svg><rect/></svg>'),
      { waitUntil: 'load' },
    );
    expect(querySelectorMock).toHaveBeenCalledWith('svg');
    expect(svgElement.screenshot).toHaveBeenCalledWith({
      type: 'png',
      omitBackground: true,
    });
    expect(result).toBeInstanceOf(Buffer);
    expect(Array.from(result)).toEqual([1, 2, 3]);
  });
});

describe('the screenshot task registered with the cluster', () => {
  let fakeCluster: ReturnType<typeof createFakeCluster>;
  let taskFn: (args: {
    page: Page;
    data: ScreenshotJobData;
  }) => Promise<unknown>;

  beforeEach(async () => {
    vi.useFakeTimers();
    fakeCluster = createFakeCluster();
    launchMock.mockResolvedValue(fakeCluster);

    const mod = await loadModule();
    await mod.initializePuppeteerCluster();
    taskFn = fakeCluster.task.mock.calls[0][0];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a placeholder for every answer when the initial page setup fails', async () => {
    getAvailableOskariMapLayersMock.mockResolvedValue([]);
    const page = createFakePage({
      goto: vi.fn().mockRejectedValue(new Error('navigation failed')),
    });
    const data: ScreenshotJobData = {
      mapProvider: 'oskari',
      mapUrl: 'https://maps.example.com',
      language: 'fi',
      answers: [
        {
          sectionId: 1,
          index: 0,
          feature: pointFeature as any,
          visibleLayerIds: [1],
          question: mapQuestion,
        },
        {
          sectionId: 2,
          index: 0,
          feature: polygonFeature as any,
          visibleLayerIds: [1],
          question: geoBudgetingQuestion,
          markerIcon: 'icon',
        },
      ],
    };

    const result = await taskFn({ page, data });

    expect(result).toEqual([
      { sectionId: 1, index: 0, image: null, layerNames: [] },
      { sectionId: 2, index: 0, image: null, layerNames: [] },
    ]);
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
  });

  it('captures a screenshot per answer and resolves the visible layer names', async () => {
    getAvailableOskariMapLayersMock.mockResolvedValue([
      { id: 1, name: 'Layer One' },
      { id: 2, name: { fi: 'Kerros kaksi', en: 'Layer two', sv: '' } },
    ]);
    const screenshotBuffers = [Buffer.from('img-1'), Buffer.from('img-2')];
    const page = createFakePage({
      screenshot: vi
        .fn()
        .mockResolvedValueOnce(screenshotBuffers[0])
        .mockResolvedValueOnce(screenshotBuffers[1]),
    });
    const data: ScreenshotJobData = {
      mapProvider: 'oskari',
      mapUrl: 'https://maps.example.com',
      language: 'fi',
      answers: [
        {
          sectionId: 10,
          index: 0,
          feature: pointFeature as any,
          visibleLayerIds: [1, 2],
          question: mapQuestion,
        },
        {
          sectionId: 20,
          index: 0,
          feature: polygonFeature as any,
          visibleLayerIds: [2],
          question: geoBudgetingQuestion,
          markerIcon: 'target-icon',
        },
      ],
    };

    const resultPromise = taskFn({ page, data });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual([
      {
        sectionId: 10,
        index: 0,
        image: screenshotBuffers[0],
        layerNames: ['Layer One', 'Kerros kaksi'],
      },
      {
        sectionId: 20,
        index: 0,
        image: screenshotBuffers[1],
        layerNames: ['Kerros kaksi'],
      },
    ]);

    // Call 0 removes the indexmap toggle during setup; calls 1 and 2 build the
    // per-answer Oskari RPC payload.
    expect(page.evaluate).toHaveBeenCalledTimes(3);
    const [, mapAnswerPayload] = (page.evaluate as ReturnType<typeof vi.fn>)
      .mock.calls[1];
    expect(mapAnswerPayload.markerIcon).toBe('point-marker');
    expect(mapAnswerPayload.featureStyle).toEqual(defaultFeatureStyle);

    const [, geoBudgetingAnswerPayload] = (
      page.evaluate as ReturnType<typeof vi.fn>
    ).mock.calls[2];
    expect(geoBudgetingAnswerPayload.markerIcon).toBe('target-icon');
    expect(geoBudgetingAnswerPayload.featureStyle).toEqual(defaultFeatureStyle);
  });

  it('falls back to a placeholder for an answer whose screenshot step fails, without dropping the others', async () => {
    getAvailableOskariMapLayersMock.mockResolvedValue([
      { id: 1, name: 'Layer One' },
    ]);
    const page = createFakePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // initial indexmap toggle removal
        .mockRejectedValueOnce(new Error('rpc failed')) // first answer's payload
        .mockResolvedValueOnce(undefined), // second answer's payload
    });
    const data: ScreenshotJobData = {
      mapProvider: 'oskari',
      mapUrl: 'https://maps.example.com',
      language: 'fi',
      answers: [
        {
          sectionId: 1,
          index: 0,
          feature: pointFeature,
          visibleLayerIds: [1],
          question: mapQuestion,
        },
        {
          sectionId: 2,
          index: 0,
          feature: pointFeature,
          visibleLayerIds: [1],
          question: mapQuestion,
        },
      ],
    };

    const resultPromise = taskFn({ page, data });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result[0]).toEqual({
      sectionId: 1,
      index: 0,
      image: null,
      layerNames: ['Layer One'],
    });
    expect(result[1].image).toBeInstanceOf(Buffer);
    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.stringContaining('section 1, index 0'),
    );
  });
});
