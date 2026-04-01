import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

export default function PendingApproval() {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', margin: '0 auto 1.5rem auto' }}>
          <Clock size={32} />
        </div>
        
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Conta em Análise</h1>
        
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
          Olá, <strong>{profile?.full_name}</strong>!<br/>
          Sua conta foi criada com sucesso e está aguardando a aprovação do nosso time. 
          Você receberá um contato assim que seu tipo de negócio for configurado em nosso painel.
        </p>

        <button onClick={handleLogout} className="btn-primary" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', width: 'fit-content', margin: '0 auto' }}>
          <LogOut size={18} />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
