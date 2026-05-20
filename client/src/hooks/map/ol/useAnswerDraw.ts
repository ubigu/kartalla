import { GeoJSONWithCRS } from '@interfaces/geojson';
import {
  MapQuestionSelectionType,
  SurveyMapQuestion,
} from '@interfaces/survey';
import { featureToGeoJSON } from '@src/components/map/openlayers/helpers';
import { FeatureDrawInteraction } from '@src/components/map/openlayers/interactions';
import {
  buildVectorLayer,
  findLayer,
} from '@src/components/map/openlayers/layers';
import { MapInteractionManager } from '@src/components/map/openlayers/mapInteractionManager';
import { olFeatureKeys } from '@src/components/map/openlayers/olMapKeys';
import { createSurveyFeatureStyle } from '@src/components/map/openlayers/styles';
import { LineString, Point, Polygon } from 'geojson';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import { RefObject, useRef } from 'react';

type DrawResult = GeoJSONWithCRS<
  GeoJSON.Feature<Point | LineString | Polygon>
> | null;
type OlGeomType = 'Point' | 'LineString' | 'Polygon';

const selectionTypeToOlType = {
  point: 'Point',
  line: 'LineString',
  area: 'Polygon',
} as const;

const olTypeToSelectionType = {
  Point: 'point',
  LineString: 'line',
  Polygon: 'area',
} as const;

export function useAnswerDraw(
  mapRef: RefObject<Map | null>,
  managerRef: RefObject<MapInteractionManager | null>,
) {
  const resolveRef = useRef<((value: DrawResult) => void) | null>(null);
  const questionRef = useRef<SurveyMapQuestion | null>(null);

  function getLayerSource() {
    const map = mapRef.current;
    if (!map) return null;
    const { source } = buildVectorLayer(map, 'answerDraw');
    source.clear();
    return source;
  }

  function wireDrawListeners(
    interaction: FeatureDrawInteraction,
    olType: OlGeomType,
  ) {
    interaction.set('olType', olType);
    interaction.on('drawend', (event) => {
      const question = questionRef.current;
      if (question) event.feature.set(olFeatureKeys.question, question);
      const resolve = resolveRef.current;
      resolveRef.current = null;
      questionRef.current = null;
      resolve?.(featureToGeoJSON(event.feature) as DrawResult);
    });
  }

  function getInteraction(source: VectorSource, olType: OlGeomType) {
    const manager = managerRef.current!;
    const drawOptions = {
      source,
      type: olType,
      style: () =>
        createSurveyFeatureStyle(
          olTypeToSelectionType[olType],
          questionRef.current ?? undefined,
        ),
    };

    const { interaction, created } = manager.build('featureDraw', drawOptions);
    if (created) {
      wireDrawListeners(interaction, olType);
      return interaction;
    }
    if (interaction.get('olType') === olType) return interaction;

    const replaced = manager.replace('featureDraw', drawOptions);
    wireDrawListeners(replaced, olType);
    return replaced;
  }

  return {
    draw(
      type: MapQuestionSelectionType,
      question: SurveyMapQuestion,
    ): Promise<DrawResult> {
      const map = mapRef.current;
      if (!map) return Promise.resolve(null);
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        questionRef.current = question;
        const olType = selectionTypeToOlType[type];
        const source = getLayerSource();
        if (!source) return Promise.resolve(null);
        getInteraction(source, olType);
        managerRef.current?.setMode('draw', 'featureDraw');
      });
    },

    stop() {
      managerRef.current?.setMode('interactivePan');
      resolveRef.current?.(null);
      resolveRef.current = null;
      questionRef.current = null;
    },

    clear() {
      const map = mapRef.current;
      if (map) findLayer(map, 'answerDraw')?.getSource()?.clear();
    },
  };
}
