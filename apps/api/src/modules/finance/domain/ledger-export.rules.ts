// The ledger as a spreadsheet (FIN-06): one row per movement in plain words, and the day's figures. Pure TS.

import { businessDay } from '../../../common/domain/calendar';

const TIPO: Record<string, string> = { ingreso: 'Ingreso', egreso: 'Egreso', transferencia: 'Transferencia' };
const ESTADO: Record<string, string> = { por_validar: 'Por validar', validado: 'Validado', observado: 'Observado', anulado: 'Anulado' };
const CONCEPTO: Record<string, string> = {
  adelanto: 'Adelanto',
  cobro: 'Cobro',
  adicional: 'Adicional',
  asistencia: 'Asistencia',
  venta_directa: 'Venta directa',
  material: 'Material',
  combustible: 'Combustible',
  mantenimiento_vehicular: 'Mantenimiento vehicular',
  viaticos: 'Viáticos',
  servicios: 'Servicios',
  sueldos: 'Sueldos',
  alquiler: 'Alquiler',
  impuestos: 'Impuestos',
  marketing: 'Marketing',
  diferencia_arqueo: 'Diferencia de arqueo',
  anticipo_por_rendir: 'Anticipo por rendir',
  devolucion_anticipo: 'Devolución de anticipo',
  otro: 'Otro',
  deposito: 'Depósito',
  retiro: 'Retiro',
};

type Named = { nombre?: string | null; name?: string | null; codigo?: string | null } | null | undefined;
export type ExportMovement = {
  fecha: Date | string;
  tipo: string;
  concepto: string;
  monto: number | string | { toString(): string };
  estado: string;
  nota?: string | null;
  caja?: Named;
  cajaDestino?: Named;
  sucursal?: Named;
  project?: Named;
  cliente?: Named;
  registradoPor?: Named;
  recibidoPor?: Named;
};

export type LedgerRow = {
  fecha: string;
  hora: string;
  tipo: string;
  concepto: string;
  monto: number;
  estado: string;
  caja: string;
  sucursal: string;
  proyecto: string;
  cliente: string;
  registro: string;
  tieneDinero: string;
  nota: string;
};

/** Spreadsheet columns, in order: key of LedgerRow → header. */
export const LEDGER_COLUMNS: [keyof LedgerRow, string][] = [
  ['fecha', 'Fecha'],
  ['hora', 'Hora'],
  ['tipo', 'Tipo'],
  ['concepto', 'Concepto'],
  ['monto', 'Monto Bs'],
  ['estado', 'Estado'],
  ['caja', 'Caja'],
  ['sucursal', 'Sucursal'],
  ['proyecto', 'Proyecto'],
  ['cliente', 'Cliente'],
  ['registro', 'Registró'],
  ['tieneDinero', 'Tiene el dinero'],
  ['nota', 'Nota'],
];

const sign = (tipo: string) => (tipo === 'ingreso' ? 1 : tipo === 'egreso' ? -1 : 0);
const cents = (value: number) => Math.round(value * 100) / 100;
/** HH:MM in Bolivia (UTC−4). */
const businessTime = (value: Date | string) => new Date(new Date(value).getTime() - 4 * 60 * 60 * 1000).toISOString().slice(11, 16);

/** Signed amount: + income, − expense; a transfer moves money between boxes and is shown with its amount unsigned. */
export function ledgerRows(movements: ExportMovement[]): LedgerRow[] {
  return movements.map((m) => {
    const amount = Number(m.monto);
    return {
      fecha: businessDay(m.fecha),
      hora: businessTime(m.fecha),
      tipo: TIPO[m.tipo] ?? m.tipo,
      concepto: CONCEPTO[m.concepto] ?? m.concepto,
      monto: cents(m.tipo === 'transferencia' ? amount : sign(m.tipo) * amount),
      estado: ESTADO[m.estado] ?? m.estado,
      caja: m.tipo === 'transferencia' ? `${m.caja?.nombre ?? '—'} → ${m.cajaDestino?.nombre ?? '—'}` : m.caja?.nombre ?? '',
      sucursal: m.sucursal?.nombre ?? '',
      proyecto: m.project?.codigo ?? '',
      cliente: m.cliente?.nombre ?? '',
      registro: m.registradoPor?.name ?? '',
      tieneDinero: m.tipo === 'ingreso' && m.estado === 'por_validar' ? m.recibidoPor?.name ?? '' : '',
      nota: m.nota ?? '',
    };
  });
}

export type LedgerSummary = {
  ingresos: number;
  egresos: number;
  neto: number;
  porValidar: { cantidad: number; monto: number };
  anulados: number;
  porConcepto: { concepto: string; monto: number }[];
};

/** The figures of the sheet "Resumen": annulled movements do not count; transfers only move money between boxes. */
export function ledgerSummary(movements: ExportMovement[]): LedgerSummary {
  const live = movements.filter((m) => m.estado !== 'anulado' && m.tipo !== 'transferencia');
  const total = (list: ExportMovement[]) => cents(list.reduce((sum, m) => sum + sign(m.tipo) * Number(m.monto), 0));
  const ingresos = total(live.filter((m) => m.tipo === 'ingreso'));
  const egresos = -total(live.filter((m) => m.tipo === 'egreso'));
  const pending = live.filter((m) => m.estado === 'por_validar');
  const byConcept = new Map<string, number>();
  for (const m of live) {
    const label = CONCEPTO[m.concepto] ?? m.concepto;
    byConcept.set(label, cents((byConcept.get(label) ?? 0) + sign(m.tipo) * Number(m.monto)));
  }
  return {
    ingresos,
    egresos,
    neto: cents(ingresos - egresos),
    porValidar: { cantidad: pending.length, monto: total(pending) },
    anulados: movements.filter((m) => m.estado === 'anulado').length,
    porConcepto: [...byConcept.entries()].map(([concepto, monto]) => ({ concepto, monto })).sort((a, b) => a.concepto.localeCompare(b.concepto, 'es')),
  };
}
