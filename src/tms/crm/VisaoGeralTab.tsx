import React from 'react';
import {
  AlertTriangle,
  Crown,
  DollarSign,
  PhoneCall,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  Users,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { fmtBRL, fmtNum } from './crm';
import { useCrmResumo } from './useCrmResumo';

export function VisaoGeralTab() {
  const { data, loading, error, refresh } = useCrmResumo();

  if (loading && !data) {
    return (
      <div className="crm-stub-card" style={{ textAlign: 'center' }}>
        <Sparkles size={20} style={{ opacity: 0.5, marginBottom: 8 }} />
        <p className="crm-stub-card__desc">Carregando indicadores da carteira…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="crm-stub-card">
        <h3 className="crm-stub-card__title">Não foi possível carregar o resumo</h3>
        <p className="crm-stub-card__desc">{error || 'Resposta vazia do servidor.'}</p>
        <button className="crm-btn" onClick={refresh}>
          <RefreshCw size={14} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="crm-kpi-grid">
        <KpiCard
          label="Total na carteira"
          value={fmtNum(data.total_clientes)}
          reference={`${fmtNum(data.fora_luiz)} fora da carteira Luiz`}
          icon={<Users size={16} />}
          iconColor="#2C503E"
        />
        <KpiCard
          label="Ativos (≤60d)"
          value={fmtNum(data.ativos)}
          reference={`${((data.ativos / Math.max(data.total_clientes, 1)) * 100).toFixed(1)}% da base`}
          icon={<Sparkles size={16} />}
          iconColor="#22c55e"
        />
        <KpiCard
          label="Inativos (>60d)"
          value={fmtNum(data.inativos)}
          reference={`${fmtNum(data.acima_60_dias)} para reativação`}
          icon={<TrendingDown size={16} />}
          iconColor="#D05F02"
        />
        <KpiCard
          label="Sem pedido"
          value={fmtNum(data.sem_pedido)}
          reference="Foco do SDR"
          icon={<PhoneCall size={16} />}
          iconColor="#3b82f6"
        />
        <KpiCard
          label="P0 — Ataque imediato"
          value={fmtNum(data.p0)}
          reference={`+ ${fmtNum(data.p1)} P1 (reativação alta)`}
          icon={<Target size={16} />}
          iconColor="#ef4444"
        />
        <KpiCard
          label="Em risco (>30d)"
          value={fmtNum(data.acima_30_dias)}
          reference="Janela 31–60d entra em P0"
          icon={<AlertTriangle size={16} />}
          iconColor="#f59e0b"
        />
        <KpiCard
          label="Carteira Luiz Bobko"
          value={fmtNum(data.carteira_luiz)}
          reference="Key Account separada"
          icon={<Crown size={16} />}
          iconColor="#8b5cf6"
        />
        <KpiCard
          label="Venda histórica total"
          value={fmtBRL(data.venda_historica_total)}
          reference={`Ticket médio ${fmtBRL(data.ticket_medio_geral)}`}
          icon={<DollarSign size={16} />}
          iconColor="#2C503E"
        />
      </div>

      <div className="crm-distrib-grid">
        <div className="crm-distrib-card">
          <h4 className="crm-distrib-card__title">Distribuição por prioridade</h4>
          <DistribRow label="P0 — Ataque imediato" value={data.p0} total={data.total_clientes} color="#ef4444" />
          <DistribRow label="P1 — Reativação alta" value={data.p1} total={data.total_clientes} color="#f97316" />
          <DistribRow label="P2 — Cadência normal" value={data.p2 ?? 0} total={data.total_clientes} color="#eab308" />
          <DistribRow label="P3 — Ativação SDR" value={data.p3 ?? 0} total={data.total_clientes} color="#3b82f6" />
          <DistribRow label="P4 — Nutrição" value={data.p4 ?? 0} total={data.total_clientes} color="#6b7280" />
          <DistribRow label="Key Account Luiz" value={data.carteira_luiz} total={data.total_clientes} color="#8b5cf6" />
        </div>

        <div className="crm-distrib-card">
          <h4 className="crm-distrib-card__title">Distribuição por status</h4>
          <DistribRow label="Ativos (≤60 dias)" value={data.ativos} total={data.total_clientes} color="#22c55e" />
          <DistribRow label="Inativos (>60 dias)" value={data.inativos} total={data.total_clientes} color="#ef4444" />
          <DistribRow label="Sem pedido" value={data.sem_pedido} total={data.total_clientes} color="#9ca3af" />
        </div>
      </div>
    </>
  );
}

function DistribRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="crm-distrib-row">
      <div className="crm-distrib-row__head">
        <span className="crm-distrib-row__label">{label}</span>
        <span className="crm-distrib-row__value">
          {fmtNum(value)} <span className="crm-distrib-row__pct">{pct.toFixed(1)}%</span>
        </span>
      </div>
      <div className="crm-distrib-row__bar">
        <div className="crm-distrib-row__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
