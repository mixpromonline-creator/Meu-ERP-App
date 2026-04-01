import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import './index.css'

// Autenticação
import Login from './pages/Login'
import Register from './pages/Register'
import PendingApproval from './pages/PendingApproval'
import Blocked from './pages/Blocked'

// Dashboards
import ClientDashboard from './pages/ClientDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'

const DashboardRouter = () => {
  const { profile } = useAuth();
  
  if (profile?.role === 'superadmin') {
    return <SuperAdminDashboard />;
  }
  return <ClientDashboard />;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI Crash Blocked:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#ef4444', background: '#1C1C1F', height: '100vh' }}>
          <h2>Algo deu muito errado na interface!</h2>
          <p>O aplicativo sofreu um colapso e encontrou um erro no código.</p>
          <pre style={{ background: '#0A0A0B', padding: '1rem', borderRadius: '8px', overflowX: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.href = '/'} className="btn-primary" style={{ marginTop: '1rem' }}>
            Tentar recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <div className="app-container">
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <main className="main-content">
              <Routes>
                {/* Rotas Públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Rota para contas que aguardam aprovação */}
                <Route element={<ProtectedRoute allowedStatus={['pending']} />}>
                  <Route path="/pending" element={<PendingApproval />} />
                </Route>
                
                {/* Rota para contas bloqueadas */}
                <Route element={<ProtectedRoute allowedStatus={['approved', 'pending', 'blocked']} />}>
                  <Route path="/blocked" element={<Blocked />} />
                </Route>

                {/* Rotas Privadas (Somente Contas Aprovadas e Super Admins) */}
                <Route element={<ProtectedRoute allowedStatus={['approved']} />}>
                  <Route path="/" element={<DashboardRouter />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </div>
  )
}

export default App
