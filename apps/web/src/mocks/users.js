/** Mock users — fictional POC accounts. Passwords are demo-only, not production secrets. */

export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  VENTAS: 'VENTAS / ADMINISTRACIÓN',
  TEC: 'SEGURIDAD ELECTRÓNICA',
  CONT: 'Contadora',
};

export const DEMO_PASSWORD = 'Demo1234!';

export const mockUsers = [
  {
    id: 'usr_admin',
    email: 'julio.admin@demo.hs.local',
    password: DEMO_PASSWORD,
    name: 'Julio',
    role: ROLES.ADMIN,
    department: 'suc_central',
    phone: '70000001',
    active: true,
    avatar: '',
    created: '2026-01-10 09:00:00',
    updated: '2026-08-01 09:00:00',
  },
  {
    id: 'usr_ventas',
    email: 'dennis.ventas@demo.hs.local',
    password: DEMO_PASSWORD,
    name: 'Dennis',
    role: ROLES.VENTAS,
    department: 'suc_norte',
    phone: '70000002',
    active: true,
    avatar: '',
    created: '2026-01-12 09:00:00',
    updated: '2026-08-01 09:00:00',
  },
  {
    id: 'usr_wilson',
    email: 'wilson.ventas@demo.hs.local',
    password: DEMO_PASSWORD,
    name: 'Wilson',
    role: ROLES.VENTAS,
    department: 'suc_sur',
    phone: '70000005',
    active: true,
    avatar: '',
    created: '2026-01-14 09:00:00',
    updated: '2026-08-01 09:00:00',
  },
  {
    id: 'usr_vanesa',
    email: 'vanesa.ventas@demo.hs.local',
    password: DEMO_PASSWORD,
    name: 'Vanesa',
    role: ROLES.VENTAS,
    department: 'suc_cocha',
    phone: '70000006',
    active: true,
    avatar: '',
    created: '2026-01-16 09:00:00',
    updated: '2026-08-01 09:00:00',
  },
  {
    id: 'usr_tec',
    email: 'elias.ops@demo.hs.local',
    password: DEMO_PASSWORD,
    name: 'Elias',
    role: ROLES.TEC,
    department: 'suc_central',
    phone: '70000003',
    active: true,
    avatar: '',
    created: '2026-01-15 09:00:00',
    updated: '2026-08-01 09:00:00',
  },
  {
    id: 'usr_conta',
    email: 'elena.conta@demo.hs.local',
    password: DEMO_PASSWORD,
    name: 'Elena Rojas',
    role: ROLES.CONT,
    department: 'suc_central',
    phone: '70000004',
    active: true,
    avatar: '',
    created: '2026-02-01 09:00:00',
    updated: '2026-08-01 09:00:00',
  },
];

export const mockSucursales = [
  { id: 'suc_central', nombre: 'Central La Paz', codigo: 'LPZ-C', activa: true, created: '2026-01-01 00:00:00', updated: '2026-01-01 00:00:00' },
  { id: 'suc_norte', nombre: 'Norte El Alto', codigo: 'EAT-N', activa: true, created: '2026-01-01 00:00:00', updated: '2026-01-01 00:00:00' },
  { id: 'suc_sur', nombre: 'Sur Calacoto', codigo: 'LPZ-S', activa: true, created: '2026-01-01 00:00:00', updated: '2026-01-01 00:00:00' },
  { id: 'suc_cocha', nombre: 'Cochabamba', codigo: 'CBB-1', activa: true, created: '2026-03-01 00:00:00', updated: '2026-03-01 00:00:00' },
];

export const mockTecnicos = [
  { id: 'tec_elias', nombre: 'Elias', user_id: 'usr_tec', sucursal_id: 'suc_central', created: '2026-01-15 00:00:00', updated: '2026-01-15 00:00:00' },
  { id: 'tec_diego', nombre: 'Diego Mamani', user_id: '', sucursal_id: 'suc_norte', created: '2026-02-01 00:00:00', updated: '2026-02-01 00:00:00' },
  { id: 'tec_sofia', nombre: 'Sofía Choque', user_id: '', sucursal_id: 'suc_sur', created: '2026-02-10 00:00:00', updated: '2026-02-10 00:00:00' },
];

export const mockConfiguration = [
  {
    id: 'cfg_global',
    general_goal: 450000,
    monthly_goal: 38000,
    weekly_goal: 9500,
    created_by: 'usr_admin',
    updated_by: 'usr_admin',
    created: '2026-01-01 00:00:00',
    updated: '2026-08-01 00:00:00',
  },
];

export const mockSalespersonGoals = [
  { id: 'sg_dennis', salesperson_name: 'Dennis', user_id: 'usr_ventas', monthly_goal: 18000, annual_goal: 216000, created_by: 'usr_admin', created: '2026-01-01 00:00:00', updated: '2026-08-01 00:00:00' },
  { id: 'sg_wilson', salesperson_name: 'Wilson', user_id: 'usr_wilson', monthly_goal: 14000, annual_goal: 168000, created_by: 'usr_admin', created: '2026-01-01 00:00:00', updated: '2026-08-01 00:00:00' },
  { id: 'sg_vanesa', salesperson_name: 'Vanesa', user_id: 'usr_vanesa', monthly_goal: 14000, annual_goal: 168000, created_by: 'usr_admin', created: '2026-01-01 00:00:00', updated: '2026-08-01 00:00:00' },
  { id: 'sg_julio', salesperson_name: 'Julio', user_id: 'usr_admin', monthly_goal: 12000, annual_goal: 144000, created_by: 'usr_admin', created: '2026-01-01 00:00:00', updated: '2026-08-01 00:00:00' },
];

export const mockBranchGoals = [
  { id: 'bg_central', branch_name: 'Central La Paz', sucursal_id: 'suc_central', monthly_goal: 20000, annual_goal: 240000, created_by: 'usr_admin', created: '2026-01-01 00:00:00', updated: '2026-08-01 00:00:00' },
  { id: 'bg_norte', branch_name: 'Norte El Alto', sucursal_id: 'suc_norte', monthly_goal: 10000, annual_goal: 120000, created_by: 'usr_admin', created: '2026-01-01 00:00:00', updated: '2026-08-01 00:00:00' },
];
