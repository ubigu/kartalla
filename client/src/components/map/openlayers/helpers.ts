import { GeoJSONWithCRS } from '@interfaces/geojson';
import { Map } from 'ol';
import { createEmpty, extend, isEmpty, type Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Geometry from 'ol/geom/Geometry';

export const defaultCrs = 'EPSG:3857';

export function featuresFromGeoJSON(
  featureCollection: GeoJSON.FeatureCollection,
): Feature<Geometry>[] {
  const dataProjection =
    (featureCollection as any)?.crs?.properties?.name ?? defaultCrs;
  return new GeoJSON().readFeatures(featureCollection, {
    dataProjection,
    featureProjection: defaultCrs,
  });
}

export function extentFromFeatures(
  features: Feature<Geometry>[],
): Extent | null {
  const extent = features.reduce((combinedExtent, feature) => {
    const featureExtent = feature.getGeometry()?.getExtent();
    return featureExtent
      ? extend(combinedExtent, featureExtent)
      : combinedExtent;
  }, createEmpty());

  return isEmpty(extent) ? null : extent;
}

export function geojsonCollectionFromFeature(
  feature: Feature<Geometry>,
): GeoJSONWithCRS<GeoJSON.FeatureCollection> {
  const geojsonFeature = new GeoJSON().writeFeatureObject(feature, {
    dataProjection: defaultCrs,
    featureProjection: defaultCrs,
  });
  return {
    type: 'FeatureCollection',
    features: [geojsonFeature],
    crs: { type: 'name', properties: { name: defaultCrs } },
  };
}

export function featureToGeoJSON(
  feature: Feature<Geometry>,
): GeoJSONWithCRS<GeoJSON.Feature> {
  const geojson = new GeoJSON().writeFeatureObject(feature, {
    dataProjection: defaultCrs,
    featureProjection: defaultCrs,
  });
  return {
    ...geojson,
    crs: { type: 'name', properties: { name: defaultCrs } },
  };
}

export function focusToExtent(map: Map, extent: Extent) {
  map.getView().fit(extent, { padding: [40, 40, 40, 40] });
}
