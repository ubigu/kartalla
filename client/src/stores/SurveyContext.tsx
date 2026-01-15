import {
  MapLayer,
  Survey,
  SurveyFollowUpSection,
  SurveyPage,
  SurveyPageSection,
} from '@interfaces/survey';
import { getSurvey, updateSurvey } from '@src/controllers/SurveyController';
import { request } from '@src/utils/request';
import { useDebounce } from '@src/utils/useDebounce';
import {
  Dispatch,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

/**
 * Context state type
 */
interface State {
  originalActiveSurvey: Survey;
  activeSurvey: Survey;
  activeSurveyLoading: boolean;
  newPageLoading: boolean;
  availableMapLayersLoading: boolean;
  availableMapLayers: MapLayer[];
  availableMapLayersError: string;
}

/** Replace the language parameter in the map URL (like fi or fi_FI) with specific language codes. */
export function getLocalizedMapUrls(mapUrl: string) {
  return {
    fi: mapUrl?.replace(/(&)?lang=\w\w(_\w\w)?/, '').concat('&lang=fi') ?? '',
    se: mapUrl?.replace(/(&)?lang=\w\w(_\w\w)?/, '').concat('&lang=sv') ?? '',
    en: mapUrl?.replace(/(&)?lang=\w\w(_\w\w)?/, '').concat('&lang=en') ?? '',
  };
}

/**
 * Action type
 */
type Action =
  | {
      type: 'SET_ACTIVE_SURVEY';
      survey: Survey;
    }
  | {
      type: 'START_LOADING_ACTIVE_SURVEY';
    }
  | {
      type: 'STOP_LOADING_ACTIVE_SURVEY';
    }
  | {
      type: 'EDIT_SURVEY';
      survey: Survey;
    }
  | {
      type: 'SET_PAGES';
      pages: SurveyPage[];
    }
  | {
      type: 'ADD_PAGE';
      page: SurveyPage;
    }
  | {
      type: 'START_LOADING_NEW_PAGE';
    }
  | {
      type: 'STOP_LOADING_NEW_PAGE';
    }
  | {
      type: 'EDIT_PAGE';
      page: SurveyPage;
    }
  | {
      type: 'DELETE_PAGE';
      pageId: number;
    }
  | {
      type: 'SET_SECTIONS';
      pageId: number;
      sections: SurveyPageSection[];
    }
  | {
      type: 'SET_FOLLOW_UP_SECTIONS';
      pageId: number;
      parentSectionId: number;
      followUpSections: SurveyFollowUpSection[];
    }
  | {
      type: 'ADD_SECTION';
      pageId: number;
      section: SurveyPageSection;
    }
  | {
      type: 'ADD_FOLLOW_UP_SECTION';
      pageId: number;
      parentSectionId: number;
      section: SurveyFollowUpSection;
    }
  | {
      type: 'EDIT_SECTION';
      pageId: number;
      sectionIndex: number;
      section: SurveyPageSection;
    }
  | {
      type: 'EDIT_FOLLOW_UP_SECTION';
      pageId: number;
      parentSectionId: number;
      section: SurveyFollowUpSection | SurveyPageSection;
    }
  | {
      type: 'DELETE_SECTION';
      pageId: number;
      sectionIndex: number;
    }
  | {
      type: 'DELETE_FOLLOW_UP_SECTION';
      pageId: number;
      parentSectionId: number;
      followUpSectionId: number;
    }
  | {
      type: 'SET_AVAILABLE_MAP_LAYERS';
      layers: MapLayer[];
    }
  | {
      type: 'SET_AVAILABLE_MAP_LAYERS_ERROR';
      error: string;
    }
  | {
      type: 'START_LOADING_AVAILABLE_MAP_LAYERS';
    }
  | {
      type: 'STOP_LOADING_AVAILABLE_MAP_LAYERS';
    };

/**
 * Context type
 */
type Context = [State, Dispatch<Action>];

/**
 * State default values
 */
const stateDefaults: State = {
  originalActiveSurvey: null,
  activeSurvey: null,
  activeSurveyLoading: true,
  newPageLoading: false,
  availableMapLayersLoading: false,
  availableMapLayers: [],
  availableMapLayersError: null,
};

/**
 * Context containing the state object and dispatch function.
 */
export const SurveyContext = createContext<Context>(null);

/**
 * Set of validation rules.
 * Add any new validation rules here.
 * - Key = validation rule key
 * - Value = validation function (returns boolean)
 */
const validationMap = {
  'survey.name': (survey: Survey) => {
    return (
      survey.name && survey.name.length > 0 && /^[a-z0-9-_]+$/.test(survey.name)
    );
  },
  'survey.author': (survey: Survey) =>
    survey.author && survey.author.length > 0,
  'survey.title': (survey: Survey) =>
    survey.title && survey.title['fi'].length > 0,
  'survey.mapUrl': (survey: Survey, state: State) =>
    !survey.mapUrl || !state.availableMapLayersError,
};

/**
 * Hook for accessing survey context.
 * @returns State and survey context functions
 */
export function useSurvey() {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error('useSurvey must be used within the SurveyProvider');
  }

  const [state, dispatch] = context;

  const hasActiveSurveyChanged = useMemo(() => {
    // For now just comparing the stringified objects is working fine - add more complex logic here when needed
    return (
      JSON.stringify(state.activeSurvey) !==
      JSON.stringify(state.originalActiveSurvey)
    );
  }, [state.activeSurvey, state.originalActiveSurvey]);

  const validationErrors = useMemo(() => {
    if (!state.activeSurvey) {
      return null;
    }
    return Object.keys(validationMap)
      .map((key: keyof typeof validationMap) => {
        // Execute validation function for each key - if returns false, add the key to errors
        return validationMap[key](state.activeSurvey, state) ? null : key;
      })
      .filter(Boolean);
  }, [
    state.activeSurvey,
    state.availableMapLayers,
    state.availableMapLayersLoading,
  ]);

  return {
    ...state,
    hasActiveSurveyChanged,
    /**
     * Validation errors for survey fields.
     */
    validationErrors,
    /**
     * Creates a new page for the active survey.
     */
    async createPage() {
      dispatch({ type: 'START_LOADING_NEW_PAGE' });
      dispatch({ type: 'START_LOADING_ACTIVE_SURVEY' });
      try {
        const page = await request<SurveyPage>(
          `/api/surveys/${state.activeSurvey.id}/page`,
          {
            method: 'POST',
            body: {
              // Set all map layers visible by default
              mapLayers: state.availableMapLayers.map((layer) => layer.id),
            } as Partial<SurveyPage>,
          },
        );
        dispatch({
          type: 'ADD_PAGE',
          page,
        });
        dispatch({ type: 'STOP_LOADING_NEW_PAGE' });
        dispatch({ type: 'STOP_LOADING_ACTIVE_SURVEY' });
        return page;
      } catch (error) {
        dispatch({ type: 'STOP_LOADING_NEW_PAGE' });
        dispatch({ type: 'STOP_LOADING_ACTIVE_SURVEY' });
        throw error;
      }
    },
    /**
     * Fetches survey by given ID to context as the active survey.
     * @param id
     */
    async fetchSurveyToContext(id: number) {
      dispatch({
        type: 'START_LOADING_ACTIVE_SURVEY',
      });

      try {
        const survey = await getSurvey(id);
        dispatch({
          type: 'SET_ACTIVE_SURVEY',
          survey,
        });
        dispatch({
          type: 'STOP_LOADING_ACTIVE_SURVEY',
        });
      } catch (error) {
        dispatch({
          type: 'STOP_LOADING_ACTIVE_SURVEY',
        });
        throw error;
      }
    },
    /**
     * Edits survey data.
     * @param survey Survey
     */
    editSurvey(survey: Survey) {
      dispatch({ type: 'EDIT_SURVEY', survey });
    },
    /**
     * Edits page data.
     * @param page Page
     */
    editPage(page: SurveyPage) {
      dispatch({ type: 'EDIT_PAGE', page });
    },
    /**
     * Deletes page with given ID.
     * @param pageId Page ID
     */
    async deletePage(surveyId: number, pageId: number) {
      dispatch({
        type: 'START_LOADING_ACTIVE_SURVEY',
      });
      try {
        await request(`/api/surveys/${surveyId}/page/${pageId}`, {
          method: 'DELETE',
        });
        dispatch({ type: 'DELETE_PAGE', pageId });
        dispatch({
          type: 'STOP_LOADING_ACTIVE_SURVEY',
        });
      } catch (error) {
        dispatch({
          type: 'STOP_LOADING_ACTIVE_SURVEY',
        });
        throw error;
      }
    },
    /**
     * Move a page into a new index.
     * @param pageId
     * @param index
     */
    movePage(pageId: number, index: number) {
      let movedPage = state.activeSurvey.pages.find(
        (page) => page.id === pageId,
      );

      let otherPages = state.activeSurvey.pages.filter(
        (page) => page.id !== pageId,
      );

      if (index === 0 || index === state.activeSurvey?.pages?.length - 1) {
        // First and last pages cannot have conditions
        movedPage = { ...movedPage, conditions: {} };
      } else {
        // Clear first and last page conditions
        otherPages = otherPages.map((page, index) =>
          index === 0 || index === otherPages.length - 1
            ? { ...page, conditions: {} }
            : page,
        );
        // A page can only have conditions based on previous pages sections
        const previousSectionIds = otherPages
          .slice(0, index)
          .map((page) => page.sections)
          .flat(1)
          .map((section) => section.id);
        movedPage = {
          ...movedPage,
          conditions: Object.fromEntries(
            Object.entries(movedPage.conditions).filter(([sectionId]) =>
              previousSectionIds.includes(Number(sectionId)),
            ),
          ),
        };
      }

      const movedPageSectionIds = movedPage.sections.map(
        (section) => section.id,
      );
      // Go through all pages which are before the moved page in the survey and filter out conditions based on the moved page
      const pagesBefore = otherPages.slice(0, index).map((page) => ({
        ...page,
        conditions: Object.fromEntries(
          Object.entries(page.conditions).filter(
            ([sectionId]) => !movedPageSectionIds.includes(Number(sectionId)),
          ),
        ),
      }));
      const pagesAfter = otherPages.slice(index);

      dispatch({
        type: 'SET_PAGES',
        pages: [...pagesBefore, movedPage, ...pagesAfter],
      });
    },
    /**
     * Adds a new section for a page.
     * @param pageId Page ID
     * @param section Section contents
     */
    addSection(pageId: number, section: SurveyPageSection) {
      dispatch({ type: 'ADD_SECTION', pageId, section });
    },
    addFollowUpSection(
      pageId: number,
      parentSectionId: number,
      section: SurveyFollowUpSection,
    ) {
      dispatch({
        type: 'ADD_FOLLOW_UP_SECTION',
        pageId,
        parentSectionId,
        section,
      });
    },
    /**
     * Edits an existing section of a given page.
     * @param pageId Page ID
     * @param sectionIndex Section index
     * @param section Section contents
     */
    editSection(
      pageId: number,
      sectionIndex: number,
      section: SurveyPageSection,
    ) {
      dispatch({ type: 'EDIT_SECTION', pageId, sectionIndex, section });
    },
    editFollowUpSection(
      pageId: number,
      parentSectionId: number,
      section: SurveyFollowUpSection | SurveyPageSection,
    ) {
      dispatch({
        type: 'EDIT_FOLLOW_UP_SECTION',
        pageId,
        parentSectionId,
        section,
      });
    },
    /**
     * Deletes section with given section index and page ID
     * @param pageId
     * @param sectionIndex
     */
    deleteSection(pageId: number, sectionIndex: number) {
      dispatch({ type: 'DELETE_SECTION', pageId, sectionIndex });
    },
    deleteFollowUpSection(
      pageId: number,
      parentSectionId: number,
      followUpSectionId: number,
    ) {
      dispatch({
        type: 'DELETE_FOLLOW_UP_SECTION',
        pageId,
        parentSectionId,
        followUpSectionId,
      });
    },
    /**
     * Move a section into a new index.
     * @param pageId
     * @param oldIndex
     * @param newIndex
     */
    moveSection(pageId: number, oldIndex: number, newIndex: number) {
      const page = state.activeSurvey.pages.find((page) => page.id === pageId);
      const section = page.sections[oldIndex];
      const otherSections = page.sections.filter(
        (_, index) => index !== oldIndex,
      );
      dispatch({
        type: 'SET_SECTIONS',
        pageId,
        sections: [
          ...otherSections.slice(0, newIndex),
          section,
          ...otherSections.slice(newIndex),
        ],
      });
    },
    moveFollowUpSection(
      pageId: number,
      parentSectionId: number,
      oldIndex: number,
      newIndex: number,
    ) {
      const page = state.activeSurvey.pages.find((page) => page.id === pageId);

      const parentSection = page.sections.find(
        (sect) => sect.id === parentSectionId,
      );

      const followUpSection = parentSection.followUpSections[oldIndex];
      const otherSections = parentSection.followUpSections.filter(
        (_, index) => index !== oldIndex,
      );

      dispatch({
        type: 'SET_FOLLOW_UP_SECTIONS',
        pageId,
        parentSectionId,
        followUpSections: [
          ...otherSections.slice(0, newIndex),
          followUpSection,
          ...otherSections.slice(newIndex),
        ],
      });
    },
    /**
     * Saves changes to the active survey
     */
    async saveChanges() {
      dispatch({ type: 'START_LOADING_ACTIVE_SURVEY' });
      try {
        const survey = await updateSurvey(
          state.activeSurvey.id,
          state.activeSurvey,
        );
        dispatch({
          type: 'SET_ACTIVE_SURVEY',
          survey,
        });
        dispatch({ type: 'STOP_LOADING_ACTIVE_SURVEY' });
      } catch (error) {
        dispatch({ type: 'STOP_LOADING_ACTIVE_SURVEY' });
        throw error;
      }
    },
    /**
     * Discards all changes to currently active survey.
     */
    discardChanges() {
      dispatch({
        type: 'SET_ACTIVE_SURVEY',
        survey: { ...state.originalActiveSurvey },
      });
    },
    /**
     * Deletes currently active survey.
     */
    async deleteActiveSurvey() {
      dispatch({ type: 'START_LOADING_ACTIVE_SURVEY' });
      try {
        await request(`/api/surveys/${state.activeSurvey.id}`, {
          method: 'DELETE',
        });
        dispatch({ type: 'STOP_LOADING_ACTIVE_SURVEY' });
      } catch (error) {
        dispatch({ type: 'STOP_LOADING_ACTIVE_SURVEY' });
        throw error;
      }
    },
  };
}

/**
 * Reducer for SurveyContext state.
 * @param state Previous state
 * @param action Dispatched action
 * @returns New state
 */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ACTIVE_SURVEY':
      return {
        ...state,
        activeSurvey: {
          ...action.survey,
          localizedMapUrls:
            action.survey.localizedMapUrls ??
            getLocalizedMapUrls(action.survey.mapUrl),
        },
        originalActiveSurvey: structuredClone(action.survey),
      };
    case 'START_LOADING_ACTIVE_SURVEY':
      return {
        ...state,
        activeSurveyLoading: true,
      };
    case 'STOP_LOADING_ACTIVE_SURVEY':
      return {
        ...state,
        activeSurveyLoading: false,
      };
    case 'ADD_PAGE':
      return {
        ...state,
        activeSurvey: {
          ...state.activeSurvey,
          pages: [...state.activeSurvey.pages, action.page],
        },
        // Reflect the change to the original survey - the change was already made server-side
        originalActiveSurvey: {
          ...state.originalActiveSurvey,
          pages: [...state.originalActiveSurvey.pages, action.page],
        },
      };
    case 'START_LOADING_NEW_PAGE':
      return {
        ...state,
        newPageLoading: true,
      };
    case 'STOP_LOADING_NEW_PAGE':
      return {
        ...state,
        newPageLoading: false,
      };
    case 'EDIT_SURVEY':
      return {
        ...state,
        activeSurvey: {
          ...action.survey,
          localizedMapUrls: getLocalizedMapUrls(action.survey.mapUrl),
          // Don't modify pages via this action
          pages: state.activeSurvey.pages,
        },
      };
    case 'SET_PAGES':
      return {
        ...state,
        activeSurvey: {
          ...state.activeSurvey,
          pages: action.pages,
        },
      };
    case 'EDIT_PAGE':
      return {
        ...state,
        activeSurvey: {
          ...state.activeSurvey,
          pages: state.activeSurvey.pages.map((page) =>
            action.page.id === page.id ? { ...action.page } : page,
          ),
        },
      };
    case 'DELETE_PAGE':
      return {
        ...state,
        activeSurvey: {
          ...state.activeSurvey,
          pages: state.activeSurvey.pages.filter(
            (page) => action.pageId !== page.id,
          ),
        },
        // Reflect the change to the original survey - the change was already made server-side
        originalActiveSurvey: {
          ...state.originalActiveSurvey,
          pages: state.originalActiveSurvey.pages.filter(
            (page) => action.pageId !== page.id,
          ),
        },
      };
    case 'SET_SECTIONS':
      return {
        ...state,
        activeSurvey: {
          ...state.activeSurvey,
          pages: state.activeSurvey.pages.map((page) =>
            action.pageId === page.id
              ? { ...page, sections: action.sections }
              : page,
          ),
        },
      };
    case 'SET_FOLLOW_UP_SECTIONS':
      return {
        ...state,
        activeSurvey: {
          ...state.activeSurvey,
          pages: state.activeSurvey.pages.map((page) =>
            action.pageId === page.id
              ? {
                  ...page,
                  sections: page.sections.map((sect) => ({
                    ...sect,
                    followUpSections:
                      sect.id === action.parentSectionId
                        ? action.followUpSections
                        : sect.followUpSections,
                  })),
                }
              : page,
          ),
        },
      };
    case 'ADD_SECTION':
      return {
        ...state,
        activeSurvey: {
          ...state.activeSurvey,
          pages: state.activeSurvey.pages.map((page) =>
            action.pageId === page.id
              ? {
                  ...page,
                  sections: [...page.sections, action.section],
                }
              : page,
          ),
        },
      };
    case 'ADD_FOLLOW_UP_SECTION':
      return {
        ...state,
        activeSurvey: {
          ...state.activeSurvey,
          pages: state.activeSurvey.pages.map((page) =>
            action.pageId === page.id
              ? {
                  ...page,
                  sections: page.sections.map((sect) =>
                    sect.id === action.parentSectionId
                      ? {
                          ...sect,
                          followUpSections: sect?.followUpSections
                            ? [...sect.followUpSections, action.section]
                            : [action.section],
                        }
                      : sect,
                  ),
                }
              : page,
          ),
        },
      };
    case 'EDIT_SECTION':
      return {
        ...state,
        activeSurvey: {
          ...state.activeSurvey,
          pages: state.activeSurvey.pages.map((page) =>
            action.pageId === page.id
              ? {
                  ...page,
                  sections: page.sections.map((section, index) =>
                    index === action.sectionIndex
                      ? {
                          ...action.section,
                        }
                      : section,
                  ),
                }
              : page,
          ),
        },
      };
    case 'EDIT_FOLLOW_UP_SECTION':
      return {
        ...state,
        activeSurvey: {
          ...state.activeSurvey,
          pages: state.activeSurvey.pages.map((page) =>
            action.pageId === page.id
              ? {
                  ...page,
                  sections: page.sections.map((sect) =>
                    sect.id === action.parentSectionId
                      ? {
                          ...sect,
                          followUpSections: sect.followUpSections.map(
                            (followUpSection) =>
                              followUpSection.id === action.section.id
                                ? { ...followUpSection, ...action.section }
                                : followUpSection,
                          ),
                        }
                      : sect,
                  ),
                }
              : page,
          ),
        },
      };
    case 'DELETE_SECTION':
      return {
        ...state,
        activeSurvey: {
          ...state.activeSurvey,
          pages: state.activeSurvey.pages.map((page) =>
            action.pageId === page.id
              ? {
                  ...page,
                  sections: page.sections.filter(
                    (_, index) => index !== action.sectionIndex,
                  ),
                }
              : page,
          ),
        },
      };
    case 'DELETE_FOLLOW_UP_SECTION':
      return {
        ...state,
        activeSurvey: {
          ...state.activeSurvey,
          pages: state.activeSurvey.pages.map((page) =>
            action.pageId === page.id
              ? {
                  ...page,
                  sections: page.sections.map((section) =>
                    action.parentSectionId === section.id
                      ? {
                          ...section,
                          followUpSections: section.followUpSections.filter(
                            (sect) => action.followUpSectionId !== sect.id,
                          ),
                        }
                      : section,
                  ),
                }
              : page,
          ),
        },
      };
    case 'SET_AVAILABLE_MAP_LAYERS':
      return {
        ...state,
        availableMapLayers: action.layers,
      };
    case 'START_LOADING_AVAILABLE_MAP_LAYERS':
      return {
        ...state,
        availableMapLayersLoading: true,
      };
    case 'STOP_LOADING_AVAILABLE_MAP_LAYERS':
      return {
        ...state,
        availableMapLayersLoading: false,
      };
    case 'SET_AVAILABLE_MAP_LAYERS_ERROR':
      return {
        ...state,
        availableMapLayersError: action.error,
      };
    default:
      throw new Error('Invalid action type');
  }
}

/**
 * Provider component for SurveyContext.
 */
export default function SurveyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, stateDefaults);
  /**
   * Use useMemo here to avoid unnecessary rerenders
   * @see https://reactjs.org/docs/hooks-reference.html#usememo
   */
  const value = useMemo<Context>(() => [state, dispatch], [state]);

  const debouncedmapUrl = useDebounce(state.activeSurvey?.mapUrl, 1000);

  /**
   * Start "loading" as soon as the URL is changed (even though it's still actually debouncing)
   */
  useEffect(() => {
    // Is the URL non-empty and has it actually changed from previous one?
    if (
      state.activeSurvey?.mapUrl &&
      state.activeSurvey?.mapUrl !== debouncedmapUrl
    ) {
      // Clear errors and move on to start loading state
      dispatch({ type: 'START_LOADING_AVAILABLE_MAP_LAYERS' });
      dispatch({ type: 'SET_AVAILABLE_MAP_LAYERS_ERROR', error: null });
    } else {
      // URL empty or not changed - stop the loading state
      dispatch({ type: 'STOP_LOADING_AVAILABLE_MAP_LAYERS' });
    }
  }, [state.activeSurvey?.mapUrl]);

  /**
   * Update available map layers when the debounced value of map URL has changed.
   */
  useEffect(() => {
    if (!debouncedmapUrl) {
      // URL was set to empty - clear all map layer data from context
      dispatch({ type: 'STOP_LOADING_AVAILABLE_MAP_LAYERS' });
      dispatch({ type: 'SET_AVAILABLE_MAP_LAYERS_ERROR', error: null });
      dispatch({
        type: 'SET_AVAILABLE_MAP_LAYERS',
        layers: [],
      });
      return;
    }

    async function updateAvailableMapLayers() {
      dispatch({ type: 'START_LOADING_AVAILABLE_MAP_LAYERS' });
      try {
        const layers = await request<MapLayer[]>(
          `/api/map/available-layers?url=${encodeURIComponent(
            debouncedmapUrl,
          )}`,
        );
        dispatch({
          type: 'SET_AVAILABLE_MAP_LAYERS',
          layers,
        });
        dispatch({ type: 'SET_AVAILABLE_MAP_LAYERS_ERROR', error: null });
        dispatch({ type: 'STOP_LOADING_AVAILABLE_MAP_LAYERS' });
      } catch (error) {
        dispatch({
          type: 'SET_AVAILABLE_MAP_LAYERS',
          layers: null,
        });
        dispatch({
          type: 'SET_AVAILABLE_MAP_LAYERS_ERROR',
          error: error.message,
        });
        dispatch({ type: 'STOP_LOADING_AVAILABLE_MAP_LAYERS' });
        throw error;
      }
    }

    updateAvailableMapLayers();
  }, [debouncedmapUrl]);

  return (
    <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>
  );
}
