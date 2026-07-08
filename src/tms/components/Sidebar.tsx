import React from 'react';
import { LayoutDashboard, Truck, Settings, LifeBuoy, Users, TicketPercent, Target } from 'lucide-react';
import BrandMark from './BrandMark';
import type { SessionUser } from '../auth/auth';
import { podeOperar } from '../descontos/descontos';
import { podeVerCrm } from '../crm/crm';

export type View = 'dashboard' | 'tms' | 'admin' | 'usuarios' | 'descontos' | 'crm';

interface Props {
  view: View;
  onChange: (v: View) => void;
  pendingCount: number;
  user: SessionUser;
}

export default function Sidebar({ view, onChange, pendingCount, user }: Props) {
  const isAdmin   = user.perfil === 'admin';
  const verDescontos = podeOperar(user.perfil);
  const verCrm = podeVerCrm(user.perfil);

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
          className={`lsw-sidebar__nav-item ${view === 'dashboard' ? 'lsw-sidebar__nav-item--active' : ''}`}
          onClick={() => onChange('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>
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
        {verCrm && (
          <button
            className={`lsw-sidebar__nav-item ${view === 'crm' ? 'lsw-sidebar__nav-item--active' : ''}`}
            onClick={() => onChange('crm')}
          >
            <Target size={18} />
            <span>CRM Comercial</span>
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
      </div>
    </aside>
  );
}
