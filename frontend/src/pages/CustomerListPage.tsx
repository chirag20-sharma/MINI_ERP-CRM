import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, Pagination as PaginationType } from '../types';
import { getCustomers } from '../services/customer.service';
import { StatusBadge, TypeBadge, Spinner, EmptyState, Pagination, Toast } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function CustomerListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers({ page, limit: 10, search, status, customerType });
      setCustomers(res.customers);
      setPagination(res.pagination);
    } catch {
      setToast({ message: 'Failed to load customers', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, status, customerType]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // Debounce search — only fire after user stops typing
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  function handleFilterChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  return (
    <div className="page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{pagination.total} total customers</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => navigate('/customers/new')}>
            + Add Customer
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search by name, mobile, business..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <select value={status} onChange={handleFilterChange(setStatus)}>
          <option value="">All Statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select value={customerType} onChange={handleFilterChange(setCustomerType)}>
          <option value="">All Types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="DISTRIBUTOR">Distributor</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="center-spinner"><Spinner /></div>
      ) : customers.length === 0 ? (
        <EmptyState message="No customers found. Try adjusting your filters." />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Business</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <button className="link-btn" onClick={() => navigate(`/customers/${c.id}`)}>
                        {c.customerName}
                      </button>
                    </td>
                    <td>{c.businessName}</td>
                    <td>{c.mobile}</td>
                    <td><TypeBadge type={c.customerType} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      {c.followUpDate
                        ? new Date(c.followUpDate).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td>
                      <button className="btn btn-sm" onClick={() => navigate(`/customers/${c.id}`)}>
                        View
                      </button>
                      {canWrite && (
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/customers/${c.id}/edit`)}>
                          Edit
                        </button>
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
