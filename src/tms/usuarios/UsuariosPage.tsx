import { useState, useMemo } from 'react';
import { UserPlus, Inbox, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useUsuarios } from './useUsuarios';
import { UsuarioCard } from './UsuarioCard';
import { UsuarioFormModal } from './UsuarioFormModal';
import type { PerfilUsuario } from './usuarios';
import './usuarios.css';

type FiltroStatus = 'todos' | 'ativos' | 'inativos';
type FiltroPerfil = PerfilUsuario | 'todos';

function formatRelative(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return date.toLocaleDateString('pt-BR');
}

const STATUS_FILTERS: Array<{ label: string; value: FiltroStatus }> = [
  { label: 'Todos',    value: 'todos'    },
  { label: 'Ativos',   value: 'ativos'   },
  { label: 'Inativos', value: 'inativos' },
];

const PERFIL_FILTERS: Array<{ label: string; value: FiltroPerfil }> = [
  { label: 'Todos os perfis', value: 'todos'      },
  { label: 'Admin',           value: 'admin'      },
  { label: 'Vendas',          value: 'vendas'     },
  { label: 'Logística',       value: 'logistica'  },
  { label: 'Financeiro',      value: 'financeiro' },
  { label: 'Leitura',         value: 'leitura'    },
];

export function UsuariosPage() {
  const { data, loading, refreshing, error, updatedAt, refresh } = useUsuarios();

  const [busca,        setBusca]        = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [filtroPerfil, setFiltroPerfil] = useState<FiltroPerfil>('todos');
  const [formOpen,     setFormOpen]     = useState(false);

  const totalAtivos   = data.filter(u => u.ativo).length;
  const totalInativos = data.filter(u => !u.ativo).length;

  const filtered = useMemo(() => {
    return data
      .filter(u => {
        if (filtroStatus === 'ativos')   return u.ativo;
        if (filtroStatus === 'inativos') return !u.ativo;
        return true;
      })
      .filter(u => filtroPerfil === 'todos' || u.perfil === filtroPerfil)
      .filter(u => {
        const q = busca.toLowerCase();
        return u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      });
  }, [data, filtroStatus, filtroPerfil, busca]);

  if (loading) {
    return (
      <div className="usr-loading">
        <Loader2 size={28} className="usr-spin" />
        <p style={{ fontSize: 13 }}>Carregando usuários...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="usr-error-state">
        <AlertCircle size={28} />
        <p style={{ fontWeight: 600, fontSize: 13 }}>Não foi possível carregar os usuários.</p>
        <p style={{ fontSize: 12, color: 'var(--lsw-text-muted)' }}>{error}</p>
        <button className="usr-btn usr-btn--primary" style={{ marginTop: 8 }} onClick={refresh}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="usr-header">
        <div>
          <h2 className="usr-header__title">Usuários</h2>
          <p className="usr-header__sub">Gerencie acessos e perfis do sistema.</p>
          {updatedAt && (
            <p className="usr-header__stamp">Atualizado {formatRelative(updatedAt)}</p>
          )}
        </div>
        <div className="usr-header__actions">
          <button className="usr-btn usr-btn--secondary" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'usr-spin' : ''} />
            Atualizar
          </button>
          <button className="usr-btn usr-btn--primary" onClick={() => setFormOpen(true)}>
            <UserPlus size={14} />
            Novo usuário
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="usr-kpi-grid">
        <div className="usr-kpi-card">
          <div className="usr-kpi-card__value usr-kpi-card__value--primary">{data.length}</div>
          <div className="usr-kpi-card__label">Total de usuários</div>
        </div>
        <div className="usr-kpi-card">
          <div className="usr-kpi-card__value usr-kpi-card__value--success">{totalAtivos}</div>
          <div className="usr-kpi-card__label">Ativos</div>
        </div>
        <div className="usr-kpi-card">
          <div className="usr-kpi-card__value usr-kpi-card__value--muted">{totalInativos}</div>
          <div className="usr-kpi-card__label">Inativos</div>
        </div>
      </div>

      {/* Busca */}
      <input
        className="usr-search"
        placeholder="Buscar por nome ou e-mail..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      {/* Filtro de status */}
      <div className="usr-filter-row">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            className={`usr-pill ${filtroStatus === f.value ? 'usr-pill--active' : ''}`}
            onClick={() => setFiltroStatus(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtro de perfil */}
      <div className="usr-filter-row" style={{ marginBottom: 20 }}>
        {PERFIL_FILTERS.map(f => (
          <button
            key={f.value}
            className={`usr-pill ${filtroPerfil === f.value ? 'usr-pill--active' : ''}`}
            onClick={() => setFiltroPerfil(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="usr-empty">
          <Inbox size={28} />
          <p style={{ fontSize: 13 }}>Nenhum usuário encontrado.</p>
          {busca && (
            <button className="usr-empty__link" onClick={() => setBusca('')}>
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="usr-list">
          {filtered.map(u => (
            <UsuarioCard key={u.id} usuario={u} onRefresh={refresh} />
          ))}
        </div>
      )}

      {formOpen && (
        <UsuarioFormModal
          onClose={() => setFormOpen(false)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
