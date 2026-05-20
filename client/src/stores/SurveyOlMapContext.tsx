import {
  extentFromFeatures,
  featuresFromGeoJSON,
} from '@src/components/map/openlayers/helpers';
import { LAYER_PROPERTY_KEYS } from '@src/components/map/openlayers/layers';
import { MapInteractionManager } from '@src/components/map/openlayers/mapInteractionManager';
import { request } from '@src/utils/request';
import Map from 'ol/Map';
import { toLonLat } from 'ol/proj';
import {
  Dispatch,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { useAnswerDraw } from '@src/hooks/map/ol/useAnswerDraw';
import { useAnswerGeometries } from '@src/hooks/map/ol/useAnswerGeometries';
import { useAnswerModify } from '@src/hooks/map/ol/useAnswerModify';
import { useAnswerSelect } from '@src/hooks/map/ol/useAnswerSelect';
import { useDefaultViewDraw } from '@src/hooks/map/ol/useDefaultViewDraw';
import {
  MapLayer,
  MapPosition,
  SurveyMapContextProvider,
} from '@src/hooks/map/surveyMapProvider';

interface OlState {
  map: Map | null;
}

type OlAction = { type: 'SET_MAP'; map: Map | null };

type OlContextType = [OlState, Dispatch<OlAction>];

const olStateDefaults: OlState = { map: null };

export const SurveyOlMapContext = createContext<OlContextType | null>(null);

function reducer(state: OlState, action: OlAction): OlState {
  switch (action.type) {
    case 'SET_MAP':
      return { ...state, map: action.map };
    default:
      throw new Error('Invalid action type');
  }
}

export function SurveyOlMapProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, olStateDefaults);
  const value = useMemo<OlContextType>(() => [state, dispatch], [state]);
  return (
    <SurveyOlMapContext.Provider value={value}>
      {children}
    </SurveyOlMapContext.Provider>
  );
}

const fitPadding = [50, 50, 50, 50];
const fitMaxZoom = 16;

export function useSurveyOlMap() {
  const context = useContext(SurveyOlMapContext);
  if (!context) {
    throw new Error('useSurveyOlMap must be used within SurveyOlMapProvider');
  }
  const [state, dispatch] = context;

  const mapRef = useRef<Map | null>(null);
  mapRef.current = state.map;

  const managerRef = useRef<MapInteractionManager | null>(null);
  if (state.map && !managerRef.current) {
    managerRef.current = new MapInteractionManager(state.map);
  } else if (!state.map) {
    managerRef.current = null;
  }

  const answerDraw = useAnswerDraw(mapRef, managerRef);
  const answerModify = useAnswerModify(mapRef, managerRef);
  const answerSelect = useAnswerSelect(mapRef, managerRef);
  const defaultViewDraw = useDefaultViewDraw(mapRef, managerRef);
  const answerGeometries = useAnswerGeometries(mapRef);

  const isReady = Boolean(state.map);

  async function fetchActiveLayers() {
    const availableLayers = (
      await request<MapLayer[]>('/api/map/ol-layers')
    ).map((layer) => ({ visible: true, ...layer }));
    const olLayerIds =
      mapRef.current
        ?.getLayers()
        .getArray()
        .map((l) => l.get(LAYER_PROPERTY_KEYS.layerId)) ?? [];
    return availableLayers.filter((layer) => olLayerIds.includes(layer.id));
  }

  const provider = useMemo<SurveyMapContextProvider>(() => {
    const provider: SurveyMapContextProvider = {
      async getInitialLayers() {
        return (await fetchActiveLayers()).map((layer) => layer.id);
      },

      async getAllLayers() {
        return fetchActiveLayers();
      },

      getMapPosition(): Promise<MapPosition> {
        const view = mapRef.current?.getView();
        const center = view?.getCenter() ?? [0, 0];
        const [centerX, centerY] = toLonLat(center);
        return Promise.resolve({ centerX, centerY, zoom: view?.getZoom() });
      },

      moveMapTo(centerX, centerY, zoom) {
        mapRef.current?.getView().animate({ center: [centerX, centerY], zoom });
      },

      initializeMap(onFeatureClick, onMarkerClick, initialGeometries) {
        answerGeometries.draw(initialGeometries);
        answerSelect.initialize(onFeatureClick, onMarkerClick);
        managerRef.current?.setMode('interactivePan');
      },

      draw(type, question) {
        return answerDraw.draw(type, question);
      },

      stopDrawing() {
        answerDraw.stop();
      },

      drawAnswerGeometries(geometries) {
        answerDraw.clear();
        answerGeometries.draw(geometries);
      },

      centerToDefaultView(featureCollection) {
        const view = mapRef.current?.getView();
        if (!view) return;
        const features = featuresFromGeoJSON(featureCollection);
        const extent = extentFromFeatures(features);
        if (!extent) return;
        view.fit(extent, { padding: fitPadding, maxZoom: fitMaxZoom });
      },

      startModifying() {
        answerModify.start();
      },

      stopModifying() {
        answerModify.stop();
      },

      onModify<
        G extends GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon =
          | GeoJSON.Point
          | GeoJSON.LineString
          | GeoJSON.Polygon,
      >(
        questionId: number,
        callback: (features: GeoJSON.Feature<G>[]) => void,
      ) {
        return answerModify.onModify<G>(questionId, callback);
      },

      zoomToAnswerGeometries() {
        // TODO
      },

      updateLayerVisibility() {
        // TODO
      },

      startDrawingDefaultView(currentDefaultView, onDefaultViewChange) {
        defaultViewDraw.startDrawing(currentDefaultView, onDefaultViewChange);
      },

      drawDefaultView(defaultView) {
        defaultViewDraw.drawDefaultView(defaultView, {
          padding: fitPadding,
          maxZoom: fitMaxZoom,
        });
      },

      clearDefaultView(onDefaultViewChange) {
        defaultViewDraw.clearView(onDefaultViewChange);
      },
    };

    return provider;
  }, []);

  return {
    setMap(map: Map | null) {
      dispatch({ type: 'SET_MAP', map });
    },
    provider,
    isReady,
  };
}
