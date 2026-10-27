import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '@/services/auth/index.js';
import { authStore } from '@/lib/authStore.js';
import { MANAGER_ROLES, ROLES } from '@/constants/roles.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authStore.onChange((_token, record) => {
      setCurrentUser(record);
    });
    setInitialLoading(false);
    return () => unsubscribe();
  }, []);

  const login = async (email, password, options = {}) => {
    try {
      const result = await authService.login(email, password, options);
      if (result.user?.active === false) {
        authService.logout();
        return { success: false, error: 'Cuenta desactivada. Contacta al administrador.' };
      }
      if (result.success && result.user) {
        setCurrentUser(result.user);
        return { success: true, user: result.user };
      }
      return { success: false, error: result.error || 'No se pudo iniciar sesión.' };
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

  /** Gerencia: ADMINISTRADOR or CONTABILIDAD, the same permissions (ROLE-01). */
  const isAdmin = () => MANAGER_ROLES.includes(currentUser?.role);
  const isVentas = () => currentUser?.role === ROLES.VENTAS;
  const isSeguridad = () => currentUser?.role === ROLES.TEC;
  const isContabilidad = () => currentUser?.role === ROLES.CONTA;
  const isVentasLevel = () => isAdmin() || isVentas();
  /** Gerencia: validate, observe, edit and annul money; transfers, refunds, stock adjustments. */
  const canManageMoney = isAdmin;

  const value = {
    currentUser,
    userRole: currentUser?.role,
    department: currentUser?.department || currentUser?.sucursalId,
    login,
    logout,
    isAuthenticated: Boolean(currentUser) && currentUser.active !== false,
    initialLoading,
    isAdmin,
    isVentas,
    isSeguridad,
    isVentasLevel,
    isContabilidad,
    canManageMoney,
    /** Reads every record (the commercial roles); writes are decided per action. */
    readsAll: isVentasLevel,
    canAccessExecutivePanel: isAdmin,
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
