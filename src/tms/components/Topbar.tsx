import React from 'react';
import { Bell } from 'lucide-react';
import { getSession } from '../auth/auth';

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
  const firstName = getSession()?.nome.split(' ')[0] ?? '';

  return (
    <div className="lsw-topbar">
      <div className="lsw-topbar__greeting">
        <h1>{title ?? `${greeting()}${firstName ? `, ${firstName}` : ''}`}</h1>
        <p>{subtitle ?? 'Veja o que está acontecendo hoje na LSW.'}</p>
      </div>
      <div className="lsw-topbar__actions">
        <button className="lsw-icon-btn" title="Notificações">
          <Bell size={17} />
          <span className="lsw-icon-btn__dot" />
        </button>
      </div>
    </div>
  );
}
