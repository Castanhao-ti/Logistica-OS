import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crown, Loader2, Search, X } from 'lucide-react';
import { StatusChip } from '../components/StatusChip';
import {
  ORIGEM_LABELS,
  PRIORIDADE_LABELS_CURTO,
  PRIORIDADE_TONE,
  STATUS_CLIENTE_LABELS,
  STATUS_CLIENTE_TONE,
  crmApi,
  fmtBRL,
  fmtCnpj,
  iniciaisDe,
  type ClienteCrm,
  type OrigemOportunidade,
} from './crm';
import { useCrmClientes } from './useCrmClientes';

interface Props {
  usuario_email: string;
  usuario_nome: string;
  /** Pré-seleciona um cliente (quando aberto via botão "+oportunidade" da carteira) */
  clientePreSelecionado?: ClienteCrm | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ORIGENS: OrigemOportunidade[] = [
  'REATIVACAO',
  'RECOMPRA',
  'SEM_PEDIDO',
  'INDICACAO',
  'CAMPANHA',
  'VENDEDOR_EXTERNO',
  'PLATAFORMA',
  'OUTRO',
];

function isoTomorrow(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

export function NovaOportunidadeModal({
  usuario_email,
  usuario_nome,
  clientePreSelecionado,
  onClose,
  onSuccess,
}: Props) {
  const { clientes: carteira, loading: carregandoClientes } = useCrmClientes();
  const [busca, setBusca] = useState('');
  const [cliente, setCliente] = useState<ClienteCrm | null>(clientePreSelecionado ?? null);
  const [valor, setValor] = useState<string>('');
  const [origem, setOrigem] = useState<OrigemOportunidade>('REATIVACAO');
  const [probabilidade, setProbabilidade] = useState<string>('');
  const [previsao, setPrevisao] = useState<string>(isoTomorrow(30));
  const [observacao, setObservacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const buscaInputRef = useRef<HTMLInputElement | null>(null);

  /* ESC + body lock */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !enviando) onClose();
    };
    document.addEventListener('keydown', onKey);
    if (!cliente) buscaInputRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, enviando, cliente]);

  const sugestoes = useMemo(() => {
    if (!busca.trim() || cliente) return [];
    const q = busca.trim().toLowerCase();
    const so = q.replace(/\D/g, '');
    return carteira
      .filter(c => {
        if (c.razao_social.toLowerCase().includes(q)) return true;
        if (so && c.cnpj.includes(so)) return true;
        return false;
      })
      .slice(0, 6);
  }, [busca, carteira, cliente]);

  async function handleSubmit() {
    setErro(null);
    if (!cliente) {
      setErro('Selecione um cliente.');
      return;
    }
    const valorNum = valor.trim() ? Number(valor.replace(',', '.')) : undefined;
    if (valorNum != null && (isNaN(valorNum) || valorNum < 0)) {
      setErro('Valor estimado inválido.');
      return;
    }
    const probNum = probabilidade.trim() ? Number(probabilidade) : undefined;
    if (probNum != null && (isNaN(probNum) || probNum < 0 || probNum > 100)) {
      setErro('Probabilidade deve ser de 0 a 100.');
      return;
    }
    setEnviando(true);
    try {
      await crmApi.criarOportunidade({
        cliente_id: cliente.id,
        usuario_email,
        usuario_nome,
        etapa: 'NOVO',
        valor_estimado: valorNum,
        origem,
        observacao: observacao.trim() || undefined,
        data_previsao_fechamento: previsao || undefined,
        probabilidade: probNum,
      });
      onSuccess();
    } catch (e) {
      setErro((e as Error).message || 'Não foi possível criar a oportunidade.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="crm-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="crm-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crm-nova-op-title"
      >
        <header className="crm-modal__header">
          <div>
            <p className="crm-modal__eyebrow">Novo card no pipeline</p>
            <h2 id="crm-nova-op-title" className="crm-modal__title">
              Cadastrar oportunidade
            </h2>
          </div>
          <button
            type="button"
            className="crm-modal__close"
            onClick={onClose}
            disabled={enviando}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </header>

        <div className="crm-modal__body">
          {/* Seção 1 — Cliente */}
          <section className="crm-modal__section">
            <h4 className="crm-modal__section-title">Cliente</h4>
            {cliente ? (
              <div className="crm-modal__cliente crm-modal__cliente--inline">
                <div className="crm-cliente__avatar">{iniciaisDe(cliente.razao_social)}</div>
                <div className="crm-modal__cliente-info">
                  <strong>{cliente.razao_social}</strong>
                  <span>
                    {fmtCnpj(cliente.cnpj)}
                    {cliente.cidade ? ` · ${cliente.cidade}` : ''}
                  </span>
                </div>
                <div className="crm-modal__cliente-chips">
                  <StatusChip tone={STATUS_CLIENTE_TONE[cliente.status_cliente]}>
                    {STATUS_CLIENTE_LABELS[cliente.status_cliente]}
                  </StatusChip>
                  <StatusChip tone={PRIORIDADE_TONE[cliente.prioridade_crm]}>
                    {PRIORIDADE_LABELS_CURTO[cliente.prioridade_crm]}
                  </StatusChip>
                  {cliente.eh_carteira_luiz && (
                    <span className="crm-luiz-badge">
                      <Crown size={10} /> Luiz
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="crm-modal__chip"
                  onClick={() => setCliente(null)}
                  disabled={enviando}
                  style={{ marginLeft: 8 }}
                >
                  Trocar
                </button>
              </div>
            ) : (
              <div className="crm-modal__busca">
                <div className="crm-search">
                  <Search size={14} />
                  <input
                    ref={buscaInputRef}
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Digite razão social ou CNPJ…"
                    disabled={enviando}
                  />
                </div>
                {carregandoClientes && carteira.length === 0 && (
                  <p className="crm-modal__busca-empty">
                    <Loader2 size={11} className="crm-spin" /> Carregando carteira…
                  </p>
                )}
                {busca.trim() && !carregandoClientes && sugestoes.length === 0 && (
                  <p className="crm-modal__busca-empty">Nenhum cliente encontrado.</p>
                )}
                {sugestoes.length > 0 && (
                  <ul className="crm-modal__sugestoes">
                    {sugestoes.map(c => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="crm-modal__sugestao"
                          onClick={() => {
                            setCliente(c);
                            setBusca('');
                          }}
                        >
                          <div className="crm-cliente__avatar">{iniciaisDe(c.razao_social)}</div>
                          <div className="crm-modal__cliente-info">
                            <strong>{c.razao_social}</strong>
                            <span>
                              {fmtCnpj(c.cnpj)}
                              {c.cidade ? ` · ${c.cidade}` : ''} · {fmtBRL(c.venda_historica)}
                            </span>
                          </div>
                          <StatusChip tone={PRIORIDADE_TONE[c.prioridade_crm]}>
                            {PRIORIDADE_LABELS_CURTO[c.prioridade_crm]}
                          </StatusChip>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* Seção 2 — Detalhes da oportunidade */}
          <section className="crm-modal__section">
            <h4 className="crm-modal__section-title">Detalhes</h4>
            <div className="crm-modal__grid">
              <label className="crm-modal__field">
                <span className="crm-modal__field-label">Valor estimado (R$)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="crm-modal__input"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  placeholder="Ex: 12500.00"
                  disabled={enviando}
                />
              </label>
              <label className="crm-modal__field">
                <span className="crm-modal__field-label">Origem</span>
                <select
                  className="crm-modal__select"
                  value={origem}
                  onChange={e => setOrigem(e.target.value as OrigemOportunidade)}
                  disabled={enviando}
                >
                  {ORIGENS.map(o => (
                    <option key={o} value={o}>
                      {ORIGEM_LABELS[o]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="crm-modal__grid">
              <label className="crm-modal__field">
                <span className="crm-modal__field-label">Probabilidade (%)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="crm-modal__input"
                  value={probabilidade}
                  onChange={e => setProbabilidade(e.target.value)}
                  placeholder="Ex: 40"
                  disabled={enviando}
                />
              </label>
              <label className="crm-modal__field">
                <span className="crm-modal__field-label">Previsão de fechamento</span>
                <input
                  type="date"
                  className="crm-modal__input"
                  value={previsao}
                  onChange={e => setPrevisao(e.target.value)}
                  min={isoTomorrow(0)}
                  disabled={enviando}
                />
              </label>
            </div>
          </section>

          {/* Seção 3 — Anotações */}
          <section className="crm-modal__section">
            <h4 className="crm-modal__section-title">
              Anotações <span className="crm-modal__opcional">opcional</span>
            </h4>
            <textarea
              className="crm-modal__textarea"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Contexto, contatos envolvidos, próximos passos…"
              rows={3}
              disabled={enviando}
              maxLength={1000}
            />
          </section>

          {erro && <div className="crm-modal__error">{erro}</div>}
        </div>

        <footer className="crm-modal__footer">
          <button
            type="button"
            className="crm-btn crm-btn--ghost"
            onClick={onClose}
            disabled={enviando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="crm-btn crm-modal__submit"
            onClick={handleSubmit}
            disabled={enviando || !cliente}
          >
            {enviando ? (
              <>
                <Loader2 size={14} className="crm-spin" /> Criando…
              </>
            ) : (
              'Criar oportunidade'
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
