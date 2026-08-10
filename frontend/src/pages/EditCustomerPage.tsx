import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomerForm from '../components/CustomerForm';
import { getCustomer, updateCustomer } from '../services/customer.service';
import { Customer } from '../types';
import { Spinner, Toast } from '../components/UI';

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    getCustomer(id!)
      .then(r => setCustomer(r.customer))
      .catch(() => setError('Customer not found'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(data: Partial<Customer>) {
    await updateCustomer(id!, data);
    setToast({ message: 'Customer updated successfully', type: 'success' });
    setTimeout(() => navigate(`/customers/${id}`), 800);
  }

  if (loading) return <div className="center-spinner"><Spinner /></div>;
  if (error || !customer) return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/customers')}>← Back to Customers</button>
      <p className="alert alert-error" style={{ marginTop: 16 }}>{error || 'Customer not found'}</p>
    </div>
  );

  return (
    <div className="page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate(`/customers/${id}`)}>← Back to Customer</button>
          <h1 className="page-title">Edit Customer</h1>
          <p className="page-subtitle">{customer.customerName}</p>
        </div>
      </div>
      <div className="form-card">
        <CustomerForm
          initial={customer}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/customers/${id}`)}
        />
      </div>
    </div>
  );
}
