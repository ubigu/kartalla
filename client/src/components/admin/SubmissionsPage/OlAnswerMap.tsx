import {
  defaultCrs,
  extentFromFeatures,
  focusToExtent,
} from '@src/components/map/openlayers/helpers';
import { buildWebGLVectorLayer } from '@src/components/map/openlayers/layers';
import { MapInteractionManager } from '@src/components/map/openlayers/mapInteractionManager';
import { OlMap } from '@src/components/map/openlayers/OlMap';
import { getWebGLFeatureStyleProps } from '@src/components/map/openlayers/styles';
import OlFeature, { FeatureLike } from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Geometry from 'ol/geom/Geometry';
import { WebGLVector } from 'ol/layer';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import { useEffect, useRef, useState } from 'react';
import { AnswerFeature } from './AnswerMap';

function getFeatureQuestion(feature: AnswerFeature) {
  return feature.properties?.question?.type === 'map'
    ? feature.properties?.question
    : undefined;
}
function getFeatureTargetIcon(feature: AnswerFeature) {
  return 'targetIcon' in feature.properties
    ? feature.properties.targetIcon
    : undefined;
}

function olFeatureFromGeojsonFeature(feature: AnswerFeature) {
  const featureResult = format.readFeature(feature, {
    dataProjection: defaultCrs,
    featureProjection: defaultCrs,
  });

  return Array.isArray(featureResult) ? featureResult[0] : featureResult;
}

const format = new GeoJSON();

interface Props {
  features: AnswerFeature[];
  onFeatureClick?: (feature: FeatureLike) => void;
  mapIsInteractive: boolean;
}

export default function OlAnswerMap({
  features,
  onFeatureClick,
  mapIsInteractive,
}: Props) {
  const mapRef = useRef<Map | null>(null);
  const webglSourceRef = useRef<VectorSource | null>(null);
  const iconLayerRef = useRef<WebGLVector<VectorSource> | null>(null);
  const iconSourceRef = useRef<VectorSource | null>(null);
  const interactionManagerRef = useRef<MapInteractionManager | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    if (!mapInitialized) return;
    const interactionManager = interactionManagerRef.current;
    if (!interactionManager) return;
    if (mapIsInteractive && interactionManager.mode === 'interactivePan')
      return;
    interactionManager.setMode(mapIsInteractive ? 'interactivePan' : 'pan');
  }, [mapIsInteractive, mapInitialized]);

  useEffect(() => {
    if (!mapInitialized) return;
    const map = mapRef.current;
    const webglSource = webglSourceRef.current;
    const iconSource = iconSourceRef.current;
    const iconLayer = iconLayerRef.current;

    if (!map || !webglSource || !iconSource || !iconLayer) return;

    const webglFeatures: OlFeature<Geometry>[] = [];
    const iconFeatures: OlFeature<Geometry>[] = [];

    for (const answerFeature of features) {
      const geomType = answerFeature.geometry?.type ?? '';
      const question = getFeatureQuestion(answerFeature);
      const targetIcon = getFeatureTargetIcon(answerFeature);
      const { strokeColor, fillColor, strokeStyle, iconSrc, iconScale } =
        getWebGLFeatureStyleProps(geomType, question, targetIcon);

      const olFeature = olFeatureFromGeojsonFeature(answerFeature);
      olFeature.setProperties({
        strokeColor,
        fillColor,
        strokeStyle,
        iconSrc,
        iconScale,
      });

      if (iconSrc) {
        iconFeatures.push(olFeature);
      } else {
        webglFeatures.push(olFeature);
      }
    }

    webglSource.clear();
    webglSource.addFeatures(webglFeatures);

    iconSource.clear();
    iconSource.addFeatures(iconFeatures);

    if (iconFeatures.length > 0) {
      const uniqueIconSrcs = [
        ...new Set(iconFeatures.map((f) => f.get('iconSrc'))),
      ];
      iconLayer.setStyle(
        uniqueIconSrcs.map((src) => {
          const iconScale =
            iconFeatures
              .find((f) => f.get('iconSrc') === src)
              ?.get('iconScale') ?? 1;
          return {
            filter: ['==', ['get', 'iconSrc'], src],
            style: {
              'icon-src': src,
              'icon-scale': iconScale,
            },
          };
        }),
      );
    }

    const allFeatures = [...webglFeatures, ...iconFeatures];
    const extent = extentFromFeatures(allFeatures);
    if (extent && mapRef.current) focusToExtent(mapRef.current, extent);
  }, [features, mapInitialized]);

  function handleMapReady(map: Map | null) {
    if (!map) return;
    mapRef.current = map;
    interactionManagerRef.current = new MapInteractionManager(map);

    const { source: webglSource } = buildWebGLVectorLayer(
      map,
      'answerGeometries',
    );
    webglSourceRef.current = webglSource;

    const { layer: iconLayer, source: iconSource } = buildWebGLVectorLayer(
      map,
      'answerIcons',
    );
    iconLayerRef.current = iconLayer;
    iconSourceRef.current = iconSource;

    const { interaction } = interactionManagerRef.current.build(
      'featureSelect',
      {
        layers: (l) =>
          ['answerGeometries', 'answerIcons'].includes(l.get('name')),
      },
    );
    interaction.on('select', (event) => {
      const feature = event.selected[0];
      if (feature) onFeatureClick?.(feature);
    });
    setMapInitialized(true);
  }

  return <OlMap onMapReady={handleMapReady} />;
}
