import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  Crown,
  Plus,
  RefreshCw,
  Target,
  TrendingUp,
} from 'lucide-react';
import { StatusChip } from '../components/StatusChip';
import {
  crmApi,
  ETAPA_LABELS,
  ETAPA_TONE,
  ETAPAS_KANBAN,
  fmtBRL,
  fmtNum,
  iniciaisDe,
  ORIGEM_LABELS,
  PRIORIDADE_LABELS_CURTO,
  PRIORIDADE_TONE,
  type EtapaOportunidade,
  type OportunidadeListagem,
} from './crm';
import { useOportunidades } from './useOportunidades';
import { NovaOportunidadeModal } from './NovaOportunidadeModal';
import type { SessionUser } from '../auth/auth';

interface Props {
  user: SessionUser;
}

export function OportunidadesTab({ user }: Props) {
  const { data, loading, error, refresh } = useOportunidades();
  const [filtroMeus, setFiltroMeus] = useState(false);
  const [novoAberto, setNovoAberto] = useState(false);
  const [movendo, setMovendo] = useState<number | null>(null);
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [hoverEtapa, setHoverEtapa] = useState<EtapaOportunidade | null>(null);
  const [toast, setToast] = useState<{ tone: 'ok' | 'erro'; texto: string } | null>(null);
  const [motivoModal, setMotivoModal] = useState<{ id: number; razao: string } | null>(null);
  const [motivoTexto, setMotivoTexto] = useState('');

  const showToast = (tone: 'ok' | 'erro', texto: string) => {
    setToast({ tone, texto });
    setTimeout(() => setToast(null), 4000);
  };

  const oportunidades = useMemo(() => {
    if (!data) return [] as OportunidadeListagem[];
    if (!filtroMeus) return data.oportunidades;
    return data.oportunidades.filter(
      o => o.owner_email && o.owner_email.toLowerCase() === user.email.toLowerCase()
    );
  }, [data, filtroMeus, user.email]);

  const colunas = useMemo(() => {
    const acc: Record<EtapaOportunidade, OportunidadeListagem[]> = {
      NOVO: [],
      CONTATADO: [],
      QUALIFICADO: [],
      PROPOSTA: [],
      NEGOCIACAO: [],
      GANHO: [],
      PERDIDO: [],
    };
    oportunidades.forEach(o => acc[o.etapa]?.push(o));
    return acc;
  }, [oportunidades]);

  const totaisAbertos = useMemo(
    () =>
      oportunidades
        .filter(o => o.etapa !== 'GANHO' && o.etapa !== 'PERDIDO')
        .reduce((s, o) => s + (o.valor_estimado || 0), 0),
    [oportunidades]
  );
  const totalGanho = useMemo(
    () => colunas.GANHO.reduce((s, o) => s + (o.valor_estimado || 0), 0),
    [colunas]
  );

  async function moverEtapa(op: OportunidadeListagem, novaEtapa: EtapaOportunidade) {
    if (op.etapa === novaEtapa) return;
    if (novaEtapa === 'PERDIDO') {
      setMotivoModal({ id: op.id, razao: op.razao_social });
      setMotivoTexto('');
      return;
    }
    setMovendo(op.id);
    try {
      await crmApi.moverEtapaOportunidade({ id: op.id, etapa: novaEtapa });
      showToast('ok', `${op.razao_social} movida para ${ETAPA_LABELS[novaEtapa]}.`);
      await refresh();
    } catch (e) {
      showToast('erro', (e as Error).message);
    } finally {
      setMovendo(null);
    }
  }

  async function confirmarMotivoPerda() {
    if (!motivoModal) return;
    const texto = motivoTexto.trim();
    if (!texto) return;
    setMovendo(motivoModal.id);
    try {
      await crmApi.moverEtapaOportunidade({
        id: motivoModal.id,
        etapa: 'PERDIDO',
        motivo_perda: texto,
      });
      showToast('ok', `${motivoModal.razao} marcada como perdida.`);
      setMotivoModal(null);
      await refresh();
    } catch (e) {
      showToast('erro', (e as Error).message);
    } finally {
      setMovendo(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="crm-stub-card" style={{ textAlign: 'center' }}>
        <p className="crm-stub-card__desc">Carregando pipeline…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crm-stub-card">
        <h3 className="crm-stub-card__title">Não foi possível carregar oportunidades</h3>
        <p className="crm-stub-card__desc">{error}</p>
        <button className="crm-btn" onClick={refresh}>
          <RefreshCw size={14} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="crm-kanban-header">
        <div className="crm-kanban-header__stats">
          <div className="crm-kanban-stat">
            <span className="crm-kanban-stat__label">
              <Target size={12} /> Em aberto
            </span>
            <strong className="crm-mono">{fmtBRL(totaisAbertos)}</strong>
            <span className="crm-kanban-stat__sub">
              {fmtNum(oportunidades.filter(o => o.etapa !== 'GANHO' && o.etapa !== 'PERDIDO').length)} cards
            </span>
          </div>
          <div className="crm-kanban-stat crm-kanban-stat--ok">
            <span className="crm-kanban-stat__label">
              <TrendingUp size={12} /> Ganho
            </span>
            <strong className="crm-mono">{fmtBRL(totalGanho)}</strong>
            <span className="crm-kanban-stat__sub">{fmtNum(colunas.GANHO.length)} cards</span>
          </div>
        </div>

        <div className="crm-kanban-header__actions">
          <label className="crm-kanban-toggle">
            <input
              type="checkbox"
              checked={filtroMeus}
              onChange={e => setFiltroMeus(e.target.checked)}
            />
            <span>Apenas meus</span>
          </label>
          <button className="crm-btn crm-btn--ghost" onClick={refresh}>
            <RefreshCw size={14} /> Atualizar
          </button>
          <button className="crm-btn crm-modal__submit" onClick={() => setNovoAberto(true)}>
            <Plus size={14} /> Nova oportunidade
          </button>
        </div>
      </div>

      <div className="crm-kanban">
        {ETAPAS_KANBAN.map(etapa => {
          const cards = colunas[etapa];
          const valor = cards.reduce((s, o) => s + (o.valor_estimado || 0), 0);
          const tone = ETAPA_TONE[etapa];
          const hoverActive = hoverEtapa === etapa && arrastando != null;
          return (
            <div
              key={etapa}
              className={`crm-kanban-col crm-kanban-col--${tone} ${hoverActive ? 'crm-kanban-col--drop' : ''}`}
              onDragOver={e => {
                if (arrastando != null) {
                  e.preventDefault();
                  setHoverEtapa(etapa);
                }
              }}
              onDragLeave={() => {
                if (hoverEtapa === etapa) setHoverEtapa(null);
              }}
              onDrop={() => {
                if (arrastando == null) return;
                const op = oportunidades.find(o => o.id === arrastando);
                setHoverEtapa(null);
                setArrastando(null);
                if (op) moverEtapa(op, etapa);
              }}
            >
              <header className="crm-kanban-col__head">
                <div className="crm-kanban-col__title">
                  <span className="crm-kanban-col__dot" />
                  <h4>{ETAPA_LABELS[etapa]}</h4>
                  <span className="crm-kanban-col__count">{cards.length}</span>
                </div>
                {valor > 0 && (
                  <span className="crm-kanban-col__valor">{fmtBRL(valor)}</span>
                )}
              </header>

              <div className="crm-kanban-col__list">
                {cards.length === 0 ? (
                  <div className="crm-kanban-col__empty">
                    {hoverActive ? 'Soltar aqui' : 'Sem cards'}
                  </div>
                ) : (
                  cards.map(op => (
                    <article
                      key={op.id}
                      className={`crm-kanban-card ${arrastando === op.id ? 'crm-kanban-card--drag' : ''} ${movendo === op.id ? 'crm-kanban-card--busy' : ''}`}
                      draggable={movendo !== op.id}
                      onDragStart={e => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', String(op.id));
                        setArrastando(op.id);
                      }}
                      onDragEnd={() => {
                        setArrastando(null);
                        setHoverEtapa(null);
                      }}
                    >
                      <div className="crm-kanban-card__head">
                        <div className="crm-cliente">
                          <div className="crm-cliente__avatar">
                            {iniciaisDe(op.razao_social)}
                          </div>
                          <div className="crm-cliente__info">
                            <strong>{op.razao_social}</strong>
                            <span>
                              {op.cidade || '—'}
                              {op.eh_carteira_luiz && (
                                <span className="crm-luiz-badge">
                                  <Crown size={10} /> Luiz
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="crm-kanban-card__valor">
                        {op.valor_estimado != null ? fmtBRL(op.valor_estimado) : '—'}
                      </div>

                      <div className="crm-kanban-card__chips">
                        {op.prioridade_crm && (
                          <StatusChip tone={PRIORIDADE_TONE[op.prioridade_crm]}>
                            {PRIORIDADE_LABELS_CURTO[op.prioridade_crm]}
                          </StatusChip>
                        )}
                        {op.origem && (
                          <span className="crm-kanban-card__tag">{ORIGEM_LABELS[op.origem]}</span>
                        )}
                      </div>

                      <footer className="crm-kanban-card__foot">
                        <span className="crm-kanban-card__meta">
                          <CalendarClock size={11} />
                          {op.etapa === 'GANHO' || op.etapa === 'PERDIDO'
                            ? `Fechada há ${op.dias_aberta}d`
                            : `Aberta há ${op.dias_aberta}d`}
                        </span>
                        {op.owner_nome && (
                          <span className="crm-kanban-card__owner" title={op.owner_email ?? undefined}>
                            {op.owner_nome.split(' ')[0]}
                          </span>
                        )}
                      </footer>

                      {op.etapa !== 'GANHO' && op.etapa !== 'PERDIDO' && (
                        <div className="crm-kanban-card__quick">
                          {ETAPAS_KANBAN.filter(e2 => e2 !== op.etapa).map(e2 => (
                            <button
                              key={e2}
                              type="button"
                              className={`crm-kanban-card__qbtn crm-kanban-card__qbtn--${ETAPA_TONE[e2]}`}
                              onClick={() => moverEtapa(op, e2)}
                              disabled={movendo === op.id}
                              title={`Mover para ${ETAPA_LABELS[e2]}`}
                            >
                              {ETAPA_LABELS[e2]}
                            </button>
                          ))}
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {novoAberto && (
        <NovaOportunidadeModal
          usuario_email={user.email}
          usuario_nome={user.nome}
          onClose={() => setNovoAberto(false)}
          onSuccess={async () => {
            setNovoAberto(false);
            showToast('ok', 'Oportunidade criada no pipeline.');
            await refresh();
          }}
        />
      )}

      {motivoModal && (
        <div className="crm-modal-overlay" onClick={() => setMotivoModal(null)}>
          <div className="crm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <header className="crm-modal__header">
              <div>
                <p className="crm-modal__eyebrow">Marcar como perdida</p>
                <h2 className="crm-modal__title">{motivoModal.razao}</h2>
              </div>
            </header>
            <div className="crm-modal__body">
              <label className="crm-modal__field">
                <span className="crm-modal__field-label">Motivo da perda</span>
                <textarea
                  className="crm-modal__textarea"
                  value={motivoTexto}
                  onChange={e => setMotivoTexto(e.target.value)}
                  placeholder="Ex: preço fora do mercado, cliente fechou com concorrente, sem fit comercial…"
                  rows={3}
                  autoFocus
                />
              </label>
            </div>
            <footer className="crm-modal__footer">
              <button
                className="crm-btn crm-btn--ghost"
                onClick={() => setMotivoModal(null)}
              >
                Cancelar
              </button>
              <button
                className="crm-btn crm-modal__submit"
                onClick={confirmarMotivoPerda}
                disabled={!motivoTexto.trim()}
              >
                Confirmar perda
              </button>
            </footer>
          </div>
        </div>
      )}

      {toast && <div className={`crm-toast crm-toast--${toast.tone}`}>{toast.texto}</div>}
    </>
  );
}
