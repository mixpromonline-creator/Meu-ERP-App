import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ allowedStatus = ['approved', 'pending'] }) => {
  const { session, profile } = useAuth();

  // Se não estiver logado, manda para o Login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Se o usuário está logado, mas ainda precisamos checar o status
  if (profile) {
    // Conta pendente e a rota exige 'approved' (ex: Dashboard)
    if (profile.status === 'pending' && !allowedStatus.includes('pending')) {
      return <Navigate to="/pending" replace />;
    }
    
    // Conta bloqueada
    if (profile.status === 'blocked') {
      return <Navigate to="/blocked" replace />;
    }
  }

  return <Outlet />;
};
