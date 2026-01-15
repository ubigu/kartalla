import { User } from '@interfaces/user';
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { useToasts } from './ToastContext';
import { useTranslations } from './TranslationContext';

/**
 * Context state type
 */
type State = {
  isInitialized: boolean;
  activeUser: User;
  otherUsers: User[];
  allUsers: User[];
};

/**
 * Reducer action type
 */
type Action =
  | {
      type: 'SET_ACTIVE_USER';
      user: User;
    }
  | {
      type: 'SET_OTHER_USERS';
      users: User[];
    }
  | {
      type: 'SET_ALL_USERS';
      users: User[];
    }
  | {
      type: 'SET_INITIALIZED';
      isInitialized: boolean;
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

/** User context initial values */
const stateDefaults: State = {
  isInitialized: false,
  activeUser: null,
  otherUsers: null,
  allUsers: null,
};

export const UserContext = createContext<Context>(null);

/** Custom hook for accessing the user context */
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within the UserProvider');
  }
  const [state, dispatch] = context;

  const setActiveUser = (user: User) => {
    dispatch({ type: 'SET_ACTIVE_USER', user });
  };

  return {
    activeUserIsAdmin:
      state.activeUser?.roles.includes('organization_admin') ?? false,
    activeUserIsSuperUser:
      state.activeUser?.roles.includes('super_user') ?? false,
    setActiveUser,
    ...state,
  };
}

/** Reducer function for dispatching actions and changing the state provided by the UserContext */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ACTIVE_USER':
      return {
        ...state,
        activeUser: action.user,
      };
    case 'SET_OTHER_USERS':
      return {
        ...state,
        otherUsers: action.users,
      };
    case 'SET_ALL_USERS':
      return {
        ...state,
        allUsers: action.users,
      };
    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: action.isInitialized,
      };
    default:
      throw new Error('Invalid action type');
  }
}

export default function UserProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, stateDefaults);
  const { showToast } = useToasts();
  const { tr } = useTranslations();

  /**
   * Use useMemo here to avoid unnecessary rerenders
   * @see https://reactjs.org/docs/hooks-reference.html#usememo
   */
  const value = useMemo<Context>(() => {
    return [state, dispatch];
  }, [state]);

  useEffect(() => {
    async function fetchOtherUsers() {
      try {
        const currentUser = await fetch('/api/users/me').then(
          (response) => response.json() as Promise<User>,
        );

        const otherUsers = await fetch('/api/users/others').then(
          (response) => response.json() as Promise<User[]>,
        );

        dispatch({ type: 'SET_ACTIVE_USER', user: currentUser });
        dispatch({ type: 'SET_OTHER_USERS', users: otherUsers });
        dispatch({
          type: 'SET_ALL_USERS',
          users: [currentUser, ...otherUsers],
        });
        dispatch({ type: 'SET_INITIALIZED', isInitialized: true });
      } catch {
        showToast({
          severity: 'error',
          message: tr.EditSurveyInfo.userFetchFailed,
        });
      }
    }

    fetchOtherUsers();
  }, []);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
