import React from 'react';
import { PackageSearch, Wallet, AlertTriangle, Weight } from 'lucide-react';
import type { Order } from '../types';
import { KpiCard } from './KpiCard';

const fmtMoney = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtKg = (v: number) =>
  `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg`;

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
    <div className="kpi-grid">
      <KpiCard
        label="Pedidos para roteirizar"
        value={String(open.length)}
        reference={routed > 0 ? `${routed} roteirizados` : undefined}
        icon={<PackageSearch size={18} />}
        iconColor="#2D4A3E"
        spark={[4, 7, 5, 9, 6, 11, 8, open.length || 1]}
      />
      <KpiCard
        label="Valor em aberto"
        value={fmtMoney(totalValue)}
        icon={<Wallet size={18} />}
        iconColor="#2D4A3E"
        spark={[3, 5, 4, 8, 6, 9, 7, 10]}
      />
      <KpiCard
        label="Alertas de alto valor"
        value={String(alerts)}
        reference={alerts > 0 ? 'ação necessária' : 'tudo em dia'}
        icon={<AlertTriangle size={18} />}
        iconColor={alerts > 0 ? '#EF4444' : '#2D4A3E'}
        spark={[1, 0, 2, 1, 3, 1, 2, alerts]}
      />
      <KpiCard
        label="Peso total em aberto"
        value={fmtKg(totalWeight)}
        icon={<Weight size={18} />}
        iconColor="#2D4A3E"
        spark={[5, 6, 4, 7, 8, 6, 9, 8]}
      />
    </div>
  );
}
