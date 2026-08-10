import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product } from '../types';
import { getProduct } from '../services/product.service';
import { Spinner, Toast } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    getProduct(id!)
      .then(res => setProduct(res.product))
      .catch(() => setToast({ message: 'Product not found', type: 'error' }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="center-spinner"><Spinner /></div>;

  if (!product) return (
    <div className="page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <button className="back-btn" onClick={() => navigate('/products')}>← Back to Products</button>
      <p style={{ color: 'var(--danger)', marginTop: 16 }}>Product not found.</p>
    </div>
  );

  return (
    <div className="page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/products')}>← Back to Products</button>
          <h1 className="page-title">{product.name}</h1>
          <p className="page-subtitle">
            <code style={{ fontSize: 12 }}>{product.sku}</code>
            &nbsp;·&nbsp;{product.category}
            &nbsp;·&nbsp;
            {product.isLowStock
              ? <span className="badge badge-low-stock">Low Stock</span>
              : <span className="badge badge-in-stock">In Stock</span>}
          </p>
        </div>
        {canWrite && (
          <button className="btn btn-secondary" onClick={() => navigate(`/products/${product.id}/edit`)}>
            Edit Product
          </button>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Product Details</h3>
          <dl className="detail-list">
            <dt>Name</dt>       <dd>{product.name}</dd>
            <dt>SKU</dt>        <dd><code>{product.sku}</code></dd>
            <dt>Category</dt>   <dd>{product.category}</dd>
            <dt>Unit Price</dt> <dd>₹{Number(product.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</dd>
            <dt>Location</dt>   <dd>{product.warehouseLocation}</dd>
            <dt>Added</dt>      <dd>{new Date(product.createdAt).toLocaleDateString('en-IN')}</dd>
          </dl>
        </div>

        <div className="detail-card">
          <h3>Stock Information</h3>
          <dl className="detail-list">
            <dt>Current Stock</dt>
            <dd style={{ fontWeight: 700, fontSize: 18, color: product.isLowStock ? 'var(--danger)' : 'var(--success)' }}>
              {product.currentStock} units
            </dd>
            <dt>Minimum Stock</dt>
            <dd>{product.minimumStock} units</dd>
            <dt>Stock Status</dt>
            <dd>
              {product.isLowStock
                ? <span className="badge badge-low-stock">⚠ Low Stock — reorder needed</span>
                : <span className="badge badge-in-stock">✓ Sufficient Stock</span>}
            </dd>
            <dt>Last Updated</dt>
            <dd>{new Date(product.updatedAt).toLocaleDateString('en-IN')}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
