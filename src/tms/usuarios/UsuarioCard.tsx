import { useState } from 'react';
import { Pencil, Trash2, ShieldCheck, ShieldOff, RotateCcw } from 'lucide-react';
import { atualizarUsuario, deletarUsuario, resetarSenha, type Usuario } from './usuarios';
import { PerfilPill } from './PerfilPill';
import { UsuarioFormModal } from './UsuarioFormModal';
import { StatusChip } from '../components/StatusChip';

interface Props {
  usuario: Usuario;
  onRefresh: () => void;
}

type Confirmacao = 'deletar' | 'desativar' | 'resetar_senha' | null;

export function UsuarioCard({ usuario, onRefresh }: Props) {
  const [editOpen,    setEditOpen]    = useState(false);
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null);
  const [novaSenha,   setNovaSenha]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [erroInline,  setErroInline]  = useState<string | null>(null);

  const executarAcao = async () => {
    if (confirmacao === 'resetar_senha' && novaSenha.length < 8) {
      setErroInline('A nova senha precisa ter no mínimo 8 caracteres.');
      return;
    }
    setLoading(true);
    setErroInline(null);
    try {
      if (confirmacao === 'deletar')        await deletarUsuario(usuario.id);
      else if (confirmacao === 'desativar') await atualizarUsuario(usuario.id, { ativo: !usuario.ativo });
      else if (confirmacao === 'resetar_senha') await resetarSenha(usuario.email, novaSenha);
      setConfirmacao(null);
      setNovaSenha('');
      onRefresh();
    } catch (e) {
      setErroInline((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const CONFIGS: Record<
    NonNullable<Confirmacao>,
    { titulo: string; descricao: string; botao: string; btnClass: string }
  > = {
    deletar: {
      titulo:    'Remover usuário?',
      descricao: `${usuario.nome} perderá o acesso imediatamente. Esta ação não pode ser desfeita.`,
      botao:     'Confirmar remoção',
      btnClass:  'usr-btn usr-btn--danger',
    },
    desativar: {
      titulo:    usuario.ativo ? 'Desativar usuário?' : 'Reativar usuário?',
      descricao: usuario.ativo
        ? `${usuario.nome} não conseguirá mais entrar no sistema.`
        : `${usuario.nome} voltará a ter acesso ao sistema.`,
      botao:     usuario.ativo ? 'Desativar' : 'Reativar',
      btnClass:  usuario.ativo ? 'usr-btn usr-btn--warning' : 'usr-btn usr-btn--primary',
    },
    resetar_senha: {
      titulo:    'Redefinir senha',
      descricao: `Defina a nova senha de acesso de ${usuario.nome} e informe a ele com segurança.`,
      botao:     'Salvar nova senha',
      btnClass:  'usr-btn usr-btn--primary',
    },
  };

  const initials = usuario.nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <div className="usr-card">
        <div className="usr-avatar">{initials}</div>

        <div className="usr-info">
          <p className="usr-info__name">{usuario.nome}</p>
          <p className="usr-info__email">{usuario.email}</p>
        </div>

        <div className="usr-badges">
          <PerfilPill perfil={usuario.perfil} />
          <StatusChip tone={usuario.ativo ? 'entregue' : 'rascunho'}>
            {usuario.ativo ? 'Ativo' : 'Inativo'}
          </StatusChip>
        </div>

        <p className="usr-last-access">
          {usuario.ultimo_acesso
            ? new Date(usuario.ultimo_acesso).toLocaleDateString('pt-BR')
            : 'Nunca acessou'}
        </p>

        <div className="usr-actions">
          <button className="usr-icon-btn" title="Editar nome e perfil" onClick={() => setEditOpen(true)}>
            <Pencil size={14} />
          </button>
          <button
            className="usr-icon-btn"
            title={usuario.ativo ? 'Desativar acesso' : 'Reativar acesso'}
            onClick={() => setConfirmacao('desativar')}
          >
            {usuario.ativo ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
          </button>
          <button className="usr-icon-btn" title="Resetar senha" onClick={() => setConfirmacao('resetar_senha')}>
            <RotateCcw size={14} />
          </button>
          <button className="usr-icon-btn usr-icon-btn--danger" title="Remover usuário" onClick={() => setConfirmacao('deletar')}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {confirmacao && (
        <div className="usr-overlay">
          <div className="usr-modal" style={{ maxWidth: 380 }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--lsw-text)' }}>
              {CONFIGS[confirmacao].titulo}
            </p>
            <p className="usr-confirm__desc">{CONFIGS[confirmacao].descricao}</p>

            {confirmacao === 'resetar_senha' && (
              <div className="usr-field" style={{ marginTop: 12 }}>
                <label className="usr-field__label">Nova senha</label>
                <input
                  className="usr-input"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
            )}

            {erroInline && (
              <div className="usr-error-box" style={{ marginTop: 12 }}>{erroInline}</div>
            )}

            <div className="usr-modal__footer">
              <button
                className="usr-btn usr-btn--secondary"
                onClick={() => { setConfirmacao(null); setErroInline(null); setNovaSenha(''); }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className={CONFIGS[confirmacao].btnClass}
                onClick={executarAcao}
                disabled={loading}
              >
                {loading ? 'Aguarde...' : CONFIGS[confirmacao].botao}
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <UsuarioFormModal
          usuario={usuario}
          onClose={() => setEditOpen(false)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}
