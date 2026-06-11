import type { Carrier, CepException, Order, RoutingRule } from './types';

const BASE = (import.meta.env.VITE_N8N_BASE as string) || 'https://dreamingcow-n8n.cloudfy.live/webhook';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[${res.status}] ${text}`);
  }
  return res.json() as Promise<T>;
}

export const ordersApi = {
  pending: () => call<{ pedidos: Order[]; total: number }>('tms-pedidos-pending'),
  history: (page = 0) =>
    call<{ pedidos: Order[]; total: number }>(`tms-pedidos-history?page=${page}`),
  approve: (orderId: string, carrierId: string) =>
    call<{ ok: boolean }>('tms-aprovar-pedido', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, carrier_id: carrierId }),
    }),
  batchApprove: (orderIds: string[]) =>
    call<{ ok: boolean; loads: { load_id: string; carrier_id: string; viamex_unit: string | null; order_count: number }[]; approved: number }>('tms-batch-aprovar', {
      method: 'POST',
      body: JSON.stringify({ order_ids: orderIds }),
    }),
};

export const carriersApi = {
  list: () => call<{ carriers: Carrier[] }>('tms-transportadoras'),
};

export const rulesApi = {
  list: () => call<{ rules: RoutingRule[] }>('tms-regras'),
  upsert: (rule: Partial<RoutingRule>) =>
    call<{ rule: RoutingRule }>('tms-regras', {
      method: 'POST',
      body: JSON.stringify(rule),
    }),
  reorder: (ids: string[]) =>
    call<{ ok: boolean }>('tms-regras-reorder', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};

export const cepApi = {
  list: () => call<{ exceptions: CepException[] }>('tms-cep-excecoes'),
  create: (ex: Omit<CepException, 'id' | 'is_active'>) =>
    call<{ exception: CepException }>('tms-cep-excecoes', {
      method: 'POST',
      body: JSON.stringify(ex),
    }),
  remove: (id: string) =>
    call<{ ok: boolean }>(`tms-cep-excecoes/${id}`, { method: 'DELETE' }),
};
