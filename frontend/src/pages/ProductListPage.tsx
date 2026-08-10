import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Pagination as PaginationType } from '../types';
import { getProducts } from '../services/product.service';
import { Spinner, EmptyState, Pagination, Toast } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function ProductListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts({
        page,
        limit: 10,
        search: search || undefined,
        category: category || undefined,
        lowStock: lowStock === 'true' ? 'true' : undefined,
      });
      setProducts(res.products);
      setPagination(res.pagination);
    } catch {
      setToast({ message: 'Failed to load products', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, category, lowStock]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  function handleFilterChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => { setter(e.target.value); setPage(1); };
  }

  return (
    <div className="page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{pagination.total} total products</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => navigate('/products/new')}>
            + Add Product
          </button>
        )}
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search by name, SKU, category..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <select value={category} onChange={handleFilterChange(setCategory)}>
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Accessories">Accessories</option>
          <option value="Cables">Cables</option>
          <option value="Networking">Networking</option>
          <option value="Storage">Storage</option>
          <option value="Other">Other</option>
        </select>
        <select value={lowStock} onChange={handleFilterChange(setLowStock)}>
          <option value="">All Stock</option>
          <option value="true">Low Stock Only</option>
        </select>
      </div>

      {loading ? (
        <div className="center-spinner"><Spinner /></div>
      ) : products.length === 0 ? (
        <EmptyState message="No products found. Try adjusting your filters." />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <button className="link-btn" onClick={() => navigate(`/products/${p.id}`)}>
                        {p.name}
                      </button>
                    </td>
                    <td><code style={{ fontSize: 12 }}>{p.sku}</code></td>
                    <td>{p.category}</td>
                    <td>₹{Number(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>{p.currentStock} / min {p.minimumStock}</td>
                    <td>
                      {p.isLowStock
                        ? <span className="badge badge-low-stock">Low Stock</span>
                        : <span className="badge badge-in-stock">In Stock</span>}
                    </td>
                    <td>{p.warehouseLocation}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => navigate(`/products/${p.id}`)}>View</button>
                      {canWrite && (
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/products/${p.id}/edit`)}>Edit</button>
                      )}
                    </td>
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
