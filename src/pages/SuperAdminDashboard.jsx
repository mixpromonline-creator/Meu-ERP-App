import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, XCircle, Users, Activity, LogOut } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchClients = async () => {
    setErrorMessage('');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setClients(data);
    }

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      setErrorMessage('O superadmin nao conseguiu listar todos os perfis. Verifique as policies do Supabase.');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const saveClientConfiguration = async (id, newBusinessType, currentStatus) => {
    if (!newBusinessType) {
      alert('Selecione um tipo de negocio para o cliente primeiro!');
      return;
    }

    const payload = {
      business_type: newBusinessType,
      status: currentStatus === 'pending' ? 'approved' : currentStatus,
    };

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', id);

    if (error) {
      alert('Erro ao salvar configuracao do cliente: ' + error.message);
      return;
    }

    fetchClients();
  };

  const blockClient = async (id) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'blocked' })
      .eq('id', id);

    if (error) {
      alert('Erro ao bloquear cliente: ' + error.message);
      return;
    }

    fetchClients();
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando Painel...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg-primary)' }}>
      <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'var(--color-brand)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <Activity color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Painel SaaS Super Admin</h2>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Gestao de inscricoes do ERP</p>
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

        {errorMessage && (
          <div style={{ marginBottom: '1rem', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.35)', background: 'rgba(245, 158, 11, 0.08)', color: 'var(--color-warning)' }}>
            {errorMessage}
          </div>
        )}

        <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Nome Responsavel</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Tipo</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Status</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onSave={saveClientConfiguration}
                  onBlock={blockClient}
                  isMe={client.id === profile?.id}
                />
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    Nenhum cliente registrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function ClientRow({ client, onSave, onBlock, isMe }) {
  const [selectedType, setSelectedType] = useState(client.business_type || '');
  const canEditType = !isMe && client.status !== 'blocked';
  const showApproveAction = client.status === 'pending';
  const hasTypeChanged = selectedType && selectedType !== client.business_type;
  const showSaveAction = !showApproveAction && canEditType && hasTypeChanged;
  const displayType = client.business_type
    ? client.business_type === 'oficina'
      ? 'Oficina'
      : client.business_type === 'restaurante'
        ? 'Restaurante'
        : 'Loja / PDV'
    : client.role === 'superadmin'
      ? 'Super Admin'
      : 'Nao definido';

  let statusTone = { background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' };
  let statusLabel = client?.status ? client.status.toUpperCase() : 'DESCONHECIDO';

  if (client.status === 'blocked') {
    statusTone = { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' };
  } else if (!client.business_type) {
    statusTone = { background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-brand)' };
    statusLabel = 'SEM CATEGORIA';
  } else if (client.status === 'approved') {
    statusTone = { background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' };
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
      <td style={{ padding: '1rem' }}>
        {client.full_name}{' '}
        {isMe && (
          <span style={{ fontSize: '0.7em', background: 'var(--color-brand)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>
            Voce
          </span>
        )}
      </td>
      <td style={{ padding: '1rem' }}>
        {isMe ? (
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: '600' }}>{displayType}</span>
        ) : (
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={!canEditType}
            style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
          >
            <option value="">-- Selecione --</option>
            <option value="oficina">Oficina Mecanica</option>
            <option value="restaurante">Restaurante</option>
            <option value="loja">Loja / PDV</option>
          </select>
        )}
      </td>
      <td style={{ padding: '1rem' }}>
        <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500', background: statusTone.background, color: statusTone.color }}>
          {statusLabel}
        </span>
      </td>
      <td style={{ padding: '1rem', textAlign: 'center' }}>
        {showApproveAction && (
          <button onClick={() => onSave(client.id, selectedType, client.status)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-success)', marginRight: '0.5rem' }} title="Aprovar e configurar">
            <CheckCircle size={20} />
          </button>
        )}
        {showSaveAction && (
          <button onClick={() => onSave(client.id, selectedType, client.status)} style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '999px', cursor: 'pointer', color: 'var(--color-brand)', marginRight: '0.5rem', fontWeight: '600', padding: '0.45rem 0.9rem' }} title="Confirmar categoria">
            Confirmar
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
