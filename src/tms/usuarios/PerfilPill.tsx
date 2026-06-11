import type { PerfilUsuario } from './usuarios';

const CONFIG: Record<PerfilUsuario, { label: string; mod: string }> = {
  admin:      { label: 'Admin',      mod: 'usr-perfil--admin'      },
  vendas:     { label: 'Vendas',     mod: 'usr-perfil--vendas'     },
  logistica:  { label: 'Logística',  mod: 'usr-perfil--logistica'  },
  financeiro: { label: 'Financeiro', mod: 'usr-perfil--financeiro' },
  leitura:    { label: 'Leitura',    mod: 'usr-perfil--leitura'    },
};

export function PerfilPill({ perfil }: { perfil: PerfilUsuario }) {
  const { label, mod } = CONFIG[perfil];
  return <span className={`usr-perfil ${mod}`}>{label}</span>;
}
