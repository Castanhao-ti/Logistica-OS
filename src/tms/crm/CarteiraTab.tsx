import React, { useMemo, useState } from 'react';
import { RefreshCw, Search, Crown, Hand, Zap, Undo2 } from 'lucide-react';
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
  type FiltroProximo,
  type PrioridadeCrm,
  type StatusCliente,
} from './crm';
import { useCrmClientes } from './useCrmClientes';
import type { SessionUser } from '../auth/auth';

type FiltroPrioridade = 'todas' | PrioridadeCrm;
type FiltroStatus = 'todos' | StatusCliente;
type FiltroLuiz = 'todos' | 'sim' | 'nao';
type FiltroDisp = 'disponiveis' | 'meus' | 'todos';

interface Props {
  user: SessionUser;
  onClienteAtribuido?: () => void;
}

export function CarteiraTab({ user, onClienteAtribuido }: Props) {
  const { clientes, total, loading, error, refresh } = useCrmClientes();
  const [busca, setBusca] = useState('');
  const [filtroPri, setFiltroPri] = useState<FiltroPrioridade>('todas');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [filtroLuiz, setFiltroLuiz] = useState<FiltroLuiz>('nao');
  const [filtroDisp, setFiltroDisp] = useState<FiltroDisp>('disponiveis');
  const [busy, setBusy] = useState<number | string | null>(null);
  const [toast, setToast] = useState<{ tone: 'ok' | 'erro'; texto: string } | null>(null);

  const showToast = (tone: 'ok' | 'erro', texto: string) => {
    setToast({ tone, texto });
    setTimeout(() => setToast(null), 4500);
  };

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return clientes.filter(c => {
      if (filtroDisp === 'disponiveis' && c.owner_crm) return false;
      if (filtroDisp === 'meus' && c.owner_crm !== user.nome) return false;
      if (filtroLuiz === 'sim' && !c.eh_carteira_luiz) return false;
      if (filtroLuiz === 'nao' && c.eh_carteira_luiz) return false;
      if (filtroPri !== 'todas' && c.prioridade_crm !== filtroPri) return false;
      if (filtroStatus !== 'todos' && c.status_cliente !== filtroStatus) return false;
      if (q) {
        const blob = `${c.razao_social} ${c.cnpj} ${c.cidade || ''} ${c.vendedor_original || ''}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [clientes, busca, filtroPri, filtroStatus, filtroLuiz, filtroDisp, user.nome]);

  async function assumir(c: ClienteCrm) {
    setBusy(c.id);
    try {
      const res = await crmApi.assumir({
        cliente_id: c.id,
        usuario_email: user.email,
        usuario_nome: user.nome,
      });
      if (res.resultado === 'OK') {
        showToast('ok', `Cliente ${res.razao_social} adicionado à sua carteira.`);
        await refresh();
        onClienteAtribuido?.();
      } else {
        showToast('erro', 'Este cliente já foi atribuído a outro vendedor.');
      }
    } catch (e) {
      showToast('erro', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function pegarProximo(filtro: FiltroProximo) {
    setBusy(`proximo-${filtro}`);
    try {
      const res = await crmApi.pegarProximo({
        usuario_email: user.email,
        usuario_nome: user.nome,
        filtro,
      });
      if (res.resultado === 'OK') {
        showToast('ok', `Próximo ${filtro}: ${res.razao_social} (${res.cidade ?? '—'}).`);
        await refresh();
        onClienteAtribuido?.();
      } else {
        showToast('erro', `Fila ${filtro} vazia — nenhum cliente disponível.`);
      }
    } catch (e) {
      showToast('erro', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function devolver(c: ClienteCrm) {
    const motivo = window.prompt(
      `Devolver ${c.razao_social} ao pool?\nInforme o motivo (será registrado nas observações):`,
      ''
    );
    if (!motivo || !motivo.trim()) return;
    setBusy(c.id);
    try {
      await crmApi.devolver({
        cliente_id: c.id,
        usuario_email: user.email,
        motivo: motivo.trim(),
      });
      showToast('ok', `${c.razao_social} devolvido ao pool.`);
      await refresh();
      onClienteAtribuido?.();
    } catch (e) {
      showToast('erro', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (loading && !clientes.length) {
    return (
      <div className="crm-stub-card" style={{ textAlign: 'center' }}>
        <p className="crm-stub-card__desc">Carregando carteira priorizada…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crm-stub-card">
        <h3 className="crm-stub-card__title">Não foi possível carregar a carteira</h3>
        <p className="crm-stub-card__desc">{error}</p>
        <button className="crm-btn" onClick={refresh}>
          <RefreshCw size={14} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="crm-quickactions">
        <span className="crm-quickactions__label">
          <Zap size={13} /> Pegar próximo da fila:
        </span>
        <button
          className="crm-btn crm-btn--p0"
          disabled={busy === 'proximo-P0'}
          onClick={() => pegarProximo('P0')}
        >
          P0 — Ataque
        </button>
        <button
          className="crm-btn crm-btn--p1"
          disabled={busy === 'proximo-P1'}
          onClick={() => pegarProximo('P1')}
        >
          P1 — Reativação
        </button>
        <button
          className="crm-btn crm-btn--sdr"
          disabled={busy === 'proximo-SDR'}
          onClick={() => pegarProximo('SDR')}
        >
          SDR — Sem pedido
        </button>
        <button
          className="crm-btn crm-btn--ghost"
          disabled={busy === 'proximo-TOPO'}
          onClick={() => pegarProximo('TOPO')}
          title="Topo geral da fila"
        >
          Top da fila
        </button>
      </div>

      <div className="crm-filterbar">
        <div className="crm-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ, cidade ou vendedor…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <select
          className="crm-select"
          value={filtroDisp}
          onChange={e => setFiltroDisp(e.target.value as FiltroDisp)}
        >
          <option value="disponiveis">Apenas disponíveis</option>
          <option value="meus">Apenas meus</option>
          <option value="todos">Todos (incl. de outros)</option>
        </select>
        <select
          className="crm-select"
          value={filtroPri}
          onChange={e => setFiltroPri(e.target.value as FiltroPrioridade)}
        >
          <option value="todas">Todas prioridades</option>
          <option value="P0 - Ataque imediato">P0 — Ataque imediato</option>
          <option value="P1 - Reativação alta">P1 — Reativação alta</option>
          <option value="P2 - Cadência normal">P2 — Cadência</option>
          <option value="P3 - Ativação SDR">P3 — SDR</option>
          <option value="P4 - Nutrição">P4 — Nutrição</option>
          <option value="KEY ACCOUNT LUIZ">Key Account Luiz</option>
        </select>
        <select
          className="crm-select"
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value as FiltroStatus)}
        >
          <option value="todos">Todos status</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
          <option value="SEM_PEDIDO">Sem pedido</option>
        </select>
        <select
          className="crm-select"
          value={filtroLuiz}
          onChange={e => setFiltroLuiz(e.target.value as FiltroLuiz)}
        >
          <option value="nao">Fora carteira Luiz</option>
          <option value="sim">Apenas Luiz</option>
          <option value="todos">Todos (Luiz + outros)</option>
        </select>
        <button className="crm-btn crm-btn--ghost" onClick={refresh} title="Atualizar">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="crm-list-meta">
        Mostrando <strong>{fmtNum(filtrados.length)}</strong> de {fmtNum(total)} clientes da view priorizada.
      </div>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Cidade</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Prioridade</th>
              <th className="crm-table__num">Venda histórica</th>
              <th className="crm-table__num">Dias s/ compra</th>
              <th>Último pedido</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.slice(0, 200).map(c => (
              <ClienteRow
                key={c.id}
                c={c}
                user={user}
                busy={busy === c.id}
                onAssumir={() => assumir(c)}
                onDevolver={() => devolver(c)}
              />
            ))}
            {!filtrados.length && (
              <tr>
                <td colSpan={9} className="crm-table__empty">
                  Nenhum cliente atende aos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtrados.length > 200 && (
        <p className="crm-list-meta crm-list-meta--soft">
          Exibindo as 200 primeiras linhas. Refine os filtros ou implementaremos paginação na próxima iteração.
        </p>
      )}

      {toast && (
        <div className={`crm-toast crm-toast--${toast.tone}`}>{toast.texto}</div>
      )}
    </>
  );
}

function ClienteRow({
  c,
  user,
  busy,
  onAssumir,
  onDevolver,
}: {
  c: ClienteCrm;
  user: SessionUser;
  busy: boolean;
  onAssumir: () => void;
  onDevolver: () => void;
}) {
  const diasTone = (() => {
    const d = c.dias_sem_compra;
    if (d == null) return 'crm-dias--na';
    if (d <= 30) return 'crm-dias--ok';
    if (d <= 60) return 'crm-dias--alerta';
    if (d <= 120) return 'crm-dias--quente';
    return 'crm-dias--frio';
  })();

  const ehMeu = c.owner_crm === user.nome;
  const semOwner = !c.owner_crm;

  return (
    <tr className={ehMeu ? 'crm-row--meu' : ''}>
      <td>
        <div className="crm-cliente">
          <div className="crm-cliente__avatar">{iniciaisDe(c.razao_social)}</div>
          <div className="crm-cliente__info">
            <strong>{c.razao_social}</strong>
            <span>
              {fmtCnpj(c.cnpj)}
              {c.eh_carteira_luiz && (
                <span className="crm-luiz-badge" title="Carteira Luiz Bobko">
                  <Crown size={10} /> Luiz
                </span>
              )}
            </span>
          </div>
        </div>
      </td>
      <td>
        {c.cidade || '—'}
        {c.uf ? ` / ${c.uf}` : ''}
      </td>
      <td>
        {c.owner_crm ? (
          <span className={`crm-owner ${ehMeu ? 'crm-owner--meu' : ''}`}>{c.owner_crm}</span>
        ) : (
          <span className="crm-owner crm-owner--vazio">Sem dono</span>
        )}
      </td>
      <td>
        <StatusChip tone={STATUS_CLIENTE_TONE[c.status_cliente]}>
          {STATUS_CLIENTE_LABELS[c.status_cliente]}
        </StatusChip>
      </td>
      <td>
        <StatusChip tone={PRIORIDADE_TONE[c.prioridade_crm]}>
          {PRIORIDADE_LABELS_CURTO[c.prioridade_crm]}
        </StatusChip>
      </td>
      <td className="crm-table__num crm-mono">{fmtBRL(c.venda_historica)}</td>
      <td className={`crm-table__num crm-mono ${diasTone}`}>
        {c.dias_sem_compra == null ? '—' : c.dias_sem_compra}
      </td>
      <td className="crm-cell-muted">{fmtData(c.data_ultimo_pedido)}</td>
      <td>
        {semOwner && (
          <button
            className="crm-rowbtn crm-rowbtn--primary"
            disabled={busy}
            onClick={onAssumir}
            title="Adicionar à minha carteira"
          >
            <Hand size={12} /> Assumir
          </button>
        )}
        {ehMeu && (
          <button
            className="crm-rowbtn crm-rowbtn--ghost"
            disabled={busy}
            onClick={onDevolver}
            title="Devolver ao pool"
          >
            <Undo2 size={12} /> Devolver
          </button>
        )}
        {!semOwner && !ehMeu && <span className="crm-cell-muted" style={{ fontSize: 11 }}>—</span>}
      </td>
    </tr>
  );
}
