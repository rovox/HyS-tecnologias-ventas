import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '@/services/auth/index.js';
import mockAdapter from '@/api/mockAdapter.js';
import { isMockMode } from '@/api/config.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = mockAdapter.authStore.onChange((_token, record) => {
      setCurrentUser(record);
    });
    setInitialLoading(false);
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      if (result.user?.active === false) {
        authService.logout();
        return { success: false, error: 'Cuenta desactivada. Contacta al administrador.' };
      }
      return { success: true, user: result.user };
    } catch (error) {
      const status = error?.status;
      if (status === 400) {
        return { success: false, error: 'Credenciales inválidas. Verificá email y contraseña.' };
      }
      if (status === 403) {
        return { success: false, error: 'Cuenta desactivada o sin permisos. Contactá al administrador.' };
      }
      return { success: false, error: `Error de autenticación (${status || 'red'}). Intentá de nuevo.` };
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const isAdmin = () => currentUser?.role === 'ADMINISTRADOR';
  const isVentas = () => currentUser?.role === 'VENTAS / ADMINISTRACIÓN';
  const isSeguridad = () => currentUser?.role === 'SEGURIDAD ELECTRÓNICA';
  const isContadora = () => currentUser?.role === 'Contadora';
  const isVentasLevel = () => isAdmin() || isVentas() || isContadora();

  const value = {
    currentUser,
    userRole: currentUser?.role,
    department: currentUser?.department,
    login,
    logout,
    isAuthenticated: mockAdapter.authStore.isValid,
    initialLoading,
    isMockAuth: isMockMode,
    isAdmin,
    isVentas,
    isSeguridad,
    isVentasLevel,
    canApproveExpenses: isVentasLevel,
    canDeleteRecords: isAdmin,
    isContadora,
    canViewFinancialReports: isVentasLevel,
    canRegisterFinancial: isVentasLevel,
    canAccessExecutivePanel: isAdmin,
    canManageVehicles: () => isAdmin() || isVentas() || isSeguridad() || isContadora(),
    canViewVehicleAnalytics: isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
