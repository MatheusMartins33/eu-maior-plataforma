import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Generic debounce hook that delays function execution
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Debounce hook specifically for values (not functions)
 */
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttle hook that limits function execution frequency
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastExecutedRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutedRef.current;

    if (timeSinceLastExecution >= delay) {
      // Execute immediately if enough time has passed
      lastExecutedRef.current = now;
      callbackRef.current(...args);
    } else {
      // Schedule execution for the remaining time
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastExecutedRef.current = Date.now();
        callbackRef.current(...args);
      }, delay - timeSinceLastExecution);
    }
  }, [delay]) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

/**
 * Hook for preventing rapid successive function calls
 */
export const usePreventRapidCalls = <T extends (...args: any[]) => any>(
  callback: T,
  minInterval: number = 1000
): [T, boolean] => {
  const lastCallRef = useRef<number>(0);
  const isBlockedRef = useRef<boolean>(false);

  const preventedCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    if (timeSinceLastCall < minInterval) {
      isBlockedRef.current = true;
      console.warn(`[PREVENT_RAPID_CALLS] Call blocked, ${minInterval - timeSinceLastCall}ms remaining`);
      return;
    }

    isBlockedRef.current = false;
    lastCallRef.current = now;
    return callback(...args);
  }, [callback, minInterval]) as T;

  return [preventedCallback, isBlockedRef.current];
};