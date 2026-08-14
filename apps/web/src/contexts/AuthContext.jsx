import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(pb.authStore.record);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, record) => {
      setCurrentUser(record);
    });
    setInitialLoading(false);

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      // Check custom active field if present
      if (authData.record.active === false) {
        pb.authStore.clear();
        return { success: false, error: 'Cuenta desactivada. Contacta al administrador.' };
      }
      return { success: true, user: authData.record };
    } catch (error) {
      console.error('Login error:', error);
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
    pb.authStore.clear();
    setCurrentUser(null);
  };

  const isAdmin = () => currentUser?.role === 'ADMINISTRADOR';
  const isVentas = () => currentUser?.role === 'VENTAS / ADMINISTRACIÓN';
  const isSeguridad = () => currentUser?.role === 'SEGURIDAD ELECTRÓNICA';
  const isContadora = () => currentUser?.role === 'Contadora';

  // Permission Helper Functions
  // VENTAS / ADMINISTRACIÓN = same financial level as Contadora
  const isVentasLevel = () => isAdmin() || isVentas() || isContadora();

  const canViewFinancialReports = () => isVentasLevel();
  const canRegisterFinancial = () => isVentasLevel();
  const canApproveExpenses = () => isVentasLevel();  // can approve/reject gastos operativos
  const canDeleteRecords = () => isAdmin();           // only admin deletes
  const canAccessExecutivePanel = () => isAdmin();
  const canManageVehicles = () => isAdmin() || isVentas() || isSeguridad() || isContadora();
  const canViewVehicleAnalytics = () => isAdmin();

  const value = {
    currentUser,
    userRole: currentUser?.role,
    department: currentUser?.department,
    login,
    logout,
    isAuthenticated: pb.authStore.isValid,
    initialLoading,
    isAdmin,
    isVentas,
    isSeguridad,
    isVentasLevel,
    canApproveExpenses,
    canDeleteRecords,
    isContadora,
    canViewFinancialReports,
    canRegisterFinancial,
    canAccessExecutivePanel,
    canManageVehicles,
    canViewVehicleAnalytics
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