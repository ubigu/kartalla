import { FeatureDrawInteraction } from '@src/components/map/openlayers/interactions';
import { findLayer } from '@src/components/map/openlayers/layers';
import { MapInteractionManager } from '@src/components/map/openlayers/mapInteractionManager';
import { olFeatureKeys } from '@src/components/map/openlayers/olMapKeys';
import { Type } from 'ol/geom/Geometry';
import { SelectEvent } from 'ol/interaction/Select';
import Map from 'ol/Map';
import { RefObject, useRef } from 'react';

function onAnswerFeatureSelect(
  event: SelectEvent,
  map: Map,
  onSelect: (questionId: number, featureIndex: number, geomType?: Type) => void,
) {
  const isDrawing = map
    .getInteractions()
    .getArray()
    .some(
      (interaction) =>
        interaction instanceof FeatureDrawInteraction &&
        interaction.getActive(),
    );
  if (isDrawing) {
    event.target.getFeatures().clear();
    return;
  }

  const feature = event.selected[0];
  if (!feature) return;

  const question = feature.get(olFeatureKeys.question) as {
    id?: number;
  };
  const index = feature.get(olFeatureKeys.index) as number;
  if (!question?.id) return;

  const geomType = feature.getGeometry()?.getType();
  onSelect(question.id, index, geomType);

  event.target.getFeatures().clear();
}

export function useAnswerSelect(
  mapRef: RefObject<Map | null>,
  managerRef: RefObject<MapInteractionManager | null>,
) {
  const onFeatureClickRef = useRef<
    ((questionId: number, index: number) => void) | null
  >(null);
  const onMarkerClickRef = useRef<
    ((questionId: number, index: number) => void) | null
  >(null);

  return {
    initialize(
      onFeatureClick: (questionId: number, index: number) => void,
      onMarkerClick: (questionId: number, index: number) => void,
    ) {
      const map = mapRef.current;
      const manager = managerRef.current;
      if (!map || !manager) return;

      onFeatureClickRef.current = onFeatureClick;
      onMarkerClickRef.current = onMarkerClick;

      const layer = findLayer(map, 'answerGeometries');
      if (!layer) return;

      const { interaction: select, created } = manager.build('featureSelect', {
        layers: [layer],
      });
      if (created) {
        select.on('select', (event) => {
          onAnswerFeatureSelect(event, map, (questionId, index, geomType) => {
            if (geomType === 'Point') {
              onMarkerClickRef.current?.(questionId, index);
            } else {
              onFeatureClickRef.current?.(questionId, index);
            }
          });
        });
      }
    },
  };
}
