import {
  LayoutDashboard,
  FileStack,
  Building2,
  ClipboardCheck,
  FileText,
  ClipboardList,
  Settings,
  CalendarDays,
  CarFront,
  Megaphone,
  Wallet,
  Boxes,
  Inbox,
  Briefcase,
} from 'lucide-react';
import { COMMERCIAL_ROLES, MANAGER_ROLES, ROLES } from '@/constants/roles.js';


const ALL_ROLES = [ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC, ROLES.CONTA];

// Contabilidad (CONTA) has the same permissions as ADMINISTRADOR (ROLE-01).
const QUOTE_ROLES = COMMERCIAL_ROLES;
const CLIENT_ROLES = ALL_ROLES;
const SURVEY_ROLES = ALL_ROLES;
const TASK_ROLES = ALL_ROLES;
const REPORT_ROLES = MANAGER_ROLES;
const ADMIN_ONLY = MANAGER_ROLES;
const PEDIDOS_ROLES = COMMERCIAL_ROLES;
const SOLICITUDES_WEB_ROLES = COMMERCIAL_ROLES;

/**
 * Menú unificado: OPERACIONES primero para todos los roles.
 * Admin añade extras al final.
 */
const operationalMenuSections = [
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
      { to: '/projects', icon: Briefcase, label: 'Proyectos', allowedRoles: QUOTE_ROLES },
      { to: '/clientes', icon: Building2, label: 'Clientes', allowedRoles: CLIENT_ROLES },
      { to: '/solicitudes-web', icon: Inbox, label: 'Solicitudes web', allowedRoles: SOLICITUDES_WEB_ROLES },
      { to: '/surveys', icon: ClipboardCheck, label: 'Relevamientos y asistencias', allowedRoles: SURVEY_ROLES },
      { to: '/schedule', icon: CalendarDays, label: 'Cronograma', allowedRoles: TASK_ROLES },
      { to: '/finanzas', icon: Wallet, label: 'Finanzas', allowedRoles: ALL_ROLES },
      { to: '/inventario', icon: Boxes, label: 'Inventario', allowedRoles: ALL_ROLES },
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

/** Extras solo Gerencia (ADMINISTRADOR, CONTABILIDAD) (después de OPERACIONES / ADMINISTRACIÓN base). */
const adminExtraMenuSections = [
  {
    title: 'GESTIÓN ADMIN',
    items: [
      { to: '/vehicle-control', icon: CarFront, label: 'Control Vehicular', allowedRoles: ADMIN_ONLY },
      { to: '/marketing', icon: Megaphone, label: 'Marketing', allowedRoles: ADMIN_ONLY },
    ],
  },
];

export function getMenuSections(role) {
  if (role === ROLES.NONE) return [];
  if (MANAGER_ROLES.includes(role)) {
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
  solicitudesWeb: SOLICITUDES_WEB_ROLES,
  frozen: ADMIN_ONLY,
  users: ALL_ROLES,
  finanzas: ALL_ROLES,
  inventario: ALL_ROLES,
};

export function canWriteQuotations(role) {
  return COMMERCIAL_ROLES.includes(role);
}

