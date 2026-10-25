// Role strings live here (and in the API's common/policy) only.
export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  VENTAS: 'VENTAS / ADMINISTRACIÓN',
  TEC: 'SEGURIDAD ELECTRÓNICA',
  /** Reads everything; validates, edits and annuls money; adjusts stock (AUTH-01). */
  CONTA: 'CONTABILIDAD',
  NONE: 'SIN ACCESO',
};

/** Roles that sell: quotations, projects, clients. */
export const COMMERCIAL_ROLES = [ROLES.ADMIN, ROLES.VENTAS];
