import type { PerfilAcesso } from '../auth/auth';

const BASE =
  (import.meta.env.VITE_N8N_BASE as string) ??
  'https://dreamingcow-n8n.cloudfy.live/webhook';

export type StatusAnalise =
  | 'pendente'
  | 'em_analise'
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'reprovado';

export type AcaoAnalise =
  | 'iniciar_analise'
  | 'solicitar_aprovacao'
  | 'aprovar'
  | 'reprovar';

export interface AnaliseInfo {
  status: StatusAnalise;
  operador: string | null;
  observacao_operador: string | null;
  gerente: string | null;
  observacao_gerente: string | null;
  solicitado_em: string | null;
  decidido_em: string | null;
}

export interface PedidoDesconto extends AnaliseInfo {
  pedido_forca_venda_key: string;
  numero_pedido_cliente: string | null;
  data_solicitacao: string;
  nome_cliente: string;
  nome_vendedor: string | null;
  equipe_vendedor: string | null;
  status_pedido: string | null;
  valor_pedido: number;
  valor_desconto: number;
  valor_acrescimo: number;
  custo_total: number | null;
  lucro_bruto: number | null;
  perc_margem: number | null;
  qtde_skus: number;
  qtde_skus_com_desconto: number;
  status_analise: StatusAnalise;
}

export interface ItemPedido {
  produto_key: number;
  descricao_produto: string | null;
  quantidade: number;
  preco_tabela: number | null;
  preco_aplicado: number | null;
  preco_variacao: number;
  preco_final: number;
  custo_unitario: number | null;
  valor_total_item: number;
  valor_variacao_item: number;
  perc_margem_item: number | null;
}

export interface DetalhePedido {
  pedido_forca_venda_key: number;
  cabecalho: Omit<PedidoDesconto, keyof AnaliseInfo | 'status_analise'> | null;
  analise: AnaliseInfo;
  totais: {
    qtde_itens: number;
    qtde_itens_desconto: number;
    qtde_itens_acrescimo: number;
    valor_desconto: number;
    valor_acrescimo: number;
  };
  itens: {
    com_desconto: ItemPedido[];
    com_acrescimo: ItemPedido[];
    sem_variacao: ItemPedido[];
  };
}

export interface RegistroAnalise extends AnaliseInfo {
  pedido_forca_venda_key: string;
  criado_em: string;
  atualizado_em: string;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new Error('Erro de conexão com o servidor. Verifique sua internet.');
  }
  if (!res.ok) {
    let msg = `Erro ${res.status} ao comunicar com o servidor.`;
    try {
      const body = (await res.json()) as { erro?: string };
      if (body?.erro) msg = body.erro;
    } catch {
      /* corpo não-JSON — mantém mensagem genérica */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const descontosApi = {
  lista: () =>
    call<{ total: number; pedidos: PedidoDesconto[] }>('lsw-pedidos-desconto'),
  detalhe: (pedido: string | number) =>
    call<DetalhePedido>(`lsw-pedido-desconto?pedido=${encodeURIComponent(String(pedido))}`),
  acao: (payload: {
    pedido_forca_venda_key: string | number;
    acao: AcaoAnalise;
    usuario: string;
    observacao?: string;
  }) =>
    call<RegistroAnalise>('lsw-pedido-desconto-analise', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const podeDecidir = (perfil: PerfilAcesso) =>
  perfil === 'admin' || perfil === 'vendas';

export const podeOperar = (perfil: PerfilAcesso) => perfil !== 'leitura';

export const STATUS_ANALISE_LABELS: Record<StatusAnalise, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  aguardando_aprovacao: 'Aguard. Aprovação',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
};

export const STATUS_ANALISE_TONE: Record<
  StatusAnalise,
  'pendente' | 'transito' | 'prioritario' | 'entregue' | 'atrasado'
> = {
  pendente: 'pendente',
  em_analise: 'transito',
  aguardando_aprovacao: 'prioritario',
  aprovado: 'entregue',
  reprovado: 'atrasado',
};

export const fmtBRL = (v: number | null | undefined) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export const fmtData = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export const fmtDataHora = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export type TomMargem = 'ok' | 'baixa' | 'negativa' | 'na';

export const tomMargem = (perc: number | null | undefined): TomMargem => {
  if (perc == null) return 'na';
  if (perc < 0) return 'negativa';
  if (perc < 15) return 'baixa';
  return 'ok';
};

export const MARGEM_TONE: Record<
  TomMargem,
  'entregue' | 'pendente' | 'atrasado' | 'rascunho'
> = {
  ok: 'entregue',
  baixa: 'pendente',
  negativa: 'atrasado',
  na: 'rascunho',
};

/** % do desconto sobre o preço tabela: |desc| / (valor_pedido - desc - acresc). */
export const percDesconto = (
  valor_pedido: number,
  valor_desconto: number,
  valor_acrescimo: number,
): number | null => {
  const semDesc = valor_pedido - valor_desconto - valor_acrescimo;
  if (semDesc <= 0) return null;
  return (Math.abs(valor_desconto) / semDesc) * 100;
};

export const fmtPerc = (perc: number | null | undefined, casas = 1) =>
  perc == null ? '—' : `${perc.toFixed(casas).replace('.', ',')}%`;

export const STATUS_FATURADO = 'Faturado por Nota Fiscal';
export const isFaturado = (status_pedido: string | null | undefined) =>
  status_pedido === STATUS_FATURADO;

/**
 * Adapta um PedidoDesconto da listagem em um DetalhePedido mínimo,
 * suficiente para alimentar o AcaoModal sem precisar carregar o detalhe completo.
 */
export function asDetalhePedido(p: PedidoDesconto): DetalhePedido {
  const {
    status,
    operador,
    observacao_operador,
    gerente,
    observacao_gerente,
    solicitado_em,
    decidido_em,
    status_analise: _statusAnalise,
    ...cabecalho
  } = p;
  return {
    pedido_forca_venda_key: Number(p.pedido_forca_venda_key) || 0,
    cabecalho,
    analise: {
      status,
      operador,
      observacao_operador,
      gerente,
      observacao_gerente,
      solicitado_em,
      decidido_em,
    },
    totais: {
      qtde_itens: 0,
      qtde_itens_desconto: 0,
      qtde_itens_acrescimo: 0,
      valor_desconto: p.valor_desconto,
      valor_acrescimo: p.valor_acrescimo,
    },
    itens: { com_desconto: [], com_acrescimo: [], sem_variacao: [] },
  };
}

/** Iniciais (até 2) para avatar do vendedor. */
export const iniciaisVendedor = (nome: string | null | undefined): string => {
  if (!nome) return '—';
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '—';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

export type SortKey = 'desconto' | 'margem' | 'data';
