import { useState, FormEvent } from 'react';
import { Customer, CustomerStatus, CustomerType } from '../types';

interface Props {
  initial?: Partial<Customer>;
  onSubmit: (data: Partial<Customer>) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}

const EMPTY: Partial<Customer> = {
  customerName: '', mobile: '', email: '', businessName: '',
  gstNumber: '', customerType: 'RETAIL', address: '',
  status: 'LEAD', followUpDate: '', notes: '',
};

export default function CustomerForm({ initial = EMPTY, onSubmit, onCancel, submitLabel }: Props) {
  const [form, setForm] = useState<Partial<Customer>>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function set(field: keyof Customer, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTopError('');
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]>; message?: string };
      if (apiErr.errors) {
        const flat: Record<string, string> = {};
        Object.entries(apiErr.errors).forEach(([k, v]) => { flat[k] = v[0] ?? ''; });
        setErrors(flat);
      } else {
        setTopError(apiErr.message ?? 'Failed to save customer');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="customer-form" onSubmit={handleSubmit} noValidate>
      {topError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{topError}</div>}
      <div className="form-grid">
        <div className="form-group">
          <label>Customer Name *</label>
          <input value={form.customerName ?? ''} onChange={e => set('customerName', e.target.value)} />
          {errors['customerName'] && <span className="field-error">{errors['customerName']}</span>}
        </div>

        <div className="form-group">
          <label>Mobile *</label>
          <input value={form.mobile ?? ''} onChange={e => set('mobile', e.target.value)} />
          {errors['mobile'] && <span className="field-error">{errors['mobile']}</span>}
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} />
          {errors['email'] && <span className="field-error">{errors['email']}</span>}
        </div>

        <div className="form-group">
          <label>Business Name *</label>
          <input value={form.businessName ?? ''} onChange={e => set('businessName', e.target.value)} />
          {errors['businessName'] && <span className="field-error">{errors['businessName']}</span>}
        </div>

        <div className="form-group">
          <label>GST Number</label>
          <input value={form.gstNumber ?? ''} onChange={e => set('gstNumber', e.target.value)} />
          {errors['gstNumber'] && <span className="field-error">{errors['gstNumber']}</span>}
        </div>

        <div className="form-group">
          <label>Customer Type *</label>
          <select value={form.customerType} onChange={e => set('customerType', e.target.value as CustomerType)}>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>

        <div className="form-group">
          <label>Status *</label>
          <select value={form.status} onChange={e => set('status', e.target.value as CustomerStatus)}>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="form-group">
          <label>Follow-up Date</label>
          <input
            type="datetime-local"
            value={form.followUpDate ? form.followUpDate.slice(0, 16) : ''}
            onChange={e => set('followUpDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
          />
        </div>

        <div className="form-group form-group-full">
          <label>Address *</label>
          <textarea rows={2} value={form.address ?? ''} onChange={e => set('address', e.target.value)} />
          {errors['address'] && <span className="field-error">{errors['address']}</span>}
        </div>

        <div className="form-group form-group-full">
          <label>Notes</label>
          <textarea rows={3} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
