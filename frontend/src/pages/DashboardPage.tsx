import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardData, DashboardStats, LowStockProduct, RecentChallan } from '../services/dashboard.service';
import { Spinner } from '../components/UI';
import { ChallanStatus } from '../types';

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={color ? { color } : undefined}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ChallanBadge({ status }: { status: ChallanStatus }) {
  const cls: Record<ChallanStatus, string> = {
    DRAFT: 'badge badge-challan-draft',
    CONFIRMED: 'badge badge-challan-confirmed',
    CANCELLED: 'badge badge-challan-cancelled',
  };
  return <span className={cls[status]}>{status}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [recentChallans, setRecentChallans] = useState<RecentChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardData()
      .then(res => {
        setStats(res.stats);
        setLowStock(res.lowStockProducts);
        setRecentChallans(res.recentChallans);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="center-spinner"><Spinner /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name} — {user?.role}</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>
      )}

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <StatCard label="Total Customers" value={stats.totalCustomers} />
          <StatCard label="Total Products" value={stats.totalProducts} />
          <StatCard label="Total Challans" value={stats.totalChallans} />
          <StatCard label="Low Stock Items" value={stats.lowStockCount} color={stats.lowStockCount > 0 ? 'var(--danger)' : undefined} />
        </div>
      )}

      <div className="dashboard-grid">
        {/* Recent Challans */}
        <div className="detail-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Recent Challans</h3>
            <button className="link-btn" onClick={() => navigate('/challans')}>View all →</button>
          </div>

          {recentChallans.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No challans yet.</p>
          ) : (
            <div className="table-wrapper" style={{ boxShadow: 'none', marginBottom: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Customer</th>
                    <th>Qty</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentChallans.map(c => (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/challans/${c.id}`)}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{c.challanNumber}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.customer.customerName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.customer.businessName}</div>
                      </td>
                      <td>{c.totalQuantity}</td>
                      <td><ChallanBadge status={c.status} /></td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: 12 }}>
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="detail-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Low Stock Alert</h3>
            <button className="link-btn" onClick={() => navigate('/inventory')}>View inventory →</button>
          </div>

          {lowStock.length === 0 ? (
            <p style={{ color: 'var(--success)', fontSize: 13 }}>✓ All products are sufficiently stocked.</p>
          ) : (
            <div className="table-wrapper" style={{ boxShadow: 'none', marginBottom: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current</th>
                    <th>Minimum</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map(p => (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/inventory')}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.sku}</div>
                      </td>
                      <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{p.currentStock}</td>
                      <td>{p.minimumStock}</td>
                      <td><span className="badge badge-low-stock">LOW STOCK</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
