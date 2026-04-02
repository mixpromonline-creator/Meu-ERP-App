import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Pencil, Save, Trash2, UserPlus, X } from 'lucide-react';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

export default function CustomersModule({ profile }) {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadCustomers = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    setErrorMessage('');

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      setErrorMessage('Nao foi possivel carregar os clientes. Verifique se o SQL do modulo foi aplicado no Supabase.');
      setCustomers([]);
    } else {
      setCustomers(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, [profile?.id]);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setEditingId(customer.id);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setErrorMessage('O nome do cliente e obrigatorio.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload = {
      owner_id: profile.id,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      notes: formData.notes.trim(),
      updated_at: new Date().toISOString(),
    };

    const query = editingId
      ? supabase.from('customers').update(payload).eq('id', editingId)
      : supabase.from('customers').insert(payload);

    const { error } = await query;

    if (error) {
      console.error('Erro ao salvar cliente:', error);
      setErrorMessage('Nao foi possivel salvar o cliente.');
      setSaving(false);
      return;
    }

    setSuccessMessage(editingId ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.');
    resetForm();
    await loadCustomers();
    setSaving(false);
  };

  const handleDelete = async (customerId) => {
    const confirmed = window.confirm('Deseja realmente excluir este cliente?');
    if (!confirmed) return;

    setErrorMessage('');
    setSuccessMessage('');

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) {
      console.error('Erro ao excluir cliente:', error);
      setErrorMessage('Nao foi possivel excluir o cliente.');
      return;
    }

    setSuccessMessage('Cliente excluido com sucesso.');
    await loadCustomers();
  };

  return (
    <section className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ marginBottom: '0.35rem' }}>Clientes</h2>
          <p style={{ marginBottom: 0 }}>Cadastre e organize sua base de clientes.</p>
        </div>
        <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.16)', minWidth: '160px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Total cadastrado</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{customers.length}</div>
        </div>
      </div>

      <div className="erp-module-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)', gap: '1.5rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>{editingId ? 'Editar cliente' : 'Novo cliente'}</h3>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-brand)', fontSize: '0.85rem' }}>
              <UserPlus size={16} />
              Cadastro rapido
            </div>
          </div>

          <Field label="Nome">
            <input value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Ex: Maria Souza" className="erp-input" />
          </Field>

          <Field label="Telefone">
            <input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="(11) 99999-9999" className="erp-input" />
          </Field>

          <Field label="E-mail">
            <input value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="cliente@email.com" className="erp-input" />
          </Field>

          <Field label="Endereco">
            <input value={formData.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Rua, numero e bairro" className="erp-input" />
          </Field>

          <Field label="Observacoes">
            <textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Informacoes adicionais do cliente" className="erp-input erp-textarea" />
          </Field>

          {errorMessage && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', fontSize: '0.9rem' }}>
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--color-success)', fontSize: '0.9rem' }}>
              {successMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Salvando...' : editingId ? 'Atualizar cliente' : 'Cadastrar cliente'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="erp-secondary-button">
                <X size={16} />
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', minHeight: '420px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Lista de clientes</h3>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{customers.length} registro(s)</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '280px', color: 'var(--color-text-secondary)' }}>
              Carregando clientes...
            </div>
          ) : customers.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '280px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '1rem' }}>
              Nenhum cliente cadastrado ainda. Use o formulario ao lado para criar o primeiro.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {customers.map((customer) => (
                <article key={customer.id} style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'rgba(10, 10, 11, 0.55)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{customer.name}</h4>
                      <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.9rem' }}>
                        {customer.phone || 'Sem telefone'} {customer.email ? ` - ${customer.email}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button type="button" onClick={() => handleEdit(customer)} className="erp-icon-button" title="Editar cliente">
                        <Pencil size={16} />
                      </button>
                      <button type="button" onClick={() => handleDelete(customer.id)} className="erp-icon-button erp-icon-button-danger" title="Excluir cliente">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {customer.address && (
                    <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
                      {customer.address}
                    </p>
                  )}

                  {customer.notes && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.88rem', color: 'var(--color-text-tertiary)' }}>
                      {customer.notes}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', color: 'var(--color-text-secondary)', fontSize: '0.92rem' }}>
      <span>{label}</span>
      {children}
    </label>
  );
}
