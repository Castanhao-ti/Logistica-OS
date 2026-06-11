import { useState } from 'react';
import { X } from 'lucide-react';
import { criarUsuario, atualizarUsuario, type Usuario, type PerfilUsuario } from './usuarios';

const PERFIS: Array<{ value: PerfilUsuario; label: string }> = [
  { value: 'admin',      label: 'Admin'      },
  { value: 'vendas',     label: 'Vendas'     },
  { value: 'logistica',  label: 'Logística'  },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'leitura',    label: 'Leitura'    },
];

interface Props {
  usuario?: Usuario;
  onClose: () => void;
  onSuccess: () => void;
}

export function UsuarioFormModal({ usuario, onClose, onSuccess }: Props) {
  const isEdicao = Boolean(usuario);

  const [nome,   setNome]   = useState(usuario?.nome  ?? '');
  const [email,  setEmail]  = useState(usuario?.email ?? '');
  const [perfil, setPerfil] = useState<PerfilUsuario>(usuario?.perfil ?? 'leitura');
  const [senha,  setSenha]  = useState('');
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState<string | null>(null);

  const handleSubmit = async () => {
    setErro(null);
    if (!nome.trim())  return setErro('Nome é obrigatório.');
    if (!email.trim()) return setErro('E-mail é obrigatório.');
    if (!isEdicao && senha.length < 8)
      return setErro('Senha temporária precisa ter no mínimo 8 caracteres.');

    setLoading(true);
    try {
      if (isEdicao && usuario) {
        await atualizarUsuario(usuario.id, { nome, perfil });
      } else {
        await criarUsuario({ nome, email, perfil, senha_temporaria: senha });
      }
      onSuccess();
      onClose();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="usr-overlay">
      <div className="usr-modal">
        <div className="usr-modal__header">
          <h2 className="usr-modal__title">
            {isEdicao ? 'Editar usuário' : 'Novo usuário'}
          </h2>
          <button className="usr-icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <div className="usr-modal__body">
          <div className="usr-field">
            <label className="usr-field__label">Nome completo</label>
            <input
              className="usr-input"
              placeholder="Ex.: João Silva"
              value={nome}
              onChange={e => setNome(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="usr-field">
            <label className="usr-field__label">E-mail</label>
            <input
              className="usr-input"
              type="email"
              placeholder="joao@castanhao.com.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading || isEdicao}
            />
            {isEdicao && (
              <span className="usr-field__hint">O e-mail não pode ser alterado após a criação.</span>
            )}
          </div>

          <div className="usr-field">
            <label className="usr-field__label">Perfil de acesso</label>
            <select
              className="usr-select"
              value={perfil}
              onChange={e => setPerfil(e.target.value as PerfilUsuario)}
              disabled={loading}
            >
              {PERFIS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {!isEdicao && (
            <div className="usr-field">
              <label className="usr-field__label">Senha temporária</label>
              <input
                className="usr-input"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                disabled={loading}
              />
              <span className="usr-field__hint">O usuário poderá trocar no primeiro acesso.</span>
            </div>
          )}

          {erro && <div className="usr-error-box">{erro}</div>}
        </div>

        <div className="usr-modal__footer">
          <button className="usr-btn usr-btn--secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="usr-btn usr-btn--primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? (isEdicao ? 'Salvando...' : 'Criando...')
              : (isEdicao ? 'Salvar alterações' : 'Criar usuário')}
          </button>
        </div>
      </div>
    </div>
  );
}
