import { LocalizedSurveyMapLayer } from '@interfaces/survey';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import { defaults as defaultInteractions } from 'ol/interaction';
import { Layer } from 'ol/layer';
import Map from 'ol/Map';
import 'ol/ol.css';
import View from 'ol/View';
import { useEffect, useRef } from 'react';
import { buildBaseLayer, createOsmLayer } from './layers';

interface Props {
  onMapReady?: (map: Map | null, layers: Layer[]) => void;
}

export function OlMap({ onMapReady }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const { showToast } = useToasts();
  const { tr } = useTranslations();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!mapRef.current || mapInstance.current) return;

      let olLayers: LocalizedSurveyMapLayer[] = [];
      let baseLayers;

      try {
        olLayers =
          await request<LocalizedSurveyMapLayer[]>('/api/map/ol-layers');
        baseLayers = olLayers.map(buildBaseLayer).filter(Boolean);
        if (!baseLayers.length) baseLayers = [createOsmLayer()];
      } catch {
        showToast({ severity: 'error', message: tr.OlMap.layerFetchError });
        baseLayers = [createOsmLayer()];
      }

      if (cancelled || !mapRef.current) return;

      const map = new Map({
        target: mapRef.current,
        layers: baseLayers,
        interactions: defaultInteractions({ doubleClickZoom: false }),
        view: new View({
          center: [2780000, 9170000],
          zoom: 5,
        }),
      });

      mapInstance.current = map;
      onMapReady?.(map, baseLayers);
    }

    init();

    return () => {
      cancelled = true;
      // Important to clean up WebGL context
      mapInstance.current?.dispose();
      mapInstance.current?.setTarget(undefined);
      mapInstance.current = null;
    };
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}
