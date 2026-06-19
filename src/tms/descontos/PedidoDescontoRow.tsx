import React from 'react';
import { CheckCircle2, Receipt, XCircle } from 'lucide-react';
import {
  fmtBRL,
  fmtData,
  fmtPerc,
  iniciaisVendedor,
  isFaturado,
  MARGEM_TONE,
  percDesconto,
  STATUS_ANALISE_LABELS,
  STATUS_ANALISE_TONE,
  tomMargem,
  type PedidoDesconto,
} from './descontos';
import { StatusChip } from '../components/StatusChip';

interface Props {
  pedido: PedidoDesconto;
  selected?: boolean;
  canDecide?: boolean;
  onClick: () => void;
  onAprovar?: (p: PedidoDesconto) => void;
  onReprovar?: (p: PedidoDesconto) => void;
}

export function PedidoDescontoRow({
  pedido,
  selected,
  canDecide,
  onClick,
  onAprovar,
  onReprovar,
}: Props) {
  const acionavel = canDecide && pedido.status_analise === 'aguardando_aprovacao';

  const handleAprovar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAprovar?.(pedido);
  };
  const handleReprovar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReprovar?.(pedido);
  };

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
    <tr
      className={`dsc-row ${selected ? 'dsc-row--selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <td>
        <div className="dsc-row__pedido">
          <span className="dsc-row__numero">
            #{pedido.numero_pedido_cliente ?? pedido.pedido_forca_venda_key}
          </span>
          {faturado && (
            <span className="dsc-row__nf" title="Faturado com NF">
              <Receipt size={12} />
            </span>
          )}
        </div>
        <span className="tms-cell-location">PFV {pedido.pedido_forca_venda_key}</span>
      </td>
      <td>
        <span className="tms-cell-mono">{fmtData(pedido.data_solicitacao)}</span>
      </td>
      <td>
        <span className="tms-cell-cliente" title={pedido.nome_cliente}>
          {pedido.nome_cliente}
        </span>
      </td>
      <td>
        <div className="dsc-row__vendedor">
          <span className="dsc-avatar" aria-hidden>{iniciais}</span>
          <span className="dsc-row__vendedor-nome" title={pedido.nome_vendedor ?? ''}>
            {pedido.nome_vendedor ?? 'Sem vendedor'}
          </span>
        </div>
      </td>
      <td className="num">
        <span className="tms-cell-value">{fmtBRL(pedido.valor_pedido)}</span>
      </td>
      <td className="num">
        <span
          className={`tms-cell-value ${
            pedido.valor_desconto < 0 ? 'dsc-row__desconto--negative' : ''
          }`}
        >
          {fmtBRL(pedido.valor_desconto)}
        </span>
        <br />
        <span className="tms-cell-location">{fmtPerc(percDesc)}</span>
      </td>
      <td>
        <StatusChip tone={MARGEM_TONE[margemTom]}>{margemFmt}</StatusChip>
      </td>
      <td>
        <StatusChip tone={STATUS_ANALISE_TONE[pedido.status_analise]}>
          {STATUS_ANALISE_LABELS[pedido.status_analise]}
        </StatusChip>
      </td>
      <td className="dsc-row__acoes-cell">
        {acionavel ? (
          <div className="dsc-row__acoes">
            <button
              type="button"
              className="dsc-row__acao dsc-row__acao--aprovar"
              onClick={handleAprovar}
              title="Aprovar pedido"
              aria-label="Aprovar pedido"
            >
              <CheckCircle2 size={16} />
            </button>
            <button
              type="button"
              className="dsc-row__acao dsc-row__acao--reprovar"
              onClick={handleReprovar}
              title="Reprovar pedido"
              aria-label="Reprovar pedido"
            >
              <XCircle size={16} />
            </button>
          </div>
        ) : (
          <span className="tms-cell-location">—</span>
        )}
      </td>
    </tr>
  );
}
