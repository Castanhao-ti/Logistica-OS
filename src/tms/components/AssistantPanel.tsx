import React, { useEffect, useState } from 'react';
import { Sparkles, SendHorizontal, Timer, MapPin } from 'lucide-react';

const CHIPS = ['Status de Pedidos', 'Entregas Atrasadas', 'Minhas Prioridades'];

const HISTORY = [
  { name: 'Rota Centro', info: '12 entregas · 4h12', status: 'done' as const },
  { name: 'Rota Litoral', info: '8 entregas · 5h47', status: 'done' as const },
  { name: 'Rota Interior — Sorocaba', info: '6 entregas · atrasada 0h38', status: 'delayed' as const },
  { name: 'Rota Grande SP — Osasco', info: '15 entregas · 3h55', status: 'done' as const },
];

function useElapsed(startedMinutesAgo: number) {
  const [seconds, setSeconds] = useState(startedMinutesAgo * 60);
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function AssistantPanel() {
  const elapsed = useElapsed(147);

  return (
    <aside className="lsw-right">
      <div className="lsw-ai-card">
        <div className="lsw-ai-card__header">
          <div className="lsw-ai-card__avatar">
            <Sparkles size={18} />
          </div>
          <div>
            <strong>LSW AI</strong>
            <span>Assistente de operação</span>
          </div>
        </div>
        <p className="lsw-ai-card__greeting">
          Olá! Sou a LSW AI. Como posso ajudar sua operação hoje?
        </p>
        <div className="lsw-ai-card__chips">
          {CHIPS.map(chip => (
            <button key={chip} className="lsw-ai-chip">{chip}</button>
          ))}
        </div>
        <div className="lsw-ai-input">
          Pergunte alguma coisa...
          <SendHorizontal size={15} />
        </div>
      </div>

      <div className="lsw-card lsw-tracker-card">
        <div className="lsw-card__header">
          <span className="lsw-card__title">Acompanhamento de Entregas</span>
        </div>
        <div className="lsw-tracker__active">
          <div className="lsw-tracker__active-top">
            <span className="lsw-tracker__pulse" />
            Rota ABC — Em rota
          </div>
          <div className="lsw-tracker__timer">
            <Timer size={18} />
            {elapsed}
          </div>
          <div className="lsw-tracker__sub">
            <MapPin size={12} />
            9 de 14 entregas concluídas · Viamex Diadema
          </div>
        </div>
        <div className="lsw-tracker__history">
          {HISTORY.map(item => (
            <div key={item.name} className="lsw-tracker__history-item">
              <span className={`lsw-tracker__dot lsw-tracker__dot--${item.status}`} />
              <span className="lsw-tracker__history-name">{item.name}</span>
              <span className="lsw-tracker__history-info">{item.info}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
