import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Customer, Product } from '../types';
import { getCustomers } from '../services/customer.service';
import { getProducts } from '../services/product.service';
import { getChallan, updateChallan } from '../services/challan.service';
import { Spinner, Toast } from '../components/UI';

interface LineItem {
  productId: string;
  quantity: number;
}

export default function ChallanEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    Promise.all([
      getCustomers({ limit: 200 }),
      getProducts({ limit: 200 }),
      getChallan(id!),
    ]).then(([c, p, challanRes]) => {
      const challan = challanRes.challan;
      if (challan.status !== 'DRAFT') {
        setError('Only DRAFT challans can be edited.');
        setLoading(false);
        return;
      }
      setCustomers(c.customers);
      setProducts(p.products);
      setCustomerId(challan.customer.id);
      setItems(challan.items.map(i => ({ productId: i.productId, quantity: i.quantity })));
      setLoading(false);
    }).catch(() => {
      setError('Failed to load challan.');
      setLoading(false);
    });
  }, [id]);

  function addRow() { setItems(prev => [...prev, { productId: '', quantity: 1 }]); }
  function removeRow(index: number) { setItems(prev => prev.filter((_, i) => i !== index)); }
  function updateRow(index: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  const totalQuantity = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const selectedProductIds = new Set(items.map(i => i.productId).filter(Boolean));

  function validate(): string | null {
    if (!customerId) return 'Please select a customer';
    for (let i = 0; i < items.length; i++) {
      if (!items[i]!.productId) return `Row ${i + 1}: please select a product`;
      if (!items[i]!.quantity || items[i]!.quantity < 1) return `Row ${i + 1}: quantity must be at least 1`;
    }
    const ids = items.map(i => i.productId);
    if (new Set(ids).size !== ids.length) return 'Duplicate products are not allowed';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    try {
      await updateChallan(id!, customerId, items.map(i => ({ productId: i.productId, quantity: Number(i.quantity) })));
      setToast({ message: 'Challan updated', type: 'success' });
      setTimeout(() => navigate(`/challans/${id}`), 800);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Failed to update challan');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="center-spinner"><Spinner /></div>;

  return (
    <div className="page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate(`/challans/${id}`)}>← Back to Challan</button>
          <h1 className="page-title">Edit Draft Challan</h1>
          <p className="page-subtitle">Only DRAFT challans can be edited</p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {!error && (
        <form onSubmit={handleSubmit}>
          <div className="form-card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Customer *</label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)} style={{ maxWidth: 400 }}>
                <option value="">Select customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.customerName} — {c.businessName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              Products
            </h3>

            <div className="challan-items-table">
              <div className="challan-items-header">
                <span>Product</span>
                <span>Available Stock</span>
                <span>Unit Price</span>
                <span>Quantity</span>
                <span></span>
              </div>

              {items.map((item, index) => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <div key={index} className="challan-item-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <select value={item.productId} onChange={e => updateRow(index, 'productId', e.target.value)}>
                        <option value="">Select product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={selectedProductIds.has(p.id) && p.id !== item.productId}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ fontSize: 13, color: product?.isLowStock ? 'var(--danger)' : 'var(--text-muted)', alignSelf: 'center' }}>
                      {product ? `${product.currentStock} units` : '—'}
                    </div>
                    <div style={{ fontSize: 13, alignSelf: 'center' }}>
                      {product ? `₹${Number(product.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <input
                        type="number" min="1" step="1"
                        value={item.quantity}
                        onChange={e => updateRow(index, 'quantity', e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16 }}
                      onClick={() => removeRow(index)}
                      disabled={items.length === 1}
                    >×</button>
                  </div>
                );
              })}
            </div>

            <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={addRow}>
              + Add Product
            </button>

            <div className="challan-summary">
              <span>Total Quantity: <strong>{totalQuantity}</strong></span>
            </div>
          </div>

          <div className="form-actions" style={{ maxWidth: 800, background: 'var(--surface)', padding: '16px 24px', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(`/challans/${id}`)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
