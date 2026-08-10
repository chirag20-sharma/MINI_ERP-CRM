import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Customer } from '../types';
import { getCustomer } from '../services/customer.service';
import { StatusBadge, TypeBadge, Spinner } from '../components/UI';
import FollowUpPanel from '../components/FollowUpPanel';
import { useAuth } from '../context/AuthContext';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCustomer(id!)
      .then(r => setCustomer(r.customer))
      .catch(() => setError('Customer not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="center-spinner"><Spinner /></div>;
  if (error || !customer) return (
    <div className="page">
      <p className="alert alert-error">{error || 'Customer not found'}</p>
      <button className="btn btn-secondary" onClick={() => navigate('/customers')}>← Back</button>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/customers')}>← Customers</button>
          <h1 className="page-title">{customer.customerName}</h1>
          <p className="page-subtitle">{customer.businessName}</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => navigate(`/customers/${id}/edit`)}>
            Edit Customer
          </button>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Customer Info</h3>
          <dl className="detail-list">
            <dt>Status</dt>
            <dd><StatusBadge status={customer.status} /></dd>
            <dt>Type</dt>
            <dd><TypeBadge type={customer.customerType} /></dd>
            <dt>Mobile</dt>
            <dd>{customer.mobile}</dd>
            <dt>Email</dt>
            <dd>{customer.email || '—'}</dd>
            <dt>GST Number</dt>
            <dd>{customer.gstNumber || '—'}</dd>
            <dt>Address</dt>
            <dd>{customer.address}</dd>
            {customer.followUpDate && (
              <>
                <dt>Follow-up Date</dt>
                <dd>{new Date(customer.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</dd>
              </>
            )}
            {customer.notes && (
              <>
                <dt>Notes</dt>
                <dd>{customer.notes}</dd>
              </>
            )}
            <dt>Created By</dt>
            <dd>{customer.createdBy.name}</dd>
            <dt>Created At</dt>
            <dd>{new Date(customer.createdAt).toLocaleDateString('en-IN')}</dd>
          </dl>
        </div>

        <div className="detail-card">
          <FollowUpPanel customerId={id!} />
        </div>
      </div>
    </div>
  );
}
