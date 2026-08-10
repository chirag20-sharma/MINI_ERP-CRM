import { useState, useEffect, useCallback } from 'react';
import { Product, StockMovement, Pagination as PaginationType } from '../types';
import { getProducts } from '../services/product.service';
import { getMovements, stockIn, stockOut } from '../services/inventory.service';
import { Spinner, EmptyState, Pagination, Toast } from '../components/UI';
import { useAuth } from '../context/AuthContext';

// ─── Stock Action Form ────────────────────────────────────────────────────────
function StockActionForm({
  products,
  onSuccess,
}: {
  products: Product[];
  onSuccess: (msg: string, newStock: number, productName: string) => void;
}) {
  const [mode, setMode] = useState<'IN' | 'OUT'>('IN');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedProduct = products.find(p => p.id === productId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!productId) { setError('Please select a product'); return; }
    const qty = Number(quantity);
    if (!qty || qty < 1) { setError('Quantity must be at least 1'); return; }
    if (!reason.trim()) { setError('Reason is required'); return; }

    setSaving(true);
    try {
      const fn = mode === 'IN' ? stockIn : stockOut;
      const res = await fn(productId, qty, reason.trim());
      onSuccess(
        `Stock ${mode} recorded successfully`,
        res.currentStock,
        res.movement.product.name,
      );
      setQuantity('');
      setReason('');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'available' in err) {
        const e = err as { available: number; requested: number };
        setError(`Insufficient stock — available: ${e.available}, requested: ${e.requested}`);
      } else {
        setError(err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Operation failed');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="detail-card" style={{ marginBottom: 24 }}>
      <h3>Record Stock Movement</h3>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={`btn ${mode === 'IN' ? 'btn-stock-in' : 'btn-secondary'}`}
          onClick={() => setMode('IN')}
        >
          ↑ Stock IN
        </button>
        <button
          type="button"
          className={`btn ${mode === 'OUT' ? 'btn-stock-out' : 'btn-secondary'}`}
          onClick={() => setMode('OUT')}
        >
          ↓ Stock OUT
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Product *</label>
            <select value={productId} onChange={e => setProductId(e.target.value)}>
              <option value="">Select product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — stock: {p.currentStock}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantity *</label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="e.g. 50"
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Reason *</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={mode === 'IN' ? 'e.g. Purchase from supplier' : 'e.g. Manual issue to warehouse'}
            />
          </div>
        </div>

        {/* Live stock preview */}
        {selectedProduct && quantity && Number(quantity) > 0 && (
          <div className="stock-preview">
            <span>Current: <strong>{selectedProduct.currentStock}</strong></span>
            <span className={`stock-arrow ${mode === 'IN' ? 'arrow-in' : 'arrow-out'}`}>
              {mode === 'IN' ? `+${quantity}` : `-${quantity}`}
            </span>
            <span>After: <strong>
              {mode === 'IN'
                ? selectedProduct.currentStock + Number(quantity)
                : selectedProduct.currentStock - Number(quantity)}
            </strong></span>
          </div>
        )}

        <div className="form-actions" style={{ marginTop: 12, paddingTop: 12 }}>
          <button type="submit" className={`btn ${mode === 'IN' ? 'btn-stock-in' : 'btn-stock-out'}`} disabled={saving}>
            {saving ? 'Saving...' : `Confirm Stock ${mode}`}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch all products (for the form dropdown and low-stock panel)
  const fetchProducts = useCallback(async () => {
    const res = await getProducts({ limit: 100 });
    setProducts(res.products);
  }, []);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMovements({
        page,
        limit: 20,
        type: typeFilter as 'IN' | 'OUT' | undefined || undefined,
      });
      setMovements(res.movements);
      setPagination(res.pagination);
    } catch {
      setToast({ message: 'Failed to load movements', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  function handleStockSuccess(msg: string, _newStock: number, _productName: string) {
    setToast({ message: msg, type: 'success' });
    // Refresh both products (stock numbers changed) and movements
    fetchProducts();
    fetchMovements();
  }

  const lowStockProducts = products.filter(p => p.isLowStock);

  return (
    <div className="page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Stock movements and inventory overview</p>
        </div>
      </div>

      {/* ── Low Stock Alert Panel ── */}
      {lowStockProducts.length > 0 && (
        <div className="low-stock-panel">
          <div className="low-stock-header">
            ⚠ {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} below minimum stock
          </div>
          <div className="low-stock-items">
            {lowStockProducts.map(p => (
              <div key={p.id} className="low-stock-item">
                <span className="low-stock-name">{p.name}</span>
                <span className="low-stock-sku">{p.sku}</span>
                <span className="low-stock-numbers">
                  <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{p.currentStock}</span>
                  <span style={{ color: 'var(--text-muted)' }}> / min {p.minimumStock}</span>
                </span>
                <span className="badge badge-low-stock">Low Stock</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stock Action Form (write roles only) ── */}
      {canWrite && (
        <StockActionForm products={products} onSuccess={handleStockSuccess} />
      )}

      {/* ── Movement History ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Movement History</h2>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
        >
          <option value="">All Movements</option>
          <option value="IN">Stock IN only</option>
          <option value="OUT">Stock OUT only</option>
        </select>
      </div>

      {loading ? (
        <div className="center-spinner"><Spinner /></div>
      ) : movements.length === 0 ? (
        <EmptyState message="No stock movements found." />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(m.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{m.product.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.product.sku}</div>
                    </td>
                    <td>
                      <span className={`badge ${m.type === 'IN' ? 'badge-movement-in' : 'badge-movement-out'}`}>
                        {m.type === 'IN' ? '↑ IN' : '↓ OUT'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: m.type === 'IN' ? 'var(--success)' : 'var(--danger)' }}>
                      {m.type === 'IN' ? '+' : '-'}{m.quantity}
                    </td>
                    <td>{m.reason}</td>
                    <td>{m.createdBy.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
