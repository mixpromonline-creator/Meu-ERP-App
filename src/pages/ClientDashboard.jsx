import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Wrench, Utensils, ShoppingBag } from 'lucide-react';

export default function ClientDashboard() {
  const { profile, signOut } = useAuth();
  const type = profile?.business_type;

  const getBusinessIcon = () => {
    switch (type) {
      case 'oficina': return <Wrench size={48} color="var(--color-brand)" />;
      case 'restaurante': return <Utensils size={48} color="var(--color-warning)" />;
      case 'loja': return <ShoppingBag size={48} color="var(--color-success)" />;
      default: return null;
    }
  };

  const getBusinessModules = () => {
    switch (type) {
      case 'oficina': return ['Ordens de Serviço', 'Clientes', 'Peças e Estoque', 'Mão de Obra'];
      case 'restaurante': return ['Gestão de Mesas', 'Cardápio Digital', 'Pedidos', 'Cozinha'];
      case 'loja': return ['Frente de Caixa (PDV)', 'Produtos e Estoque', 'Gestão de Vendas'];
      default: return [];
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* Sidebar Simples */}
      <aside style={{ width: '260px', borderRight: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {getBusinessIcon() && React.cloneElement(getBusinessIcon(), { size: 24 })}
          Meu ERP
        </h2>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {getBusinessModules().map(mod => (
            <div key={mod} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-tertiary)', cursor: 'pointer', border: '1px solid transparent', transition: 'border 0.2s' }}>
              {mod}
            </div>
          ))}
        </nav>

        <button onClick={signOut} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--color-border)', marginTop: '2rem', margin: '0 auto', width: '100%' }}>
          <LogOut size={16} /> Sair
        </button>
      </aside>

      {/* Área Principal */}
      <main style={{ flex: 1, padding: '3rem 4rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem' }}>Olá, {profile?.full_name}</h1>
          <p>Visão geral do sistema ({type?.toUpperCase()})</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {getBusinessModules().map(mod => (
            <div key={mod} className="glass-panel" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', marginBottom: '1rem' }}>
                {getBusinessIcon()}
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{mod}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-success)', marginTop: '0.5rem' }}>Módulo Ativo</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
