import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import './index.css'

// Autenticação
import Login from './pages/Login'
import Register from './pages/Register'
import PendingApproval from './pages/PendingApproval'

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

function App() {
  return (
    <div className="app-container">
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
    </div>
  )
}

export default App
