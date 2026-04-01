import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Building2, AlertCircle, Loader2 } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await signIn(email, password);
      
      if (signInError) {
        throw signInError;
      }
      
      // Se não der erro, o roteamento global será trigado pelo AuthContext
      navigate('/');
    } catch (err) {
      setError('Falha ao entrar. Verifique suas credenciais.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Building2 size={24} />
          </div>
          <h1>Bem-vindo de volta!</h1>
          <p>Acesse o painel inteligente da sua empresa.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">E-mail Corporativo</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="suaempresa@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Acessar Painel'}
          </button>
        </form>

        <div className="auth-footer">
          Não tem uma conta ainda? <Link to="/register">Cadastre-se</Link>
        </div>
      </div>
    </div>
  );
}
