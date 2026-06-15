import { useCallback, useEffect, useRef, useState } from 'react';
import { descontosApi, type DetalhePedido } from './descontos';

export interface UseDescontoDetalheState {
  data: DetalhePedido | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDescontoDetalhe(
  pedidoKey: string | number | null,
): UseDescontoDetalheState {
  const [data, setData]             = useState<DetalhePedido | null>(null);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(
    async (key: string | number, isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const res = await descontosApi.detalhe(key);
        if (!mounted.current) return;
        setData(res);
      } catch (e) {
        if (!mounted.current) return;
        setError((e as Error).message ?? 'Erro ao carregar detalhe.');
      } finally {
        if (!mounted.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    mounted.current = true;
    if (pedidoKey != null) load(pedidoKey);
    else {
      setData(null);
      setError(null);
    }
    return () => {
      mounted.current = false;
    };
  }, [pedidoKey, load]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: () => (pedidoKey != null ? load(pedidoKey, true) : undefined),
  };
}
