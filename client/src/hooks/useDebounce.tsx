import { useEffect, useRef, useState } from 'react';

/**
 * Hook for handling debounced values.
 * @param value
 * @param delayMs
 * @returns
 */
export function useDebounce<Value>(value: Value, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const firstDebounce = useRef(true);
  useEffect(() => {
    if (value && firstDebounce.current) {
      setDebouncedValue(value);
      firstDebounce.current = false;
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);
  return debouncedValue;
}
