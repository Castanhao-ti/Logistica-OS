import React from 'react';
import type { Order } from '../types';
import { StatusChip, type StatusTone } from './StatusChip';

const fmt = (v: number | null) =>
  v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '—';
const fmtW = (v: number | null) =>
  v != null ? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v)} kg` : '—';
const fmtDate = (v: string | null) =>
  v ? new Date(v).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—';
const fmtDateTime = (v: string | null) =>
  v ? new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

function statusTone(status: string | null): StatusTone {
  if (!status) return 'pendente';
  const s = status.toLowerCase();
  if (s.includes('cancel') || s.includes('extrav') || s.includes('avari') || s.includes('denegad')) return 'atrasado';
  if (s.includes('autoriz') || s.includes('entreg') || s.includes('realizad') || s.includes('conclu') || s.includes('fatur')) return 'entregue';
  if (s.includes('trânsit') || s.includes('transit') || s.includes('saiu') || s.includes('coleta')) return 'transito';
  return 'pendente';
}

function StatusBadge({ status, fallback }: { status: string | null; fallback: string }) {
  return <StatusChip tone={statusTone(status)}>{status ?? fallback}</StatusChip>;
}

interface Props {
  orders: Order[];
}

export default function NotasFiscaisTable({ orders }: Props) {
  return (
    <table className="tms-table">
      <thead>
        <tr>
          <th>Nº Pedido</th>
          <th>Cliente</th>
          <th>NF</th>
          <th>Valor NF</th>
          <th>Transportadora / Motorista</th>
          <th>CTe</th>
          <th>Rastreamento</th>
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order.id}>
            <td>
              <span className="tms-cell-mono">{order.pedido_forca_venda_key}</span>
            </td>
            <td>
              <span className="tms-cell-cliente" title={order.nome_razao_cliente}>
                {order.nome_razao_cliente}
              </span>
            </td>
            <td>
              <span className="tms-cell-mono">{order.nf_numero ?? '—'}</span>
              <br />
              <span className="tms-cell-location">{fmtDate(order.data_emissao_nf)}</span>
            </td>
            <td>
              <span className="tms-cell-value">{fmt(order.valor_nota_fiscal)}</span>
              <br />
              <span className="tms-cell-location">{order.qtde_total_nf ?? '—'} itens · {fmtW(order.peso_nf)}</span>
            </td>
            <td>
              <span className="tms-cell-cliente" title={order.nome_transportadora_nf ?? undefined}>
                {order.nome_transportadora_nf ?? '—'}
              </span>
              <br />
              <span className="tms-cell-location">{order.nome_motorista ?? '—'}</span>
            </td>
            <td>
              {order.numero_cte ? (
                <>
                  <span className="tms-cell-mono">{order.numero_cte}</span>
                  <br />
                  <span className="tms-cell-location">{fmt(order.valor_cte)} · {order.status_cte ?? '—'}</span>
                </>
              ) : '—'}
            </td>
            <td>
              {order.ultima_ocorrencia_status ? (
                <>
                  <StatusBadge status={order.ultima_ocorrencia_status} fallback="—" />
                  <br />
                  <span className="tms-cell-location">{fmtDateTime(order.ultima_ocorrencia_data)}</span>
                </>
              ) : (
                <StatusChip tone="rascunho">Sem rastreio</StatusChip>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
