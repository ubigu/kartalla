import { request } from '@src/utils/request';
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { useToasts } from './ToastContext';
import { useTranslations } from './TranslationContext';

/**
 * Context state type
 */
type State = {
  newNotifications: boolean;
};

/**
 * Reducer action type
 */
type Action = {
  type: 'SET_NEW_NOTIFICATIONS';
  newNotifications: boolean;
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

/** General notification context initial values */
const stateDefaults: State = {
  newNotifications: false,
};

export const GenralNotificationContext = createContext<Context>(null);

/** Custom hook for accessing the general notification context */
export function useGeneralNotifications() {
  const context = useContext(GenralNotificationContext);
  if (!context) {
    throw new Error(
      'useGeneralNotifications must be used within the GeneralNotificationProvider',
    );
  }
  const [state] = context;

  return state;
}

/** Reducer function for dispatching actions and changing the state provided by the GenralNotificationContext */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_NEW_NOTIFICATIONS':
      return {
        ...state,
        newNotifications: action.newNotifications,
      };
    default:
      throw new Error('Invalid action type');
  }
}

export default function GeneralNotificationProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, stateDefaults);
  const { showToast } = useToasts();
  const { tr } = useTranslations();
  const [sseReconnects, setSseReconnects] = useState(0);

  /**
   * Use useMemo here to avoid unnecessary rerenders
   * @see https://reactjs.org/docs/hooks-reference.html#usememo
   */
  const value = useMemo<Context>(() => {
    return [state, dispatch];
  }, [state]);

  async function refreshRecentCount() {
    const data = await request<{ count: number }>(
      '/api/general-notifications/recent-count',
    );

    dispatch({
      type: 'SET_NEW_NOTIFICATIONS',
      newNotifications: data.count > 0,
    });
  }

  useEffect(() => {
    let generalNotificationEventSource: EventSource;
    function initializeEventSource() {
      generalNotificationEventSource = new EventSource(
        '/api/general-notifications/events',
      );
      generalNotificationEventSource.onerror = () => {
        setSseReconnects((prev) => prev + 1);
        generalNotificationEventSource.close();

        if (sseReconnects === 10) {
          showToast({
            message: tr.AppBar.generalNotificationsError,
            severity: 'error',
          });
        } else {
          setTimeout(() => {
            initializeEventSource();
          }, 5000);
        }
      };
      generalNotificationEventSource.onopen = () => {
        setSseReconnects(0);
      };

      generalNotificationEventSource.onmessage = (message) => {
        const data = JSON.parse(message.data);

        if (data.newGeneralNotifications || data.deletedGeneralNotification) {
          refreshRecentCount();
        } else {
          dispatch({
            type: 'SET_NEW_NOTIFICATIONS',
            newNotifications: false,
          });
        }
      };
    }
    initializeEventSource();
    return () => {
      generalNotificationEventSource.close();
    };
  }, []);

  useEffect(() => {
    refreshRecentCount();
  }, []);

  return (
    <GenralNotificationContext.Provider value={value}>
      {children}
    </GenralNotificationContext.Provider>
  );
}
