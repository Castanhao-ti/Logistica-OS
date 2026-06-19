import React from 'react';

export type StatusTone =
  | 'entregue'
  | 'transito'
  | 'pendente'
  | 'atrasado'
  | 'prioritario'
  | 'rascunho';

interface Props {
  tone: StatusTone;
  children: React.ReactNode;
  title?: string;
}

export function StatusChip({ tone, children, title }: Props) {
  return (
    <span className={`status-chip status-chip--${tone}`} title={title}>
      <span className="status-chip__dot" aria-hidden />
      <span className="status-chip__label">{children}</span>
    </span>
  );
}

export default StatusChip;
