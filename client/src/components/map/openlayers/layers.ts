import {
  LocalizedSurveyMapLayer,
  MapQuestionSelectionType,
  SurveyMapQuestion,
} from '@interfaces/survey';
import { Map } from 'ol';
import Feature, { FeatureLike } from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import { Layer, WebGLVector } from 'ol/layer';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { olFeatureKeys } from './olMapKeys';
import {
  adminViewStyle,
  createSurveyFeatureStyle,
  webGLAnswerFlatStyle,
} from './styles';

export const DEFAULT_OL_MAP_LAYER_ID = 0;
export const LAYER_PROPERTY_KEYS = {
  layerId: 'layerId',
  name: 'name',
};

function setLayerCustomId(layer: Layer, id: number) {
  layer.set(LAYER_PROPERTY_KEYS.layerId, id);
  return layer;
}

const olBaseLayerFactoryMap: Record<number, () => Layer> = {
  0: createOsmLayer,
};

export function buildBaseLayer(layer: LocalizedSurveyMapLayer) {
  const baseLayer = olBaseLayerFactoryMap[layer.id]();
  setLayerCustomId(baseLayer, layer.id);
  return baseLayer;
}

export type OlLayerName =
  | 'answerDraw'
  | 'answerGeometries'
  | 'answerIcons'
  | 'defaultView'
  | 'OpenStreetMap';

export function setLayerName(layer: Layer, name: OlLayerName): void {
  layer.set(LAYER_PROPERTY_KEYS.name, name);
}

export function findLayer<
  L extends VectorLayer<VectorSource> | WebGLVector<VectorSource> =
    VectorLayer<VectorSource>,
>(map: Map, name: string): L | null {
  return (
    (map
      .getLayers()
      .getArray()
      .find((l) => l.get('name') === name) as L) ?? null
  );
}

export function createOsmLayer() {
  return new TileLayer({ source: new OSM() });
}

function createDefaultViewLayer() {
  const source = new VectorSource<Feature<Geometry>>();
  const layer = new VectorLayer({ source, style: adminViewStyle });
  return { layer, source };
}

export function surveyFeatureStyle(olFeature: FeatureLike) {
  const question = olFeature.get(olFeatureKeys.question) as SurveyMapQuestion;
  const targetIcon = olFeature.get(olFeatureKeys.targetIcon);
  const geomType = (olFeature as Feature<Geometry>).getGeometry?.()?.getType();
  const type: MapQuestionSelectionType =
    geomType === 'Point'
      ? 'point'
      : geomType === 'LineString'
        ? 'line'
        : 'area';
  return createSurveyFeatureStyle(type, { ...question, targetIcon });
}

function createSurveyDrawLayer() {
  const source = new VectorSource<Feature<Geometry>>();
  const layer = new VectorLayer({ source, style: surveyFeatureStyle });
  return { layer, source };
}

function createAnswerGeometriesLayer() {
  const source = new VectorSource<Feature<Geometry>>();
  const layer = new VectorLayer({ source, style: surveyFeatureStyle });
  return { layer, source };
}

function createAnswerViewWebGLLayer() {
  const source = new VectorSource<Feature<Geometry>>();
  const layer = new WebGLVector({ source, style: webGLAnswerFlatStyle });
  return { layer, source };
}

// Placeholder style used only until the first features load and the layer is
// rebuilt with the actual icon URLs compiled into per-src shader rules.
function createAnswerIconsWebGLLayer() {
  const source = new VectorSource<Feature<Geometry>>();
  const layer = new WebGLVector({ source, style: webGLAnswerFlatStyle });
  return { layer, source };
}

/** Returns an existing named vector layer or creates and adds a new one to the map. */
export function buildVectorLayer(
  map: Map,
  layerName: Exclude<OlLayerName, 'answerIcons' | 'OpenStreetMap'>,
): { layer: VectorLayer<VectorSource>; source: VectorSource } {
  const existing = findLayer(map, layerName);
  if (existing) {
    return { layer: existing, source: existing.getSource()! };
  }

  const factories: Record<
    Exclude<OlLayerName, 'answerIcons' | 'OpenStreetMap'>,
    () => { layer: VectorLayer<VectorSource>; source: VectorSource }
  > = {
    answerDraw: createSurveyDrawLayer,
    answerGeometries: createAnswerGeometriesLayer,
    defaultView: createDefaultViewLayer,
  };

  const { layer, source } = factories[layerName]();
  setLayerName(layer, layerName);
  map.addLayer(layer);
  return { layer, source };
}

/** Same as buildVectorLayer but uses a WebGL-backed layer for high-performance rendering. */
export function buildWebGLVectorLayer(
  map: Map,
  layerName: Extract<OlLayerName, 'answerGeometries' | 'answerIcons'>,
) {
  const existing = findLayer<WebGLVector<VectorSource>>(map, layerName);
  if (existing) {
    return { layer: existing, source: existing.getSource()! };
  }

  const factories: Record<
    typeof layerName,
    () => { layer: WebGLVector<VectorSource>; source: VectorSource }
  > = {
    answerGeometries: createAnswerViewWebGLLayer,
    answerIcons: createAnswerIconsWebGLLayer,
  };

  const { layer, source } = factories[layerName]();
  setLayerName(layer, layerName);
  map.addLayer(layer);
  return { layer, source };
}
