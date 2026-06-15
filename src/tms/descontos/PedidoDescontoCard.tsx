import React from 'react';
import { FileText } from 'lucide-react';
import {
  fmtBRL,
  fmtData,
  fmtPerc,
  iniciaisVendedor,
  isFaturado,
  percDesconto,
  STATUS_ANALISE_LABELS,
  tomMargem,
  type PedidoDesconto,
} from './descontos';

interface Props {
  pedido: PedidoDesconto;
  selected?: boolean;
  onClick: () => void;
}

export function PedidoDescontoCard({ pedido, selected, onClick }: Props) {
  const percDesc = percDesconto(
    pedido.valor_pedido,
    pedido.valor_desconto,
    pedido.valor_acrescimo,
  );
  const margemTom = tomMargem(pedido.perc_margem);
  const margemFmt =
    pedido.perc_margem == null
      ? '—'
      : `${pedido.perc_margem.toFixed(1).replace('.', ',')}%`;
  const faturado = isFaturado(pedido.status_pedido);
  const iniciais = iniciaisVendedor(pedido.nome_vendedor);

  return (
    <article
      className={`dsc-card ${selected ? 'dsc-card--selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {/* Bloco 1 — identificação */}
      <header className="dsc-card__head">
        <div className="dsc-card__id">
          <span className="dsc-card__numero">
            #{pedido.numero_pedido_cliente ?? pedido.pedido_forca_venda_key}
          </span>
          <span className="dsc-card__pfv">PFV {pedido.pedido_forca_venda_key}</span>
        </div>
        <span className={`dsc-status dsc-status--${pedido.status_analise}`}>
          {STATUS_ANALISE_LABELS[pedido.status_analise]}
        </span>
      </header>

      <div className="dsc-card__cliente-row">
        <div className="dsc-card__cliente" title={pedido.nome_cliente}>
          {pedido.nome_cliente}
        </div>
        <div className="dsc-card__data">
          {fmtData(pedido.data_solicitacao)}
          {faturado && (
            <span className="dsc-tag dsc-tag--nf">
              <FileText size={10} /> NF
            </span>
          )}
        </div>
      </div>

      {/* Bloco 2 — métricas */}
      <div className="dsc-card__metrics">
        <div className="dsc-card__metric">
          <span className="dsc-card__metric-label">Total</span>
          <span className="dsc-card__metric-value">{fmtBRL(pedido.valor_pedido)}</span>
        </div>
        <div className="dsc-card__metric">
          <span className="dsc-card__metric-label">Desconto</span>
          <span
            className={`dsc-card__metric-value ${
              pedido.valor_desconto < 0 ? 'dsc-card__metric-value--negative' : ''
            }`}
          >
            {fmtBRL(pedido.valor_desconto)}
          </span>
          <span className="dsc-card__metric-sub">{fmtPerc(percDesc)}</span>
        </div>
      </div>

      {/* Bloco 3 — vendedor + margem */}
      <footer className="dsc-card__foot">
        <div className="dsc-card__vendedor">
          <span className="dsc-avatar" aria-hidden>{iniciais}</span>
          <span className="dsc-card__vendedor-nome" title={pedido.nome_vendedor ?? ''}>
            {pedido.nome_vendedor ?? 'Sem vendedor'}
          </span>
        </div>
        <span className={`dsc-margem dsc-margem--${margemTom}`}>
          Margem {margemFmt}
        </span>
      </footer>
    </article>
  );
}
