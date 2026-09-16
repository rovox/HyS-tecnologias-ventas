import {
  LayoutDashboard,
  FileStack,
  Building2,
  ClipboardCheck,
  FileText,
  ClipboardList,
  Settings,
  CalendarDays,
  Package,
  Receipt,
  CarFront,
  Megaphone,
  Calculator,
  Wallet,
} from 'lucide-react';
import { ROLES } from '@/mocks/users.js';

export { ROLES };

export const ALL_ROLES = [ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC];

const QUOTE_ROLES = [ROLES.ADMIN, ROLES.VENTAS];
const CLIENT_ROLES = [ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC];
const SURVEY_ROLES = [ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC];
const TASK_ROLES = [ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC];
const REPORT_ROLES = [ROLES.ADMIN];
const ADMIN_ONLY = [ROLES.ADMIN];
const PEDIDOS_ROLES = [ROLES.ADMIN, ROLES.VENTAS];

/**
 * Menú unificado: OPERACIONES primero para todos los roles.
 * Admin añade extras al final.
 */
export const operationalMenuSections = [
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
      { to: '/schedule', icon: CalendarDays, label: 'Cronograma', allowedRoles: TASK_ROLES },
      { to: '/pedidos-internos', icon: Package, label: 'Pedidos Internos', allowedRoles: PEDIDOS_ROLES },
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

/** Extras solo ADMINISTRADOR (después de OPERACIONES / ADMINISTRACIÓN base). */
export const adminExtraMenuSections = [
  {
    title: 'GESTIÓN ADMIN',
    items: [
      { to: '/gastos-operativos', icon: Receipt, label: 'Gastos Operativos', allowedRoles: ADMIN_ONLY },
      { to: '/vehicle-control', icon: CarFront, label: 'Control Vehicular', allowedRoles: ADMIN_ONLY },
      { to: '/marketing', icon: Megaphone, label: 'Marketing', allowedRoles: ADMIN_ONLY },
      { to: '/accounting', icon: Calculator, label: 'Costos Operativos', allowedRoles: ADMIN_ONLY },
      { to: '/finanzas', icon: Wallet, label: 'Finanzas y Contabilidad', allowedRoles: ADMIN_ONLY },
    ],
  },
];

/** @deprecated Prefer getMenuSections — kept for imports that still reference admin menu. */
export const adminMenuSections = [
  ...operationalMenuSections,
  ...adminExtraMenuSections,
];

export const menuSections = operationalMenuSections;

export function getMenuSections(role) {
  if (role === ROLES.NONE) return [];
  if (role === ROLES.ADMIN) {
    return [...operationalMenuSections, ...adminExtraMenuSections];
  }
  return operationalMenuSections;
}

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
  pedidos: PEDIDOS_ROLES,
  frozen: ADMIN_ONLY,
  users: ALL_ROLES,
};

export function canWriteQuotations(role) {
  return role === ROLES.ADMIN || role === ROLES.VENTAS;
}

/** Quien puede ver /quotations también puede editar en esta vista. */
export function canEditQuotationsView(role) {
  return routeRoles.quotations.includes(role);
}

export function canWriteClients(role) {
  return role === ROLES.ADMIN || role === ROLES.VENTAS;
}

export function sucursalOf(user) {
  return user?.sucursalId || user?.sucursal_id || user?.department || '';
}
