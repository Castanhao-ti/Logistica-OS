import { useCallback, useEffect, useRef, useState } from 'react';
import { descontosApi, type PedidoDesconto } from './descontos';

const POLLING_MS = 5 * 60 * 1000;

export interface UseDescontosState {
  data: PedidoDesconto[];
  total: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  updatedAt: Date | null;
  refresh: () => void;
}

export function useDescontos(): UseDescontosState {
  const [data, setData]             = useState<PedidoDesconto[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [updatedAt, setUpdatedAt]   = useState<Date | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const res = await descontosApi.lista();
      if (!mounted.current) return;
      setData(res.pedidos ?? []);
      setTotal(res.total ?? res.pedidos?.length ?? 0);
      setUpdatedAt(new Date());
    } catch (e) {
      if (!mounted.current) return;
      setError((e as Error).message ?? 'Erro ao carregar pedidos.');
    } finally {
      if (!mounted.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    const id = setInterval(() => load(true), POLLING_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [load]);

  return {
    data,
    total,
    loading,
    refreshing,
    error,
    updatedAt,
    refresh: () => load(true),
  };
}
