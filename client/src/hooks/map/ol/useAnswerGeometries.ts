import { featuresFromGeoJSON } from '@src/components/map/openlayers/helpers';
import { buildVectorLayer } from '@src/components/map/openlayers/layers';
import Map from 'ol/Map';
import { RefObject } from 'react';

export function useAnswerGeometries(mapRef: RefObject<Map | null>) {
  return {
    draw(geometries: GeoJSON.FeatureCollection) {
      const map = mapRef.current;
      if (!map) return;
      const { source } = buildVectorLayer(map, 'answerGeometries');
      source.clear();
      source.addFeatures(featuresFromGeoJSON(geometries));
    },
  };
}
