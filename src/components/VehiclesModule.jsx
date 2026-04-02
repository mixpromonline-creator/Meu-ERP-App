import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Car, ChevronDown, Pencil, Save, Trash2, X } from 'lucide-react';

const emptyForm = {
  customer_id: '',
  plate: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  fuel: '',
  transmission: '',
  mileage: '',
  notes: '',
};

export default function VehiclesModule({ profile }) {
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
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

    const [
      { data: customerRows, error: customerError },
      { data: vehicleRows, error: vehicleError },
      { data: brandRows, error: brandError },
      { data: modelRows, error: modelError },
    ] = await Promise.all([
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
      supabase
        .from('vehicle_brands')
        .select('id, name')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .from('vehicle_models')
        .select('id, brand_id, name')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
    ]);

    if (customerError || vehicleError || brandError || modelError) {
      console.error('Erro ao carregar dados dos veiculos:', customerError || vehicleError || brandError || modelError);
      setErrorMessage('Nao foi possivel carregar os veiculos. Verifique se o SQL do modulo foi aplicado no Supabase.');
      setCustomers([]);
      setVehicles([]);
      setBrands([]);
      setModels([]);
    } else {
      setCustomers(customerRows || []);
      setVehicles(vehicleRows || []);
      setBrands(brandRows || []);
      setModels(modelRows || []);
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

  const filteredCustomers = customers.filter((item) => matchesSearch(item.name, customerSearch));
  const filteredBrands = brands.filter((item) => matchesSearch(item.name, brandSearch));
  const availableModels = models.filter((item) => item.brand_id === formData.brand);
  const filteredModels = availableModels.filter((item) => matchesSearch(item.name, modelSearch));
  const selectedBrand = brands.find((item) => item.id === formData.brand);
  const selectedModel = availableModels.find((item) => item.id === formData.model);

  const resetForm = () => {
    setFormData(emptyForm);
    setCustomerSearch('');
    setBrandSearch('');
    setModelSearch('');
    setEditingId(null);
  };

  const handleEdit = (vehicle) => {
    const brandMatch = brands.find((item) => item.name === vehicle.brand);
    const modelMatch = models.find((item) => item.name === vehicle.model && item.brand_id === brandMatch?.id);

    setFormData({
      customer_id: vehicle.customer_id || '',
      plate: vehicle.plate || '',
      brand: brandMatch?.id || '',
      model: modelMatch?.id || '',
      year: vehicle.year || '',
      color: vehicle.color || '',
      fuel: vehicle.fuel || '',
      transmission: vehicle.transmission || '',
      mileage: vehicle.mileage?.toString() || '',
      notes: vehicle.notes || '',
    });
    setCustomerSearch(vehicle.customers?.name || '');
    setBrandSearch(vehicle.brand || '');
    setModelSearch(vehicle.model || '');
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

    if (!formData.plate.trim() || !formData.brand || !formData.model) {
      setErrorMessage('Placa, marca e modelo sao obrigatorios.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload = {
      owner_id: profile.id,
      customer_id: formData.customer_id,
      plate: formData.plate.trim().toUpperCase(),
      brand: selectedBrand?.name || '',
      model: selectedModel?.name || '',
      year: formData.year.trim(),
      color: formData.color.trim(),
      fuel: formData.fuel.trim(),
      transmission: formData.transmission.trim(),
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
            <SearchableSelect
              value={customerSearch}
              onValueChange={(value) => setCustomerSearch(value)}
              options={filteredCustomers}
              selectedId={formData.customer_id}
              onSelect={(option) => {
                handleChange('customer_id', option?.id || '');
                setCustomerSearch(option?.name || '');
              }}
              placeholder="Digite para buscar o cliente"
              emptyText="Nenhum cliente encontrado"
            />
          </Field>

          <Field label="Placa">
            <input value={formData.plate} onChange={(e) => handleChange('plate', e.target.value)} placeholder="ABC1D23" className="erp-input" />
          </Field>

          <Field label="Marca">
            <SearchableSelect
              value={brandSearch}
              onValueChange={(value) => setBrandSearch(value)}
              options={filteredBrands}
              selectedId={formData.brand}
              onSelect={(option) => {
                handleChange('brand', option?.id || '');
                handleChange('model', '');
                setBrandSearch(option?.name || '');
                setModelSearch('');
              }}
              placeholder="Digite para buscar a marca"
              emptyText="Nenhuma marca encontrada"
            />
          </Field>

          <Field label="Modelo">
            <SearchableSelect
              value={modelSearch}
              onValueChange={(value) => setModelSearch(value)}
              options={filteredModels}
              selectedId={formData.model}
              onSelect={(option) => {
                handleChange('model', option?.id || '');
                setModelSearch(option?.name || '');
              }}
              placeholder={formData.brand ? 'Digite para buscar o modelo' : 'Escolha a marca primeiro'}
              emptyText="Nenhum modelo encontrado"
              disabled={!formData.brand}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <Field label="Ano">
              <input value={formData.year} onChange={(e) => handleChange('year', e.target.value)} placeholder="2020" className="erp-input" />
            </Field>
            <Field label="Cor">
              <input value={formData.color} onChange={(e) => handleChange('color', e.target.value)} placeholder="Prata" className="erp-input" />
            </Field>
            <Field label="Combustivel">
              <input value={formData.fuel} onChange={(e) => handleChange('fuel', e.target.value)} placeholder="Flex" className="erp-input" />
            </Field>
            <Field label="Cambio">
              <select value={formData.transmission} onChange={(e) => handleChange('transmission', e.target.value)} className="erp-input">
                <option value="">Selecione</option>
                <option value="Manual">Manual</option>
                <option value="Automatico">Automatico</option>
                <option value="Automatizado">Automatizado</option>
                <option value="CVT">CVT</option>
              </select>
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
                    {vehicle.color || 'Cor nao informada'} {vehicle.fuel ? ` - ${vehicle.fuel}` : ''} {vehicle.transmission ? ` - ${vehicle.transmission}` : ''} {vehicle.mileage ? ` - ${vehicle.mileage} km` : ''}
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

function matchesSearch(value, search) {
  if (!search.trim()) return true;
  return (value || '').toLowerCase().includes(search.trim().toLowerCase());
}

function SearchableSelect({
  value,
  onValueChange,
  options,
  selectedId,
  onSelect,
  placeholder,
  emptyText,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const visibleOptions = useMemo(() => {
    if (!value.trim()) {
      return options.slice(0, 12);
    }

    return options.slice(0, 20);
  }, [options, value]);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);

        const selectedOption = options.find((option) => option.id === selectedId);

        if (!value.trim()) {
          onSelect(null);
          return;
        }

        if (selectedOption) {
          onValueChange(selectedOption.name);
          return;
        }

        const exactMatch = options.find((option) => option.name.toLowerCase() === value.trim().toLowerCase());
        if (exactMatch) {
          onSelect(exactMatch);
          onValueChange(exactMatch.name);
        } else {
          onSelect(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onSelect, onValueChange, options, selectedId, value]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={(e) => {
          const nextValue = e.target.value;
          onValueChange(nextValue);
          setIsOpen(true);

          const matchedOption = options.find((option) => option.name.toLowerCase() === nextValue.trim().toLowerCase());
          onSelect(matchedOption || null);
        }}
        onFocus={() => {
          if (value.trim()) {
            setIsOpen(true);
          }
        }}
        placeholder={placeholder}
        className="erp-input"
        disabled={disabled}
        style={{ paddingRight: '2.8rem' }}
      />
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setIsOpen((current) => !current);
        }}
        style={{
          position: 'absolute',
          top: '50%',
          right: '0.85rem',
          transform: 'translateY(-50%)',
          border: 'none',
          background: 'transparent',
          color: 'var(--color-text-secondary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        disabled={disabled}
      >
        <ChevronDown size={16} />
      </button>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.35rem)',
            left: 0,
            right: 0,
            zIndex: 30,
            maxHeight: '220px',
            overflowY: 'auto',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'rgb(25, 26, 30)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.35)',
          }}
        >
          {visibleOptions.length > 0 ? (
            visibleOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelect(option);
                  onValueChange(option.name);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.8rem 0.95rem',
                  border: 'none',
                  background: option.id === selectedId ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                  color: 'var(--color-text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                {option.name}
              </button>
            ))
          ) : (
            <div style={{ padding: '0.8rem 0.95rem', color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
              {emptyText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
