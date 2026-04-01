import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ allowedStatus = ['approved', 'pending'] }) => {
  const { session, profile, loading } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (loading || !profile) {
    return (
      <div className="app-loader-screen">
        <div className="app-loader-card">
          <div className="app-loader-spinner" />
          <p className="app-loader-title">Carregando painel...</p>
          <p className="app-loader-subtitle">Validando a sua sessao.</p>
        </div>
      </div>
    );
  }

  if (profile.status === 'pending' && !allowedStatus.includes('pending')) {
    return <Navigate to="/pending" replace />;
  }

  if (profile.status === 'blocked') {
    return <Navigate to="/blocked" replace />;
  }

  return <Outlet />;
};
