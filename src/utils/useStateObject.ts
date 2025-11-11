import { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

export function useStateObject<T extends Record<string, any>>(initialState: T): [T, (updates: Partial<T> | ((prev: T) => Partial<T>)) => void] {
  const [state, setState] = useState<T>(initialState);

  const updateState = useCallback((updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setState(prev => {
      if (typeof updates === 'function') {
        return { ...prev, ...updates(prev) };
      }
      return { ...prev, ...updates };
    });
  }, []);

  return [state, updateState];
}

// Hook to extract state context from outlet
export function useStateContext() {
  return useOutletContext<[any, (updates: any) => void, any, (user: any) => void]>();
}