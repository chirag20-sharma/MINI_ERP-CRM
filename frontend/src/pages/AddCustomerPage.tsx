import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerForm from '../components/CustomerForm';
import { createCustomer } from '../services/customer.service';
import { Customer } from '../types';
import { Toast } from '../components/UI';

export default function AddCustomerPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleSubmit(data: Partial<Customer>) {
    const res = await createCustomer(data);
    setToast({ message: `${res.customer.customerName} added successfully`, type: 'success' });
    setTimeout(() => navigate(`/customers/${res.customer.id}`), 800);
  }

  return (
    <div className="page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/customers')}>← Back to Customers</button>
          <h1 className="page-title">Add Customer</h1>
          <p className="page-subtitle">Create a new customer record</p>
        </div>
      </div>
      <div className="form-card">
        <CustomerForm
          submitLabel="Create Customer"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/customers')}
        />
      </div>
    </div>
  );
}
