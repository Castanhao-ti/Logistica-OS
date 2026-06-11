import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchUsuarios, type Usuario } from './usuarios';

const POLLING_INTERVAL_MS = 5 * 60 * 1000;

export interface UseUsuariosState {
  data: Usuario[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  updatedAt: Date | null;
  refresh: () => void;
}

export function useUsuarios(): UseUsuariosState {
  const [data, setData]               = useState<Usuario[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [updatedAt, setUpdatedAt]     = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const result = await fetchUsuarios(ctrl.signal);
      setData(result);
      setUpdatedAt(new Date());
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message ?? 'Erro desconhecido.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), POLLING_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [load]);

  return {
    data,
    loading,
    refreshing,
    error,
    updatedAt,
    refresh: () => load(true),
  };
}
