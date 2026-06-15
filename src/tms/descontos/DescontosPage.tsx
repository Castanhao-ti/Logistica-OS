import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { PedidoDescontoCard } from './PedidoDescontoCard';
import { PedidoDescontoDetalhe } from './PedidoDescontoDetalhe';
import { useDescontos } from './useDescontos';
import {
  isFaturado,
  STATUS_ANALISE_LABELS,
  type PedidoDesconto,
  type StatusAnalise,
} from './descontos';
import type { SessionUser } from '../auth/auth';
import './descontos.css';

type FiltroStatus = 'todos' | StatusAnalise;
type FiltroFaturado = 'todos' | 'com_nf' | 'sem_nf';
type FiltroPeriodo = 'todos' | '7d' | '15d' | '30d' | '60d' | 'custom';

const FILTROS_STATUS: Array<{ value: FiltroStatus; label: string }> = [
  { value: 'todos',                label: 'Todos'           },
  { value: 'pendente',             label: STATUS_ANALISE_LABELS.pendente             },
  { value: 'em_analise',           label: STATUS_ANALISE_LABELS.em_analise           },
  { value: 'aguardando_aprovacao', label: STATUS_ANALISE_LABELS.aguardando_aprovacao },
  { value: 'aprovado',             label: STATUS_ANALISE_LABELS.aprovado             },
  { value: 'reprovado',            label: STATUS_ANALISE_LABELS.reprovado            },
];

const FILTROS_FATURADO: Array<{ value: FiltroFaturado; label: string }> = [
  { value: 'todos',  label: 'Todos'        },
  { value: 'com_nf', label: 'Com NF'       },
  { value: 'sem_nf', label: 'Sem NF'       },
];

const FILTROS_PERIODO: Array<{ value: FiltroPeriodo; label: string }> = [
  { value: 'todos',  label: 'Todo período' },
  { value: '7d',     label: '7 dias'       },
  { value: '15d',    label: '15 dias'      },
  { value: '30d',    label: '30 dias'      },
  { value: '60d',    label: '60 dias'      },
  { value: 'custom', label: 'Personalizado'},
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

export function DescontosPage({ user }: Props) {
  const { data, loading, refreshing, error, updatedAt, refresh } = useDescontos();

  const [busca, setBusca]                 = useState('');
  const [filtro, setFiltro]               = useState<FiltroStatus>('todos');
  const [filtroNf, setFiltroNf]           = useState<FiltroFaturado>('todos');
  const [periodo, setPeriodo]             = useState<FiltroPeriodo>('todos');
  const [dataDe, setDataDe]               = useState<string>('');
  const [dataAte, setDataAte]             = useState<string>('');
  const [pedidoAberto, setPedidoAberto]   = useState<string | null>(null);
  const [toasts, setToasts]               = useState<ToastState[]>([]);

  const handlePeriodo = (p: FiltroPeriodo) => {
    setPeriodo(p);
    if (p === 'custom') {
      if (!dataAte) setDataAte(hojeIso());
      if (!dataDe)  setDataDe(diasAtras(30));
    } else if (p === 'todos') {
      setDataDe(''); setDataAte('');
    } else {
      const dias = { '7d': 7, '15d': 15, '30d': 30, '60d': 60 }[p];
      setDataDe(diasAtras(dias));
      setDataAte(hojeIso());
    }
  };

  const rangeAtivo = useMemo(() => {
    if (periodo === 'todos') return null;
    return { de: dataDe || null, ate: dataAte || null };
  }, [periodo, dataDe, dataAte]);

  const pushToast = (kind: ToastState['kind'], msg: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  /** Recorta a base pelo intervalo de data e NF — usado tanto pelos KPIs quanto pela lista. */
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

  const filtered = useMemo<PedidoDesconto[]>(() => {
    const q = busca.trim().toLowerCase();
    return baseFiltrada
      .filter(p => filtro === 'todos' || p.status_analise === filtro)
      .filter(p => {
        if (!q) return true;
        return (
          p.nome_cliente.toLowerCase().includes(q) ||
          (p.numero_pedido_cliente ?? '').toLowerCase().includes(q) ||
          p.pedido_forca_venda_key.toLowerCase().includes(q) ||
          (p.nome_vendedor ?? '').toLowerCase().includes(q)
        );
      });
  }, [baseFiltrada, filtro, busca]);

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
        <p style={{ fontWeight: 600, fontSize: 13 }}>Não foi possível carregar os pedidos.</p>
        <p style={{ fontSize: 12, color: 'var(--lsw-text-muted)' }}>{error}</p>
        <button className="dsc-btn dsc-btn--primary" style={{ marginTop: 8 }} onClick={refresh}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="dsc-header">
        <div>
          <h2 className="dsc-header__title">Análise de Pedidos com Desconto</h2>
          <p className="dsc-header__sub">
            Operadores analisam e gerentes aprovam pedidos com variação de preço.
          </p>
          {updatedAt && (
            <p className="dsc-header__stamp">Atualizado {formatRelative(updatedAt)}</p>
          )}
        </div>
        <div className="dsc-header__actions">
          <button className="dsc-btn dsc-btn--secondary" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'dsc-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="dsc-kpi-grid">
        <KpiCard label="Total"        value={counts.total}                tone="green"   />
        <KpiCard label="Pendentes"    value={counts.pendente}             tone="muted"   />
        <KpiCard label="Em análise"   value={counts.em_analise}           tone="orange"  />
        <KpiCard label="Aguardando"   value={counts.aguardando_aprovacao} tone="orange"  />
        <KpiCard label="Decididos"    value={counts.aprovado + counts.reprovado} tone="success" />
      </div>

      <input
        className="dsc-search"
        placeholder="Buscar por pedido, cliente ou vendedor…"
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      <div className="dsc-filter-group">
        <div className="dsc-filter-group__label">Período</div>
        <div className="dsc-filter-row">
          {FILTROS_PERIODO.map(f => (
            <button
              key={f.value}
              className={`dsc-pill ${periodo === f.value ? 'dsc-pill--active' : ''}`}
              onClick={() => handlePeriodo(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {periodo === 'custom' && (
          <div className="dsc-date-range">
            <label className="dsc-date-range__field">
              <span>De</span>
              <input
                type="date"
                className="dsc-date-input"
                value={dataDe}
                onChange={e => setDataDe(e.target.value)}
              />
            </label>
            <label className="dsc-date-range__field">
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

      <div className="dsc-filter-group">
        <div className="dsc-filter-group__label">Faturamento</div>
        <div className="dsc-filter-row">
          {FILTROS_FATURADO.map(f => (
            <button
              key={f.value}
              className={`dsc-pill ${filtroNf === f.value ? 'dsc-pill--active' : ''}`}
              onClick={() => setFiltroNf(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dsc-filter-group">
        <div className="dsc-filter-group__label">Status da análise</div>
        <div className="dsc-filter-row">
          {FILTROS_STATUS.map(f => (
            <button
              key={f.value}
              className={`dsc-pill ${filtro === f.value ? 'dsc-pill--active' : ''}`}
              onClick={() => setFiltro(f.value)}
            >
              {f.label}
              <span className="dsc-pill__count">
                {f.value === 'todos' ? counts.total : counts[f.value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="dsc-empty">
          <Inbox size={28} />
          <p style={{ fontSize: 13 }}>Nenhum pedido encontrado.</p>
          {busca && (
            <button className="dsc-empty__link" onClick={() => setBusca('')}>
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="dsc-list">
          {filtered.map(p => (
            <PedidoDescontoCard
              key={p.pedido_forca_venda_key}
              pedido={p}
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

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'green' | 'orange' | 'muted' | 'success' | 'danger';
}) {
  return (
    <div className="dsc-kpi-card">
      <div className={`dsc-kpi-card__value dsc-kpi-card__value--${tone}`}>{value}</div>
      <div className="dsc-kpi-card__label">{label}</div>
    </div>
  );
}

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
