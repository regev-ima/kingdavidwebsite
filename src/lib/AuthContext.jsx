import React, { createContext, useContext } from 'react';

// The public-facing King David site doesn't require user authentication.
// Orders are placed via phone or WhatsApp and persisted to the kcrm Supabase
// project. This stub keeps the AuthContext API stable for any component that
// still references it.

const AuthContext = createContext(null);

const STUB_VALUE = {
  user: null,
  isAuthenticated: false,
  isLoadingAuth: false,
  isLoadingPublicSettings: false,
  authError: null,
  appPublicSettings: null,
  logout: () => {},
  navigateToLogin: () => {},
  checkAppState: () => {},
};

export const AuthProvider = ({ children }) => {
  return <AuthContext.Provider value={STUB_VALUE}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return STUB_VALUE;
  }
  return context;
};
