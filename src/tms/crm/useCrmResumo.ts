import { useCallback, useEffect, useState } from 'react';
import { crmApi } from './crm';

export interface CrmResumo {
  total_clientes: number;
  ativos: number;
  inativos: number;
  sem_pedido: number;
  acima_30_dias: number;
  acima_60_dias: number;
  p0: number;
  p1: number;
  p2?: number;
  p3?: number;
  p4?: number;
  carteira_luiz: number;
  fora_luiz: number;
  venda_historica_total: number;
  ticket_medio_geral: number;
}

function toNumbers(raw: any): CrmResumo {
  const num = (v: any) => (v == null ? 0 : typeof v === 'number' ? v : parseFloat(String(v)));
  return {
    total_clientes: num(raw.total_clientes),
    ativos: num(raw.ativos),
    inativos: num(raw.inativos),
    sem_pedido: num(raw.sem_pedido),
    acima_30_dias: num(raw.acima_30_dias),
    acima_60_dias: num(raw.acima_60_dias),
    p0: num(raw.p0),
    p1: num(raw.p1),
    p2: num(raw.p2),
    p3: num(raw.p3),
    p4: num(raw.p4),
    carteira_luiz: num(raw.carteira_luiz),
    fora_luiz: num(raw.fora_luiz),
    venda_historica_total: num(raw.venda_historica_total),
    ticket_medio_geral: num(raw.ticket_medio_geral),
  };
}

export function useCrmResumo() {
  const [data, setData] = useState<CrmResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await crmApi.resumoGerencial();
      setData(toNumbers(raw));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
