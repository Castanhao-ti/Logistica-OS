import type { PerfilAcesso } from '../auth/auth';

const BASE =
  (import.meta.env.VITE_N8N_BASE as string) ??
  'https://dreamingcow-n8n.cloudfy.live/webhook';

/* ───────────────────── Enums e tipos ───────────────────── */

export type StatusCliente = 'ATIVO' | 'INATIVO' | 'SEM_PEDIDO';

export type FaixaAcaoComercial =
  | 'ATIVO_SAUDAVEL'
  | 'ATIVO_EM_RISCO_31_60'
  | 'INATIVO_RECENTE_61_120'
  | 'INATIVO_FRIO_121_180'
  | 'DORMINDO_ACIMA_180'
  | 'SEM_PEDIDO';

export type PrioridadeCrm =
  | 'P0 - Ataque imediato'
  | 'P1 - Reativação alta'
  | 'P2 - Cadência normal'
  | 'P3 - Ativação SDR'
  | 'P4 - Nutrição'
  | 'KEY ACCOUNT LUIZ';

export type FaixaLtv = 'ALTO' | 'MEDIO' | 'BAIXO';

export type TipoOwner =
  | 'VENDA_INTERNA'
  | 'SDR'
  | 'LUIZ_BOBKO'
  | 'EXTERNO'
  | 'PLATAFORMA'
  | 'SEM_OWNER';

export type TipoAcao =
  | 'LIGACAO'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'VISITA'
  | 'PROPOSTA'
  | 'PEDIDO_GERADO'
  | 'SEM_RETORNO'
  | 'CADASTRO_INVALIDO'
  | 'REATIVACAO'
  | 'ATIVACAO_SEM_PEDIDO';

export type CanalAcao =
  | 'TELEFONE'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'PRESENCIAL'
  | 'SISTEMA'
  | 'OUTRO';

export type ResultadoAcao =
  | 'CONTATO_REALIZADO'
  | 'NAO_ATENDEU'
  | 'SEM_INTERESSE'
  | 'INTERESSADO'
  | 'PEDIU_CONDICAO'
  | 'PEDIDO_REALIZADO'
  | 'RETORNAR_DEPOIS'
  | 'CADASTRO_DESATUALIZADO'
  | 'PERDIDO'
  | 'GANHO';

export type StatusProximaAcao = 'PENDENTE' | 'VENCIDA' | 'CONCLUIDA';

export type EtapaOportunidade =
  | 'NOVO'
  | 'CONTATADO'
  | 'QUALIFICADO'
  | 'PROPOSTA'
  | 'NEGOCIACAO'
  | 'GANHO'
  | 'PERDIDO';

export type OrigemOportunidade =
  | 'REATIVACAO'
  | 'RECOMPRA'
  | 'SEM_PEDIDO'
  | 'INDICACAO'
  | 'CAMPANHA'
  | 'VENDEDOR_EXTERNO'
  | 'PLATAFORMA'
  | 'OUTRO';

/* ───────────────────── Entidades ───────────────────── */

export interface ClienteCrm {
  id: number;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  cidade: string | null;
  uf: string | null;
  vendedor_original: string | null;
  eh_carteira_luiz: boolean;
  owner_crm: string | null;
  tipo_owner: TipoOwner;
  venda_historica: number;
  qtd_pedidos: number;
  ticket_medio: number;
  data_ultimo_pedido: string | null;
  dias_sem_compra: number | null;
  status_cliente: StatusCliente;
  faixa_acao_comercial: FaixaAcaoComercial;
  prioridade_crm: PrioridadeCrm;
  faixa_ltv: FaixaLtv | null;
  ultima_acao_tipo: TipoAcao | null;
  ultima_acao_data: string | null;
  proxima_acao: string | null;
  data_proxima_acao: string | null;
  status_proxima_acao: StatusProximaAcao | null;
}

export interface AcaoComercial {
  id: number;
  cliente_id: number;
  owner_id: number | null;
  owner_nome: string | null;
  data_acao: string;
  tipo_acao: TipoAcao;
  canal: CanalAcao;
  resultado: ResultadoAcao;
  observacao: string | null;
  proxima_acao: string | null;
  data_proxima_acao: string | null;
  status_acao: 'CONCLUIDA' | 'CANCELADA';
}

export interface Oportunidade {
  id: number;
  cliente_id: number;
  owner_id: number | null;
  etapa: EtapaOportunidade;
  valor_estimado: number | null;
  origem: OrigemOportunidade | null;
  probabilidade: number | null;
  data_abertura: string;
  data_previsao_fechamento: string | null;
  data_fechamento: string | null;
  motivo_perda: string | null;
  observacao: string | null;
}

/* ───────────────────── API client (stubs — backend em construção) ───────────────────── */

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
      /* corpo não-JSON */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export type FiltroProximo = 'TOPO' | 'P0' | 'P1' | 'SDR' | 'REATIVACAO';

export interface AtribuicaoResult {
  resultado: 'OK' | 'JA_ATRIBUIDO' | 'FILA_VAZIA';
  owner_id: number;
  cliente_id: number | null;
  razao_social: string | null;
  cnpj: string | null;
  cidade: string | null;
  venda_historica?: number;
  owner_anterior?: number | null;
}

export interface MinhaAgendaResponse {
  total_carteira: number;
  vencidas: ClienteCrm[];
  hoje: ClienteCrm[];
  semana: ClienteCrm[];
  sem_proxima: ClienteCrm[];
}

export const crmApi = {
  listaClientes: () =>
    call<{ total: number; clientes: ClienteCrm[] }>('lsw-crm-clientes'),
  detalheCliente: (id: number | string) =>
    call<{
      cliente: ClienteCrm;
      acoes: AcaoComercial[];
      oportunidades: Oportunidade[];
    }>(`lsw-crm-cliente?id=${encodeURIComponent(String(id))}`),
  registrarAcao: (payload: {
    cliente_id: number;
    tipo_acao: TipoAcao;
    canal: CanalAcao;
    resultado: ResultadoAcao;
    observacao?: string;
    proxima_acao?: string;
    data_proxima_acao?: string;
    usuario: string;
  }) =>
    call<AcaoComercial>('lsw-crm-acao', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resumoGerencial: () =>
    call<{
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
    }>('lsw-crm-resumo'),
  assumir: (payload: { cliente_id: number; usuario_email: string; usuario_nome: string }) =>
    call<AtribuicaoResult>('lsw-crm-assumir', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  pegarProximo: (payload: { usuario_email: string; usuario_nome: string; filtro: FiltroProximo }) =>
    call<AtribuicaoResult>('lsw-crm-pegar-proximo', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  devolver: (payload: { cliente_id: number; usuario_email: string; motivo: string }) =>
    call<{ id: number; razao_social: string; cnpj: string }>('lsw-crm-devolver', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  minhaAgenda: (email: string) =>
    call<MinhaAgendaResponse>(
      `lsw-crm-minha-agenda?email=${encodeURIComponent(email)}`
    ),
  listarOportunidades: () =>
    call<{ resposta: OportunidadesResponse }>('lsw-crm-oportunidades').then(
      r => r.resposta
    ),
  criarOportunidade: (payload: {
    cliente_id: number;
    usuario_email: string;
    usuario_nome: string;
    etapa?: EtapaOportunidade;
    valor_estimado?: number;
    origem?: OrigemOportunidade;
    observacao?: string;
    data_previsao_fechamento?: string;
    probabilidade?: number;
  }) =>
    call<OportunidadeListagem>('lsw-crm-oportunidade-criar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  moverEtapaOportunidade: (payload: {
    id: number;
    etapa: EtapaOportunidade;
    motivo_perda?: string;
    valor_estimado?: number;
  }) =>
    call<OportunidadeListagem>('lsw-crm-oportunidade-etapa', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

/* ───────────────────── Oportunidades (response shape) ───────────────────── */

/** Oportunidade enriquecida que vem do BFF lsw-crm-oportunidades (com JOIN
 *  em crm_clientes e crm_indicadores_cliente + agregado dias_aberta). */
export interface OportunidadeListagem extends Oportunidade {
  razao_social: string;
  cnpj: string;
  cidade: string | null;
  uf: string | null;
  eh_carteira_luiz: boolean;
  prioridade_crm: PrioridadeCrm | null;
  status_cliente: StatusCliente | null;
  owner_nome: string | null;
  owner_email: string | null;
  dias_aberta: number;
}

export interface OportunidadesResponse {
  total: number;
  valor_total: number;
  oportunidades: OportunidadeListagem[];
}

/* ───────────────────── Permissões ───────────────────── */

/** Quem vê o módulo CRM. Por padrão todos exceto leitura. */
export const podeVerCrm = (perfil: PerfilAcesso) => perfil !== 'leitura';

/** Quem pode registrar ações e mover oportunidades. */
export const podeOperarCrm = (perfil: PerfilAcesso) => perfil !== 'leitura';

/** Quem pode gerenciar carteira (mudar owner, importar base, configurar metas). */
export const podeGerenciarCrm = (perfil: PerfilAcesso) =>
  perfil === 'admin' || perfil === 'vendas';

/* ───────────────────── Labels e tons ───────────────────── */

export const STATUS_CLIENTE_LABELS: Record<StatusCliente, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  SEM_PEDIDO: 'Sem pedido',
};

export const STATUS_CLIENTE_TONE: Record<
  StatusCliente,
  'entregue' | 'atrasado' | 'rascunho'
> = {
  ATIVO: 'entregue',
  INATIVO: 'atrasado',
  SEM_PEDIDO: 'rascunho',
};

export const FAIXA_ACAO_LABELS: Record<FaixaAcaoComercial, string> = {
  ATIVO_SAUDAVEL: 'Ativo saudável (0–30d)',
  ATIVO_EM_RISCO_31_60: 'Em risco (31–60d)',
  INATIVO_RECENTE_61_120: 'Inativo recente (61–120d)',
  INATIVO_FRIO_121_180: 'Inativo frio (121–180d)',
  DORMINDO_ACIMA_180: 'Dormindo (180d+)',
  SEM_PEDIDO: 'Sem pedido',
};

export const PRIORIDADE_TONE: Record<
  PrioridadeCrm,
  'atrasado' | 'pendente' | 'transito' | 'prioritario' | 'entregue' | 'rascunho'
> = {
  'P0 - Ataque imediato': 'atrasado',
  'P1 - Reativação alta': 'pendente',
  'P2 - Cadência normal': 'transito',
  'P3 - Ativação SDR': 'prioritario',
  'P4 - Nutrição': 'rascunho',
  'KEY ACCOUNT LUIZ': 'entregue',
};

export const PRIORIDADE_LABELS_CURTO: Record<PrioridadeCrm, string> = {
  'P0 - Ataque imediato': 'P0 · Ataque',
  'P1 - Reativação alta': 'P1 · Reativação',
  'P2 - Cadência normal': 'P2 · Cadência',
  'P3 - Ativação SDR': 'P3 · SDR',
  'P4 - Nutrição': 'P4 · Nutrição',
  'KEY ACCOUNT LUIZ': 'Key Account Luiz',
};

export const TIPO_ACAO_LABELS: Record<TipoAcao, string> = {
  LIGACAO: 'Ligação',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  VISITA: 'Visita',
  PROPOSTA: 'Proposta',
  PEDIDO_GERADO: 'Pedido gerado',
  SEM_RETORNO: 'Sem retorno',
  CADASTRO_INVALIDO: 'Cadastro inválido',
  REATIVACAO: 'Reativação',
  ATIVACAO_SEM_PEDIDO: 'Ativação',
};

export const CANAL_LABELS: Record<CanalAcao, string> = {
  TELEFONE: 'Telefone',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  PRESENCIAL: 'Presencial',
  SISTEMA: 'Sistema',
  OUTRO: 'Outro',
};

export const RESULTADO_LABELS: Record<ResultadoAcao, string> = {
  CONTATO_REALIZADO: 'Contato realizado',
  NAO_ATENDEU: 'Não atendeu',
  SEM_INTERESSE: 'Sem interesse',
  INTERESSADO: 'Interessado',
  PEDIU_CONDICAO: 'Pediu condição',
  PEDIDO_REALIZADO: 'Pedido realizado',
  RETORNAR_DEPOIS: 'Retornar depois',
  CADASTRO_DESATUALIZADO: 'Cadastro desatualizado',
  PERDIDO: 'Perdido',
  GANHO: 'Ganho',
};

export const ETAPA_LABELS: Record<EtapaOportunidade, string> = {
  NOVO: 'Novo',
  CONTATADO: 'Contatado',
  QUALIFICADO: 'Qualificado',
  PROPOSTA: 'Proposta',
  NEGOCIACAO: 'Negociação',
  GANHO: 'Ganho',
  PERDIDO: 'Perdido',
};

/** Ordem oficial das colunas do kanban */
export const ETAPAS_KANBAN: EtapaOportunidade[] = [
  'NOVO',
  'CONTATADO',
  'QUALIFICADO',
  'PROPOSTA',
  'NEGOCIACAO',
  'GANHO',
  'PERDIDO',
];

/** Tom semântico de cada etapa para colorir a coluna do kanban */
export const ETAPA_TONE: Record<EtapaOportunidade, 'frio' | 'info' | 'ok' | 'alerta' | 'urgente' | 'sucesso' | 'perdido'> = {
  NOVO:         'frio',
  CONTATADO:    'info',
  QUALIFICADO:  'info',
  PROPOSTA:     'alerta',
  NEGOCIACAO:   'urgente',
  GANHO:        'sucesso',
  PERDIDO:      'perdido',
};

export const ORIGEM_LABELS: Record<OrigemOportunidade, string> = {
  REATIVACAO:        'Reativação',
  RECOMPRA:          'Recompra',
  SEM_PEDIDO:        'Sem pedido',
  INDICACAO:         'Indicação',
  CAMPANHA:          'Campanha',
  VENDEDOR_EXTERNO:  'Vendedor externo',
  PLATAFORMA:        'Plataforma',
  OUTRO:             'Outro',
};

/* ───────────────────── Formatadores ───────────────────── */

export const fmtBRL = (v: number | null | undefined) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export const fmtNum = (v: number | null | undefined) =>
  v == null ? '—' : new Intl.NumberFormat('pt-BR').format(v);

export const fmtData = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export const fmtCnpj = (cnpj: string | null | undefined) => {
  if (!cnpj) return '—';
  const d = cnpj.replace(/\D/g, '').padStart(14, '0');
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

/** Iniciais (até 2) para avatar de cliente/owner. */
export const iniciaisDe = (nome: string | null | undefined): string => {
  if (!nome) return '—';
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '—';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};
