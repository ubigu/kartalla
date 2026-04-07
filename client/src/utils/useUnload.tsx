// @ts-strict-ignore
import { useEffect, useRef } from 'react';

/**
 * Hook for applying a custom function on page unload.
 * @param handler Unload event handler
 */
export function useUnload(handler: OnBeforeUnloadEventHandler) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    const onUnload = handlerRef.current;
    window.addEventListener('beforeunload', onUnload);

    // Cleanup effect
    return () => {
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [handlerRef]);
}
