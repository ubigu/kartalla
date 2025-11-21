import { GeoJSONWithCRS } from '@interfaces/geojson';
import {
  MapQuestionSelectionType,
  SurveyMapQuestion,
} from '@interfaces/survey';
import { harmaa } from '@src/themes/common';
import { LineString, Point, Polygon } from 'geojson';
import { Channel, DrawingEventHandler, Layer } from 'oskari-rpc';
import parseCSSColor from 'parse-css-color';
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { useTranslations } from './TranslationContext';

interface State {
  visibleLayers: (number | string)[];
  allLayers: (number | string)[];
  rpcChannel: Channel;
  helperText: string;
  selectionType: MapQuestionSelectionType;
  questionId: number;
  editingMapAnswer: {
    questionId: number;
    index: number;
  };
  answerGeometries: GeoJSON.FeatureCollection;
  modifying: boolean;
  mapFeatureColorScheme: {
    primaryColor: string;
    primaryFillColor: string;
    secondaryColor: string;
    secondaryFillColor: string;
  };

  defaultView: GeoJSON.FeatureCollection;
  oskariVersion: number;
}

type Action =
  | {
      type: 'SET_VISIBLE_LAYERS';
      layers: (number | string)[];
    }
  | {
      type: 'SET_ALL_LAYERS';
      layers: (number | string)[];
    }
  | {
      type: 'SET_RPC_CHANNEL';
      rpcChannel: Channel;
    }
  | {
      type: 'SET_HELPER_TEXT';
      text: string;
    }
  | {
      type: 'SET_SELECTION_TYPE';
      value: MapQuestionSelectionType;
    }
  | {
      type: 'SET_QUESTION_ID';
      value: number;
    }
  | {
      type: 'SET_EDITING_MAP_ANSWER';
      value: {
        questionId: number;
        index: number;
      };
    }
  | {
      type: 'SET_ANSWER_GEOMETRIES';
      value: GeoJSON.FeatureCollection;
    }
  | {
      type: 'SET_MODIFYING';
      value: boolean;
    }
  | {
      type: 'SET_DEFAULT_VIEW';
      value: GeoJSON.FeatureCollection;
    }
  | {
      type: 'SET_OSKARI_VERSION';
      value: number;
    };

type Context = [State, React.Dispatch<Action>];

const stateDefaults: State = {
  visibleLayers: null,
  allLayers: [],
  rpcChannel: null,
  helperText: null,
  selectionType: null,
  questionId: null,
  editingMapAnswer: null,
  answerGeometries: {
    type: 'FeatureCollection',
    features: [],
  },
  modifying: false,
  mapFeatureColorScheme: {
    primaryColor: harmaa,
    primaryFillColor: `${harmaa}d4`,
    secondaryColor: '#3e37bf',
    secondaryFillColor: 'rgba(62, 55, 191, 0.6)',
  },

  defaultView: null,
  oskariVersion: null,
};

/**
 * Context containing the state object and dispatch function.
 */
export const SurveyMapContext = createContext<Context>(null);

// Default view layer id
const defaultViewLayer = 'defaultView';

// Layer ID for answer geometries
const answerGeometryLayer = 'answers';

// Drawing ID for modifying existing geometries
const modifyEventId = 'modify';

// Default feature style
const defaultFeatureStyle = {
  stroke: {
    color: harmaa,
    width: 6,
  },
  fill: {
    color: `${harmaa}d4`,
  },
};

function getFeatureStyle(
  selectionType: MapQuestionSelectionType,
  question: SurveyMapQuestion,
) {
  // Use default style for points
  if (selectionType === 'point') {
    return defaultFeatureStyle;
  }
  // Get feature style from question
  const style = question.featureStyles?.[selectionType];
  // If no style is defined, use default
  if (!style) {
    return defaultFeatureStyle;
  }
  // Parse & calculate fill color with a fixed opacity from the stroke color
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

/**
 * Generates a unique ID for question and selection type combination.
 * If selection type is not specified, it will be omitted from the ID.
 * @param questionId Question ID
 * @param selectionType Selection type
 * @returns Drawing event ID, e.g. `'map-answer:123:line'`
 */
function getDrawingEventId(
  questionId: number,
  selectionType?: MapQuestionSelectionType,
) {
  return `map-answer:${questionId}${selectionType ? `:${selectionType}` : ''}`;
}

export function useAdminMap() {
  const context = useContext(SurveyMapContext);
  const featureStyle = {
    fill: { color: '#00000000' },
    stroke: { color: '#FF4747', lineDash: 6 },
  };

  if (!context) {
    throw new Error('useSurveyMap must be used within the SurveyMapProvider');
  }

  const [state, dispatch] = context;

  const isMapReady = useMemo(
    () => Boolean(state.rpcChannel),
    [state.rpcChannel],
  );

  function startDrawingRequest() {
    state.rpcChannel.postRequest('DrawTools.StartDrawingRequest', [
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
    ]);

    const drawingHandler: DrawingEventHandler = (event) => {
      if (event.id === 'DefaultViewSelection' && state.defaultView) {
        state.rpcChannel.postRequest(
          'MapModulePlugin.RemoveFeaturesFromMapRequest',
          [null, null, defaultViewLayer],
        );
      }
      if (event.id === 'DefaultViewSelection' && event.isFinished) {
        dispatch({
          type: 'SET_DEFAULT_VIEW',
          value: event.geojson,
        });
      }
    };

    state.rpcChannel.handleEvent('DrawingEvent', drawingHandler);
  }
  function drawDefaultView() {
    if (!state.defaultView) return;

    state.rpcChannel.postRequest('MapModulePlugin.AddFeaturesToMapRequest', [
      state.defaultView,
      {
        centerTo: true,
        clearPrevious: true,
        layerId: defaultViewLayer,
        featureStyle: featureStyle,
      },
    ] as any);
  }

  function clearView() {
    // Clear recent features
    state.rpcChannel.postRequest('DrawTools.StopDrawingRequest', [
      'DefaultViewSelection',
      true,
      true,
    ]);
    // Clear previously drawn features
    state.rpcChannel.postRequest(
      'MapModulePlugin.RemoveFeaturesFromMapRequest',
      [null, null, defaultViewLayer],
    );
    dispatch({
      type: 'SET_DEFAULT_VIEW',
      value: null,
    });
    startDrawingRequest();
  }

  return {
    ...state,
    isMapReady,
    startDrawingRequest,
    drawDefaultView,
    clearView,
    /**
     * Set RPC channel for controlling the map
     * @param rpcChannel
     */
    setRpcChannel(rpcChannel: Channel) {
      dispatch({ type: 'SET_RPC_CHANNEL', rpcChannel });
    },
    setDefaultView(viewGeometry: GeoJSON.FeatureCollection) {
      dispatch({ type: 'SET_DEFAULT_VIEW', value: viewGeometry });
    },
    setVisibleLayers(layers: (number | string)[]) {
      dispatch({ type: 'SET_VISIBLE_LAYERS', layers });
    },
  };
}

/**
 * Hook for accessing survey map context.
 * @returns State and survey map context functions
 */
export function useSurveyMap() {
  const context = useContext(SurveyMapContext);
  const { language } = useTranslations();

  if (!context) {
    throw new Error('useSurveyMap must be used within the SurveyMapProvider');
  }

  const [state, dispatch] = context;

  const drawingRef = useRef<boolean | null>(null);
  drawingRef.current = state.questionId != null;

  const isMapReady = useMemo(() => {
    state.rpcChannel?.getInfo((oskariInfo) => {
      const oskariVersion = Number(oskariInfo.version.split('.').join(''));
      dispatch({ type: 'SET_OSKARI_VERSION', value: oskariVersion });
    });

    return Boolean(state.rpcChannel);
  }, [state.rpcChannel]);

  /**
   * Draws given geometries as features onto the map
   * @param geometries
   */
  function drawAnswerGeometries(geometries: GeoJSON.FeatureCollection) {
    // Clear previous geometries
    state.rpcChannel.postRequest(
      'MapModulePlugin.RemoveFeaturesFromMapRequest',
      [null, null, answerGeometryLayer],
    );
    state.rpcChannel.postRequest('MapModulePlugin.RemoveMarkersRequest', []);
    // Add current features one by one to get the correct styles
    // For points: render as markers (for map questions and geo-budgeting)
    // For lines/polygons: render as features
    geometries.features.forEach((feature) => {
      if (['Polygon', 'LineString'].includes(feature.geometry.type)) {
        state.rpcChannel.postRequest(
          'MapModulePlugin.AddFeaturesToMapRequest',
          [
            {
              type: 'FeatureCollection',
              features: [feature],
            },
            {
              layerId: answerGeometryLayer,
              centerTo: false,
              clearPrevious: false,
              cursor: 'pointer',
              featureStyle: getFeatureStyle(
                feature.geometry.type === 'Polygon' ? 'area' : 'line',
                feature.properties.question,
              ),
            },
          ] as any,
        );
      } else {
        // Check for custom icon: geo-budgeting uses targetIcon, map questions use featureStyles
        const customIcon =
          feature.properties.targetIcon ||
          feature.properties.question.featureStyles?.point?.markerIcon;
        state.rpcChannel.postRequest('MapModulePlugin.AddMarkerRequest', [
          {
            x: (feature.geometry as any).coordinates[0],
            y: (feature.geometry as any).coordinates[1],
            shape: customIcon ? customIcon : 0,
            offsetX: 0,
            offsetY: 0,
            size:
              Boolean(customIcon) &&
              state.oskariVersion >= 270 &&
              state.oskariVersion < 290
                ? 64
                : 6,
          },
          `answer:${feature.properties.question.id}:${
            feature.properties.index
          }${
            feature.properties.submissionId != null
              ? `:${feature.properties.submissionId}`
              : ''
          }`,
        ]);
      }
    });
  }

  function centerToDefaultView(
    featureCollection: GeoJSON.FeatureCollection,
    style: object = {},
  ) {
    state.rpcChannel.postRequest(
      'MapModulePlugin.RemoveFeaturesFromMapRequest',
      [null, null, defaultViewLayer],
    );
    state.rpcChannel.postRequest('MapModulePlugin.AddFeaturesToMapRequest', [
      featureCollection,
      {
        centerTo: true,
        clearPrevious: true,
        layerId: defaultViewLayer,
        featureStyle: style,
      },
    ] as any);
  }

  return {
    ...state,
    isMapReady,
    centerToDefaultView,
    /**
     * Set visible layers
     * @param layers Visible layers
     */
    setVisibleLayers(layers: (number | string)[]) {
      dispatch({ type: 'SET_VISIBLE_LAYERS', layers });
    },
    /**
     * Set RPC channel for controlling the map
     * @param rpcChannel
     */
    setRpcChannel(rpcChannel: Channel) {
      dispatch({ type: 'SET_RPC_CHANNEL', rpcChannel });
    },
    /**
     * Initializes the map instance:
     * - assigns a feature click handler (previous handlers should be automatically unregistered on unmount)
     * - Draws current answer geometries on the map (clears any previous)
     */
    initializeMap() {
      // Set handler for clicking features
      state.rpcChannel.handleEvent('FeatureEvent', (event) => {
        if (event.operation !== 'click' || drawingRef.current) {
          return;
        }
        // TODO: tuleeko klikki-eventit läpi jos on drawing-mode päällä? eli voiko pitää muokkaus-moodia jatkuvasti kartalla (pl. uusien piirtomoodi)?
        // There should only be one feature collection
        const featureCollection: GeoJSON.FeatureCollection =
          event.features[0].geojson;
        // There should only be one feature
        const feature = featureCollection.features[0];
        // Pick answer data from feature properties
        const { question, index } = feature.properties;
        // Open editing dialog via context
        dispatch({
          type: 'SET_EDITING_MAP_ANSWER',
          value: { questionId: question?.id, index },
        });
      });

      state.rpcChannel.handleEvent('MarkerClickEvent', (event) => {
        const [, questionId, index] = event.id.split(':').map(Number);
        dispatch({
          type: 'SET_EDITING_MAP_ANSWER',
          value: { questionId, index },
        });
      });

      // Draw existing answer geometries onto the map
      drawAnswerGeometries(state.answerGeometries);
    },
    /**
     * Enters the draw state and returns the geometry when user has finished drawing.
     * @param type Selection type (shape)
     * @param question Map question
     * @returns Drawn geometry
     */
    async draw(type: MapQuestionSelectionType, question: SurveyMapQuestion) {
      // Stop any previous drawing if the map is in a draw state
      if (state.questionId) {
        state.rpcChannel.postRequest('DrawTools.StopDrawingRequest', [
          getDrawingEventId(state.questionId, state.selectionType),
          true,
        ]);
      }
      const eventId = getDrawingEventId(question.id, type);
      // These events need to be delayed - otherwise there might be an extraneous feature click event from Oskari
      setTimeout(() => {
        dispatch({ type: 'SET_HELPER_TEXT', text: question.title[language] });
        dispatch({ type: 'SET_QUESTION_ID', value: question.id });
        dispatch({ type: 'SET_SELECTION_TYPE', value: type });
      }, 0);

      const featureStyle =
        getFeatureStyle(type, question) ?? defaultFeatureStyle;
      // Start the new drawing
      state.rpcChannel.postRequest('DrawTools.StartDrawingRequest', [
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
            // Due to some buggy changes in https://github.com/mozilla/jschannel/pull/15 the recursive object check fails,
            // unless we do a deep copy of the style object.
            draw: JSON.parse(JSON.stringify(featureStyle)),
            modify: JSON.parse(JSON.stringify(featureStyle)),
          },
        },
      ]);

      // Wait for the matching finished drawing event
      let handler: DrawingEventHandler = null;
      const geometry = await new Promise<
        GeoJSONWithCRS<
          GeoJSON.Feature<GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon>
        >
      >((resolve) => {
        handler = (event) => {
          const [, eventQuestionId, eventSelectionType] = event.id.split(':');
          // Skip unfinished events and events for a different question and different selection type (if specified)
          if (
            !event.isFinished ||
            eventQuestionId !== String(question.id) ||
            (eventSelectionType && eventSelectionType !== type) ||
            !event.geojson.features.length
          ) {
            return;
          }
          // Resolve the geometry from the event
          resolve({
            ...event.geojson.features[0],
            crs: {
              type: 'name',
              properties: {
                name: event.geojson.crs,
              },
            },
          });
        };
        state.rpcChannel.handleEvent('DrawingEvent', handler);
      });

      // Drawing is now completed - unregister the event handler
      state.rpcChannel.unregisterEventHandler('DrawingEvent', handler);

      // Stop the drawing interaction
      state.rpcChannel.postRequest('DrawTools.StopDrawingRequest', [
        eventId,
        false,
      ]);

      dispatch({ type: 'SET_SELECTION_TYPE', value: null });
      dispatch({ type: 'SET_HELPER_TEXT', text: null });
      dispatch({ type: 'SET_QUESTION_ID', value: null });

      return geometry;
    },
    /**
     * Stops the drawing interaction on the map for given question ID (or the currently active question)
     * @param questionId Question ID (default: current question ID)
     */
    stopDrawing(questionId: number | null = state.questionId) {
      state.rpcChannel.postRequest('DrawTools.StopDrawingRequest', [
        questionId == null
          ? null
          : getDrawingEventId(questionId, state.selectionType),
        true,
      ]);
      // If stopping the current drawing (or there was none), clear the internal state
      if (!state.questionId || questionId === state.questionId) {
        dispatch({ type: 'SET_SELECTION_TYPE', value: null });
        dispatch({ type: 'SET_HELPER_TEXT', text: null });
        dispatch({ type: 'SET_QUESTION_ID', value: null });
      }
    },
    /**
     * Starts modifying existing geometries.
     */
    startModifying() {
      dispatch({ type: 'SET_MODIFYING', value: true });
      // Remove all static features from the map
      state.rpcChannel.postRequest(
        'MapModulePlugin.RemoveFeaturesFromMapRequest',
        [null, null, answerGeometryLayer],
      );
      state.rpcChannel.postRequest('MapModulePlugin.RemoveMarkersRequest', []);

      // TODO in modify mode, all feature styles will be replaced even when adding them one by one - so just use the default style in this case
      // Start modifying with currently stored answer geometries
      state.rpcChannel.postRequest('DrawTools.StartDrawingRequest', [
        modifyEventId,
        // This must have some valid value, but shouldnt matter a lot because we aren't drawing new shapes here
        'LineString',
        {
          drawControl: false,
          modifyControl: true,
          geojson: {
            ...state.answerGeometries,
            features: state.answerGeometries.features.map((feature) => ({
              ...feature,
              // Leave properties from modify mode to prevent passing recursive data structures
              properties: {},
              // Oskari overwrites GeoJSON properties when entering drawing mode - form an ID to keep the data available in drawing event handler
              id: `answer:${feature.properties.question.id}:${feature.properties.index}`,
            })),
          },
          style: {
            // Due to some buggy changes in https://github.com/mozilla/jschannel/pull/15 the recursive object check fails,
            // unless we do a deep copy of the style object.
            draw: JSON.parse(JSON.stringify(defaultFeatureStyle)),
            modify: JSON.parse(JSON.stringify(defaultFeatureStyle)),
          },
        },
      ]);
    },
    /**
     * Stop modifying geometries.
     */
    stopModifying() {
      dispatch({ type: 'SET_MODIFYING', value: false });
      // Stop the drawing
      state.rpcChannel.postRequest('DrawTools.StopDrawingRequest', [
        modifyEventId,
        true,
        false,
      ]);
      // Draw stored answer geometries to map as static features
      drawAnswerGeometries(state.answerGeometries);
    },
    /**
     * Register a function listening to changes to geometries during modification.
     * @param questionId Which question's geometries to listen to?
     * @param callback Callback when geometries for given question ID have changed
     * @returns Function for unregistering the event handler
     */
    onModify(
      questionId: number,
      callback: (
        features: GeoJSON.Feature<Point | LineString | Polygon>[],
      ) => void,
    ) {
      // Create a handler for any modification DrawingEvents
      const handler: DrawingEventHandler = (event) => {
        if (event.id !== modifyEventId || !event.isFinished) {
          return;
        }
        const changedFeatures = event.geojson.features
          // Destructure the question ID and index from feature ID and store them in properties
          .map((feature) => {
            const [, questionId, index] = String(feature.id)
              .split(':')
              .map(Number);
            return {
              ...feature,
              crs: {
                type: 'name',
                properties: {
                  name: event.geojson.crs,
                },
              },
              properties: {
                ...feature.properties,
                questionId,
                index,
              },
            };
          })
          // Filter out all features of other questions
          .filter((feature) => feature.properties.questionId === questionId)
          // Sort the features by index for assigning the changed features to correct slots
          .sort((a, b) => a.properties.index - b.properties.index);

        // Only invoke the callback if there were changed features for the given question ID
        if (changedFeatures.length) {
          callback(changedFeatures);
        }
      };
      state.rpcChannel.handleEvent('DrawingEvent', handler);

      // Return a function for unregistering the event handler after leaving the page
      return () => {
        state.rpcChannel.unregisterEventHandler('DrawingEvent', handler);
      };
    },
    /**
     * Update geometries shown on the map. If not modifying, the geometries will be redrawn.
     * The geometries will be stored in context for possible later modifications.
     * @param geometries Geometries
     */
    updateGeometries(geometries: GeoJSON.FeatureCollection) {
      dispatch({ type: 'SET_ANSWER_GEOMETRIES', value: geometries });
      // Only update geometries to state if still modifying
      if (state.modifying) {
        return;
      }
      state.rpcChannel.postRequest(
        'MapModulePlugin.RemoveFeaturesFromMapRequest',
        [null, null, answerGeometryLayer],
      );
      drawAnswerGeometries(geometries);
    },
    /**
     * Zoom to geometries shown on the answer geometry layer.
     */
    zoomToAnswerGeometries() {
      state.rpcChannel.postRequest('MapModulePlugin.ZoomToFeaturesRequest', [
        { layer: [answerGeometryLayer] },
        {},
      ]);
    },
    /**
     * Stop editing a map answer in dialog
     */
    stopEditingMapAnswer() {
      dispatch({ type: 'SET_EDITING_MAP_ANSWER', value: null });
    },
    /**
     * Is map currently in drawing state
     */
    get drawing() {
      return state.questionId !== null;
    },
    /**
     * Get all current layers
     * @returns
     */
    async getAllLayers() {
      if (!state.rpcChannel) {
        return [];
      }
      return new Promise<Layer[]>((resolve) => {
        state.rpcChannel.getAllLayers((layers) => resolve(layers));
      });
    },
  };
}

/**
 * Reducer for SurveyMapContext state.
 * @param state Previous state
 * @param action Dispatched action
 * @returns New state
 */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_VISIBLE_LAYERS':
      return {
        ...state,
        visibleLayers: action.layers,
      };
    case 'SET_ALL_LAYERS':
      return {
        ...state,
        allLayers: action.layers,
      };
    case 'SET_RPC_CHANNEL':
      return {
        ...state,
        rpcChannel: action.rpcChannel,
      };
    case 'SET_HELPER_TEXT':
      return {
        ...state,
        helperText: action.text,
      };
    case 'SET_SELECTION_TYPE':
      return {
        ...state,
        selectionType: action.value,
      };
    case 'SET_QUESTION_ID':
      return {
        ...state,
        questionId: action.value,
      };
    case 'SET_EDITING_MAP_ANSWER':
      return {
        ...state,
        editingMapAnswer: action.value,
      };
    case 'SET_ANSWER_GEOMETRIES':
      return {
        ...state,
        answerGeometries: action.value,
      };
    case 'SET_MODIFYING':
      return {
        ...state,
        modifying: action.value,
      };

    case 'SET_DEFAULT_VIEW':
      return {
        ...state,
        defaultView: action.value,
      };
    case 'SET_OSKARI_VERSION':
      return {
        ...state,
        oskariVersion: action.value,
      };
    default:
      throw new Error('Invalid action type');
  }
}

/**
 * Provider component for SurveyMapContext.
 */
export default function SurveyMapProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, stateDefaults);
  /**
   * Use React.useMemo here to avoid unnecessary rerenders
   * @see https://reactjs.org/docs/hooks-reference.html#usememo
   */
  const value = useMemo<Context>(() => [state, dispatch], [state]);

  /**
   * Initialization of the map once RPC channel is created
   */
  useEffect(() => {
    if (!state.rpcChannel) {
      return;
    }

    state.rpcChannel.getAllLayers((allLayers) => {
      const layers = allLayers.map((layer) => layer.id);
      dispatch({ type: 'SET_ALL_LAYERS', layers });
      // Set all layers to be visible by default, unless there already are visible layers declared
      dispatch({
        type: 'SET_VISIBLE_LAYERS',
        layers: state.visibleLayers ?? layers,
      });
    });
  }, [state.rpcChannel]);

  /**
   * Whenever changes are made to visible layers, update the visibility to state
   */
  useEffect(() => {
    if (!state.allLayers || !state.rpcChannel) {
      return;
    }
    state.allLayers.forEach((layerId) => {
      // Update visibility for each layer - only show it if current page has that layer visible
      state.rpcChannel.postRequest(
        'MapModulePlugin.MapLayerVisibilityRequest',
        [layerId, state.visibleLayers?.includes?.(layerId) ?? false],
      );
    });
  }, [state.rpcChannel, state.allLayers, state.visibleLayers]);

  return (
    <SurveyMapContext.Provider value={value}>
      {children}
    </SurveyMapContext.Provider>
  );
}
