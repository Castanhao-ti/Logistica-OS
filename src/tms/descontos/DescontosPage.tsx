import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileBarChart2,
  Inbox,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tags,
  Users,
  XCircle,
} from 'lucide-react';
import { PedidoDescontoCard } from './PedidoDescontoCard';
import { PedidoDescontoDetalhe } from './PedidoDescontoDetalhe';
import { useDescontos } from './useDescontos';
import {
  fmtBRL,
  isFaturado,
  STATUS_ANALISE_LABELS,
  type PedidoDesconto,
  type SortKey,
  type StatusAnalise,
} from './descontos';
import type { SessionUser } from '../auth/auth';
import './descontos.css';

/* ───────────────────── Tipos e constantes ───────────────────── */

type FiltroStatus = 'todos' | StatusAnalise;
type FiltroFaturado = 'todos' | 'com_nf' | 'sem_nf';
type FiltroPeriodo = 'todos' | '7d' | '15d' | '30d' | '60d' | 'custom';
type AbaInterna = 'visao_geral' | 'pedidos' | 'aprovacoes' | 'clientes' | 'relatorios';

const ABAS: Array<{ value: AbaInterna; label: string; icon: React.ReactNode }> = [
  { value: 'visao_geral', label: 'Visão geral',         icon: <LayoutDashboard size={15} /> },
  { value: 'pedidos',     label: 'Pedidos com desconto', icon: <Tags size={15} />            },
  { value: 'aprovacoes',  label: 'Aprovações',           icon: <ShieldCheck size={15} />     },
  { value: 'clientes',    label: 'Clientes',             icon: <Users size={15} />           },
  { value: 'relatorios',  label: 'Relatórios',           icon: <FileBarChart2 size={15} />   },
];

const FILTROS_STATUS: Array<{ value: FiltroStatus; label: string }> = [
  { value: 'todos',                label: 'Todos'           },
  { value: 'pendente',             label: STATUS_ANALISE_LABELS.pendente             },
  { value: 'em_analise',           label: STATUS_ANALISE_LABELS.em_analise           },
  { value: 'aguardando_aprovacao', label: STATUS_ANALISE_LABELS.aguardando_aprovacao },
  { value: 'aprovado',             label: STATUS_ANALISE_LABELS.aprovado             },
  { value: 'reprovado',            label: STATUS_ANALISE_LABELS.reprovado            },
];

const FILTROS_FATURADO: Array<{ value: FiltroFaturado; label: string }> = [
  { value: 'todos',  label: 'Todos'  },
  { value: 'com_nf', label: 'Com NF' },
  { value: 'sem_nf', label: 'Sem NF' },
];

const FILTROS_PERIODO: Array<{ value: FiltroPeriodo; label: string }> = [
  { value: 'todos',  label: 'Todo período'  },
  { value: '7d',     label: '7 dias'        },
  { value: '15d',    label: '15 dias'       },
  { value: '30d',    label: '30 dias'       },
  { value: '60d',    label: '60 dias'       },
  { value: 'custom', label: 'Personalizado' },
];

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'desconto', label: 'Maior desconto %' },
  { value: 'margem',   label: 'Menor margem'     },
  { value: 'data',     label: 'Mais recentes'    },
];

function diasAtras(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function formatRelative(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return date.toLocaleDateString('pt-BR');
}

interface ToastState {
  id: number;
  kind: 'success' | 'error';
  msg: string;
}

interface Props {
  user: SessionUser;
}

/* ───────────────────── Componente principal ───────────────────── */

export function DescontosPage({ user }: Props) {
  const [aba, setAba] = useState<AbaInterna>('pedidos');

  return (
    <div className="dsc-shell">
      <nav className="dsc-tabs-bar" role="tablist">
        {ABAS.map(t => (
          <button
            key={t.value}
            role="tab"
            aria-selected={aba === t.value}
            className={`dsc-tabbtn ${aba === t.value ? 'dsc-tabbtn--active' : ''}`}
            onClick={() => setAba(t.value)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {aba === 'pedidos' ? (
        <PedidosTab user={user} />
      ) : (
        <PlaceholderTab aba={aba} />
      )}
    </div>
  );
}

/* ───────────────────── Aba: Pedidos com desconto ───────────────────── */

function PedidosTab({ user }: { user: SessionUser }) {
  const { data, loading, refreshing, error, updatedAt, refresh } = useDescontos();

  const [busca, setBusca]               = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [vendedor, setVendedor]         = useState<string>('todos');
  const [sort, setSort]                 = useState<SortKey>('desconto');
  const [filtroNf, setFiltroNf]         = useState<FiltroFaturado>('todos');
  const [periodo, setPeriodo]           = useState<FiltroPeriodo>('todos');
  const [dataDe, setDataDe]             = useState('');
  const [dataAte, setDataAte]           = useState('');
  const [maisFiltros, setMaisFiltros]   = useState(false);
  const [pedidoAberto, setPedidoAberto] = useState<string | null>(null);
  const [toasts, setToasts]             = useState<ToastState[]>([]);

  const pushToast = (kind: ToastState['kind'], msg: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const handlePeriodo = (p: FiltroPeriodo) => {
    setPeriodo(p);
    if (p === 'custom') {
      if (!dataAte) setDataAte(hojeIso());
      if (!dataDe)  setDataDe(diasAtras(30));
    } else if (p === 'todos') {
      setDataDe(''); setDataAte('');
    } else {
      const dias = { '7d': 7, '15d': 15, '30d': 30, '60d': 60 }[p];
      setDataDe(diasAtras(dias)); setDataAte(hojeIso());
    }
  };

  const rangeAtivo = useMemo(() => {
    if (periodo === 'todos') return null;
    return { de: dataDe || null, ate: dataAte || null };
  }, [periodo, dataDe, dataAte]);

  /* Recorte por data + NF — base para tudo */
  const baseFiltrada = useMemo<PedidoDesconto[]>(() => {
    return data
      .filter(p => {
        if (!rangeAtivo) return true;
        const d = (p.data_solicitacao ?? '').slice(0, 10);
        if (rangeAtivo.de  && d < rangeAtivo.de)  return false;
        if (rangeAtivo.ate && d > rangeAtivo.ate) return false;
        return true;
      })
      .filter(p => {
        if (filtroNf === 'todos') return true;
        const fat = isFaturado(p.status_pedido);
        return filtroNf === 'com_nf' ? fat : !fat;
      });
  }, [data, rangeAtivo, filtroNf]);

  /* Vendedores únicos para o select */
  const vendedoresDisponiveis = useMemo(() => {
    const set = new Set<string>();
    baseFiltrada.forEach(p => p.nome_vendedor && set.add(p.nome_vendedor));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [baseFiltrada]);

  /* Contadores por status (sobre baseFiltrada) */
  const counts = useMemo(() => {
    const acc: Record<StatusAnalise | 'total', number> = {
      total: baseFiltrada.length,
      pendente: 0,
      em_analise: 0,
      aguardando_aprovacao: 0,
      aprovado: 0,
      reprovado: 0,
    };
    baseFiltrada.forEach(p => { acc[p.status_analise]++; });
    return acc;
  }, [baseFiltrada]);

  /* Lista filtrada + ordenada (status, vendedor, busca, sort) */
  const filtered = useMemo<PedidoDesconto[]>(() => {
    const q = busca.trim().toLowerCase();
    const list = baseFiltrada
      .filter(p => filtroStatus === 'todos' || p.status_analise === filtroStatus)
      .filter(p => vendedor === 'todos' || p.nome_vendedor === vendedor)
      .filter(p => {
        if (!q) return true;
        return (
          p.nome_cliente.toLowerCase().includes(q) ||
          (p.numero_pedido_cliente ?? '').toLowerCase().includes(q) ||
          p.pedido_forca_venda_key.toLowerCase().includes(q) ||
          (p.nome_vendedor ?? '').toLowerCase().includes(q)
        );
      });

    const sorted = [...list];
    if (sort === 'desconto') {
      sorted.sort((a, b) => {
        const da = a.valor_pedido > 0 ? Math.abs(a.valor_desconto) / a.valor_pedido : 0;
        const db = b.valor_pedido > 0 ? Math.abs(b.valor_desconto) / b.valor_pedido : 0;
        return db - da;
      });
    } else if (sort === 'margem') {
      sorted.sort((a, b) => (a.perc_margem ?? 999) - (b.perc_margem ?? 999));
    } else {
      sorted.sort((a, b) =>
        (b.data_solicitacao ?? '').localeCompare(a.data_solicitacao ?? ''),
      );
    }
    return sorted;
  }, [baseFiltrada, filtroStatus, vendedor, busca, sort]);

  /* Total de desconto acumulado da seleção atual */
  const descontoAcumulado = useMemo(
    () => filtered.reduce((acc, p) => acc + Math.abs(p.valor_desconto), 0),
    [filtered],
  );

  if (loading) {
    return (
      <div className="dsc-loading">
        <Loader2 size={28} className="dsc-spin" />
        <p style={{ fontSize: 13 }}>Carregando pedidos com desconto…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dsc-error-state">
        <AlertCircle size={28} />
        <p style={{ fontWeight: 600, fontSize: 13 }}>Não foi possível carregar.</p>
        <p style={{ fontSize: 12, color: 'var(--lsw-text-muted)' }}>{error}</p>
        <button className="dsc-btn dsc-btn--primary" style={{ marginTop: 8 }} onClick={refresh}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="dsc-tab-content">
      {/* Sub-header */}
      <div className="dsc-subheader">
        <div className="dsc-subheader__title-area">
          <h2 className="dsc-subheader__title">Pedidos com desconto</h2>
          <p className="dsc-subheader__sub">
            Análise e solicitação de aprovação.
            {updatedAt && (
              <span className="dsc-subheader__stamp"> · Atualizado {formatRelative(updatedAt)}</span>
            )}
          </p>
        </div>
        <div className="dsc-subheader__stats">
          <div className="dsc-stat">
            <span className="dsc-stat__label">Pedidos</span>
            <span className="dsc-stat__value">{filtered.length}</span>
          </div>
          <div className="dsc-stat">
            <span className="dsc-stat__label">Desconto total</span>
            <span className="dsc-stat__value dsc-stat__value--accent">
              {fmtBRL(-descontoAcumulado)}
            </span>
          </div>
          <button className="dsc-icon-btn dsc-icon-btn--lg" onClick={refresh} disabled={refreshing} title="Atualizar">
            <RefreshCw size={16} className={refreshing ? 'dsc-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filtros principais */}
      <div className="dsc-filterbar">
        <div className="dsc-search">
          <Search size={15} className="dsc-search__icon" />
          <input
            className="dsc-search__input"
            placeholder="Buscar por nº, cliente ou vendedor…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        <div className="dsc-select">
          <select
            className="dsc-select__field"
            value={vendedor}
            onChange={e => setVendedor(e.target.value)}
          >
            <option value="todos">Todos os vendedores</option>
            {vendedoresDisponiveis.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div className="dsc-select dsc-select--with-icon">
          <SlidersHorizontal size={14} className="dsc-select__icon" />
          <select
            className="dsc-select__field"
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <button
          className="dsc-btn dsc-btn--ghost dsc-btn--small"
          onClick={() => setMaisFiltros(v => !v)}
        >
          {maisFiltros ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Mais filtros
        </button>
      </div>

      {/* Chips de status */}
      <div className="dsc-chips">
        {FILTROS_STATUS.map(f => (
          <button
            key={f.value}
            className={`dsc-chip ${filtroStatus === f.value ? 'dsc-chip--active' : ''}`}
            onClick={() => setFiltroStatus(f.value)}
          >
            {f.label}
            <span className="dsc-chip__count">
              {f.value === 'todos' ? counts.total : counts[f.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Filtros secundários (período + NF) */}
      {maisFiltros && (
        <div className="dsc-filters-extra">
          <div className="dsc-filter-row">
            <span className="dsc-filter-row__label">Período</span>
            <div className="dsc-chips dsc-chips--compact">
              {FILTROS_PERIODO.map(f => (
                <button
                  key={f.value}
                  className={`dsc-chip ${periodo === f.value ? 'dsc-chip--active' : ''}`}
                  onClick={() => handlePeriodo(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {periodo === 'custom' && (
              <div className="dsc-date-range">
                <label>
                  <span>De</span>
                  <input
                    type="date"
                    className="dsc-date-input"
                    value={dataDe}
                    onChange={e => setDataDe(e.target.value)}
                  />
                </label>
                <label>
                  <span>Até</span>
                  <input
                    type="date"
                    className="dsc-date-input"
                    value={dataAte}
                    onChange={e => setDataAte(e.target.value)}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="dsc-filter-row">
            <span className="dsc-filter-row__label">Faturamento</span>
            <div className="dsc-chips dsc-chips--compact">
              {FILTROS_FATURADO.map(f => (
                <button
                  key={f.value}
                  className={`dsc-chip ${filtroNf === f.value ? 'dsc-chip--active' : ''}`}
                  onClick={() => setFiltroNf(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid de cards */}
      {filtered.length === 0 ? (
        <div className="dsc-empty">
          <Inbox size={28} />
          <p style={{ fontSize: 13 }}>Nenhum pedido encontrado com esses filtros.</p>
          {busca && (
            <button className="dsc-empty__link" onClick={() => setBusca('')}>
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="dsc-grid">
          {filtered.map(p => (
            <PedidoDescontoCard
              key={p.pedido_forca_venda_key}
              pedido={p}
              selected={pedidoAberto === p.pedido_forca_venda_key}
              onClick={() => setPedidoAberto(p.pedido_forca_venda_key)}
            />
          ))}
        </div>
      )}

      {pedidoAberto && (
        <PedidoDescontoDetalhe
          pedidoKey={pedidoAberto}
          user={user}
          onClose={() => setPedidoAberto(null)}
          onAcaoOk={msg => {
            pushToast('success', msg);
            refresh();
          }}
        />
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}

/* ───────────────────── Abas placeholder ───────────────────── */

function PlaceholderTab({ aba }: { aba: AbaInterna }) {
  const LABEL: Record<AbaInterna, string> = {
    visao_geral: 'Visão geral',
    pedidos:     'Pedidos com desconto',
    aprovacoes:  'Aprovações',
    clientes:    'Clientes',
    relatorios:  'Relatórios',
  };
  return (
    <div className="dsc-placeholder">
      <Sparkles size={32} />
      <h2 className="dsc-placeholder__title">{LABEL[aba]}</h2>
      <p className="dsc-placeholder__sub">Em breve.</p>
    </div>
  );
}

/* ───────────────────── Toast stack ───────────────────── */

function ToastStack({ toasts }: { toasts: ToastState[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="dsc-toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`dsc-toast dsc-toast--${t.kind}`}>
          {t.kind === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
