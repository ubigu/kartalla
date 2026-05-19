import { useEffect } from 'react';
import { useRef } from 'react';
import { useCurrent } from './useCurrent';

/**
 * Hook for preventing unloads (page reload or close) e.g. when page has unsaved changes.
 * @param prevent Should the unload be prevented?
 * @param confirmationMessage Confirmation message for the dialog (Note: not supported by any modern browsers!)
 */
export function usePreventUnload(
  prevent: boolean,
  confirmationMessage: string,
) {
  // Access current "prevent" value via ref - otherwise it won't get updated inside the callback
  const getCurrentPrevent = useCurrent(prevent);
  const handlerRef = useRef((event: BeforeUnloadEvent) => {
    if (getCurrentPrevent()) {
      // These lines do pretty much the same, but are there for better cross-browser support
      event.preventDefault();
      (event || window.event).returnValue = confirmationMessage;
      return confirmationMessage;
    }
  });

  useEffect(() => {
    const onUnload = handlerRef.current;
    window.addEventListener('beforeunload', onUnload);

    // Cleanup effect
    return () => {
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [handlerRef]);
}
