import { useState, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: '🏠 Dashboard' },
  { to: '/customers', label: '👥 Customers' },
  { to: '/products',  label: '📦 Products' },
  { to: '/inventory', label: '📈 Inventory' },
  { to: '/challans',  label: '📄 Sales Challans' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const sidebarContent = (
    <>
      <div className="sidebar-brand">
        <span>Mini ERP</span>
        <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu">×</button>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={location.pathname.startsWith(to) ? 'nav-link active' : 'nav-link'}
            onClick={() => setOpen(false)}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">{user?.role}</span>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </>
  );

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      {/* Desktop sidebar */}
      <aside className="sidebar sidebar-desktop">{sidebarContent}</aside>

      {/* Mobile sidebar */}
      <aside className={`sidebar sidebar-mobile${open ? ' sidebar-mobile-open' : ''}`}>
        {sidebarContent}
      </aside>

      <div className="main-wrapper">
        {/* Mobile top bar */}
        <header className="mobile-header">
          <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <span className="mobile-brand">Mini ERP</span>
        </header>

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
