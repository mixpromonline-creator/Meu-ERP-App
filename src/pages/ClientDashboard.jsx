import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Menu, ShoppingBag, Users, Utensils, Wrench, X } from 'lucide-react';
import CustomersModule from '../components/CustomersModule';
import VehiclesModule from '../components/VehiclesModule';

const businessConfig = {
  oficina: {
    icon: Wrench,
    color: 'var(--color-brand)',
    modules: ['Clientes', 'Veiculos', 'Ordens de Servico', 'Pecas e Estoque', 'Mao de Obra'],
  },
  restaurante: {
    icon: Utensils,
    color: 'var(--color-warning)',
    modules: ['Clientes', 'Gestao de Mesas', 'Cardapio Digital', 'Pedidos'],
  },
  loja: {
    icon: ShoppingBag,
    color: 'var(--color-success)',
    modules: ['Clientes', 'Produtos e Estoque', 'Frente de Caixa', 'Vendas'],
  },
};

export default function ClientDashboard() {
  const { profile, signOut } = useAuth();
  const [activeModule, setActiveModule] = useState('Clientes');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const config = businessConfig[profile?.business_type] || {
    icon: Users,
    color: 'var(--color-brand)',
    modules: ['Clientes'],
  };

  const BusinessIcon = config.icon;

  useEffect(() => {
    if (!config.modules.includes(activeModule)) {
      setActiveModule(config.modules[0]);
    }
  }, [activeModule, config.modules]);

  const renderModuleContent = () => {
    if (activeModule === 'Clientes') {
      return <CustomersModule profile={profile} />;
    }

    if (activeModule === 'Veiculos') {
      return <VehiclesModule profile={profile} />;
    }

    return (
      <section className="glass-panel" style={{ padding: '1.75rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>{activeModule}</h2>
        <p style={{ marginBottom: 0 }}>
          Este modulo sera o proximo da fila. Ja deixei a estrutura do painel pronta para encaixarmos as proximas etapas do ERP.
        </p>
      </section>
    );
  };

  return (
    <div className="erp-dashboard-shell">
      <aside className={`erp-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BusinessIcon size={22} color={config.color} />
            Meu ERP
          </h2>
          <button type="button" className="erp-mobile-toggle" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>Conta ativa</div>
          <div style={{ fontWeight: 700 }}>{profile?.full_name}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            {profile?.business_type ? profile.business_type.toUpperCase() : 'SEM CATEGORIA'}
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {config.modules.map((module) => {
            const isActive = module === activeModule;

            return (
              <button
                key={module}
                type="button"
                onClick={() => {
                  setActiveModule(module);
                  setSidebarOpen(false);
                }}
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(59, 130, 246, 0.35)' : 'transparent'}`,
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {module}
              </button>
            );
          })}
        </nav>

        <button onClick={signOut} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--color-border)', width: '100%', marginTop: '1.5rem' }}>
          <LogOut size={16} /> Sair
        </button>
      </aside>

      <main style={{ minWidth: 0 }}>
        <header style={{ padding: '1rem 1rem 0 1rem' }}>
          <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>Painel da empresa</div>
              <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '0.35rem' }}>Ola, {profile?.full_name}</h1>
              <p style={{ marginBottom: 0 }}>Modulo atual: {activeModule}</p>
            </div>
            <button type="button" className="erp-mobile-toggle erp-mobile-toggle-visible" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
              Menu
            </button>
          </div>
        </header>

        <div style={{ padding: '1rem', display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {config.modules.map((module) => (
              <div
                key={module}
                className="glass-panel"
                style={{
                  padding: '1rem 1.1rem',
                  border: module === activeModule ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid var(--color-border)',
                  background: module === activeModule ? 'rgba(59, 130, 246, 0.08)' : undefined,
                }}
              >
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Modulo</div>
                <div style={{ fontWeight: 700 }}>{module}</div>
              </div>
            ))}
          </div>

          {renderModuleContent()}
        </div>
      </main>
    </div>
  );
}
