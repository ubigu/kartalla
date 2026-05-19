import { SurveyMapQuestion } from '@interfaces/survey';
import { featureToGeoJSON } from '@src/components/map/openlayers/helpers';
import { buildVectorLayer } from '@src/components/map/openlayers/layers';
import { MapInteractionManager } from '@src/components/map/openlayers/mapInteractionManager';
import { olFeatureKeys } from '@src/components/map/openlayers/olMapKeys';
import {
  createSurveyFeatureStyle,
  createVertexStyle,
} from '@src/components/map/openlayers/styles';
import { LineString, Point, Polygon } from 'geojson';
import Feature, { FeatureLike } from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import { ModifyEvent } from 'ol/interaction/Modify';
import Map from 'ol/Map';
import { RefObject } from 'react';

function modifyVertexStyle(olFeature: FeatureLike) {
  const subFeatures = olFeature.get('features') as FeatureLike[] | undefined;
  if (!subFeatures?.length) return createVertexStyle();
  const parent = subFeatures[0];
  const geomType = (parent as Feature<Geometry>).getGeometry?.()?.getType();
  if (geomType === 'Point') {
    const question = parent.get(olFeatureKeys.question) as SurveyMapQuestion;
    const targetIcon = parent.get(olFeatureKeys.targetIcon);

    return createSurveyFeatureStyle('point', {
      ...question,
      targetIcon,
    });
  }
  return createVertexStyle();
}

export function useAnswerModify(
  mapRef: RefObject<Map | null>,
  managerRef: RefObject<MapInteractionManager | null>,
) {
  function buildInteractions() {
    const map = mapRef.current;
    const manager = managerRef.current;
    if (!map || !manager) return null;
    const { source } = buildVectorLayer(map, 'answerGeometries');

    const { interaction: modify } = manager.build('featureModify', {
      source,
      style: modifyVertexStyle,
    });
    manager.build('featureSnap', { source });
    return modify;
  }

  return {
    start() {
      buildInteractions();
      managerRef.current?.setMode('modify');
    },

    stop() {
      managerRef.current?.setMode('interactivePan');
    },

    onModify<
      G extends Point | LineString | Polygon = Point | LineString | Polygon,
    >(
      questionId: number,
      callback: (features: GeoJSON.Feature<G>[]) => void,
    ): () => void {
      const map = mapRef.current;
      if (!map) return () => {};
      const interaction = buildInteractions();
      if (!interaction) return () => {};

      const handler = (event: ModifyEvent) => {
        const modified = event.features
          .getArray()
          .filter(
            (feature) => feature.get(olFeatureKeys.question)?.id === questionId,
          )
          .map((feature) => featureToGeoJSON(feature));
        if (modified.length) {
          callback(modified as GeoJSON.Feature<G>[]);
        }
      };

      interaction.on('modifyend', handler);
      return () => interaction.un('modifyend', handler);
    },
  };
}
