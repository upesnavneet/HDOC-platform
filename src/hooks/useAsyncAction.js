// @ts-check
import { useState, useCallback } from 'react';

/**
 * M12: Generic hook for wrapping async operations with loading/error state.
 * Provides consistent UX: buttons can be disabled during flight,
 * errors can be displayed to the user, and double-submissions are prevented.
 *
 * @param {(...args: any[]) => Promise<any>} asyncFn - The async function to wrap.
 * @returns {{ execute: (...args: any[]) => Promise<any>, status: string, error: Error|null, isLoading: boolean }}
 */
export function useAsyncAction(asyncFn) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      if (status === 'loading') return; // Prevent double-submit
      setStatus('loading');
      setError(null);
      try {
        const result = await asyncFn(...args);
        setStatus('success');
        return result;
      } catch (err) {
        setError(err);
        setStatus('error');
        throw err;
      }
    },
    [asyncFn, status]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { execute, status, error, isLoading: status === 'loading', reset };
}
