import React from 'react';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  count: number;
  total: number;
  weight: number;
  onCancel: () => void;
  onGenerate: () => void;
}

export default function BatchActionBar({ count, total, weight, onCancel, onGenerate }: Props) {
  return (
    <div className="tms-batch-bar">
      <span className="tms-batch-bar__info">
        <strong>{count}</strong> pedido{count !== 1 ? 's' : ''} selecionado{count !== 1 ? 's' : ''}
        <span className="tms-batch-bar__sep"> · </span>
        Total: <strong>{fmt(total)}</strong>
        <span className="tms-batch-bar__sep"> · </span>
        Peso: <strong>{weight.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg</strong>
      </span>
      <span className="tms-batch-bar__spacer" />
      <button className="tms-batch-bar__cancel" onClick={onCancel}>
        Cancelar
      </button>
      <button className="tms-btn--gerar-carga" onClick={onGenerate}>
        → Gerar Carga
      </button>
    </div>
  );
}
