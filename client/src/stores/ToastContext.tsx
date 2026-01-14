import { Alert, AlertProps, IconButton, Snackbar } from '@mui/material';
import CloseIcon from '@src/components/icons/CloseIcon';
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

export interface Toast {
  severity: AlertProps['severity'];
  message: string;
  autoHideDuration?: number;
}

/**
 * Context state type
 */
interface State {
  queue: Toast[];
  currentToast: Toast;
  open: boolean;
}

/**
 * Action type
 */
type Action =
  | {
      type: 'ADD_TOAST_TO_QUEUE';
      toast: Toast;
    }
  | {
      type: 'POP_NEXT_TOAST_FROM_QUEUE';
    }
  | {
      type: 'CLOSE_CURRENT_TOAST';
    }
  | {
      type: 'SET_OPEN';
      open: boolean;
    };

/**
 * Context type
 */
type Context = [State, Dispatch<Action>];

/**
 * State default values
 */
const stateDefaults: State = {
  queue: [],
  currentToast: null,
  open: false,
};

/**
 * Context containing the state object and dispatch function.
 */
export const ToastContext = createContext<Context>(null);

/**
 * Hook for accessing toast context.
 * @returns State and toast context functions
 */
export function useToasts() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within the ToastProvider');
  }

  const [state, dispatch] = context;

  return {
    ...state,
    showToast(toast: Toast) {
      dispatch({ type: 'ADD_TOAST_TO_QUEUE', toast });
    },
  };
}

/**
 * Reducer for ToastContext state.
 * @param state Previous state
 * @param action Dispatched action
 * @returns New state
 */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TOAST_TO_QUEUE':
      return {
        ...state,
        queue: [...state.queue, action.toast],
      };
    case 'CLOSE_CURRENT_TOAST':
      return {
        ...state,
        currentToast: null,
      };
    case 'POP_NEXT_TOAST_FROM_QUEUE': {
      const [nextToast, ...queue] = state.queue;
      return {
        ...state,
        queue,
        currentToast: nextToast ?? null,
        // open: Boolean(nextToast),
      };
    }
    case 'SET_OPEN':
      return {
        ...state,
        open: action.open,
      };
    default:
      throw new Error('Invalid action type');
  }
}

/**
 * Provider component for ToastContext.
 */
export default function ToastProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, stateDefaults);
  /**
   * Use useMemo here to avoid unnecessary rerenders
   * @see https://reactjs.org/docs/hooks-reference.html#usememo
   */
  const value = useMemo<Context>(() => [state, dispatch], [state]);

  // Effect for popping the next toast from queue
  useEffect(() => {
    // Bring the next toast in from the queue if there is none at display
    if (!state.currentToast && state.queue.length) {
      dispatch({ type: 'POP_NEXT_TOAST_FROM_QUEUE' });
      dispatch({ type: 'SET_OPEN', open: true });
    }
  }, [state.currentToast, state.queue]);

  function closeCurrentToast() {
    dispatch({ type: 'SET_OPEN', open: false });

    // For better feedback, allow previous toasts to disappear gracefully before
    // clearing the alert contents and showing the next toast
    setTimeout(() => {
      dispatch({ type: 'CLOSE_CURRENT_TOAST' });
    }, 200);
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={state.currentToast?.autoHideDuration ?? 8000}
        onClose={closeCurrentToast}
      >
        <Alert
          elevation={2}
          tabIndex={-1}
          variant="filled"
          severity={state.currentToast?.severity}
          sx={{ width: '100%' }}
          action={
            <IconButton size="small" onClick={closeCurrentToast}>
              <CloseIcon />
            </IconButton>
          }
        >
          {state.currentToast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
