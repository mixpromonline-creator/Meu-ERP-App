import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, XCircle, Users, Activity, LogOut } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    // Busca todos os perfis registrados no banco
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setClients(data);
    if (error) console.error("Erro ao buscar clientes: ", error);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const approveClient = async (id, newBusinessType) => {
    if(!newBusinessType) {
      alert("Selecione um tipo de negócio para o cliente primeiro!");
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ status: 'approved', business_type: newBusinessType })
      .eq('id', id);

    if (error) {
      alert("Erro ao aprovar cliente: " + error.message);
    } else {
      fetchClients();
    }
  };

  const blockClient = async (id) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'blocked' })
      .eq('id', id);

    if (!error) fetchClients();
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando Painel...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg-primary)' }}>
      <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'var(--color-brand)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <Activity color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Painel SaaS Super Admin</h2>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Gestão de Inscrições do ERP</p>
          </div>
        </div>
        <button className="btn-primary" onClick={signOut} style={{ background: 'transparent', border: '1px solid var(--color-border)', padding: '0.5rem 1rem' }}>
          <LogOut size={16} /> Sair
        </button>
      </header>

      <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Users size={20} color="var(--color-text-secondary)" />
          <h3 style={{ margin: 0 }}>Empresas Cadastradas ({clients.length})</h3>
        </div>

        <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Nome Responsável</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Tipo (Escolha)</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Status</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <ClientRow 
                  key={client.id} 
                  client={client} 
                  onApprove={approveClient} 
                  onBlock={blockClient} 
                  isMe={client.id === profile.id}
                />
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Nenhum cliente registrado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function ClientRow({ client, onApprove, onBlock, isMe }) {
  const [selectedType, setSelectedType] = useState(client.business_type || '');

  return (
    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
      <td style={{ padding: '1rem' }}>
        {client.full_name} {isMe && <span style={{ fontSize: '0.7em', background: 'var(--color-brand)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>Você</span>}
      </td>
      <td style={{ padding: '1rem' }}>
        <select 
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          disabled={client.status === 'approved' && !isMe}
          style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
        >
          <option value="">-- Selecione --</option>
          <option value="oficina">Oficina Mecânica</option>
          <option value="restaurante">Restaurante</option>
          <option value="loja">Loja / PDV</option>
        </select>
      </td>
      <td style={{ padding: '1rem' }}>
        <span style={{
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: '500',
          background: client.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : client.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: client.status === 'approved' ? 'var(--color-success)' : client.status === 'pending' ? 'var(--color-warning)' : 'var(--color-error)'
        }}>
          {client.status.toUpperCase()}
        </span>
      </td>
      <td style={{ padding: '1rem', textAlign: 'center' }}>
        {client.status === 'pending' && (
          <button onClick={() => onApprove(client.id, selectedType)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-success)', marginRight: '0.5rem' }} title="Aprovar">
            <CheckCircle size={20} />
          </button>
        )}
        {client.status !== 'blocked' && !isMe && (
          <button onClick={() => onBlock(client.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }} title="Bloquear / Recusar">
            <XCircle size={20} />
          </button>
        )}
      </td>
    </tr>
  );
}
