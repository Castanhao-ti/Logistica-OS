import React, { useState } from 'react';
import {
  BarChart3,
  Briefcase,
  CalendarClock,
  Crown,
  LayoutDashboard,
  PhoneCall,
  Target,
  TrendingUp,
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import type { SessionUser } from '../auth/auth';
import { VisaoGeralTab } from './VisaoGeralTab';
import { CarteiraTab } from './CarteiraTab';
import { MinhaAgendaTab } from './MinhaAgendaTab';
import './crm.css';

type AbaCrm =
  | 'visao_geral'
  | 'minha_agenda'
  | 'carteira'
  | 'reativacao'
  | 'sdr'
  | 'carteira_luiz'
  | 'oportunidades'
  | 'relatorios';

interface AbaConfig {
  value: AbaCrm;
  label: string;
  icon: React.ReactNode;
  titulo: string;
  subtitulo: string;
}

const ABAS: AbaConfig[] = [
  {
    value: 'visao_geral',
    label: 'Visão geral',
    icon: <LayoutDashboard size={15} />,
    titulo: 'Visão geral da carteira',
    subtitulo:
      'Indicadores agregados de toda a base — ativos, inativos, sem pedido, prioridades e venda histórica.',
  },
  {
    value: 'minha_agenda',
    label: 'Minha agenda',
    icon: <CalendarClock size={15} />,
    titulo: 'Minha agenda',
    subtitulo:
      'Clientes da sua carteira agrupados por urgência — comece pelas ações vencidas, depois hoje, semana e sem próximo passo.',
  },
  {
    value: 'carteira',
    label: 'Carteira priorizada',
    icon: <Briefcase size={15} />,
    titulo: 'Carteira priorizada',
    subtitulo:
      'Lista pública da carteira. Use "Pegar próximo" para puxar da fila ou clique em "Assumir" para escolher um cliente específico.',
  },
  {
    value: 'reativacao',
    label: 'Reativação',
    icon: <TrendingUp size={15} />,
    titulo: 'Carteira de reativação',
    subtitulo:
      'Clientes que pararam de comprar — segmentados pelas faixas de 31–60, 61–120, 121–180 e 180+ dias.',
  },
  {
    value: 'sdr',
    label: 'SDR — Sem pedido',
    icon: <PhoneCall size={15} />,
    titulo: 'SDR — Clientes sem pedido',
    subtitulo:
      'Base de cadastro nunca convertida em pedido — foco de prospecção e ativação.',
  },
  {
    value: 'carteira_luiz',
    label: 'Carteira Luiz',
    icon: <Crown size={15} />,
    titulo: 'Carteira Luiz Bobko',
    subtitulo:
      'Carteira estratégica do Luiz — separada da operação comum para não distorcer os indicadores das vendas internas.',
  },
  {
    value: 'oportunidades',
    label: 'Oportunidades',
    icon: <Target size={15} />,
    titulo: 'Funil de oportunidades',
    subtitulo:
      'Pipeline de vendas em aberto — do primeiro contato ao fechamento (ganho / perdido).',
  },
  {
    value: 'relatorios',
    label: 'Relatórios',
    icon: <BarChart3 size={15} />,
    titulo: 'Relatórios',
    subtitulo:
      'Exportações, produtividade por owner e visões consolidadas para reuniões comerciais.',
  },
];

const STUBS: Record<AbaCrm, { titulo: string; descricao: string; itens: string[] } | null> = {
  visao_geral: null,
  minha_agenda: null,
  carteira: null,
  reativacao: {
    titulo: 'Funil de reativação em construção',
    descricao:
      'Vai usar os mesmos dados de crm_indicadores_cliente segmentados por faixa de inatividade. Próximo passo: filtrar carteira nas faixas 31–60, 61–120, 121–180 e 180+ com KPIs de venda histórica em risco.',
    itens: [
      'Funil por faixa de inatividade',
      'Venda histórica em risco por faixa',
      'Clientes reativados no período',
      'Pedidos gerados após ação comercial',
      'Taxa de reativação por owner',
    ],
  },
  sdr: {
    titulo: 'Painel SDR em construção',
    descricao:
      'Filtragem da carteira em SEM_PEDIDO com funil de ativação (contatados → qualificados → convertidos) lendo de crm_acoes_comerciais.',
    itens: [
      'Total de clientes sem pedido (já mapeado: 3.446)',
      'Funil contatados / qualificados / convertidos',
      'Principais motivos de não compra',
      'Conversão por SDR',
    ],
  },
  carteira_luiz: {
    titulo: 'Visão Key Account em construção',
    descricao:
      'Filtra eh_carteira_luiz = TRUE em vw_crm_carteira_luiz (já criada). 364 clientes mapeados.',
    itens: [
      'Carteira priorizada exclusiva do Luiz',
      'Indicadores comparativos vs operação interna',
      'Ações registradas no período',
    ],
  },
  oportunidades: {
    titulo: 'Pipeline em construção',
    descricao:
      'Kanban por etapa (Novo → Contatado → Qualificado → Proposta → Negociação → Ganho/Perdido). Persiste em crm_oportunidades.',
    itens: [
      'Kanban arrastável por etapa',
      'Valor estimado e ponderado',
      'Origem da oportunidade',
      'Motivos de perda',
    ],
  },
  relatorios: {
    titulo: 'Relatórios em construção',
    descricao:
      'Produtividade por owner (já temos vw_crm_produtividade_owner), ações por canal/tipo/resultado, exports CSV.',
    itens: [
      'Produtividade por owner',
      'Ações por canal e resultado',
      'Conversão por período',
      'Export CSV da carteira filtrada',
    ],
  },
};

interface Props {
  user: SessionUser;
}

export function CrmPage({ user }: Props) {
  const [aba, setAba] = useState<AbaCrm>('minha_agenda');
  const [agendaKey, setAgendaKey] = useState(0);
  const abaAtual = ABAS.find(a => a.value === aba) ?? ABAS[0];
  const stub = STUBS[aba];

  return (
    <div className="crm-shell">
      <div className="crm-tabs-bar">
        {ABAS.map(a => (
          <button
            key={a.value}
            className={`crm-tabbtn ${a.value === aba ? 'crm-tabbtn--active' : ''}`}
            onClick={() => setAba(a.value)}
          >
            {a.icon}
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      <div className="crm-subheader">
        <div className="crm-subheader__title-area">
          <h2 className="crm-subheader__title">{abaAtual.titulo}</h2>
          <p className="crm-subheader__sub">{abaAtual.subtitulo}</p>
        </div>
      </div>

      {aba === 'visao_geral' && <VisaoGeralTab />}
      {aba === 'minha_agenda' && <MinhaAgendaTab key={agendaKey} user={user} />}
      {aba === 'carteira' && (
        <CarteiraTab
          user={user}
          onClienteAtribuido={() => setAgendaKey(k => k + 1)}
        />
      )}

      {stub && (
        <>
          <EmptyState icon={<Target size={22} />} title={stub.titulo} description={stub.descricao} />
          <div className="crm-stub-card">
            <h3 className="crm-stub-card__title">O que esta aba vai entregar</h3>
            <p className="crm-stub-card__desc">
              Backlog técnico — backend já preparado, só falta o front desta seção.
            </p>
            <ul className="crm-stub-card__list">
              {stub.itens.map(it => (
                <li key={it} className="crm-stub-card__item">
                  <span className="crm-stub-card__dot" />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default CrmPage;
