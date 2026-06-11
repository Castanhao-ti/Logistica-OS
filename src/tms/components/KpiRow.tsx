import React from 'react';
import { PackageSearch, Wallet, AlertTriangle, Weight } from 'lucide-react';
import type { Order } from '../types';

const fmtMoney = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtKg = (v: number) =>
  `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg`;

function Sparkline({ points, accent = false }: { points: number[]; accent?: boolean }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const coords = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${30 - ((p - min) / range) * 26}`)
    .join(' ');
  const color = accent ? 'var(--lsw-orange)' : 'var(--lsw-green)';
  return (
    <svg className="lsw-kpi-card__sparkline" viewBox="0 0 100 32" preserveAspectRatio="none">
      <polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

interface KpiCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  spark: number[];
  badge?: string;
  badgeTone?: 'up' | 'down';
}

function KpiCard({ icon, value, label, spark, badge, badgeTone = 'up' }: KpiCardProps) {
  return (
    <div className="lsw-kpi-card">
      <div className="lsw-kpi-card__top">
        <div className="lsw-kpi-card__icon">{icon}</div>
        {badge && (
          <span className={`lsw-kpi-card__delta lsw-kpi-card__delta--${badgeTone}`}>{badge}</span>
        )}
      </div>
      <span className="lsw-kpi-card__value">{value}</span>
      <span className="lsw-kpi-card__label">{label}</span>
      <Sparkline points={spark} accent={badgeTone === 'down'} />
    </div>
  );
}

interface Props {
  orders: Order[];
}

export default function KpiRow({ orders }: Props) {
  const open = orders.filter(o => o.routing_status !== 'approved' && o.routing_status !== 'in_load');
  const totalValue = open.reduce((a, o) => a + Number(o.valor_pedido), 0);
  const totalWeight = open.reduce((a, o) => a + Number(o.peso_pedido ?? 0), 0);
  const alerts = open.filter(o => o.routing_status === 'alert_value').length;
  const routed = orders.length - open.length;

  return (
    <div className="lsw-kpi-grid">
      <KpiCard
        icon={<PackageSearch size={19} />}
        value={String(open.length)}
        label="Pedidos para roteirizar"
        badge={routed > 0 ? `${routed} roteirizados` : undefined}
        spark={[4, 7, 5, 9, 6, 11, 8, open.length || 1]}
      />
      <KpiCard
        icon={<Wallet size={19} />}
        value={fmtMoney(totalValue)}
        label="Valor em aberto"
        spark={[3, 5, 4, 8, 6, 9, 7, 10]}
      />
      <KpiCard
        icon={<AlertTriangle size={19} />}
        value={String(alerts)}
        label="Alertas de alto valor"
        badge={alerts > 0 ? 'ação necessária' : 'tudo em dia'}
        badgeTone={alerts > 0 ? 'down' : 'up'}
        spark={[1, 0, 2, 1, 3, 1, 2, alerts]}
      />
      <KpiCard
        icon={<Weight size={19} />}
        value={fmtKg(totalWeight)}
        label="Peso total em aberto"
        spark={[5, 6, 4, 7, 8, 6, 9, 8]}
      />
    </div>
  );
}
