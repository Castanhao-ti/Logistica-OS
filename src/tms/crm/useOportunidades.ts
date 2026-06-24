import { useCallback, useEffect, useState } from 'react';
import { crmApi, type OportunidadesResponse } from './crm';

export interface UseOportunidadesResult {
  data: OportunidadesResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOportunidades(): UseOportunidadesResult {
  const [data, setData] = useState<OportunidadesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await crmApi.listarOportunidades();
      setData({
        total: Number(resp.total) || 0,
        valor_total: Number(resp.valor_total) || 0,
        oportunidades: (resp.oportunidades || []).map(o => ({
          ...o,
          valor_estimado: o.valor_estimado == null ? null : Number(o.valor_estimado),
          probabilidade: o.probabilidade == null ? null : Number(o.probabilidade),
          dias_aberta: Number(o.dias_aberta) || 0,
        })),
      });
    } catch (e) {
      setError((e as Error).message || 'Erro ao carregar oportunidades.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { data, loading, error, refresh: carregar };
}
