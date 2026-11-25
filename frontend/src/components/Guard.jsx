
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Guard({ children, role }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="center">
        Securing your session…
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: loc.pathname }}
      />
    );
  }

  if (role && user.role !== role) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
