import { useCallback, useEffect, useState } from 'react';
import { crmApi, type ClienteCrm, type MinhaAgendaResponse } from './crm';

function normaliza(raw: any): ClienteCrm {
  const num = (v: any) => (v == null ? 0 : typeof v === 'number' ? v : parseFloat(String(v)) || 0);
  const intOrNull = (v: any) => (v == null ? null : parseInt(String(v), 10));
  return {
    id: parseInt(String(raw.id), 10),
    cnpj: String(raw.cnpj || ''),
    razao_social: String(raw.razao_social || ''),
    nome_fantasia: raw.nome_fantasia ?? null,
    cidade: raw.cidade ?? null,
    uf: raw.uf ?? null,
    vendedor_original: raw.vendedor_original ?? null,
    eh_carteira_luiz: !!raw.eh_carteira_luiz,
    owner_crm: raw.owner_crm_nome ?? null,
    tipo_owner: raw.tipo_owner ?? 'SEM_OWNER',
    venda_historica: num(raw.venda_historica),
    qtd_pedidos: parseInt(String(raw.qtd_pedidos ?? 0), 10) || 0,
    ticket_medio: num(raw.ticket_medio),
    data_ultimo_pedido: raw.data_ultimo_pedido ? String(raw.data_ultimo_pedido).slice(0, 10) : null,
    dias_sem_compra: intOrNull(raw.dias_sem_compra),
    status_cliente: raw.status_cliente ?? 'SEM_PEDIDO',
    faixa_acao_comercial: raw.faixa_acao_comercial ?? 'SEM_PEDIDO',
    prioridade_crm: raw.prioridade_crm ?? 'P4 - Nutrição',
    faixa_ltv: raw.faixa_ltv ?? null,
    ultima_acao_tipo: raw.ultima_acao_tipo ?? null,
    ultima_acao_data: raw.ultima_acao_data ?? null,
    proxima_acao: raw.proxima_acao ?? null,
    data_proxima_acao: raw.data_proxima_acao ?? null,
    status_proxima_acao: raw.status_proxima_acao ?? null,
    credito_obs: raw.credito_obs ?? null,
    credito_grade: raw.credito_grade == null ? null : parseInt(String(raw.credito_grade), 10),
    credito_bloqueado: !!raw.credito_bloqueado,
    valor_atrasado: num(raw.valor_atrasado),
    qtd_boletos_atrasados: intOrNull(raw.qtd_boletos_atrasados),
    vencimento_mais_antigo: raw.vencimento_mais_antigo
      ? String(raw.vencimento_mais_antigo).slice(0, 10)
      : null,
  };
}

export function useMinhaAgenda(email: string | null) {
  const [data, setData] = useState<MinhaAgendaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await crmApi.minhaAgenda(email);
      setData({
        total_carteira: Number(raw.total_carteira) || 0,
        vencidas: (raw.vencidas || []).map(normaliza),
        hoje: (raw.hoje || []).map(normaliza),
        semana: (raw.semana || []).map(normaliza),
        sem_proxima: (raw.sem_proxima || []).map(normaliza),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
