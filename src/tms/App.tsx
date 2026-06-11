import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import OperacaoPanel from './pages/OperacaoPanel';
import Sidebar, { type View } from './components/Sidebar';
import Topbar from './components/Topbar';
import './tms.css';

export default function App() {
  const [view, setView] = useState<View>('tms');
  const [pendingCount, setPendingCount] = useState(0);

  return (
    <div className="tms-root">
      <div className="lsw-shell">
        <Sidebar view={view} onChange={setView} pendingCount={pendingCount} />

        <main className="lsw-main">
          <Topbar
            title={view === 'admin' ? 'Configurações Admin' : undefined}
            subtitle={view === 'admin' ? 'Regras de roteirização, exceções de CEP e tabelas de frete.' : undefined}
          />
          <div className="lsw-content">
            {view === 'tms' && <OperacaoPanel onCountChange={setPendingCount} />}
            {view === 'admin' && (
              <div className="lsw-empty-state">
                <div className="lsw-empty-state__icon">
                  <Settings size={24} />
                </div>
                <div className="lsw-empty-state__title">Painel Administrativo</div>
                <div className="lsw-empty-state__sub">
                  Construtor de regras, gestão de exceções de CEP e upload de tabelas de frete — em construção.
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
