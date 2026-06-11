export type PerfilAcesso = 'admin' | 'vendas' | 'logistica' | 'financeiro' | 'leitura';

export interface SessionUser {
  id: string;
  email: string;
  nome: string;
  perfil: PerfilAcesso;
}

const BASE =
  (import.meta.env.VITE_N8N_BASE as string) ??
  'https://dreamingcow-n8n.cloudfy.live/webhook';

const STORAGE_KEY = 'tms_session';

export async function login(email: string, senha: string): Promise<SessionUser> {
  const res = await fetch(`${BASE}/tms-usuarios-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });
  if (!res.ok) {
    throw new Error('Erro ao conectar com o servidor. Tente novamente.');
  }
  const data = (await res.json()) as
    | { ok: true; usuario: SessionUser }
    | { ok: false; error: string };
  if (!data.ok) throw new Error(data.error);
  return data.usuario;
}

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as SessionUser;
    if (!user.id || !user.email || !user.perfil) return null;
    return user;
  } catch {
    return null;
  }
}

export function saveSession(user: SessionUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
