import { GeoJSONWithCRS } from '@interfaces/geojson';
import { SurveyMapQuestion } from '@interfaces/survey';
import { unlink, writeFile } from 'fs/promises';
import { Feature, LineString, Point, Polygon } from 'geojson';
import { tmpdir } from 'os';
import { join } from 'path';
import proj4 from 'proj4';
import StaticMaps from 'staticmaps';
import { getOlMapLayers } from './map';
import { svgToPng } from './puppeteer-screenshot';
import {
  ScreenshotJobData,
  ScreenshotJobReturnData,
  defaultFeatureStyle,
  getFeatureStyle,
} from './screenshot';

const MARKER_SIZE = 24;
const LINE_WIDTH = 3;

function defaultCircleMarker(): string {
  const r = MARKER_SIZE / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_SIZE}" height="${MARKER_SIZE}"><circle cx="${r}" cy="${r}" r="${r - 2}" fill="rgba(0,0,0)" stroke="white" stroke-width="2"/></svg>`;
}

function parseCrs(feature: GeoJSONWithCRS): string {
  const name = feature.crs?.properties?.name;
  const epsgCode = name?.match(/\d+$/)?.[0];
  return epsgCode ? `EPSG:${epsgCode}` : 'EPSG:3857';
}

function toWgs84(x: number, y: number, crs: string): [number, number] {
  return proj4(crs, 'EPSG:4326', [x, y]) as [number, number];
}

async function writeTempMarker(svgContent: string): Promise<string> {
  const pngBuffer = await svgToPng(svgContent);
  const filePath = join(tmpdir(), `marker-${crypto.randomUUID()}.png`);
  await writeFile(filePath, pngBuffer);
  return filePath;
}

async function renderPoint(
  map: StaticMaps,
  feature: GeoJSONWithCRS<Feature<Point>>,
  markerIcon: string | undefined,
): Promise<void> {
  const [x, y] = feature.geometry.coordinates;
  const crs = parseCrs(feature);
  const svgContent = markerIcon ?? defaultCircleMarker();
  const tempFile = await writeTempMarker(svgContent);
  try {
    map.addMarker({
      img: tempFile,
      coord: toWgs84(x, y, crs),
      width: MARKER_SIZE,
      height: MARKER_SIZE,
      offsetX: MARKER_SIZE / 2,
      offsetY: MARKER_SIZE / 2,
    });
    await map.render();
  } finally {
    await unlink(tempFile).catch(() => {});
  }
}

async function renderLine(
  map: StaticMaps,
  feature: GeoJSONWithCRS<Feature<LineString>>,
  question: SurveyMapQuestion | null,
): Promise<void> {
  const crs = parseCrs(feature);
  const style = question
    ? getFeatureStyle('line', question)
    : defaultFeatureStyle;
  map.addLine({
    coords: feature.geometry.coordinates.map(([x, y]) => toWgs84(x, y, crs)),
    color: style.stroke.color,
    width: LINE_WIDTH,
  });
  await map.render();
}

async function renderPolygon(
  map: StaticMaps,
  feature: GeoJSONWithCRS<Feature<Polygon>>,
  question: SurveyMapQuestion | null,
): Promise<void> {
  const crs = parseCrs(feature);
  const style = question
    ? getFeatureStyle('area', question)
    : defaultFeatureStyle;
  map.addPolygon({
    coords: feature.geometry.coordinates[0].map(([x, y]) => toWgs84(x, y, crs)),
    color: style.stroke.color,
    width: LINE_WIDTH,
    fill: style.fill.color,
  });
  await map.render();
}

export async function getStaticMapsScreenshots(
  jobData: ScreenshotJobData,
): Promise<ScreenshotJobReturnData[]> {
  const returnData: ScreenshotJobReturnData[] = [];
  const availableMapLayers = await getOlMapLayers();

  for (const answer of jobData.answers) {
    const { feature, question, markerIcon, sectionId, index } = answer;
    const mapQuestion =
      question.type === 'map' ? (question as SurveyMapQuestion) : null;

    const map = new StaticMaps({
      width: 800,
      height: 600,
      paddingX: 50,
      paddingY: 50,
    });

    const geomType = feature.geometry.type;
    if (geomType === 'Point') {
      await renderPoint(
        map,
        feature as GeoJSONWithCRS<Feature<Point>>,
        markerIcon,
      );
    } else if (geomType === 'LineString') {
      await renderLine(
        map,
        feature as GeoJSONWithCRS<Feature<LineString>>,
        mapQuestion,
      );
    } else if (geomType === 'Polygon') {
      await renderPolygon(
        map,
        feature as GeoJSONWithCRS<Feature<Polygon>>,
        mapQuestion,
      );
    } else {
      continue;
    }

    const image = await map.image.buffer('image/png');
    returnData.push({
      sectionId,
      index,
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
