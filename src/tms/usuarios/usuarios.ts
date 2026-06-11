export type PerfilUsuario =
  | 'admin'
  | 'vendas'
  | 'logistica'
  | 'financeiro'
  | 'leitura';

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  ultimo_acesso: string | null;
  criado_em: string;
}

export interface CriarUsuarioPayload {
  email: string;
  nome: string;
  perfil: PerfilUsuario;
  senha_temporaria: string;
}

export interface AtualizarUsuarioPayload {
  nome?: string;
  perfil?: PerfilUsuario;
  ativo?: boolean;
}

const BASE =
  import.meta.env.VITE_N8N_BASE ??
  'https://dreamingcow-n8n.cloudfy.live/webhook';

async function request<T>(
  path: string,
  options?: RequestInit,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    signal,
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Erro ${res.status}: ${msg}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchUsuarios(signal?: AbortSignal): Promise<Usuario[]> {
  const data = await request<Usuario[]>('/tms-usuarios-list', { method: 'GET' }, signal);
  if (!Array.isArray(data)) throw new Error('Resposta inesperada da API.');
  return data;
}

export async function criarUsuario(payload: CriarUsuarioPayload): Promise<void> {
  await request('/tms-usuarios-create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function atualizarUsuario(
  id: string,
  patch: AtualizarUsuarioPayload,
): Promise<void> {
  await request('/tms-usuarios-update', {
    method: 'POST',
    body: JSON.stringify({ id, ...patch }),
  });
}

export async function deletarUsuario(id: string): Promise<void> {
  await request('/tms-usuarios-delete', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function resetarSenha(email: string, novaSenha: string): Promise<void> {
  const res = await request<{ ok: boolean }>('/tms-usuarios-reset-senha', {
    method: 'POST',
    body: JSON.stringify({ email, nova_senha: novaSenha }),
  });
  if (!res.ok) throw new Error('Usuário não encontrado.');
}
