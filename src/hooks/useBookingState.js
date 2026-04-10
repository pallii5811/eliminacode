import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/supabase';

const INITIAL_SETTINGS = {
  enabled: true,
  closedMessage: 'Le prenotazioni non sono ancora attive. Riprova più tardi.',
  available: true,
};

export function useBookingState() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const nextSettings = await api.getBookingSettings();
      if (mountedRef.current) {
        setSettings(nextSettings);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const unsubscribe = api.subscribe(() => refresh());

    return () => {
      mountedRef.current = false;
      unsubscribe?.();
    };
  }, [refresh]);

  const updateSettings = useCallback(async (updates) => {
    try {
      const nextSettings = await api.updateBookingSettings(updates);
      if (mountedRef.current) {
        setSettings(nextSettings);
        setError(null);
      }
      return nextSettings;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
      }
      throw err;
    }
  }, []);

  return {
    settings,
    loading,
    error,
    refresh,
    updateSettings,
  };
}
