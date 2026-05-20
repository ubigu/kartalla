import { GeoJSONWithCRS } from '@interfaces/geojson';
import {
  MapQuestionSelectionType,
  SurveyMapQuestion,
} from '@interfaces/survey';
import { colors } from '@src/themes/colors';
import { Geometry, LineString, Point, Polygon } from 'geojson';
import { Channel, DrawingEventHandler } from 'oskari-rpc';
import parseCSSColor from 'parse-css-color';
import {
  Dispatch,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import {
  MapLayer,
  MapPosition,
  SurveyMapContextProvider,
} from '../hooks/map/surveyMapProvider';

interface OskariState {
  rpcChannel: Channel | null;
  oskariVersion: number | null;
}

type OskariAction =
  | { type: 'SET_RPC_CHANNEL'; rpcChannel: Channel | null }
  | { type: 'SET_OSKARI_VERSION'; value: number };

type OskariContextType = [OskariState, Dispatch<OskariAction>];

const oskariStateDefaults: OskariState = {
  rpcChannel: null,
  oskariVersion: null,
};

export const SurveyOskariMapContext = createContext<OskariContextType | null>(
  null,
);

const defaultViewLayer = 'defaultView';
const answerGeometryLayer = 'answers';
const modifyEventId = 'modify';

const defaultFeatureStyle = {
  stroke: {
    color: colors.harmaa,
    width: 6,
  },
  fill: {
    color: `${colors.harmaa}d4`,
  },
};

const adminFeatureStyle = {
  fill: { color: '#00000000' },
  stroke: { color: '#FF4747', lineDash: 6 },
};

function getFeatureStyle(
  selectionType: MapQuestionSelectionType,
  question: SurveyMapQuestion,
) {
  if (selectionType === 'point') {
    return defaultFeatureStyle;
  }
  const style = question.featureStyles?.[selectionType];
  if (!style) {
    return defaultFeatureStyle;
  }
  const parsedStrokeColor = parseCSSColor(style.strokeColor);
  const fillColor = parsedStrokeColor
    ? `rgba(${parsedStrokeColor.values.join(',')}, 0.3)`
    : defaultFeatureStyle.fill.color;
  return {
    stroke: {
      color: style.strokeColor || defaultFeatureStyle.stroke.color,
      width: 4,
      lineDash:
        style.strokeStyle === 'dashed'
          ? [30, 10]
          : style.strokeStyle === 'dotted'
            ? [0, 14]
            : null,
      lineCap: style.strokeStyle === 'dashed' ? 'butt' : 'round',
    },
    fill: {
      color: fillColor,
    },
  };
}

function reducer(state: OskariState, action: OskariAction): OskariState {
  switch (action.type) {
    case 'SET_RPC_CHANNEL':
      return { ...state, rpcChannel: action.rpcChannel };
    case 'SET_OSKARI_VERSION':
      return { ...state, oskariVersion: action.value };
    default:
      throw new Error('Invalid action type');
  }
}

export function SurveyOskariMapProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, oskariStateDefaults);
  const value = useMemo<OskariContextType>(() => [state, dispatch], [state]);
  return (
    <SurveyOskariMapContext.Provider value={value}>
      {children}
    </SurveyOskariMapContext.Provider>
  );
}

export function useSurveyOskariMap() {
  const context = useContext(SurveyOskariMapContext);
  if (!context) {
    throw new Error(
      'useSurveyOskariMap must be used within SurveyOskariMapProvider',
    );
  }
  const [state, dispatch] = context;

  const stateRef = useRef(state);
  stateRef.current = state;

  const activeDrawEventIdRef = useRef<string | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  const isReady = Boolean(state.rpcChannel);

  const provider = useMemo<SurveyMapContextProvider>(() => {
    function drawAnswerGeometries(geometries: GeoJSON.FeatureCollection) {
      const { rpcChannel, oskariVersion } = stateRef.current;
      rpcChannel?.postRequest('MapModulePlugin.RemoveFeaturesFromMapRequest', [
        null,
        null,
        answerGeometryLayer,
      ]);
      rpcChannel?.postRequest('MapModulePlugin.RemoveMarkersRequest', []);

      geometries.features.forEach((feature) => {
        if (['Polygon', 'LineString'].includes(feature.geometry.type)) {
          rpcChannel?.postRequest('MapModulePlugin.AddFeaturesToMapRequest', [
            { type: 'FeatureCollection', features: [feature] },
            {
              layerId: answerGeometryLayer,
              centerTo: false,
              clearPrevious: false,
              cursor: 'pointer',
              featureStyle: getFeatureStyle(
                feature.geometry.type === 'Polygon' ? 'area' : 'line',
                feature.properties?.question,
              ),
            },
          ] as any);
        } else {
          const customIcon =
            feature.properties?.targetIcon ||
            feature.properties?.question.featureStyles?.point?.markerIcon;
          rpcChannel?.postRequest('MapModulePlugin.AddMarkerRequest', [
            {
              x: (feature.geometry as any).coordinates[0],
              y: (feature.geometry as any).coordinates[1],
              shape: customIcon ? customIcon : 0,
              offsetX: 0,
              offsetY: 0,
              size:
                Boolean(customIcon) &&
                oskariVersion &&
                oskariVersion >= 270 &&
                oskariVersion < 290
                  ? 64
                  : 6,
            },
            `answer:${feature.properties?.question.id}:${
              feature.properties?.index
            }${
              feature.properties?.submissionId != null
                ? `:${feature.properties.submissionId}`
                : ''
            }`,
          ]);
        }
      });
    }

    const provider: SurveyMapContextProvider = {
      getInitialLayers() {
        return new Promise((resolve) => {
          const interval = setInterval(() => {
            stateRef.current.rpcChannel?.getCurrentState(({ mapfull }) => {
              const layers = mapfull.state.selectedLayers.map(
                (layer) => layer.id,
              );
              if (!layers.length) {
                return;
              }
              clearInterval(interval);
              resolve(layers);
            });
          }, 100);
        });
      },

      getAllLayers(): Promise<MapLayer[]> {
        return new Promise((resolve) => {
          stateRef.current.rpcChannel?.getAllLayers((layers) =>
            resolve(layers as MapLayer[]),
          );
        });
      },

      getMapPosition(): Promise<MapPosition> {
        return new Promise((resolve) => {
          stateRef.current.rpcChannel?.getMapPosition((pos) => resolve(pos));
        });
      },

      moveMapTo(centerX, centerY, zoom) {
        stateRef.current.rpcChannel?.postRequest('MapMoveRequest', [
          centerX,
          centerY,
          zoom,
        ]);
      },

      initializeMap(
        onFeatureClick: (questionId: number, index: number) => void,
        onMarkerClick: (questionId: number, index: number) => void,
        initialGeometries: GeoJSON.FeatureCollection,
      ) {
        stateRef.current.rpcChannel?.handleEvent('FeatureEvent', (event) => {
          if (event.operation !== 'click' || isDrawingRef.current) {
            return;
          }
          const featureCollection: GeoJSON.FeatureCollection<
            Geometry,
            { question: { id?: number }; index: number }
          > = event.features[0].geojson;
          const feature = featureCollection.features[0];
          const { question, index } = feature.properties;
          if (question.id) onFeatureClick(question.id, index);
        });

        stateRef.current.rpcChannel?.handleEvent(
          'MarkerClickEvent',
          (event) => {
            const [, questionId, index] = event.id.split(':').map(Number);
            onMarkerClick(questionId, index);
          },
        );

        drawAnswerGeometries(initialGeometries);
      },

      async draw(
        type: MapQuestionSelectionType,
        question: SurveyMapQuestion,
      ): Promise<
        GeoJSONWithCRS<GeoJSON.Feature<Point | LineString | Polygon>>
      > {
        const eventId = `map-answer:${question.id}:${type}`;
        activeDrawEventIdRef.current = eventId;
        isDrawingRef.current = true;

        const featureStyle =
          getFeatureStyle(type, question) ?? defaultFeatureStyle;

        stateRef.current.rpcChannel?.postRequest(
          'DrawTools.StartDrawingRequest',
          [
            eventId,
            type === 'point'
              ? 'Point'
              : type === 'line'
                ? 'LineString'
                : type === 'area'
                  ? 'Polygon'
                  : null,
            {
              allowMultipleDrawing: false,
              style: {
                draw: JSON.parse(JSON.stringify(featureStyle)),
                modify: JSON.parse(JSON.stringify(featureStyle)),
              },
            },
          ],
        );

        let handler: DrawingEventHandler | null = null;
        const geometry = await new Promise<
          GeoJSONWithCRS<GeoJSON.Feature<Point | LineString | Polygon>>
        >((resolve) => {
          handler = (event) => {
            const [, eventQuestionId, eventSelectionType] = event.id.split(':');
            if (
              !event.isFinished ||
              eventQuestionId !== String(question.id) ||
              (eventSelectionType && eventSelectionType !== type) ||
              !event.geojson.features.length
            ) {
              return;
            }
            resolve({
              ...event.geojson.features[0],
              crs: {
                type: 'name',
                properties: { name: event.geojson.crs },
              },
            });
          };
          stateRef.current.rpcChannel?.handleEvent('DrawingEvent', handler);
        });

        if (handler) {
          stateRef.current.rpcChannel?.unregisterEventHandler(
            'DrawingEvent',
            handler,
          );
        }
        isDrawingRef.current = false;
        stateRef.current.rpcChannel?.postRequest(
          'DrawTools.StopDrawingRequest',
          [eventId, false],
        );

        return geometry;
      },

      stopDrawing() {
        const eventId = activeDrawEventIdRef.current;
        activeDrawEventIdRef.current = null;
        isDrawingRef.current = false;
        if (!eventId) return;
        stateRef.current.rpcChannel?.postRequest(
          'DrawTools.StopDrawingRequest',
          [eventId, true],
        );
      },

      drawAnswerGeometries(geometries) {
        drawAnswerGeometries(geometries);
      },

      centerToDefaultView(featureCollection, style = {}) {
        stateRef.current.rpcChannel?.postRequest(
          'MapModulePlugin.RemoveFeaturesFromMapRequest',
          [null, null, defaultViewLayer],
        );
        stateRef.current.rpcChannel?.postRequest(
          'MapModulePlugin.AddFeaturesToMapRequest',
          [
            featureCollection,
            {
              centerTo: true,
              clearPrevious: true,
              layerId: defaultViewLayer,
              featureStyle: style,
            },
          ] as any,
        );
      },

      startModifying(answerGeometries) {
        const { rpcChannel } = stateRef.current;
        rpcChannel?.postRequest(
          'MapModulePlugin.RemoveFeaturesFromMapRequest',
          [null, null, answerGeometryLayer],
        );
        rpcChannel?.postRequest('MapModulePlugin.RemoveMarkersRequest', []);
        rpcChannel?.postRequest('DrawTools.StartDrawingRequest', [
          modifyEventId,
          'LineString',
          {
            drawControl: false,
            modifyControl: true,
            geojson: {
              ...answerGeometries,
              features: answerGeometries.features.map((feature) => ({
                ...feature,
                properties: {},
                id: `answer:${feature.properties?.question.id}:${feature.properties?.index}`,
              })),
            },
            style: {
              draw: JSON.parse(JSON.stringify(defaultFeatureStyle)),
              modify: JSON.parse(JSON.stringify(defaultFeatureStyle)),
            },
          },
        ]);
      },

      stopModifying(answerGeometries) {
        stateRef.current.rpcChannel?.postRequest(
          'DrawTools.StopDrawingRequest',
          [modifyEventId, true, false],
        );
        drawAnswerGeometries(answerGeometries);
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
        const handler: DrawingEventHandler = (event) => {
          if (event.id !== modifyEventId || !event.isFinished) {
            return;
          }
          const changedFeatures = event.geojson.features
            .map((feature) => {
              const [, fqId, index] = String(feature.id).split(':').map(Number);
              return {
                ...feature,
                crs: {
                  type: 'name',
                  properties: { name: event.geojson.crs },
                },
                properties: {
                  ...feature.properties,
                  questionId: fqId,
                  index,
                },
              };
            })
            .filter((feature) => feature.properties.questionId === questionId)
            .sort((a, b) => a.properties.index - b.properties.index);

          if (changedFeatures.length) {
            callback(changedFeatures as unknown as GeoJSON.Feature<G>[]);
          }
        };
        stateRef.current.rpcChannel?.handleEvent('DrawingEvent', handler);
        return () => {
          stateRef.current.rpcChannel?.unregisterEventHandler(
            'DrawingEvent',
            handler,
          );
        };
      },

      zoomToAnswerGeometries() {
        stateRef.current.rpcChannel?.postRequest(
          'MapModulePlugin.ZoomToFeaturesRequest',
          [{ layer: [answerGeometryLayer] }, {}],
        );
      },

      updateLayerVisibility(allLayers, visibleLayers) {
        allLayers.forEach((layerId) => {
          stateRef.current.rpcChannel?.postRequest(
            'MapModulePlugin.MapLayerVisibilityRequest',
            [layerId, visibleLayers?.includes?.(layerId) ?? false],
          );
        });
      },

      startDrawingDefaultView(currentDefaultView, onDefaultViewChange) {
        stateRef.current.rpcChannel?.postRequest(
          'DrawTools.StartDrawingRequest',
          [
            'DefaultViewSelection',
            'Box',
            {
              allowMultipleDrawing: 'single',
              style: {
                draw: {
                  fill: { color: '#00000000' },
                  stroke: { color: '#FF4747', lineDash: 6, width: 2 },
                },
                modify: {
                  fill: { color: '#00000000' },
                  stroke: { color: '#FF4747', lineDash: 6, width: 2 },
                },
              },
              modifyControl: false,
            },
          ],
        );

        const drawingHandler: DrawingEventHandler = (event) => {
          if (event.id === 'DefaultViewSelection' && currentDefaultView) {
            stateRef.current.rpcChannel?.postRequest(
              'MapModulePlugin.RemoveFeaturesFromMapRequest',
              [null, null, defaultViewLayer],
            );
          }
          if (event.id === 'DefaultViewSelection' && event.isFinished) {
            onDefaultViewChange(event.geojson);
          }
        };

        stateRef.current.rpcChannel?.handleEvent(
          'DrawingEvent',
          drawingHandler,
        );
      },

      drawDefaultView(defaultView) {
        if (!defaultView) return;
        stateRef.current.rpcChannel?.postRequest(
          'MapModulePlugin.AddFeaturesToMapRequest',
          [
            defaultView,
            {
              centerTo: true,
              clearPrevious: true,
              layerId: defaultViewLayer,
              featureStyle: adminFeatureStyle,
            },
          ] as any,
        );
      },

      clearDefaultView(onDefaultViewChange) {
        stateRef.current.rpcChannel?.postRequest(
          'DrawTools.StopDrawingRequest',
          ['DefaultViewSelection', true, true],
        );
        stateRef.current.rpcChannel?.postRequest(
          'MapModulePlugin.RemoveFeaturesFromMapRequest',
          [null, null, defaultViewLayer],
        );
        provider.startDrawingDefaultView(null, onDefaultViewChange);
      },
    };

    return provider;
  }, []);

  return {
    setRpcChannel(channel: Channel | null) {
      dispatch({ type: 'SET_RPC_CHANNEL', rpcChannel: channel });
      if (channel) {
        channel.getInfo((info) => {
          const version = Number(info.version.split('.').join(''));
          dispatch({ type: 'SET_OSKARI_VERSION', value: version });
        });
      }
    },
    provider,
    isReady,
  };
}
