import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useSucursales } from '@/features/catalogs';
import { formatDateTime } from '@/shared/lib/format.js';
import { cn } from '@/lib/utils';
import { useKardex } from '../api.js';
import { MOVEMENT } from './StockMovementDialog.jsx';

const select = 'h-9 rounded-md border border-input bg-background px-2 text-sm';
/** Where a movement came from or went, in words. */
const detail = (m) => m.ventaDirecta ? `Venta NV-${String(m.ventaDirecta.numero).padStart(4, '0')}` : m.project ? `Proyecto ${m.project.codigo}` : m.pedidoInterno ? `Pedido ${m.pedidoInterno.codigo}` : m.motivo || m.nota || '';

/**
 * Kardex of one product (INV-03): oldest first, what came into and went out of the branch (or the company, where
 * transfers move nothing) and the running balance — so a seller sees the history of his own branch.
 */
export function KardexDialog({ product, sucursalId: initial, onClose }) {
  const { data: sucursales = [] } = useSucursales();
  const [sucursalId, setSucursalId] = useState(initial || '');
  useEffect(() => setSucursalId(initial || ''), [initial, product]);
  const { data, isLoading, isError, error } = useKardex(product?.id, sucursalId);
  const rows = data?.movimientos || [];
  const unit = product?.unidad || '';

  return (
    <Dialog open={Boolean(product)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kardex: {product?.nombre}</DialogTitle>
          <DialogDescription>{product?.codigo} · Entradas, salidas y saldo, del más antiguo al más reciente.</DialogDescription>
        </DialogHeader>
        <select aria-label="Kardex de" className={select} value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
          <option value="">Toda la empresa</option>
          {sucursales.map((s) => <option key={s.id} value={s.id}>Sucursal {s.nombre}</option>)}
        </select>
        {isError && <p className="text-sm text-danger-fg">No se pudo cargar el kardex: {error?.message}</p>}
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sin movimientos en esta sucursal.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-1.5">Fecha</th>
                <th>Movimiento</th>
                <th>Detalle</th>
                <th className="text-right">Entra</th>
                <th className="text-right">Sale</th>
                <th className="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m, i) => (
                <tr key={m.id} className={cn('border-b border-border/60', i % 2 === 1 && 'bg-row-stripe')}>
                  <td className="whitespace-nowrap py-1.5">{formatDateTime(m.fecha)}</td>
                  <td>{MOVEMENT[m.tipo]?.title || m.tipo}</td>
                  <td className="text-xs text-muted-foreground">{detail(m)}{m.registradoPor ? ` · ${m.registradoPor.name}` : ''}</td>
                  <td className="text-right tabular-nums text-success-fg">{m.entra ? `+${m.entra}` : ''}</td>
                  <td className="text-right tabular-nums text-danger-fg">{m.sale ? `−${m.sale}` : ''}</td>
                  <td className="text-right font-semibold tabular-nums">{m.saldo} {unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DialogContent>
    </Dialog>
  );
}
