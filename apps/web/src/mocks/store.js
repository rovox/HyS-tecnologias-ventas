/**
 * In-memory mock database for the frontend POC.
 * Services and the PocketBase-compatible adapter share this store.
 * Mutations persist for the browser session only.
 */

import { mockUsers, mockSucursales, mockTecnicos, mockConfiguration, mockSalespersonGoals, mockBranchGoals } from './users.js';
import { mockClientes } from './clients.js';
import { mockQuotations, mockQuotationCategories } from './quotations.js';
import { mockSchedules, mockVisitas, mockSchedulePayments, mockScheduleObservations } from './schedules.js';
import { mockPedidosInternos, mockDetallesPedidos, mockComentariosPedidos, mockMerchandiseOrders } from './orders.js';
import {
  mockVehiculos,
  mockRegistrosCombustible,
  mockRegistrosMantenimiento,
  mockRegistrosAceite,
  mockRegistrosObservaciones,
  mockRegistrosProblemas,
  mockComentariosVehiculos,
  mockHistorialVehiculos,
} from './vehicles.js';
import {
  mockCajasBancos,
  mockProveedores,
  mockComprasProveedores,
  mockMovimientos,
  mockGastosOperativos,
  mockCostosTrabajo,
  mockFacturasControl,
  mockAnulaciones,
  mockPlantillasCostos,
  mockMaterialesTrabajo,
  mockGastosDirectos,
  mockSobrantes,
  mockEquiposInstalados,
} from './finance.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function newId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'm';
  for (let i = 0; i < 14; i += 1) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function parseValue(raw) {
  const value = raw.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === "''" || value === '""') return '';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value !== '' && !Number.isNaN(Number(value))) return Number(value);
  return value;
}

function getField(record, field) {
  if (field.includes('.')) {
    return field.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), record);
  }
  return record[field];
}

function compare(left, op, right) {
  if (op === '~') {
    return String(left ?? '').toLowerCase().includes(String(right ?? '').toLowerCase());
  }
  const leftStr = left == null ? '' : String(left);
  const rightStr = right == null ? '' : String(right);
  switch (op) {
    case '=':
      return left === right || leftStr === rightStr;
    case '!=':
      return left !== right && leftStr !== rightStr;
    case '>=':
      return leftStr >= rightStr;
    case '<=':
      return leftStr <= rightStr;
    case '>':
      return leftStr > rightStr;
    case '<':
      return leftStr < rightStr;
    default:
      return false;
  }
}

function splitTopLevel(expr, separator) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < expr.length; i += 1) {
    const ch = expr[i];
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (depth === 0 && expr.slice(i, i + separator.length) === separator) {
      parts.push(current.trim());
      current = '';
      i += separator.length - 1;
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function evalAtom(record, expr) {
  let inner = expr.trim();
  if (inner.startsWith('(') && inner.endsWith(')')) {
    return matchFilter(record, inner.slice(1, -1));
  }
  const match = inner.match(/^([\w.]+)\s*(!=|>=|<=|~|=|>|<)\s*(.+)$/);
  if (!match) return true;
  const [, field, op, rawValue] = match;
  return compare(getField(record, field), op, parseValue(rawValue));
}

export function matchFilter(record, filter) {
  if (!filter || !String(filter).trim()) return true;
  const orParts = splitTopLevel(filter, '||');
  if (orParts.length > 1) {
    return orParts.some((part) => matchFilter(record, part));
  }
  const andParts = splitTopLevel(filter, '&&');
  if (andParts.length > 1) {
    return andParts.every((part) => matchFilter(record, part));
  }
  return evalAtom(record, filter);
}

function sortRecords(records, sort) {
  if (!sort) return records;
  const keys = String(sort).split(',').map((part) => part.trim()).filter(Boolean);
  return [...records].sort((a, b) => {
    for (const key of keys) {
      const desc = key.startsWith('-');
      const field = desc ? key.slice(1) : key;
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
    }
    return 0;
  });
}

function seedCollections() {
  return {
    users: clone(mockUsers),
    sucursales: clone(mockSucursales),
    tecnicos: clone(mockTecnicos),
    configuration: clone(mockConfiguration),
    salesperson_goals: clone(mockSalespersonGoals),
    branch_goals: clone(mockBranchGoals),
    clientes: clone(mockClientes),
    quotations: clone(mockQuotations),
    quotation_categories: clone(mockQuotationCategories),
    schedules: clone(mockSchedules),
    visitas_tecnicas: clone(mockVisitas),
    schedule_payments: clone(mockSchedulePayments),
    schedule_observations: clone(mockScheduleObservations),
    pedidos_internos: clone(mockPedidosInternos),
    detalles_pedidos_internos: clone(mockDetallesPedidos),
    comentarios_pedidos_internos: clone(mockComentariosPedidos),
    merchandise_orders: clone(mockMerchandiseOrders),
    vehiculos: clone(mockVehiculos),
    vehicles: [],
    registros_combustible: clone(mockRegistrosCombustible),
    registros_mantenimiento: clone(mockRegistrosMantenimiento),
    registros_aceite: clone(mockRegistrosAceite),
    registros_observaciones: clone(mockRegistrosObservaciones),
    registros_problemas: clone(mockRegistrosProblemas),
    comentarios_vehiculos: clone(mockComentariosVehiculos),
    historial_actividad_vehiculos: clone(mockHistorialVehiculos),
    cajas_bancos: clone(mockCajasBancos),
    proveedores: clone(mockProveedores),
    compras_proveedores: clone(mockComprasProveedores),
    movimientos: clone(mockMovimientos),
    gastos_operativos: clone(mockGastosOperativos),
    costos_trabajo: clone(mockCostosTrabajo),
    facturas_control: clone(mockFacturasControl),
    anulaciones_financieras: clone(mockAnulaciones),
    plantillas_costos: clone(mockPlantillasCostos),
    materiales_trabajo: clone(mockMaterialesTrabajo),
    gastos_directos: clone(mockGastosDirectos),
    sobrantes_devoluciones: clone(mockSobrantes),
    equipos_instalados: clone(mockEquiposInstalados),
    campaigns_new: [
      {
        id: 'camp_1',
        nombre: 'Campaña cámaras Q3',
        status: 'active',
        canal: 'WhatsApp',
        sucursal_nombre: 'Central La Paz',
        presupuesto_asignado: 2500,
        gasto_real: 800,
        interesados: 18,
        clientes_generados: 3,
        trabajos_cerrados: 1,
        imagen_principal: '',
        created: '2026-07-15 00:00:00',
        updated: '2026-08-01 00:00:00',
      },
    ],
    campaigns: [],
    campaign_materials: [],
    campaign_metrics: [],
    actividad_interna: [
      {
        id: 'act_1',
        titulo: 'Inicio instalación Andina',
        contenido: 'Equipo en sitio. Material PI-2026-008 en preparación.',
        tipo: 'operacion',
        trabajo_id: 'sch_andina',
        trabajo_nombre: 'CCTV Comercial Andina',
        cliente_id: 'cli_andina',
        cliente_nombre: 'Comercial Andina SRL',
        pedido_id: 'ped_andina',
        sucursal_nombre: 'Central La Paz',
        created_by: 'usr_tec',
        created_by_nombre: 'Marco Quispe',
        usuario_id: 'usr_tec',
        estado: 'activo',
        es_importante: true,
        es_resuelto: false,
        fijado: true,
        reacciones: {},
        created: '2026-08-13 09:10:00',
        updated: '2026-08-13 09:10:00',
      },
    ],
    comentarios_actividad: [],
    historial_actividad: [],
    reports: [],
    income: [],
    expenses: [],
    monthly_results: [],
    goals: [],
    contabilidad: [],
    alertas_metas: [],
    exportaciones_reportes: [],
  };
}

let collections = seedCollections();

export function resetStore() {
  collections = seedCollections();
}

export function ensureCollection(name) {
  if (!collections[name]) collections[name] = [];
  return collections[name];
}

export function list(name, { filter, sort } = {}) {
  const rows = ensureCollection(name).filter((row) => matchFilter(row, filter));
  return sortRecords(rows, sort).map((row) => clone(row));
}

export function findById(name, id) {
  const row = ensureCollection(name).find((item) => item.id === id);
  return row ? clone(row) : null;
}

export function insert(name, data) {
  const record = {
    ...data,
    id: data.id || newId(),
    created: data.created || nowStamp(),
    updated: data.updated || nowStamp(),
  };
  ensureCollection(name).unshift(record);
  return clone(record);
}

export function update(name, id, data) {
  const rows = ensureCollection(name);
  const index = rows.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const next = { ...rows[index], ...data, id, updated: nowStamp() };
  rows[index] = next;
  return clone(next);
}

export function remove(name, id) {
  const rows = ensureCollection(name);
  const index = rows.findIndex((item) => item.id === id);
  if (index < 0) return false;
  rows.splice(index, 1);
  return true;
}

export { nowStamp, newId, clone };
