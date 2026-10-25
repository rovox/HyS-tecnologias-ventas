import { formatBs, formatDay } from '@/shared/lib/format.js';
import { Money } from '@/shared/views';
import { CollectedBar, ProjectStateBadge } from './ProjectStateBadge.jsx';

const sum = (key) => (rows) => formatBs(rows.reduce((total, p) => total + Number(p[key]), 0));

export const projectColumns = [
  {
    key: 'codigo',
    header: 'Proyecto',
    cell: (p) => (
      <div className="min-w-0">
        <p className="font-medium text-foreground">{p.codigo}</p>
        <p className="truncate text-xs text-muted-foreground" title={p.titulo}>{p.titulo}</p>
      </div>
    ),
  },
  { key: 'cliente', header: 'Cliente', cell: (p) => p.cliente?.nombre },
  { key: 'categoria', header: 'Categoría', cell: (p) => p.categoria?.label },
  { key: 'estado', header: 'Estado', cell: (p) => <ProjectStateBadge project={p} /> },
  {
    key: 'garantia',
    header: 'Garantía',
    cell: (p) => (p.garantiaHasta ? <span className={p.garantiaVigente ? '' : 'text-muted-foreground line-through'}>{formatDay(p.garantiaHasta)}</span> : '—'),
  },
  { key: 'monto', header: 'Monto', align: 'right', cell: (p) => formatBs(p.montoOficial), total: sum('montoOficial') },
  { key: 'cobrado', header: 'Cobrado', align: 'right', cell: (p) => <div className="flex flex-col items-end gap-1">{formatBs(p.cobrado)}<CollectedBar pct={p.pctCobrado} /></div>, total: sum('cobrado') },
  { key: 'saldo', header: 'Saldo', align: 'right', cell: (p) => <Money value={p.saldo} kind="owed" />, total: sum('saldo') },
];

export function ProjectCard({ project: p }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{p.codigo}</p>
        <ProjectStateBadge project={p} />
      </div>
      <p className="line-clamp-2 text-muted-foreground">{p.titulo}</p>
      <p className="text-xs">{p.cliente?.nombre}</p>
      <div className="flex items-center justify-between pt-1">
        <CollectedBar pct={p.pctCobrado} />
        <span className="text-xs">
          Saldo <Money value={p.saldo} kind="owed" />
        </span>
      </div>
    </div>
  );
}

export const projectCsv = [
  { header: 'Código', value: (p) => p.codigo },
  { header: 'Título', value: (p) => p.titulo },
  { header: 'Cliente', value: (p) => p.cliente?.nombre },
  { header: 'Categoría', value: (p) => p.categoria?.label },
  { header: 'Estado', value: (p) => p.estado },
  { header: 'Monto Bs', value: (p) => Number(p.montoOficial).toFixed(2) },
  { header: 'Cobrado Bs', value: (p) => Number(p.cobrado).toFixed(2) },
  { header: 'Saldo Bs', value: (p) => Number(p.saldo).toFixed(2) },
  { header: 'Garantía hasta', value: (p) => (p.garantiaHasta ? String(p.garantiaHasta).slice(0, 10) : '') },
];
