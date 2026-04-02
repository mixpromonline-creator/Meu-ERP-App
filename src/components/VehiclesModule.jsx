import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Car, Pencil, Save, Trash2, X } from 'lucide-react';

const emptyForm = {
  customer_id: '',
  plate: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  fuel: '',
  mileage: '',
  notes: '',
};

export default function VehiclesModule({ profile }) {
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadBaseData = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    setErrorMessage('');

    const [{ data: customerRows, error: customerError }, { data: vehicleRows, error: vehicleError }] = await Promise.all([
      supabase
        .from('customers')
        .select('id, name')
        .eq('owner_id', profile.id)
        .order('name', { ascending: true }),
      supabase
        .from('vehicles')
        .select('*, customers(name)')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false }),
    ]);

    if (customerError || vehicleError) {
      console.error('Erro ao carregar dados dos veiculos:', customerError || vehicleError);
      setErrorMessage('Nao foi possivel carregar os veiculos. Verifique se o SQL do modulo foi aplicado no Supabase.');
      setCustomers([]);
      setVehicles([]);
    } else {
      setCustomers(customerRows || []);
      setVehicles(vehicleRows || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadBaseData();
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

  const handleEdit = (vehicle) => {
    setFormData({
      customer_id: vehicle.customer_id || '',
      plate: vehicle.plate || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      color: vehicle.color || '',
      fuel: vehicle.fuel || '',
      mileage: vehicle.mileage?.toString() || '',
      notes: vehicle.notes || '',
    });
    setEditingId(vehicle.id);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.customer_id) {
      setErrorMessage('Selecione o cliente dono do veiculo.');
      return;
    }

    if (!formData.plate.trim() || !formData.model.trim()) {
      setErrorMessage('Placa e modelo sao obrigatorios.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload = {
      owner_id: profile.id,
      customer_id: formData.customer_id,
      plate: formData.plate.trim().toUpperCase(),
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      year: formData.year.trim(),
      color: formData.color.trim(),
      fuel: formData.fuel.trim(),
      mileage: formData.mileage ? Number(formData.mileage) : null,
      notes: formData.notes.trim(),
      updated_at: new Date().toISOString(),
    };

    const query = editingId
      ? supabase.from('vehicles').update(payload).eq('id', editingId)
      : supabase.from('vehicles').insert(payload);

    const { error } = await query;

    if (error) {
      console.error('Erro ao salvar veiculo:', error);
      setErrorMessage('Nao foi possivel salvar o veiculo.');
      setSaving(false);
      return;
    }

    setSuccessMessage(editingId ? 'Veiculo atualizado com sucesso.' : 'Veiculo cadastrado com sucesso.');
    resetForm();
    await loadBaseData();
    setSaving(false);
  };

  const handleDelete = async (vehicleId) => {
    const confirmed = window.confirm('Deseja realmente excluir este veiculo?');
    if (!confirmed) return;

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) {
      console.error('Erro ao excluir veiculo:', error);
      setErrorMessage('Nao foi possivel excluir o veiculo.');
      return;
    }

    setSuccessMessage('Veiculo excluido com sucesso.');
    await loadBaseData();
  };

  return (
    <section className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ marginBottom: '0.35rem' }}>Veiculos</h2>
          <p style={{ marginBottom: 0 }}>Vincule cada carro, moto ou utilitario ao cliente correto.</p>
        </div>
        <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.16)', minWidth: '160px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Total cadastrado</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{vehicles.length}</div>
        </div>
      </div>

      <div className="erp-module-grid">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>{editingId ? 'Editar veiculo' : 'Novo veiculo'}</h3>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', fontSize: '0.85rem' }}>
              <Car size={16} />
              Patio organizado
            </div>
          </div>

          <Field label="Cliente">
            <select value={formData.customer_id} onChange={(e) => handleChange('customer_id', e.target.value)} className="erp-input">
              <option value="">Selecione o cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Placa">
            <input value={formData.plate} onChange={(e) => handleChange('plate', e.target.value)} placeholder="ABC1D23" className="erp-input" />
          </Field>

          <Field label="Marca">
            <input value={formData.brand} onChange={(e) => handleChange('brand', e.target.value)} placeholder="Volkswagen, Fiat, Honda..." className="erp-input" />
          </Field>

          <Field label="Modelo">
            <input value={formData.model} onChange={(e) => handleChange('model', e.target.value)} placeholder="Gol, Uno, Civic..." className="erp-input" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
            <Field label="Ano">
              <input value={formData.year} onChange={(e) => handleChange('year', e.target.value)} placeholder="2020" className="erp-input" />
            </Field>
            <Field label="Cor">
              <input value={formData.color} onChange={(e) => handleChange('color', e.target.value)} placeholder="Prata" className="erp-input" />
            </Field>
            <Field label="Combustivel">
              <input value={formData.fuel} onChange={(e) => handleChange('fuel', e.target.value)} placeholder="Flex" className="erp-input" />
            </Field>
          </div>

          <Field label="Quilometragem">
            <input value={formData.mileage} onChange={(e) => handleChange('mileage', e.target.value)} placeholder="125000" className="erp-input" />
          </Field>

          <Field label="Observacoes">
            <textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Detalhes do veiculo, historico rapido, avarias..." className="erp-input erp-textarea" />
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
              {saving ? 'Salvando...' : editingId ? 'Atualizar veiculo' : 'Cadastrar veiculo'}
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
            <h3 style={{ margin: 0 }}>Patio de veiculos</h3>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{vehicles.length} registro(s)</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '280px', color: 'var(--color-text-secondary)' }}>
              Carregando veiculos...
            </div>
          ) : vehicles.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '280px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '1rem' }}>
              Nenhum veiculo cadastrado ainda. Primeiro selecione um cliente e cadastre o carro dele.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {vehicles.map((vehicle) => (
                <article key={vehicle.id} style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'rgba(10, 10, 11, 0.55)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{vehicle.model} - {vehicle.plate}</h4>
                      <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.9rem' }}>
                        {vehicle.brand || 'Marca nao informada'} {vehicle.year ? ` - ${vehicle.year}` : ''}
                      </p>
                      <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                        Cliente: {vehicle.customers?.name || 'Nao identificado'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button type="button" onClick={() => handleEdit(vehicle)} className="erp-icon-button" title="Editar veiculo">
                        <Pencil size={16} />
                      </button>
                      <button type="button" onClick={() => handleDelete(vehicle.id)} className="erp-icon-button erp-icon-button-danger" title="Excluir veiculo">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p style={{ margin: '0.65rem 0 0 0', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                    {vehicle.color || 'Cor nao informada'} {vehicle.fuel ? ` - ${vehicle.fuel}` : ''} {vehicle.mileage ? ` - ${vehicle.mileage} km` : ''}
                  </p>

                  {vehicle.notes && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.88rem', color: 'var(--color-text-tertiary)' }}>
                      {vehicle.notes}
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
