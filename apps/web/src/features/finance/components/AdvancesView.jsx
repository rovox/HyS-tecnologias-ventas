import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { ListView, RowQuickActions, useConfirm } from '@/shared/views';
import { formatBs, formatDay } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { cn } from '@/lib/utils';
import { CheckCheck } from 'lucide-react';
import { useAdvances, useSettleAdvance } from '../api.js';

/**
 * Anticipos por rendir (FIN-04): money handed to someone for expenses still to be accounted for — who, what for, how
 * much, until when and how many days late (red). Gerencia marks it "rendido" once the receipts are in.
 */
export function AdvancesView({ onOpen }) {
  const { isAdmin } = useAuth();
  const { data: advances = [], isLoading, isError, error } = useAdvances();
  const settle = useSettleAdvance();
  const confirm = useConfirm();

  async function markSettled(a) {
    const { ok, reason } = await confirm({
      title: `¿Marcar rendido el anticipo de ${a.recibidoPor?.name}?`,
      details: [['Asunto', a.asunto], ['Monto', formatBs(a.monto)], ['Fecha límite', formatDay(a.fechaLimite)]],
      effect: 'Los comprobantes se registran como gastos; lo que sobró, como "Devolución de anticipo"',
      reason: 'Cómo se rindió',
      reasonOptions: ['Rindió todo con facturas', 'Rindió y devolvió el sobrante'],
      confirmLabel: 'Rendido',
      tone: 'success',
    });
    if (!ok) return;
    settle.mutateAsync({ id: a.id, nota: reason }).then(() => notify.success('Anticipo rendido'), () => null);
  }

  const columns = useMemo(
    () => [
      { key: 'responsable', header: 'Responsable', cell: (a) => <span className="font-medium">{a.recibidoPor?.name}</span> },
      { key: 'asunto', header: 'Asunto', cell: (a) => <div><p>{a.asunto}</p>{a.nota && <p className="text-xs text-muted-foreground">{a.nota}</p>}</div> },
      { key: 'sucursal', header: 'Sucursal', cell: (a) => a.sucursal?.nombre },
      { key: 'entregado', header: 'Entregado', cell: (a) => formatDay(a.fecha) },
      { key: 'limite', header: 'Rendir hasta', cell: (a) => formatDay(a.fechaLimite) },
      { key: 'atraso', header: 'Atraso', align: 'right', cell: (a) => <span className={cn('font-semibold', a.diasAtraso ? 'text-danger-fg' : 'text-success-fg')}>{a.diasAtraso ? `${a.diasAtraso} días` : 'A tiempo'}</span> },
      { key: 'monto', header: 'Monto', align: 'right', cell: (a) => formatBs(a.monto), total: (rows) => formatBs(rows.reduce((s, a) => s + Number(a.monto), 0)), menuLabel: 'Monto' },
      {
        key: 'acciones',
        header: '',
        // A cobro held in a personal QR is handed over by validating it into a box (its detail), not marked by hand.
        cell: (a) =>
          isAdmin() &&
          (a.tipo === 'ingreso' ? (
            <RowQuickActions actions={[{ key: 'open', icon: CheckCheck, label: 'Validar en caja', tone: 'success', onClick: () => onOpen?.(a.id) }]} />
          ) : (
            <RowQuickActions actions={[{ key: 'ok', icon: CheckCheck, label: 'Marcar rendido', tone: 'success', disabled: settle.isPending, onClick: () => markSettled(a) }]} />
          )),
      },
    ],
    [settle.isPending], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Un anticipo se registra con <strong>Registrar gasto</strong> › concepto “Anticipo por rendir” (a quién, asunto y hasta cuándo). Un cobro que entró al QR personal de quien cobró
        también queda aquí hasta que se valida en una caja.
      </p>
      {isError && <p className="text-sm text-danger-fg">No se pudieron cargar los anticipos: {error?.message}</p>}
      <ListView id="anticipos" columns={columns} rows={advances} loading={isLoading} tone={(a) => (a.diasAtraso ? 'danger' : undefined)} onRowClick={(a) => onOpen?.(a.id)} empty="No hay anticipos pendientes de rendir" />
    </div>
  );
}
