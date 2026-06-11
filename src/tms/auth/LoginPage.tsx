import React, { useState } from 'react';
import { Lock, Mail, Loader2 } from 'lucide-react';
import BrandMark from '../components/BrandMark';
import { login, saveSession, type SessionUser } from './auth';

interface Props {
  onLogin: (user: SessionUser) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), senha);
      saveSession(user);
      onLogin(user);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lsw-login">
      <div className="lsw-login__card">
        <div className="lsw-login__brand">
          <BrandMark />
          <div>
            <strong>LSW Distribuidora</strong>
            <span>Central de Gestão</span>
          </div>
        </div>

        <h1 className="lsw-login__title">Acessar o sistema</h1>
        <p className="lsw-login__sub">Entre com o e-mail e a senha cadastrados.</p>

        <form onSubmit={handleSubmit}>
          <label className="lsw-login__field">
            <span className="lsw-login__label">E-mail</span>
            <div className="lsw-login__input-wrap">
              <Mail size={15} />
              <input
                type="email"
                autoComplete="username"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
          </label>

          <label className="lsw-login__field">
            <span className="lsw-login__label">Senha</span>
            <div className="lsw-login__input-wrap">
              <Lock size={15} />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                disabled={loading}
              />
            </div>
          </label>

          {erro && <div className="lsw-login__error">{erro}</div>}

          <button className="lsw-login__submit" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={15} className="lsw-login__spin" /> Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="lsw-login__hint">
          Esqueceu a senha? Fale com o administrador do sistema.
        </p>
      </div>
    </div>
  );
}
