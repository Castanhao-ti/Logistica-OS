import React from 'react';
import { Truck, TicketPercent, Target, Users, Settings, ArrowUpRight } from 'lucide-react';
import type { View } from './Sidebar';

interface Props {
  verDescontos: boolean;
  verCrm: boolean;
  isAdmin: boolean;
  onNavigate: (v: View) => void;
}

export default function DashboardView({ verDescontos, verCrm, isAdmin, onNavigate }: Props) {
  const cards: Array<{
    view: View;
    icon: typeof Truck;
    title: string;
    desc: string;
    visible: boolean;
  }> = [
    {
      view: 'tms',
      icon: Truck,
      title: 'TMS — Roteirização',
      desc: 'Aprove cargas, acompanhe transportadoras e resolva pendências de roteirização.',
      visible: true,
    },
    {
      view: 'descontos',
      icon: TicketPercent,
      title: 'Pedidos c/ Desconto',
      desc: 'Analise margem e aprove pedidos com desconto antes do faturamento.',
      visible: verDescontos,
    },
    {
      view: 'crm',
      icon: Target,
      title: 'CRM Comercial',
      desc: 'Gerencie carteira priorizada, agenda e oportunidades da equipe de vendas.',
      visible: verCrm,
    },
    {
      view: 'usuarios',
      icon: Users,
      title: 'Usuários',
      desc: 'Gerencie acessos e perfis de quem usa o painel.',
      visible: isAdmin,
    },
    {
      view: 'admin',
      icon: Settings,
      title: 'Configurações Admin',
      desc: 'Regras de roteirização, exceções de CEP e tabelas de frete.',
      visible: isAdmin,
    },
  ];

  return (
    <div className="lsw-dash">
      <section className="lsw-dash__banner">
        <div className="lsw-dash__banner-text">
          <span className="lsw-dash__badge">Painel LSW</span>
          <h2>Central de Gestão LSW Distribuidora</h2>
          <p>Clareza, agilidade e parceria para gerar resultado. Escolha um módulo para começar.</p>
        </div>
        <button
          className="lsw-dash__cta"
          onClick={() => onNavigate(verDescontos ? 'descontos' : 'tms')}
        >
          {verDescontos ? 'Abrir Pedidos c/ Desconto' : 'Abrir TMS — Roteirização'}
        </button>
      </section>

      <div className="lsw-dash__grid">
        {cards.filter(c => c.visible).map(c => {
          const Icon = c.icon;
          return (
            <button key={c.view} className="lsw-dash__card" onClick={() => onNavigate(c.view)}>
              <span className="lsw-dash__card-icon"><Icon size={20} /></span>
              <span className="lsw-dash__card-body">
                <strong>{c.title}</strong>
                <span>{c.desc}</span>
              </span>
              <ArrowUpRight size={16} className="lsw-dash__card-arrow" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
