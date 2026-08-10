import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Challan, ChallanStatus, Pagination as PaginationType } from '../types';
import { getChallans } from '../services/challan.service';
import { Spinner, EmptyState, Pagination, Toast } from '../components/UI';
import { useAuth } from '../context/AuthContext';

function ChallanStatusBadge({ status }: { status: ChallanStatus }) {
  const cls: Record<ChallanStatus, string> = {
    DRAFT: 'badge badge-challan-draft',
    CONFIRMED: 'badge badge-challan-confirmed',
    CANCELLED: 'badge badge-challan-cancelled',
  };
  return <span className={cls[status]}>{status}</span>;
}

export default function ChallanListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [challans, setChallans] = useState<Challan[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchChallans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getChallans({ page, limit: 10, search: search || undefined, status: status || undefined });
      setChallans(res.challans);
      setPagination(res.pagination);
    } catch {
      setToast({ message: 'Failed to load challans', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchChallans(); }, [fetchChallans]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Challans</h1>
          <p className="page-subtitle">{pagination.total} total challans</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => navigate('/challans/new')}>
            + New Challan
          </button>
        )}
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search by challan number..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="center-spinner"><Spinner /></div>
      ) : challans.length === 0 ? (
        <EmptyState message="No challans found." />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.map(c => (
                  <tr key={c.id}>
                    <td>
                      <button className="link-btn" onClick={() => navigate(`/challans/${c.id}`)}>
                        {c.challanNumber}
                      </button>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.customer.customerName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.customer.businessName}</div>
                    </td>
                    <td>{c._count?.items ?? c.items?.length ?? '—'}</td>
                    <td>{c.totalQuantity}</td>
                    <td><ChallanStatusBadge status={c.status} /></td>
                    <td>{c.createdBy.name}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <button className="btn btn-sm" onClick={() => navigate(`/challans/${c.id}`)}>View</button>
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
