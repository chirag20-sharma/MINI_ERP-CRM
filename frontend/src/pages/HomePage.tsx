import { useState, useEffect } from 'react';

interface HealthResponse {
  success: boolean;
  message: string;
}

function HomePage() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: HealthResponse) => setApiStatus(data.message))
      .catch(() => setApiStatus('Backend not reachable'));
  }, []);

  return (
    <main style={styles.container}>
      <h1 style={styles.title}>Mini ERP + CRM</h1>
      <p style={styles.subtitle}>Operations Portal for Wholesale & Distribution</p>
      <div style={styles.statusBox}>
        <span style={styles.label}>API Status: </span>
        <span style={styles.value}>{apiStatus}</span>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
    backgroundColor: '#f5f7fa',
  },
  title: {
    fontSize: '2.5rem',
    color: '#1a202c',
    margin: 0,
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#4a5568',
    marginTop: '0.5rem',
  },
  statusBox: {
    marginTop: '2rem',
    padding: '1rem 2rem',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontSize: '1rem',
  },
  label: {
    fontWeight: 'bold',
    color: '#2d3748',
  },
  value: {
    color: '#38a169',
  },
};

export default HomePage;
