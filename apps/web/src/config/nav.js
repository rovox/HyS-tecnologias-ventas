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
  Activity,
  CarFront,
  Megaphone,
  Calculator,
  Wallet,
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
const PEDIDOS_ROLES = [ROLES.ADMIN, ROLES.VENTAS];

/** Menú operativo para Ventas / Técnico / Contadora. Tareas = botón flotante. */
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

/** Menú legado completo, solo ADMINISTRADOR. */
export const adminMenuSections = [
  {
    title: 'PRINCIPAL',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', allowedRoles: ADMIN_ONLY },
    ],
  },
  {
    title: 'OPERACIONES',
    items: [
      {
        icon: CalendarDays,
        label: 'Cronogramas',
        allowedRoles: ADMIN_ONLY,
        children: [
          { to: '/schedule', label: 'Instalaciones / Proyectos', allowedRoles: ADMIN_ONLY },
          { to: '/surveys', label: 'Relevamientos / Asistencias', allowedRoles: ADMIN_ONLY },
        ],
      },
      { to: '/clientes', icon: Building2, label: 'Clientes', allowedRoles: ADMIN_ONLY },
      { to: '/pedidos-internos', icon: Package, label: 'Pedidos Internos', allowedRoles: PEDIDOS_ROLES },
      { to: '/gastos-operativos', icon: Receipt, label: 'Gastos Operativos', allowedRoles: ADMIN_ONLY },
      {
        icon: Activity,
        label: 'Muro de Actividad',
        allowedRoles: ADMIN_ONLY,
        action: 'open-activity',
      },
    ],
  },
  {
    title: 'GESTIÓN',
    items: [
      { to: '/vehicle-control', icon: CarFront, label: 'Control Vehicular', allowedRoles: ADMIN_ONLY },
      { to: '/marketing', icon: Megaphone, label: 'Marketing', allowedRoles: ADMIN_ONLY },
      { to: '/quotations', icon: FileStack, label: 'Cotizaciones', allowedRoles: ADMIN_ONLY },
    ],
  },
  {
    title: 'ADMINISTRACIÓN',
    items: [
      { to: '/accounting', icon: Calculator, label: 'Costos Operativos', allowedRoles: ADMIN_ONLY },
      { to: '/finanzas', icon: Wallet, label: 'Finanzas y Contabilidad', allowedRoles: ADMIN_ONLY },
      { to: '/reports', icon: FileText, label: 'Reportes', allowedRoles: ADMIN_ONLY },
      { to: '/admin/management', icon: ClipboardList, label: 'Panel de Control', allowedRoles: ADMIN_ONLY },
      { to: '/configuration', icon: Settings, label: 'Configuración', allowedRoles: ADMIN_ONLY },
    ],
  },
];

export const menuSections = operationalMenuSections;

export function getMenuSections(role) {
  if (role === ROLES.NONE) return [];
  return role === ROLES.ADMIN ? adminMenuSections : operationalMenuSections;
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
};

export function canWriteQuotations(role) {
  return role === ROLES.ADMIN || role === ROLES.VENTAS;
}

/** Quien puede ver /quotations también puede editar en esta vista (incluye Contadora). */
export function canEditQuotationsView(role) {
  return routeRoles.quotations.includes(role);
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
