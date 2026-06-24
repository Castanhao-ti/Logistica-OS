import React, { useEffect, useRef, useState } from 'react';
import { Crown, Loader2, X } from 'lucide-react';
import { StatusChip } from '../components/StatusChip';
import {
  CANAL_LABELS,
  PRIORIDADE_LABELS_CURTO,
  PRIORIDADE_TONE,
  RESULTADO_LABELS,
  STATUS_CLIENTE_LABELS,
  STATUS_CLIENTE_TONE,
  TIPO_ACAO_LABELS,
  crmApi,
  fmtCnpj,
  iniciaisDe,
  type CanalAcao,
  type ClienteCrm,
  type ResultadoAcao,
  type TipoAcao,
} from './crm';

interface Props {
  cliente: ClienteCrm;
  usuario: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TIPOS_OPCOES: TipoAcao[] = [
  'LIGACAO',
  'WHATSAPP',
  'EMAIL',
  'VISITA',
  'PROPOSTA',
  'PEDIDO_GERADO',
  'REATIVACAO',
  'ATIVACAO_SEM_PEDIDO',
  'SEM_RETORNO',
  'CADASTRO_INVALIDO',
];

const CANAIS_OPCOES: CanalAcao[] = [
  'TELEFONE',
  'WHATSAPP',
  'EMAIL',
  'PRESENCIAL',
  'SISTEMA',
  'OUTRO',
];

const RESULTADOS_OPCOES: ResultadoAcao[] = [
  'CONTATO_REALIZADO',
  'INTERESSADO',
  'PEDIU_CONDICAO',
  'PEDIDO_REALIZADO',
  'GANHO',
  'RETORNAR_DEPOIS',
  'NAO_ATENDEU',
  'CADASTRO_DESATUALIZADO',
  'SEM_INTERESSE',
  'PERDIDO',
];

/* Sugestão de canal padrão a partir do tipo de ação selecionado */
const CANAL_PADRAO: Partial<Record<TipoAcao, CanalAcao>> = {
  LIGACAO: 'TELEFONE',
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL',
  VISITA: 'PRESENCIAL',
  PROPOSTA: 'EMAIL',
  PEDIDO_GERADO: 'SISTEMA',
  REATIVACAO: 'TELEFONE',
  ATIVACAO_SEM_PEDIDO: 'TELEFONE',
  SEM_RETORNO: 'TELEFONE',
  CADASTRO_INVALIDO: 'SISTEMA',
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

const HOJE_ISO = isoDate(new Date());

export function RegistrarAcaoModal({ cliente, usuario, onClose, onSuccess }: Props) {
  const [tipo, setTipo] = useState<TipoAcao>('LIGACAO');
  const [canal, setCanal] = useState<CanalAcao>('TELEFONE');
  const [resultado, setResultado] = useState<ResultadoAcao>('CONTATO_REALIZADO');
  const [observacao, setObservacao] = useState('');
  const [proximaAcao, setProximaAcao] = useState('');
  const [dataProxima, setDataProxima] = useState<string>('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const firstFieldRef = useRef<HTMLSelectElement | null>(null);

  /* ESC fecha + body scroll lock + autofocus */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !enviando) onClose();
    };
    document.addEventListener('keydown', onKey);
    firstFieldRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, enviando]);

  /* Auto-preenche canal ao trocar tipo, se canal estiver no padrão */
  function setTipoComCanal(novoTipo: TipoAcao) {
    setTipo(novoTipo);
    const sugestao = CANAL_PADRAO[novoTipo];
    if (sugestao) setCanal(sugestao);
  }

  /* Atalhos de data próxima */
  function setDataRelativa(days: number) {
    setDataProxima(isoDate(addDays(new Date(), days)));
  }

  async function handleSubmit() {
    setErro(null);
    if (!resultado) {
      setErro('Informe o resultado da ação.');
      return;
    }
    if (dataProxima && !proximaAcao.trim()) {
      setErro('Descreva a próxima ação antes de informar a data.');
      return;
    }
    if (proximaAcao.trim() && !dataProxima) {
      setErro('Defina uma data para a próxima ação.');
      return;
    }

    setEnviando(true);
    try {
      await crmApi.registrarAcao({
        cliente_id: cliente.id,
        tipo_acao: tipo,
        canal,
        resultado,
        observacao: observacao.trim() || undefined,
        proxima_acao: proximaAcao.trim() || undefined,
        data_proxima_acao: dataProxima || undefined,
        usuario,
      });
      onSuccess();
    } catch (e) {
      setErro((e as Error).message || 'Não foi possível registrar a ação.');
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
        aria-labelledby="crm-modal-title"
      >
        <header className="crm-modal__header">
          <div>
            <p className="crm-modal__eyebrow">Registrar ação comercial</p>
            <h2 id="crm-modal-title" className="crm-modal__title">
              Como foi o contato?
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

        <div className="crm-modal__cliente">
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
        </div>

        <div className="crm-modal__body">
          <section className="crm-modal__section">
            <h4 className="crm-modal__section-title">O que foi feito</h4>
            <div className="crm-modal__grid">
              <Field label="Tipo de ação">
                <select
                  ref={firstFieldRef}
                  className="crm-modal__select"
                  value={tipo}
                  onChange={e => setTipoComCanal(e.target.value as TipoAcao)}
                  disabled={enviando}
                >
                  {TIPOS_OPCOES.map(t => (
                    <option key={t} value={t}>
                      {TIPO_ACAO_LABELS[t]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Canal">
                <select
                  className="crm-modal__select"
                  value={canal}
                  onChange={e => setCanal(e.target.value as CanalAcao)}
                  disabled={enviando}
                >
                  {CANAIS_OPCOES.map(c => (
                    <option key={c} value={c}>
                      {CANAL_LABELS[c]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Resultado">
              <select
                className="crm-modal__select"
                value={resultado}
                onChange={e => setResultado(e.target.value as ResultadoAcao)}
                disabled={enviando}
              >
                {RESULTADOS_OPCOES.map(r => (
                  <option key={r} value={r}>
                    {RESULTADO_LABELS[r]}
                  </option>
                ))}
              </select>
            </Field>
          </section>

          <section className="crm-modal__section">
            <h4 className="crm-modal__section-title">Anotações</h4>
            <textarea
              className="crm-modal__textarea"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="O que conversaram? Há objeções, pendências ou compromissos?"
              rows={3}
              disabled={enviando}
              maxLength={1000}
            />
          </section>

          <section className="crm-modal__section">
            <h4 className="crm-modal__section-title">
              Próximo passo <span className="crm-modal__opcional">opcional</span>
            </h4>
            <Field label="O que será feito">
              <input
                type="text"
                className="crm-modal__input"
                value={proximaAcao}
                onChange={e => setProximaAcao(e.target.value)}
                placeholder="Ex: Enviar proposta com condição especial"
                disabled={enviando}
                maxLength={200}
              />
            </Field>
            <div className="crm-modal__grid">
              <Field label="Quando">
                <input
                  type="date"
                  className="crm-modal__input"
                  value={dataProxima}
                  onChange={e => setDataProxima(e.target.value)}
                  min={HOJE_ISO}
                  disabled={enviando}
                />
              </Field>
              <div className="crm-modal__atalhos">
                <span className="crm-modal__field-label">Atalhos</span>
                <div className="crm-modal__atalhos-row">
                  <ChipBtn onClick={() => setDataRelativa(0)} active={dataProxima === isoDate(new Date())}>
                    Hoje
                  </ChipBtn>
                  <ChipBtn onClick={() => setDataRelativa(1)} active={dataProxima === isoDate(addDays(new Date(), 1))}>
                    Amanhã
                  </ChipBtn>
                  <ChipBtn onClick={() => setDataRelativa(3)} active={dataProxima === isoDate(addDays(new Date(), 3))}>
                    +3d
                  </ChipBtn>
                  <ChipBtn onClick={() => setDataRelativa(7)} active={dataProxima === isoDate(addDays(new Date(), 7))}>
                    +1 sem
                  </ChipBtn>
                  <ChipBtn onClick={() => setDataRelativa(30)} active={dataProxima === isoDate(addDays(new Date(), 30))}>
                    +1 mês
                  </ChipBtn>
                </div>
              </div>
            </div>
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
            disabled={enviando}
          >
            {enviando ? (
              <>
                <Loader2 size={14} className="crm-spin" /> Registrando…
              </>
            ) : (
              'Registrar ação'
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="crm-modal__field">
      <span className="crm-modal__field-label">{label}</span>
      {children}
    </label>
  );
}

function ChipBtn({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`crm-modal__chip ${active ? 'crm-modal__chip--active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
