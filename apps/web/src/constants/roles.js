// Role strings live here (and in the API's common/policy) only.
export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  VENTAS: 'VENTAS / ADMINISTRACIÓN',
  TEC: 'SEGURIDAD ELECTRÓNICA',
  /** The same permissions as ADMINISTRADOR; a separate name for its users (ROLE-01). */
  CONTA: 'CONTABILIDAD',
  NONE: 'SIN ACCESO',
};

/** Gerencia: ADMINISTRADOR and CONTABILIDAD have the same permissions (ROLE-01, owner 2026-10-27). */
export const MANAGER_ROLES = [ROLES.ADMIN, ROLES.CONTA];

/** Roles that sell: quotations, projects, clients (Gerencia and Ventas). */
export const COMMERCIAL_ROLES = [...MANAGER_ROLES, ROLES.VENTAS];
