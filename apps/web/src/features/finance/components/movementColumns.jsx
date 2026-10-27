import { formatBs, formatDay } from '@/shared/lib/format.js';
import { cn } from '@/lib/utils';
import { StatusBadge, ToneTag } from '@/shared/views';
import { CONCEPTO_LABEL, TIPO_LABEL, sign } from '../constants.js';

function MovementStateBadge({ movement }) {
  return (
    <span title={movement.motivo || undefined}>
      <StatusBadge entity="movement" state={movement.estado} />
    </span>
  );
}

function Amount({ movement }) {
  const s = sign(movement);
  return (
    <span className={cn('whitespace-nowrap font-semibold tabular-nums', s > 0 && 'text-success-fg', s < 0 && 'text-danger-fg')}>
      {s > 0 ? '+' : s < 0 ? '−' : '↔ '}
      {formatBs(movement.monto)}
    </span>
  );
}

const origin = (m) => (m.project ? `${m.project.codigo} — ${m.project.titulo}` : m.schedule?.descripcionTrabajo || (m.relevamiento ? `Visita del ${formatDay(m.relevamiento.fecha)}` : null));

function Detail({ movement: m }) {
  const main = origin(m);
  if (!main && !m.cliente && !m.nota) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="min-w-0 text-sm">
      {main && <p className="line-clamp-1 font-medium">{main}</p>}
      {m.cliente && <p className="line-clamp-1 text-xs text-muted-foreground">Cliente: {m.cliente.nombre}</p>}
      {m.nota && <p className="line-clamp-1 text-xs italic text-muted-foreground" title={m.nota}>{m.nota}</p>}
    </div>
  );
}

/** Who registered it and, for an income still waiting, who holds the money (warning colour: it must be handed in). */
function People({ movement: m }) {
  const holding = m.tipo === 'ingreso' && m.estado === 'por_validar' && m.recibidoPor;
  return (
    <div className="text-sm">
      <p>{m.registradoPor?.name}</p>
      {holding && m.recibidoPor.id !== m.registradoPor?.id && <p className="text-xs font-semibold text-warning-fg">Tiene el dinero: {m.recibidoPor.name}</p>}
      {holding && m.recibidoPor.id === m.registradoPor?.id && <p className="text-xs font-semibold text-warning-fg">Tiene el dinero</p>}
    </div>
  );
}

const boxes = (m) => (m.tipo === 'transferencia' ? `${m.caja?.nombre || '—'} → ${m.cajaDestino?.nombre || '—'}` : m.caja?.nombre || '—');

/** Net effect on cash (incomes minus expenses; transfers net to zero). */
const net = (rows) => formatBs(rows.filter((m) => m.estado !== 'anulado').reduce((sum, m) => sum + sign(m) * Number(m.monto), 0));

/**
 * The figures read before the rows (LIST-01): incomes, expenses and their net (annulled ones do not count; transfers
 * only move money between boxes), plus what still waits for validation.
 */
export function movementSummary(rows) {
  const live = rows.filter((m) => m.estado !== 'anulado');
  const sum = (list) => list.reduce((total, m) => total + Number(m.monto), 0);
  const ingresos = sum(live.filter((m) => m.tipo === 'ingreso'));
  const egresos = sum(live.filter((m) => m.tipo === 'egreso'));
  const pending = live.filter((m) => m.estado === 'por_validar' && m.tipo !== 'transferencia');
  return [
    { label: 'Ingresos', value: `+${formatBs(ingresos)}`, tone: 'success' },
    { label: 'Egresos', value: `−${formatBs(egresos)}`, tone: 'danger' },
    { label: 'Neto', value: formatBs(ingresos - egresos), tone: ingresos - egresos < 0 ? 'danger' : undefined },
    { label: `Por validar (${pending.length})`, value: formatBs(pending.reduce((t, m) => t + sign(m) * Number(m.monto), 0)), tone: pending.length ? 'warning' : undefined },
  ];
}

export function movementColumns(renderActions) {
  return [
    { key: 'fecha', header: 'Fecha', cell: (m) => formatDay(m.fecha) },
    {
      key: 'concepto',
      header: 'Concepto',
      cell: (m) => (
        <div>
          <p className="font-medium">{CONCEPTO_LABEL[m.concepto] || m.concepto}</p>
          <p className="text-xs text-muted-foreground">{TIPO_LABEL[m.tipo]}{m.pagadoPor === 'empleado' ? `, lo pagó ${m.registradoPor?.name}` : ''}</p>
          {m.reembolsoPendiente && <ToneTag tone="warning" className="mt-0.5">Reembolso pendiente</ToneTag>}
        </div>
      ),
    },
    { key: 'detalle', header: 'Proyecto, cliente, nota', cell: (m) => <Detail movement={m} /> },
    { key: 'registro', header: 'Registró', cell: (m) => <People movement={m} /> },
    { key: 'caja', header: 'Caja', cell: boxes },
    { key: 'estado', header: 'Estado', cell: (m) => <MovementStateBadge movement={m} /> },
    { key: 'monto', header: 'Monto', align: 'right', cell: (m) => <Amount movement={m} />, total: net },
    { key: 'acciones', header: '', cell: renderActions },
  ];
}

export function MovementCard({ movement: m, actions }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{CONCEPTO_LABEL[m.concepto] || m.concepto}</p>
        <Amount movement={m} />
      </div>
      <Detail movement={m} />
      <div className="flex items-center justify-between">
        <span className="text-xs">{formatDay(m.fecha)}, {m.registradoPor?.name}</span>
        <div className="flex items-center gap-1">
          <MovementStateBadge movement={m} />
          {actions}
        </div>
      </div>
    </div>
  );
}

export const movementCsv = [
  { header: 'Fecha', value: (m) => String(m.fecha).slice(0, 10) },
  { header: 'Tipo', value: (m) => m.tipo },
  { header: 'Concepto', value: (m) => CONCEPTO_LABEL[m.concepto] || m.concepto },
  { header: 'Proyecto', value: (m) => m.project?.codigo },
  { header: 'Cliente', value: (m) => m.cliente?.nombre },
  { header: 'Caja', value: boxes },
  { header: 'Estado', value: (m) => m.estado },
  { header: 'Registró', value: (m) => m.registradoPor?.name },
  { header: 'Monto Bs', value: (m) => (sign(m) * Number(m.monto)).toFixed(2) },
  { header: 'Nota', value: (m) => m.nota },
];
