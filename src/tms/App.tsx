import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import OperacaoPanel from './pages/OperacaoPanel';
import { UsuariosPage } from './usuarios/UsuariosPage';
import { DescontosPage } from './descontos/DescontosPage';
import { podeOperar } from './descontos/descontos';
import Sidebar, { type View } from './components/Sidebar';
import Topbar from './components/Topbar';
import { EmptyState } from './components/EmptyState';
import LoginPage from './auth/LoginPage';
import { getSession, clearSession, type SessionUser } from './auth/auth';
import './tms.css';

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(() => getSession());
  const [view, setView] = useState<View>('tms');
  const [pendingCount, setPendingCount] = useState(0);

  if (!user) {
    return (
      <div className="tms-root">
        <LoginPage onLogin={u => { setUser(u); setView('tms'); }} />
      </div>
    );
  }

  const isAdmin   = user.perfil === 'admin';
  const verDescontos = podeOperar(user.perfil);
  const podeView = (v: View): boolean => {
    if (v === 'tms') return true;
    if (v === 'descontos') return verDescontos;
    return isAdmin;
  };
  const activeView: View = podeView(view) ? view : 'tms';

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setView('tms');
  };

  return (
    <div className="tms-root">
      <div className="lsw-shell">
        <Sidebar
          view={activeView}
          onChange={setView}
          pendingCount={pendingCount}
          user={user}
          onLogout={handleLogout}
        />

        <main className="lsw-main">
          <Topbar
            title={activeView === 'admin' ? 'Configurações Admin' : undefined}
            subtitle={activeView === 'admin' ? 'Regras de roteirização, exceções de CEP e tabelas de frete.' : undefined}
          />
          <div className="lsw-content">
            {activeView === 'tms'       && <OperacaoPanel onCountChange={setPendingCount} />}
            {activeView === 'descontos' && verDescontos && <DescontosPage user={user} />}
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
