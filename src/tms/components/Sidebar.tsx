import React from 'react';
import { Truck, Settings, LifeBuoy } from 'lucide-react';

export type View = 'tms' | 'admin';

interface Props {
  view: View;
  onChange: (v: View) => void;
  pendingCount: number;
}

export default function Sidebar({ view, onChange, pendingCount }: Props) {
  return (
    <aside className="lsw-sidebar">
      <div className="lsw-sidebar__brand">
        <div className="lsw-sidebar__mark">LSW</div>
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
        <button
          className={`lsw-sidebar__nav-item ${view === 'admin' ? 'lsw-sidebar__nav-item--active' : ''}`}
          onClick={() => onChange('admin')}
        >
          <Settings size={18} />
          <span>Configurações Admin</span>
        </button>
      </nav>

      <div className="lsw-sidebar__footer">
        <button className="lsw-sidebar__support">
          <LifeBuoy size={16} />
          Suporte
        </button>
        <div className="lsw-sidebar__user">
          <div className="lsw-sidebar__avatar">RA</div>
          <div className="lsw-sidebar__user-info">
            <strong>Rodolfo Almeida</strong>
            <span>Logística</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
