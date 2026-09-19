import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ children, role }) {
  const { token, user } = useAuth();

  // 1. Not logged in at all -> send to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Logged in, but wrong role -> send to their correct portal
  if (user?.role !== role) {
    const redirectPath = user?.role === 'PLATFORM_ADMIN' ? '/admin' : '/tenant';
    return <Navigate to={redirectPath} replace />;
  }

  // 3. Authorized -> render the layout/page
  return children;
}