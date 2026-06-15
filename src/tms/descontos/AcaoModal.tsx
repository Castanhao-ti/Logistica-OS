import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  descontosApi,
  fmtBRL,
  type AcaoAnalise,
  type DetalhePedido,
} from './descontos';

interface Props {
  pedido: DetalhePedido;
  acao: AcaoAnalise;
  usuario: string;
  observacaoObrigatoria?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TITULOS: Record<AcaoAnalise, string> = {
  iniciar_analise:     'Iniciar análise do pedido',
  solicitar_aprovacao: 'Solicitar aprovação ao gerente',
  aprovar:             'Aprovar pedido',
  reprovar:            'Reprovar pedido',
};

const CONFIRMS: Record<AcaoAnalise, string> = {
  iniciar_analise:     'Confirmar',
  solicitar_aprovacao: 'Solicitar aprovação',
  aprovar:             'Aprovar',
  reprovar:            'Reprovar',
};

const CLASSE_BTN: Record<AcaoAnalise, string> = {
  iniciar_analise:     'dsc-btn dsc-btn--primary',
  solicitar_aprovacao: 'dsc-btn dsc-btn--primary',
  aprovar:             'dsc-btn dsc-btn--success',
  reprovar:            'dsc-btn dsc-btn--danger',
};

export function AcaoModal({
  pedido,
  acao,
  usuario,
  observacaoObrigatoria,
  onClose,
  onSuccess,
}: Props) {
  const [observacao, setObservacao] = useState('');
  const [enviando, setEnviando]     = useState(false);
  const [erro, setErro]             = useState<string | null>(null);

  const cab = pedido.cabecalho;
  const margem = cab?.perc_margem;
  const margemFmt =
    margem == null ? '—' : `${margem.toFixed(1).replace('.', ',')}%`;

  const handleSubmit = async () => {
    setErro(null);
    if (observacaoObrigatoria && !observacao.trim()) {
      setErro('A observação é obrigatória para esta ação.');
      return;
    }
    setEnviando(true);
    try {
      await descontosApi.acao({
        pedido_forca_venda_key: pedido.pedido_forca_venda_key,
        acao,
        usuario,
        observacao: observacao.trim() || undefined,
      });
      onSuccess();
    } catch (e) {
      setErro((e as Error).message ?? 'Erro ao executar ação.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="dsc-modal-overlay" onClick={onClose}>
      <div className="dsc-modal" onClick={e => e.stopPropagation()}>
        <h3 className="dsc-modal__title">{TITULOS[acao]}</h3>

        <dl className="dsc-modal__resumo">
          <dt>Pedido</dt>
          <dd>#{cab?.numero_pedido_cliente ?? pedido.pedido_forca_venda_key}</dd>
          <dt>Cliente</dt>
          <dd>{cab?.nome_cliente ?? '—'}</dd>
          <dt>Valor</dt>
          <dd>{fmtBRL(cab?.valor_pedido)}</dd>
          <dt>Desconto</dt>
          <dd className={cab && cab.valor_desconto < 0 ? 'negative' : ''}>
            {fmtBRL(cab?.valor_desconto)}
          </dd>
          <dt>Margem</dt>
          <dd className={margem != null && margem < 0 ? 'negative' : ''}>{margemFmt}</dd>
        </dl>

        <div className="dsc-modal__field">
          <label className="dsc-modal__label">
            Observação{observacaoObrigatoria ? ' *' : ' (opcional)'}
          </label>
          <textarea
            className="dsc-modal__textarea"
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            placeholder={
              acao === 'reprovar'
                ? 'Justifique a reprovação (obrigatório)'
                : 'Adicione um comentário…'
            }
            disabled={enviando}
            autoFocus
          />
        </div>

        {erro && <div className="dsc-modal__error">{erro}</div>}

        <div className="dsc-modal__footer">
          <button className="dsc-btn dsc-btn--secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button className={CLASSE_BTN[acao]} onClick={handleSubmit} disabled={enviando}>
            {enviando && <Loader2 size={14} className="dsc-spin" />}
            {CONFIRMS[acao]}
          </button>
        </div>
      </div>
    </div>
  );
}
