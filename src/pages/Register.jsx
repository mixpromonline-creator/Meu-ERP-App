import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Building2, AlertCircle, Loader2 } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signUpError } = await signUp(email, password, fullName);
      
      if (signUpError) {
        throw signUpError;
      }
      
      navigate('/pending'); // Redireciona logo após o cadastro para a tela de conta pendente
    } catch (err) {
      setError(err.message || 'Falha ao criar conta. Tente novamente.');
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
          <h1>Crie sua conta</h1>
          <p>Dê o primeiro passo para organizar sua empresa.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="fullName">Nome Completo (Responsável)</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                id="fullName"
                type="text"
                className="input-field"
                placeholder="João Silva"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

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
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Cadastrar e Aguardar Aprovação'}
          </button>
        </form>

        <div className="auth-footer">
          Já tem uma conta? <Link to="/login">Fazer Login</Link>
        </div>
      </div>
    </div>
  );
}
