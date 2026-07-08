import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import OperacaoPanel from './pages/OperacaoPanel';
import { UsuariosPage } from './usuarios/UsuariosPage';
import { DescontosPage } from './descontos/DescontosPage';
import { CrmPage } from './crm/CrmPage';
import { podeOperar } from './descontos/descontos';
import { podeVerCrm } from './crm/crm';
import Sidebar, { type View } from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardView from './components/DashboardView';
import { EmptyState } from './components/EmptyState';
import LoginPage from './auth/LoginPage';
import { getSession, clearSession, type SessionUser } from './auth/auth';
import './tms.css';

const TOPBAR_TITLES: Partial<Record<View, { title: string; subtitle: string }>> = {
  tms:       { title: 'TMS — Roteirização',    subtitle: 'Aprove cargas, acompanhe transportadoras e resolva pendências de roteirização.' },
  descontos: { title: 'Pedidos c/ Desconto',   subtitle: 'Analise margem e aprove pedidos com desconto antes do faturamento.' },
  crm:       { title: 'CRM Comercial',         subtitle: 'Gerencie carteira priorizada, agenda e oportunidades da equipe de vendas.' },
  usuarios:  { title: 'Usuários',              subtitle: 'Gerencie acessos e perfis de quem usa o painel.' },
  admin:     { title: 'Configurações Admin',   subtitle: 'Regras de roteirização, exceções de CEP e tabelas de frete.' },
};

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(() => getSession());
  const [view, setView] = useState<View>('dashboard');
  const [pendingCount, setPendingCount] = useState(0);

  if (!user) {
    return (
      <div className="tms-root">
        <LoginPage onLogin={u => { setUser(u); setView('dashboard'); }} />
      </div>
    );
  }

  const isAdmin   = user.perfil === 'admin';
  const verDescontos = podeOperar(user.perfil);
  const verCrm = podeVerCrm(user.perfil);
  const podeView = (v: View): boolean => {
    if (v === 'dashboard' || v === 'tms') return true;
    if (v === 'descontos') return verDescontos;
    if (v === 'crm') return verCrm;
    return isAdmin;
  };
  const activeView: View = podeView(view) ? view : 'dashboard';

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setView('dashboard');
  };

  return (
    <div className="tms-root">
      <div className="lsw-shell">
        <Sidebar
          view={activeView}
          onChange={setView}
          pendingCount={pendingCount}
          user={user}
        />

        <main className="lsw-main">
          <Topbar
            title={TOPBAR_TITLES[activeView]?.title}
            subtitle={TOPBAR_TITLES[activeView]?.subtitle}
            user={user}
            onLogout={handleLogout}
          />
          <div className="lsw-content">
            {activeView === 'dashboard' && (
              <DashboardView
                verDescontos={verDescontos}
                verCrm={verCrm}
                isAdmin={isAdmin}
                onNavigate={setView}
              />
            )}
            {activeView === 'tms'       && <OperacaoPanel onCountChange={setPendingCount} />}
            {activeView === 'descontos' && verDescontos && <DescontosPage user={user} />}
            {activeView === 'crm'       && verCrm && <CrmPage user={user} />}
            {activeView === 'usuarios'  && isAdmin && <UsuariosPage />}
            {activeView === 'admin' && isAdmin && (
              <EmptyState
                icon={<Settings size={22} />}
                title="Painel Administrativo"
                description="Construtor de regras, gestão de exceções de CEP e upload de tabelas de frete — em construção."
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
