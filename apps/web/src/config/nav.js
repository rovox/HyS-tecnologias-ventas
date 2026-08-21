import {
  LayoutDashboard,
  FileStack,
  Building2,
  ClipboardCheck,
  FileText,
  ClipboardList,
  Settings,
} from 'lucide-react';
import { ROLES } from '@/mocks/users.js';

export { ROLES };

export const ALL_ROLES = [ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC, ROLES.CONT];

const QUOTE_ROLES = [ROLES.ADMIN, ROLES.VENTAS, ROLES.CONT];
const CLIENT_ROLES = [ROLES.ADMIN, ROLES.VENTAS, ROLES.CONT, ROLES.TEC];
const SURVEY_ROLES = [ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC];
const TASK_ROLES = [ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC];
const REPORT_ROLES = [ROLES.ADMIN, ROLES.CONT];
const ADMIN_ONLY = [ROLES.ADMIN];

/** Menú operativo. Cotizaciones primero. Sin Gestión. Tareas = botón flotante. */
export const menuSections = [
  {
    title: 'PRINCIPAL',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', allowedRoles: ALL_ROLES },
    ],
  },
  {
    title: 'OPERACIONES',
    items: [
      { to: '/quotations', icon: FileStack, label: 'Cotizaciones', allowedRoles: QUOTE_ROLES },
      { to: '/clientes', icon: Building2, label: 'Clientes', allowedRoles: CLIENT_ROLES },
      { to: '/surveys', icon: ClipboardCheck, label: 'Relevamientos', allowedRoles: SURVEY_ROLES },
    ],
  },
  {
    title: 'ADMINISTRACIÓN',
    items: [
      { to: '/reports', icon: FileText, label: 'Reportes', allowedRoles: REPORT_ROLES },
      { to: '/admin/management', icon: ClipboardList, label: 'Panel de Control', allowedRoles: ADMIN_ONLY },
      { to: '/configuration', icon: Settings, label: 'Configuración', allowedRoles: ADMIN_ONLY },
    ],
  },
];

export const routeRoles = {
  dashboard: ALL_ROLES,
  quotations: QUOTE_ROLES,
  clientes: CLIENT_ROLES,
  surveys: SURVEY_ROLES,
  tareas: TASK_ROLES,
  schedule: TASK_ROLES,
  reports: REPORT_ROLES,
  activity: ALL_ROLES,
  admin: ADMIN_ONLY,
};

export function canWriteQuotations(role) {
  return role === ROLES.ADMIN || role === ROLES.VENTAS;
}

export function canWriteClients(role) {
  return role === ROLES.ADMIN || role === ROLES.VENTAS;
}

export function canAccessTasks(role) {
  return role === ROLES.ADMIN || role === ROLES.VENTAS || role === ROLES.TEC;
}

export function sucursalOf(user) {
  return user?.sucursalId || user?.sucursal_id || user?.department || '';
}
