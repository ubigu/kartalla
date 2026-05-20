// @ts-strict-ignore
import {
  MapQuestionSelectionType,
  SurveyMapQuestion,
} from '@interfaces/survey';
import { colors } from '@src/themes/colors';
import { LineString, Point, Polygon } from 'geojson';
import {
  Dispatch,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import {
  MapLayer,
  SurveyMapContextProvider,
} from '../hooks/map/surveyMapProvider';
import { useTranslations } from './TranslationContext';

interface State {
  visibleLayers: (number | string)[];
  allLayers: (number | string)[];
  mapProvider: SurveyMapContextProvider | null;
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
  isInitialized: boolean;
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
      type: 'SET_MAP_PROVIDER';
      value: SurveyMapContextProvider | null;
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
      type: 'SET_IS_INITIALIZED';
      value: boolean;
    };

type Context = [State, Dispatch<Action>];

const stateDefaults: State = {
  visibleLayers: [],
  allLayers: [],
  mapProvider: null,
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
    primaryColor: colors.harmaa,
    primaryFillColor: `${colors.harmaa}d4`,
    secondaryColor: '#3e37bf',
    secondaryFillColor: 'rgba(62, 55, 191, 0.6)',
  },

  defaultView: null,
  isInitialized: false,
};

export const SurveyMapContext = createContext<Context>(null);

export function useAdminMap() {
  const context = useContext(SurveyMapContext);

  if (!context) {
    throw new Error('useSurveyMap must be used within the SurveyMapProvider');
  }

  const [state, dispatch] = context;

  function startDrawingDefaultView() {
    state.mapProvider.startDrawingDefaultView(state.defaultView, (geojson) =>
      dispatch({ type: 'SET_DEFAULT_VIEW', value: geojson }),
    );
  }

  function drawDefaultView(
    view: GeoJSON.FeatureCollection = state.defaultView,
  ) {
    if (!view) return;
    state.mapProvider.drawDefaultView(view);
  }

  function clearDefaultView() {
    dispatch({ type: 'SET_DEFAULT_VIEW', value: null });
    state.mapProvider.clearDefaultView((geojson) =>
      dispatch({ type: 'SET_DEFAULT_VIEW', value: geojson }),
    );
  }

  return {
    ...state,
    isMapReady: Boolean(state.isInitialized && state.mapProvider),
    startDrawingDefaultView,
    drawDefaultView,
    clearDefaultView,
    setMapProvider(provider: SurveyMapContextProvider | null) {
      dispatch({ type: 'SET_MAP_PROVIDER', value: provider });
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

  const isMapReady = Boolean(state.isInitialized && state.mapProvider);

  return {
    ...state,
    isMapReady,
    /**
     * Set visible layers
     * @param layers Visible layers
     */
    setVisibleLayers(layers: (number | string)[]) {
      dispatch({ type: 'SET_VISIBLE_LAYERS', layers });
    },
    /**
     * Set map provider (called by the map component when a provider connects)
     */
    setMapProvider(provider: SurveyMapContextProvider | null) {
      dispatch({ type: 'SET_MAP_PROVIDER', value: provider });
    },
    /**
     * Initializes the map instance:
     * - assigns a feature click handler (previous handlers should be automatically unregistered on unmount)
     * - Draws current answer geometries on the map (clears any previous)
     */
    initializeMap() {
      state.mapProvider.initializeMap(
        (questionId, index) =>
          dispatch({
            type: 'SET_EDITING_MAP_ANSWER',
            value: { questionId, index },
          }),
        (questionId, index) =>
          dispatch({
            type: 'SET_EDITING_MAP_ANSWER',
            value: { questionId, index },
          }),
        state.answerGeometries,
      );
    },
    /**
     * Enters the draw state and returns the geometry when user has finished drawing.
     * @param type Selection type (shape)
     * @param question Map question
     * @returns Drawn geometry
     */
    async draw(type: MapQuestionSelectionType, question: SurveyMapQuestion) {
      if (state.questionId) {
        state.mapProvider.stopDrawing();
      }

      // These events need to be delayed - otherwise there might be an extraneous feature click event from Oskari
      setTimeout(() => {
        dispatch({ type: 'SET_HELPER_TEXT', text: question.title[language] });
        dispatch({ type: 'SET_QUESTION_ID', value: question.id });
        dispatch({ type: 'SET_SELECTION_TYPE', value: type });
      }, 0);

      const geometry = await state.mapProvider.draw(type, question);

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
      state.mapProvider.stopDrawing();
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
      state.mapProvider.startModifying(state.answerGeometries);
    },
    /**
     * Stop modifying geometries.
     */
    stopModifying() {
      dispatch({ type: 'SET_MODIFYING', value: false });
      state.mapProvider.stopModifying(state.answerGeometries);
    },
    /**
     * Register a function listening to changes to geometries during modification.
     * @param questionId Which question's geometries to listen to?
     * @param callback Callback when geometries for given question ID have changed
     * @returns Function for unregistering the event handler
     */
    onModify<
      G extends Point | LineString | Polygon = Point | LineString | Polygon,
    >(questionId: number, callback: (features: GeoJSON.Feature<G>[]) => void) {
      return state.mapProvider.onModify<G>(questionId, callback);
    },
    /**
     * Update geometries shown on the map. If not modifying, the geometries will be redrawn.
     * The geometries will be stored in context for possible later modifications.
     * @param geometries Geometries
     */
    updateGeometries(geometries: GeoJSON.FeatureCollection) {
      dispatch({ type: 'SET_ANSWER_GEOMETRIES', value: geometries });
      if (state.modifying) {
        return;
      }
      state.mapProvider.drawAnswerGeometries(geometries);
    },
    /**
     * Zoom to geometries shown on the answer geometry layer.
     */
    zoomToAnswerGeometries() {
      state.mapProvider.zoomToAnswerGeometries();
    },
    /**
     * Center map to default view geometry.
     */
    centerToDefaultView(
      featureCollection: GeoJSON.FeatureCollection,
      style: object = {},
    ) {
      state.mapProvider.centerToDefaultView(featureCollection, style);
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
    async getAllLayers(): Promise<MapLayer[]> {
      if (!state.mapProvider) {
        return [];
      }
      return state.mapProvider.getAllLayers();
    },
    /**
     * Get current map position
     */
    async getMapPosition() {
      return state.mapProvider.getMapPosition();
    },
    /**
     * Move map to given position
     */
    moveMapTo(centerX: number, centerY: number, zoom: number) {
      state.mapProvider.moveMapTo(centerX, centerY, zoom);
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
    case 'SET_MAP_PROVIDER':
      return {
        ...state,
        mapProvider: action.value,
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
    case 'SET_IS_INITIALIZED':
      return {
        ...state,
        isInitialized: action.value,
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
   * Use useMemo here to avoid unnecessary rerenders
   * @see https://reactjs.org/docs/hooks-reference.html#usememo
   */
  const value = useMemo<Context>(() => [state, dispatch], [state]);

  /**
   * Initialization of allLayers and isInitialized once a map provider is set.
   */
  useEffect(() => {
    if (!state.mapProvider) {
      if (state.isInitialized) {
        dispatch({ type: 'SET_IS_INITIALIZED', value: false });
      }
      return;
    }

    let cancelled = false;
    state.mapProvider.getInitialLayers().then((layers) => {
      if (cancelled) return;
      dispatch({ type: 'SET_ALL_LAYERS', layers });
      dispatch({ type: 'SET_IS_INITIALIZED', value: true });
    });

    return () => {
      cancelled = true;
    };
  }, [state.mapProvider]);

  /**
   * Whenever changes are made to visible layers, update the visibility to state
   */
  useEffect(() => {
    if (!state.allLayers || !state.isInitialized || !state.mapProvider) {
      return;
    }

    state.mapProvider.updateLayerVisibility(
      state.allLayers,
      state.visibleLayers,
    );
  }, [
    state.isInitialized,
    state.allLayers,
    state.visibleLayers,
    state.mapProvider,
  ]);

  return (
    <SurveyMapContext.Provider value={value}>
      {children}
    </SurveyMapContext.Provider>
  );
}
