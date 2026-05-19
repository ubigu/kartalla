import {
  extentFromFeatures,
  featuresFromGeoJSON,
  geojsonCollectionFromFeature,
} from '@src/components/map/openlayers/helpers';
import {
  buildVectorLayer,
  findLayer,
} from '@src/components/map/openlayers/layers';
import { MapInteractionManager } from '@src/components/map/openlayers/mapInteractionManager';
import { adminViewStyle } from '@src/components/map/openlayers/styles';
import { createBox } from 'ol/interaction/Draw';
import Map from 'ol/Map';
import { RefObject } from 'react';

export function useDefaultViewDraw(
  mapRef: RefObject<Map | null>,
  managerRef: RefObject<MapInteractionManager | null>,
) {
  return {
    startDrawing(
      currentDefaultView: GeoJSON.FeatureCollection | null,
      onDefaultViewChange: (geojson: GeoJSON.FeatureCollection) => void,
    ) {
      const map = mapRef.current;
      if (!map) return;
      const { source } = buildVectorLayer(map, 'defaultView');

      const manager = managerRef.current;
      if (!manager) return;
      const { interaction: draw, created } = manager.build('featureDraw', {
        source,
        type: 'Circle',
        geometryFunction: createBox(),
        style: adminViewStyle,
      });
      if (created) {
        draw.on('drawstart', () => {
          if (currentDefaultView) source.clear();
        });
        draw.on('drawend', (event) => {
          source.clear();
          onDefaultViewChange(geojsonCollectionFromFeature(event.feature));
        });
      }

      managerRef.current?.setMode('draw', 'featureDraw');
    },

    drawDefaultView(
      defaultView: GeoJSON.FeatureCollection,
      fitOptions: { padding: number[]; maxZoom: number },
    ) {
      const map = mapRef.current;
      if (!map) return;
      const { source } = buildVectorLayer(map, 'defaultView');
      source.clear();
      const features = featuresFromGeoJSON(defaultView);
      source.addFeatures(features);
      const extent = extentFromFeatures(features);
      if (extent) {
        map.getView().fit(extent, fitOptions);
      }
    },

    clearView(
      onDefaultViewChange: (geojson: GeoJSON.FeatureCollection | null) => void,
    ) {
      const map = mapRef.current;
      if (!map) return;
      findLayer(map, 'defaultView')?.getSource()?.clear();
      this.startDrawing(null, onDefaultViewChange);
    },
  };
}
