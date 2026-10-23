import { formatBs, formatDay } from '@/shared/lib/format.js';
import { cn } from '@/lib/utils';
import { CONCEPTO_LABEL, ESTADO, TIPO_LABEL, sign } from '../constants.js';

function MovementStateBadge({ movement }) {
  const state = ESTADO[movement.estado];
  return (
    <span className={cn('inline-flex rounded px-2 py-0.5 text-xs font-medium', state.className)} title={movement.motivo || undefined}>
      {state.label}
    </span>
  );
}

function Amount({ movement }) {
  const s = sign(movement);
  return (
    <span className={cn('font-medium', s > 0 && 'text-secondary', s < 0 && 'text-destructive')}>
      {s > 0 ? '+' : s < 0 ? '−' : '↔ '}
      {formatBs(movement.monto)}
    </span>
  );
}

const detail = (m) =>
  [m.project && `${m.project.codigo} · ${m.project.titulo}`, !m.project && m.schedule?.descripcionTrabajo, m.cliente?.nombre, m.nota]
    .filter(Boolean)
    .join(' · ');

const boxes = (m) => (m.tipo === 'transferencia' ? `${m.caja?.nombre || '—'} → ${m.cajaDestino?.nombre || '—'}` : m.caja?.nombre || '—');

/** Net effect on cash (incomes minus expenses; transfers net to zero). */
const net = (rows) => formatBs(rows.filter((m) => m.estado !== 'anulado').reduce((sum, m) => sum + sign(m) * Number(m.monto), 0));

export function movementColumns(renderActions) {
  return [
    { key: 'fecha', header: 'Fecha', cell: (m) => formatDay(m.fecha) },
    {
      key: 'concepto',
      header: 'Concepto',
      cell: (m) => (
        <div>
          <p className="font-medium">{CONCEPTO_LABEL[m.concepto] || m.concepto}</p>
          <p className="text-xs text-muted-foreground">
            {TIPO_LABEL[m.tipo]}
            {m.pagadoPor === 'empleado' ? ` · pagó ${m.registradoPor?.name}${m.reembolsoPendiente ? ' (reembolso pendiente)' : ''}` : ''}
          </p>
        </div>
      ),
    },
    { key: 'detalle', header: 'Detalle', cell: (m) => <span className="line-clamp-2 text-sm" title={detail(m)}>{detail(m) || '—'}</span> },
    { key: 'registro', header: 'Registró', cell: (m) => m.registradoPor?.name },
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
      <p className="line-clamp-2 text-xs text-muted-foreground">{detail(m) || TIPO_LABEL[m.tipo]}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs">{formatDay(m.fecha)} · {m.registradoPor?.name}</span>
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
