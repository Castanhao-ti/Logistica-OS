import React from 'react';
import { Search, Bell } from 'lucide-react';

const FIRST_NAME = 'Rodolfo';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

interface Props {
  title?: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: Props) {
  return (
    <div className="lsw-topbar">
      <div className="lsw-topbar__greeting">
        <h1>{title ?? `${greeting()}, ${FIRST_NAME}`}</h1>
        <p>{subtitle ?? 'Veja o que está acontecendo hoje na LSW.'}</p>
      </div>
      <div className="lsw-topbar__actions">
        <div className="lsw-search">
          <Search size={16} />
          <input placeholder="Buscar pedidos, clientes..." disabled />
        </div>
        <button className="lsw-icon-btn" title="Notificações">
          <Bell size={17} />
          <span className="lsw-icon-btn__dot" />
        </button>
      </div>
    </div>
  );
}
