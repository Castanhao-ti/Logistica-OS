import React from 'react';
import { Bell, Calendar, LogOut } from 'lucide-react';
import type { SessionUser } from '../auth/auth';

const PERFIL_LABELS: Record<SessionUser['perfil'], string> = {
  admin: 'Admin',
  vendas: 'Vendas',
  logistica: 'Logística',
  financeiro: 'Financeiro',
  leitura: 'Leitura',
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

interface Props {
  title?: string;
  subtitle?: string;
  user: SessionUser;
  onLogout: () => void;
}

export default function Topbar({ title, subtitle, user, onLogout }: Props) {
  const firstName = user.nome.split(' ')[0] ?? '';
  const initials = user.nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const rawDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <div className="lsw-topbar">
      <div className="lsw-topbar__greeting">
        <h1>{title ?? `${greeting()}${firstName ? `, ${firstName}` : ''}`}</h1>
        <p>{subtitle ?? 'Veja o que está acontecendo hoje na LSW.'}</p>
      </div>
      <div className="lsw-topbar__actions">
        <span className="lsw-topbar__date">
          <Calendar size={14} />
          {dateLabel}
        </span>
        <button className="lsw-icon-btn" title="Notificações">
          <Bell size={17} />
          <span className="lsw-icon-btn__dot" />
        </button>
        <div className="lsw-topbar__user">
          <div className="lsw-topbar__avatar">{initials}</div>
          <div className="lsw-topbar__user-info">
            <strong>{user.nome}</strong>
            <span>{PERFIL_LABELS[user.perfil]}</span>
          </div>
          <button className="lsw-topbar__logout" title="Sair" onClick={onLogout}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
