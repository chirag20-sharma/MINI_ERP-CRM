import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, createProduct, updateProduct } from '../services/product.service';
import { Toast } from '../components/UI';

interface FormState {
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: string;
  minimumStock: string;
  warehouseLocation: string;
}

const empty: FormState = {
  name: '', sku: '', category: '', unitPrice: '', currentStock: '0', minimumStock: '0', warehouseLocation: '',
};

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    getProduct(id!)
      .then(res => {
        const p = res.product;
        setForm({
          name: p.name,
          sku: p.sku,
          category: p.category,
          unitPrice: String(p.unitPrice),
          currentStock: String(p.currentStock),
          minimumStock: String(p.minimumStock),
          warehouseLocation: p.warehouseLocation,
        });
      })
      .catch(() => setToast({ message: 'Failed to load product', type: 'error' }))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.sku.trim()) e.sku = 'SKU is required';
    if (!form.category.trim()) e.category = 'Category is required';
    if (form.unitPrice === '' || Number(form.unitPrice) < 0) e.unitPrice = 'Unit price must be >= 0';
    if (form.currentStock === '' || Number(form.currentStock) < 0) e.currentStock = 'Stock must be >= 0';
    if (form.minimumStock === '' || Number(form.minimumStock) < 0) e.minimumStock = 'Minimum stock must be >= 0';
    if (!form.warehouseLocation.trim()) e.warehouseLocation = 'Warehouse location is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category.trim(),
      unitPrice: Number(form.unitPrice),
      currentStock: Number(form.currentStock),
      minimumStock: Number(form.minimumStock),
      warehouseLocation: form.warehouseLocation.trim(),
    };
    try {
      if (isEdit) {
        await updateProduct(id!, payload);
        setToast({ message: 'Product updated successfully', type: 'success' });
        setTimeout(() => navigate(`/products/${id}`), 800);
        return;
      } else {
        const res = await createProduct(payload);
        setToast({ message: 'Product created successfully', type: 'success' });
        setTimeout(() => navigate(`/products/${res.product.id}`), 800);
        return;
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Failed to save product';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function field(key: keyof FormState, label: string, type = 'text', extra?: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
      <div className="form-group">
        <label>{label}</label>
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          {...extra}
        />
        {errors[key] && <span className="field-error">{errors[key]}</span>}
      </div>
    );
  }

  if (loading) return <div className="center-spinner" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  return (
    <div className="page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/products')}>← Back to Products</button>
          <h1 className="page-title">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-grid">
            {field('name', 'Product Name *')}
            {field('sku', 'SKU / Code *')}
            <div className="form-group">
              <label>Category *</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                <option value="">Select category</option>
                <option>Electronics</option>
                <option>Accessories</option>
                <option>Cables</option>
                <option>Networking</option>
                <option>Storage</option>
                <option>Other</option>
              </select>
              {errors.category && <span className="field-error">{errors.category}</span>}
            </div>
            {field('warehouseLocation', 'Warehouse Location *')}
            {field('unitPrice', 'Unit Price (₹) *', 'number', { min: '0', step: '0.01' })}
            {field('minimumStock', 'Minimum Stock Alert *', 'number', { min: '0', step: '1' })}
            {!isEdit && field('currentStock', 'Initial Stock', 'number', { min: '0', step: '1' })}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
