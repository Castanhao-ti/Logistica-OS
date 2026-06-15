import React from 'react';
import { Truck, Settings, LifeBuoy, Users, LogOut, TicketPercent } from 'lucide-react';
import BrandMark from './BrandMark';
import type { SessionUser } from '../auth/auth';
import { podeOperar } from '../descontos/descontos';

export type View = 'tms' | 'admin' | 'usuarios' | 'descontos';

const PERFIL_LABELS: Record<SessionUser['perfil'], string> = {
  admin: 'Admin',
  vendas: 'Vendas',
  logistica: 'Logística',
  financeiro: 'Financeiro',
  leitura: 'Leitura',
};

interface Props {
  view: View;
  onChange: (v: View) => void;
  pendingCount: number;
  user: SessionUser;
  onLogout: () => void;
}

export default function Sidebar({ view, onChange, pendingCount, user, onLogout }: Props) {
  const isAdmin   = user.perfil === 'admin';
  const verDescontos = podeOperar(user.perfil);
  const initials = user.nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="lsw-sidebar">
      <div className="lsw-sidebar__brand">
        <BrandMark />
        <div className="lsw-sidebar__brand-text">
          <strong>LSW Distribuidora</strong>
          <span>Central de Gestão</span>
        </div>
      </div>

      <nav className="lsw-sidebar__nav">
        <button
          className={`lsw-sidebar__nav-item ${view === 'tms' ? 'lsw-sidebar__nav-item--active' : ''}`}
          onClick={() => onChange('tms')}
        >
          <Truck size={18} />
          <span>TMS — Roteirização</span>
          {pendingCount > 0 && (
            <span className="lsw-sidebar__nav-badge">{pendingCount}</span>
          )}
        </button>
        {verDescontos && (
          <button
            className={`lsw-sidebar__nav-item ${view === 'descontos' ? 'lsw-sidebar__nav-item--active' : ''}`}
            onClick={() => onChange('descontos')}
          >
            <TicketPercent size={18} />
            <span>Pedidos c/ Desconto</span>
          </button>
        )}
        {isAdmin && (
          <>
            <button
              className={`lsw-sidebar__nav-item ${view === 'usuarios' ? 'lsw-sidebar__nav-item--active' : ''}`}
              onClick={() => onChange('usuarios')}
            >
              <Users size={18} />
              <span>Usuários</span>
            </button>
            <button
              className={`lsw-sidebar__nav-item ${view === 'admin' ? 'lsw-sidebar__nav-item--active' : ''}`}
              onClick={() => onChange('admin')}
            >
              <Settings size={18} />
              <span>Configurações Admin</span>
            </button>
          </>
        )}
      </nav>

      <div className="lsw-sidebar__footer">
        <button className="lsw-sidebar__support">
          <LifeBuoy size={16} />
          Suporte
        </button>
        <div className="lsw-sidebar__user">
          <div className="lsw-sidebar__avatar">{initials}</div>
          <div className="lsw-sidebar__user-info">
            <strong>{user.nome}</strong>
            <span>{PERFIL_LABELS[user.perfil]}</span>
          </div>
          <button className="lsw-sidebar__logout" title="Sair" onClick={onLogout}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
