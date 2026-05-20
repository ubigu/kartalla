import { GeoJSONWithCRS } from '@interfaces/geojson';
import {
  MapQuestionSelectionType,
  SurveyMapQuestion,
} from '@interfaces/survey';
import { FeatureLike } from 'ol/Feature';

export interface MapLayer {
  id: number;
  name: string;
  visible?: boolean;
}

export interface MapPosition {
  centerX: number;
  centerY: number;
  zoom?: number;
  options?: object;
}

export interface SurveyMapContextProvider {
  getInitialLayers(): Promise<(number | string)[]>;

  getAllLayers(): Promise<MapLayer[]>;

  getMapPosition(): Promise<MapPosition>;

  moveMapTo(centerX: number, centerY: number, zoom: number): void;

  initializeMap(
    onFeatureClick: (questionId: number, index: number) => void,
    onMarkerClick: (questionId: number, index: number) => void,
    initialGeometries: GeoJSON.FeatureCollection,
  ): void;

  draw(
    type: MapQuestionSelectionType,
    question: SurveyMapQuestion,
  ): Promise<GeoJSONWithCRS<
    GeoJSON.Feature<GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon>
  > | null>;

  stopDrawing(): void;

  drawAnswerGeometries(geometries: GeoJSON.FeatureCollection): void;

  centerToDefaultView(
    featureCollection: GeoJSON.FeatureCollection,
    style?: object,
  ): void;

  startModifying(answerGeometries: GeoJSON.FeatureCollection): void;

  stopModifying(answerGeometries: GeoJSON.FeatureCollection): void;

  onModify<
    G extends GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon =
      | GeoJSON.Point
      | GeoJSON.LineString
      | GeoJSON.Polygon,
  >(
    questionId: number,
    callback: (features: GeoJSON.Feature<G>[]) => void,
  ): () => void;

  zoomToAnswerGeometries(features?: FeatureLike[]): void;

  updateLayerVisibility(
    allLayers: (number | string)[],
    visibleLayers: (number | string)[],
  ): void;

  startDrawingDefaultView(
    currentDefaultView: GeoJSON.FeatureCollection | null,
    onDefaultViewChange: (geojson: GeoJSON.FeatureCollection) => void,
  ): void;

  drawDefaultView(defaultView: GeoJSON.FeatureCollection): void;

  clearDefaultView(
    onDefaultViewChange: (geojson: GeoJSON.FeatureCollection | null) => void,
  ): void;
}
