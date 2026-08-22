import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Challan, ChallanStatus } from '../types';
import { getChallan, confirmChallan, cancelChallan } from '../services/challan.service';
import { Spinner, Toast } from '../components/UI';
import { useAuth } from '../context/AuthContext';

function ChallanStatusBadge({ status }: { status: ChallanStatus }) {
  const cls: Record<ChallanStatus, string> = {
    DRAFT: 'badge badge-challan-draft',
    CONFIRMED: 'badge badge-challan-confirmed',
    CANCELLED: 'badge badge-challan-cancelled',
  };
  const label: Record<ChallanStatus, string> = {
    DRAFT: '● Draft',
    CONFIRMED: '✓ Confirmed',
    CANCELLED: '✕ Cancelled',
  };
  return <span className={cls[status]} style={{ fontSize: 13, padding: '4px 12px' }}>{label[status]}</span>;
}

// Simple inline confirmation dialog
function ConfirmDialog({
  message, onConfirm, onCancel,
}: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <p style={{ marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAct = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [dialog, setDialog] = useState<'confirm' | 'cancel' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    getChallan(id!)
      .then(res => setChallan(res.challan))
      .catch(() => setToast({ message: 'Challan not found', type: 'error' }))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleConfirm() {
    setDialog(null);
    setActionError('');
    setActing(true);
    try {
      const res = await confirmChallan(id!);
      setChallan(res.challan);
      setToast({ message: `${res.challan.challanNumber} confirmed — stock has been deducted`, type: 'success' });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'product' in err) {
        const e = err as { product: string; available: number; requested: number };
        setActionError(
          `Cannot confirm challan. "${e.product}" has only ${e.available} unit${e.available !== 1 ? 's' : ''} available, but ${e.requested} ${e.requested !== 1 ? 'were' : 'was'} requested.`
        );
      } else {
        setActionError(err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Confirmation failed');
      }
    } finally {
      setActing(false);
    }
  }

  async function handleCancel() {
    setDialog(null);
    setActing(true);
    try {
      const res = await cancelChallan(id!);
      setChallan(prev => prev ? { ...prev, status: res.challan.status } : prev);
      setToast({ message: 'Challan cancelled', type: 'success' });
    } catch (err: unknown) {
      setToast({
        message: err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Cancellation failed',
        type: 'error',
      });
    } finally {
      setActing(false);
    }
  }

  if (loading) return <div className="center-spinner"><Spinner /></div>;

  if (!challan) return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/challans')}>← Back</button>
      <p style={{ color: 'var(--danger)', marginTop: 16 }}>Challan not found.</p>
    </div>
  );

  const isDraft = challan.status === 'DRAFT';
  const totalValue = challan.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  function handleDownloadPDF() {
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL ?? '';
    fetch(`${baseUrl}/api/challans/${id}/pdf`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to generate PDF');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `challan-${challan?.challanNumber || id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        setToast({ message: err.message || 'Failed to download PDF', type: 'error' });
      });
  }

  return (
    <div className="page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {dialog === 'confirm' && (
        <ConfirmDialog
          message={`Confirming challan ${challan.challanNumber} will permanently deduct stock for ${challan.items.length} product(s). This cannot be undone. Continue?`}
          onConfirm={handleConfirm}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog === 'cancel' && (
        <ConfirmDialog
          message={`Are you sure you want to cancel challan ${challan.challanNumber}? This action cannot be undone.`}
          onConfirm={handleCancel}
          onCancel={() => setDialog(null)}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/challans')}>← Back to Challans</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title">{challan.challanNumber}</h1>
            <ChallanStatusBadge status={challan.status} />
          </div>
          <p className="page-subtitle">
            Created by {challan.createdBy.name} on {new Date(challan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={handleDownloadPDF}>
            📄 Download PDF
          </button>
          {canAct && isDraft && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate(`/challans/${id}/edit`)} disabled={acting}>
                Edit
              </button>
              <button className="btn btn-secondary" onClick={() => setDialog('cancel')} disabled={acting}>
                Cancel Challan
              </button>
              <button className="btn btn-stock-in" onClick={() => setDialog('confirm')} disabled={acting}>
                {acting ? 'Processing...' : 'Confirm & Deduct Stock'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Insufficient stock error — shown prominently */}
      {actionError && (
        <div className="alert alert-error" style={{ marginBottom: 20, fontSize: 14 }}>
          ⚠ {actionError}
        </div>
      )}

      {/* Info cards */}
      <div className="detail-grid" style={{ marginBottom: 20 }}>
        <div className="detail-card">
          <h3>Challan Details</h3>
          <dl className="detail-list">
            <dt>Number</dt>    <dd>{challan.challanNumber}</dd>
            <dt>Status</dt>    <dd><ChallanStatusBadge status={challan.status} /></dd>
            <dt>Created By</dt><dd>{challan.createdBy.name}</dd>
            <dt>Date</dt>      <dd>{new Date(challan.createdAt).toLocaleDateString('en-IN')}</dd>
            <dt>Total Qty</dt> <dd>{challan.totalQuantity} units</dd>
          </dl>
        </div>

        <div className="detail-card">
          <h3>Customer</h3>
          <dl className="detail-list">
            <dt>Name</dt>    <dd>{challan.customer.customerName}</dd>
            <dt>Business</dt><dd>{challan.customer.businessName}</dd>
            {challan.customer.mobile && <><dt>Mobile</dt><dd>{challan.customer.mobile}</dd></>}
          </dl>
        </div>
      </div>

      {/* Items table */}
      <div className="detail-card" style={{ maxWidth: '100%' }}>
        <h3>Items ({challan.items.length})</h3>

        {challan.status === 'DRAFT' && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fef9c3', borderRadius: 'var(--radius)', fontSize: 12, color: '#a16207', border: '1px solid #fde68a' }}>
            ⚠ This challan is a DRAFT. Stock has NOT been deducted yet.
          </div>
        )}

        {challan.status === 'CONFIRMED' && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f0fdf4', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--success)', border: '1px solid #bbf7d0' }}>
            ✓ Stock has been deducted. OUT movements have been recorded in inventory.
          </div>
        )}

        <div className="table-wrapper" style={{ boxShadow: 'none', marginBottom: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Unit Price (snapshot)</th>
                <th>Quantity</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.productName}</td>
                  <td><code style={{ fontSize: 12 }}>{item.sku}</code></td>
                  <td>₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>{item.quantity}</td>
                  <td>₹{(Number(item.unitPrice) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, padding: '12px 14px', fontSize: 13 }}>
                  Total
                </td>
                <td style={{ fontWeight: 700, padding: '12px 14px' }}>{challan.totalQuantity} units</td>
                <td style={{ fontWeight: 700, padding: '12px 14px' }}>
                  ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
          * Unit prices shown are snapshots captured at the time this challan was created. They will not change if the product price is updated later.
        </p>
      </div>
    </div>
  );
}
