import { Action, Location } from 'history';
import { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';

interface Transition {
  location: Location;
  action: Action;
  /** Continues the navigation that was blocked. */
  retry: () => void;
}

/**
 * Hook for blocking in-app (react-router) navigation, e.g. when the page has
 * unsaved changes. Unlike usePreventUnload, this does not cover page
 * reload/close - only navigation performed via the router (links, history.push etc).
 */
export function useBlocker(
  onBlocked: (transition: Transition) => void,
  when: boolean,
) {
  const history = useHistory();
  const onBlockedRef = useRef(onBlocked);
  onBlockedRef.current = onBlocked;

  useEffect(() => {
    if (!when) {
      return;
    }

    const unblock = history.block((location, action) => {
      onBlockedRef.current({
        location,
        action,
        retry: () => {
          unblock();
          history.push(location);
        },
      });
      // Returning false silently blocks the transition instead of showing
      // the native window.confirm dialog.
      return false;
    });

    return unblock;
  }, [history, when]);
}
