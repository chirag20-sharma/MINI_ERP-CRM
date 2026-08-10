import { CustomerStatus, CustomerType } from '../types';

export function StatusBadge({ status }: { status: CustomerStatus }) {
  const styles: Record<CustomerStatus, string> = {
    LEAD: 'badge badge-lead',
    ACTIVE: 'badge badge-active',
    INACTIVE: 'badge badge-inactive',
  };
  return <span className={styles[status]}>{status}</span>;
}

export function TypeBadge({ type }: { type: CustomerType }) {
  const styles: Record<CustomerType, string> = {
    RETAIL: 'badge badge-retail',
    WHOLESALE: 'badge badge-wholesale',
    DISTRIBUTOR: 'badge badge-distributor',
  };
  return <span className={styles[type]}>{type}</span>;
}

export function Spinner() {
  return <div className="spinner" aria-label="Loading" />;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <p>{message}</p>
    </div>
  );
}

export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button onClick={onClose} className="toast-close">×</button>
    </div>
  );
}

export function Pagination({
  page, totalPages, onPageChange,
}: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}>← Prev</button>
      <span>Page {page} of {totalPages}</span>
      <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next →</button>
    </div>
  );
}
