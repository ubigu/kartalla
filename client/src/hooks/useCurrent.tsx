import { useRef } from 'react';

/**
 * Helper hook that returns a getter function for fetching current value of a given value.
 * Useful when accessing changing values from inside callbacks.
 * @param value Value
 * @returns Getter function for the current value
 */
export function useCurrent<Value>(value: Value) {
  const ref = useRef<Value | null>(null);
  ref.current = value;
  return () => ref.current;
}
