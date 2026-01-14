import { SurveyPage, SurveyPageSection } from '@interfaces/survey';
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

/**
 * Reducer state type
 */
type State = {
  clipboardPage: SurveyPage;
  clipboardSection: SurveyPageSection;
};

/**
 * Reducer action type
 */
type Action =
  | {
      type: 'SET_SECTION';
      clipboardSection: SurveyPageSection;
    }
  | {
      type: 'SET_PAGE';
      clipboardPage: SurveyPage;
    };

/**
 * Type of stored context (state & reducer returned from useReducer)
 */
type Context = [State, Dispatch<Action>];

/**
 * Type of provider props
 */
interface Props {
  children: ReactNode;
}

/** Translation context initial values */
const stateDefaults: State = {
  clipboardPage: null,
  clipboardSection: null,
};

export const ClipboardContext = createContext<Context>(null);

/** Custom hook for accessing the workspace context */
export function useClipboard() {
  const context = useContext(ClipboardContext);

  if (!context) {
    throw new Error('useClipboard must be used within the ClipboardProvider');
  }
  const [state, dispatch] = context;

  const setSection = (clipboardSection: SurveyPageSection) => {
    dispatch({ type: 'SET_SECTION', clipboardSection });
  };

  const setClipboardPage = (clipboardPage: SurveyPage) => {
    dispatch({ type: 'SET_PAGE', clipboardPage });
  };

  return {
    setSection,
    setClipboardPage: setClipboardPage,
    clipboardSection: state.clipboardSection,
    clipboardPage: state.clipboardPage,
  };
}

/** Reducer function for dispatching actions and changing the state provided by the ClipboardContext */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SECTION':
      return {
        ...state,
        clipboardSection: action.clipboardSection,
      };
    case 'SET_PAGE':
      return {
        ...state,
        clipboardPage: action.clipboardPage,
      };
    default:
      throw new Error('Invalid action type');
  }
}

export default function ClipboardProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, stateDefaults);

  /**
   * Listen for changes in the local storage so that all browser tabs get notification of the copied survey page/section
   */
  useEffect(() => {
    // Event listener for the storage event
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'clipboard-content') {
        // Handle the change, e.g., update your component's state
        const clipboardContent = JSON.parse(event.newValue);
        if (!clipboardContent) return;

        const {
          clipboardSection,
          clipboardPage,
        }: { clipboardSection: SurveyPageSection; clipboardPage: SurveyPage } =
          clipboardContent;

        clipboardPage && dispatch({ type: 'SET_PAGE', clipboardPage });
        clipboardSection && dispatch({ type: 'SET_SECTION', clipboardSection });
      }
    };

    // Add the event listener when the component mounts
    window.addEventListener('storage', handleStorageChange);

    // Find out if there is some content already in the localStorage: this use case comes into question if the user navigates
    // in the same tab to a different survey. The front makes then a fresh page request that causes the ClipBoard context
    // to rerender and thus it misses all previously stored clipboard contents
    const clipboardContent = JSON.parse(
      localStorage.getItem('clipboard-content'),
    );

    if (!clipboardContent) return;

    const {
      clipboardSection,
      clipboardPage,
    }: { clipboardSection: SurveyPageSection; clipboardPage: SurveyPage } =
      clipboardContent;

    clipboardPage && dispatch({ type: 'SET_PAGE', clipboardPage });
    clipboardSection && dispatch({ type: 'SET_SECTION', clipboardSection });

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /**
   * Use useMemo here to avoid unnecessary rerenders
   * @see https://reactjs.org/docs/hooks-reference.html#usememo
   */
  const value = useMemo<Context>(() => [state, dispatch], [state]);

  return (
    <ClipboardContext.Provider value={value}>
      {children}
    </ClipboardContext.Provider>
  );
}
