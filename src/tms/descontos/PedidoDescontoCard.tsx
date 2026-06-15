import React from 'react';
import { Calendar, FileText, ShoppingBag, User } from 'lucide-react';
import {
  fmtBRL,
  fmtData,
  fmtPerc,
  isFaturado,
  percDesconto,
  STATUS_ANALISE_LABELS,
  tomMargem,
  type PedidoDesconto,
} from './descontos';

interface Props {
  pedido: PedidoDesconto;
  onClick: () => void;
}

export function PedidoDescontoCard({ pedido, onClick }: Props) {
  const margemTom = tomMargem(pedido.perc_margem);
  const margemFmt =
    pedido.perc_margem == null
      ? '—'
      : `${pedido.perc_margem.toFixed(1).replace('.', ',')}%`;

  const percDesc = percDesconto(
    pedido.valor_pedido,
    pedido.valor_desconto,
    pedido.valor_acrescimo,
  );
  const faturado = isFaturado(pedido.status_pedido);

  return (
    <div className="dsc-card" onClick={onClick} role="button" tabIndex={0}>
      <div>
        <div className="dsc-card__head">
          <span className="dsc-card__pedido">
            #{pedido.numero_pedido_cliente ?? pedido.pedido_forca_venda_key}
          </span>
          <span className="dsc-card__pfv">PFV {pedido.pedido_forca_venda_key}</span>
          <span className={`dsc-status dsc-status--${pedido.status_analise}`}>
            {STATUS_ANALISE_LABELS[pedido.status_analise]}
          </span>
          {faturado && (
            <span className="dsc-tag dsc-tag--nf">
              <FileText size={11} /> NF
            </span>
          )}
          <span className={`dsc-margem dsc-margem--${margemTom}`}>
            Margem {margemFmt}
          </span>
        </div>
        <div className="dsc-card__cliente">{pedido.nome_cliente}</div>
        <div className="dsc-card__meta">
          <span><Calendar size={12} /> <strong>{fmtData(pedido.data_solicitacao)}</strong></span>
          <span><User size={12} /> {pedido.nome_vendedor ?? '—'}</span>
          <span><ShoppingBag size={12} /> {pedido.qtde_skus_com_desconto}/{pedido.qtde_skus} skus c/ desconto</span>
        </div>
      </div>

      <div className="dsc-card__numbers">
        <div>
          <div className="dsc-card__num-label">Valor</div>
          <div className="dsc-card__num-value">{fmtBRL(pedido.valor_pedido)}</div>
        </div>
        <div>
          <div className="dsc-card__num-label">Desconto</div>
          <div
            className={
              pedido.valor_desconto < 0
                ? 'dsc-card__num-value dsc-card__num-value--negative'
                : 'dsc-card__num-value'
            }
          >
            {fmtBRL(pedido.valor_desconto)}
          </div>
          <div className="dsc-card__num-perc">{fmtPerc(percDesc)}</div>
        </div>
        <div>
          <div className="dsc-card__num-label">Lucro</div>
          <div
            className={
              pedido.lucro_bruto != null && pedido.lucro_bruto < 0
                ? 'dsc-card__num-value dsc-card__num-value--negative'
                : pedido.lucro_bruto != null && pedido.lucro_bruto > 0
                  ? 'dsc-card__num-value dsc-card__num-value--positive'
                  : 'dsc-card__num-value'
            }
          >
            {fmtBRL(pedido.lucro_bruto)}
          </div>
        </div>
      </div>
    </div>
  );
}
