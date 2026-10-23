import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/features/projects';
import { ListView } from '@/shared/views';
import { formatBs } from '@/shared/lib/format.js';

const sum = (key) => (rows) => formatBs(rows.reduce((s, p) => s + Number(p[key]), 0));

const columns = [
  { key: 'codigo', header: 'Proyecto', cell: (p) => <div><p className="font-medium">{p.codigo}</p><p className="text-xs text-muted-foreground">{p.titulo}</p></div> },
  { key: 'cliente', header: 'Cliente', cell: (p) => p.cliente?.nombre },
  { key: 'monto', header: 'Monto', align: 'right', cell: (p) => formatBs(p.montoOficial), total: sum('montoOficial') },
  { key: 'cobrado', header: 'Cobrado', align: 'right', cell: (p) => formatBs(p.cobrado), total: sum('cobrado') },
  { key: 'porValidar', header: 'Por validar', align: 'right', cell: (p) => formatBs(p.porValidar), total: sum('porValidar') },
  { key: 'saldo', header: 'Saldo', align: 'right', cell: (p) => <span className="font-medium text-destructive">{formatBs(p.saldo)}</span>, total: sum('saldo') },
];

/** Cuentas por cobrar: projects that still owe money, the largest debt first. */
export function ReceivablesView() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();
  const owing = projects.filter((p) => p.saldo > 0).sort((a, b) => b.saldo - a.saldo);
  return <ListView columns={columns} rows={owing} loading={isLoading} onRowClick={(p) => navigate(`/projects/${p.id}`)} empty="Ningún proyecto tiene saldo pendiente" />;
}
