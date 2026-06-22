import React from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Clock,
  Crown,
  Inbox,
  RefreshCw,
  Undo2,
} from 'lucide-react';
import { StatusChip } from '../components/StatusChip';
import {
  crmApi,
  fmtBRL,
  fmtCnpj,
  fmtData,
  fmtNum,
  iniciaisDe,
  PRIORIDADE_LABELS_CURTO,
  PRIORIDADE_TONE,
  STATUS_CLIENTE_LABELS,
  STATUS_CLIENTE_TONE,
  type ClienteCrm,
} from './crm';
import { useMinhaAgenda } from './useMinhaAgenda';
import type { SessionUser } from '../auth/auth';

interface Props {
  user: SessionUser;
}

export function MinhaAgendaTab({ user }: Props) {
  const { data, loading, error, refresh } = useMinhaAgenda(user.email);
  const [toast, setToast] = React.useState<{ tone: 'ok' | 'erro'; texto: string } | null>(null);
  const [busy, setBusy] = React.useState<number | null>(null);

  const showToast = (tone: 'ok' | 'erro', texto: string) => {
    setToast({ tone, texto });
    setTimeout(() => setToast(null), 4000);
  };

  async function devolver(c: ClienteCrm) {
    const motivo = window.prompt(
      `Devolver ${c.razao_social} ao pool?\nMotivo:`,
      ''
    );
    if (!motivo || !motivo.trim()) return;
    setBusy(c.id);
    try {
      await crmApi.devolver({ cliente_id: c.id, usuario_email: user.email, motivo: motivo.trim() });
      showToast('ok', `${c.razao_social} devolvido ao pool.`);
      await refresh();
    } catch (e) {
      showToast('erro', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="crm-stub-card" style={{ textAlign: 'center' }}>
        <p className="crm-stub-card__desc">Carregando sua agenda…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crm-stub-card">
        <h3 className="crm-stub-card__title">Não foi possível carregar a agenda</h3>
        <p className="crm-stub-card__desc">{error}</p>
        <button className="crm-btn" onClick={refresh}>
          <RefreshCw size={14} /> Tentar novamente
        </button>
      </div>
    );
  }

  if (!data || data.total_carteira === 0) {
    return (
      <div className="crm-stub-card" style={{ textAlign: 'center' }}>
        <Inbox size={28} style={{ opacity: 0.4, marginBottom: 10 }} />
        <h3 className="crm-stub-card__title">Sua carteira está vazia</h3>
        <p className="crm-stub-card__desc">
          Vá em <strong>Carteira priorizada</strong> e clique em <em>Pegar próximo P0</em> ou
          <em> Pegar próximo SDR</em> para começar a operar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="crm-agenda-header">
        <div>
          <strong>{fmtNum(data.total_carteira)} clientes</strong> na sua carteira
        </div>
        <button className="crm-btn crm-btn--ghost" onClick={refresh}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <Section
        titulo="Vencidas"
        descricao="Próximas ações em atraso — começar pelo mais antigo."
        icone={<AlertTriangle size={16} />}
        tone="alerta"
        clientes={data.vencidas}
        busy={busy}
        onDevolver={devolver}
      />
      <Section
        titulo="Para hoje"
        descricao="Próxima ação marcada para hoje."
        icone={<Clock size={16} />}
        tone="hoje"
        clientes={data.hoje}
        busy={busy}
        onDevolver={devolver}
      />
      <Section
        titulo="Esta semana"
        descricao="Próximas ações nos próximos 7 dias."
        icone={<CalendarDays size={16} />}
        tone="semana"
        clientes={data.semana}
        busy={busy}
        onDevolver={devolver}
      />
      <Section
        titulo="Sem próxima ação definida"
        descricao="Clientes que você assumiu mas ainda não definiu o próximo passo."
        icone={<CalendarClock size={16} />}
        tone="frio"
        clientes={data.sem_proxima}
        busy={busy}
        onDevolver={devolver}
      />

      {toast && <div className={`crm-toast crm-toast--${toast.tone}`}>{toast.texto}</div>}
    </>
  );
}

function Section({
  titulo,
  descricao,
  icone,
  tone,
  clientes,
  busy,
  onDevolver,
}: {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  tone: 'alerta' | 'hoje' | 'semana' | 'frio';
  clientes: ClienteCrm[];
  busy: number | null;
  onDevolver: (c: ClienteCrm) => void;
}) {
  return (
    <div className={`crm-agenda-section crm-agenda-section--${tone}`}>
      <div className="crm-agenda-section__head">
        <div className="crm-agenda-section__title">
          {icone}
          <h3>{titulo}</h3>
          <span className="crm-agenda-section__count">{clientes.length}</span>
        </div>
        <p className="crm-agenda-section__desc">{descricao}</p>
      </div>

      {clientes.length === 0 ? (
        <div className="crm-agenda-section__empty">Sem clientes nesta categoria.</div>
      ) : (
        <div className="crm-agenda-list">
          {clientes.map(c => (
            <AgendaCard key={c.id} c={c} busy={busy === c.id} onDevolver={() => onDevolver(c)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AgendaCard({
  c,
  busy,
  onDevolver,
}: {
  c: ClienteCrm;
  busy: boolean;
  onDevolver: () => void;
}) {
  return (
    <div className="crm-agenda-card">
      <div className="crm-agenda-card__head">
        <div className="crm-cliente">
          <div className="crm-cliente__avatar">{iniciaisDe(c.razao_social)}</div>
          <div className="crm-cliente__info">
            <strong>{c.razao_social}</strong>
            <span>
              {fmtCnpj(c.cnpj)} · {c.cidade || '—'}
              {c.eh_carteira_luiz && (
                <span className="crm-luiz-badge">
                  <Crown size={10} /> Luiz
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="crm-agenda-card__chips">
          <StatusChip tone={STATUS_CLIENTE_TONE[c.status_cliente]}>
            {STATUS_CLIENTE_LABELS[c.status_cliente]}
          </StatusChip>
          <StatusChip tone={PRIORIDADE_TONE[c.prioridade_crm]}>
            {PRIORIDADE_LABELS_CURTO[c.prioridade_crm]}
          </StatusChip>
        </div>
      </div>

      <div className="crm-agenda-card__body">
        <div className="crm-agenda-card__metric">
          <span>Venda histórica</span>
          <strong className="crm-mono">{fmtBRL(c.venda_historica)}</strong>
        </div>
        <div className="crm-agenda-card__metric">
          <span>Dias s/ compra</span>
          <strong className="crm-mono">
            {c.dias_sem_compra == null ? '—' : c.dias_sem_compra}
          </strong>
        </div>
        <div className="crm-agenda-card__metric">
          <span>Último pedido</span>
          <strong className="crm-mono">{fmtData(c.data_ultimo_pedido)}</strong>
        </div>
        <div className="crm-agenda-card__metric">
          <span>{c.data_proxima_acao ? 'Próxima ação' : 'Definir próximo passo'}</span>
          <strong>{c.proxima_acao || '—'}</strong>
        </div>
      </div>

      <div className="crm-agenda-card__foot">
        <button className="crm-rowbtn crm-rowbtn--primary" disabled>
          Registrar ação
          <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>(em breve)</span>
        </button>
        <button
          className="crm-rowbtn crm-rowbtn--ghost"
          disabled={busy}
          onClick={onDevolver}
        >
          <Undo2 size={12} /> Devolver
        </button>
      </div>
    </div>
  );
}
