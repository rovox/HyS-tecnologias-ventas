import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatBs, formatDateTime } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { TONE } from '@/shared/lib/status.js';
import { cn } from '@/lib/utils';
import { useReviewClose } from '../api.js';

const label = (d) => (Number(d) < 1 ? `${Math.round(Number(d) * 100)} ctvs` : `Bs ${d}`);
const REASONS = ['Falta el comprobante', 'El conteo no coincide', 'Motivo poco claro'];

/** Shortage red, surplus amber, balanced green (LAUNCH P1-3). */
export const differenceTone = (diferencia) => (Number(diferencia) < 0 ? 'danger' : Number(diferencia) > 0 ? 'warning' : 'success');
export const differenceText = (diferencia) =>
  Number(diferencia) === 0 ? 'Cuadra' : `${Number(diferencia) < 0 ? 'Faltante' : 'Sobrante'} ${formatBs(Math.abs(Number(diferencia)))}`;

/**
 * "Revisar" a daily close (LAUNCH P1-3): everything it saved — count by note and coin, expected, counted, difference,
 * reason, sales and other methods — and Aprobar (its difference is validated into the branch box) or Observar with a
 * reason (the difference goes back to the cashier). An approved close is final.
 */
export function CloseReviewDialog({ close, onClose }) {
  const review = useReviewClose();
  const [observing, setObserving] = useState(false);
  const [motivo, setMotivo] = useState('');
  useEffect(() => {
    setObserving(false);
    setMotivo('');
  }, [close?.id]);
  if (!close) return null;
  const diferencia = Number(close.diferencia);
  const conteo = Object.entries(close.conteo || {}).filter(([, n]) => Number(n) > 0).sort(([a], [b]) => Number(b) - Number(a));

  async function act(action) {
    if (action === 'observar' && !motivo.trim()) return notify.error('Indica qué hay que revisar del cierre');
    try {
      await review.mutateAsync({ id: close.id, action, motivo: motivo.trim() });
      notify.success(action === 'aprobar' ? `Cierre del ${close.dia} aprobado` : `Cierre del ${close.dia} observado`, {
        description: close.diferenciaMovimiento ? (action === 'aprobar' ? 'La diferencia quedó validada en la caja de la sucursal' : 'La diferencia vuelve a quien cerró') : undefined,
      });
      onClose();
    } catch {
      /* shown by the query client */
    }
  }

  const rows = [
    ['Saldo inicial', formatBs(close.saldoInicial)],
    ['Entró en efectivo', `+${formatBs(close.ingresosEfectivo)}`],
    ['Salió en efectivo', `−${formatBs(close.egresosEfectivo)}`],
    ['Debía haber', formatBs(close.efectivoEsperado)],
    ['Contado', formatBs(close.efectivoContado)],
    ['QR / Transferencias', `${formatBs(close.totalQr)} / ${formatBs(close.totalTransferencia)}`],
    ['Ventas del día', `${close.ventasCantidad} por ${formatBs(close.ventasTotal)}`],
  ];

  return (
    <Dialog open={Boolean(close)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cierre del {close.dia} · {close.sucursal?.nombre}</DialogTitle>
          <DialogDescription>Cerró {close.cerradoPor?.name} el {formatDateTime(close.cerradoAt)}</DialogDescription>
        </DialogHeader>
        <p role="status" className={cn('rounded-md border px-3 py-2 text-base font-bold tabular-nums', TONE[differenceTone(diferencia)].badge)}>
          {differenceText(diferencia)}
          {close.motivoDiferencia && <span className="block text-sm font-normal">Motivo: {close.motivoDiferencia}</span>}
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <section>
          <h3 className="mb-1 text-sm font-semibold">Conteo</h3>
          {conteo.length ? (
            <ul aria-label="Conteo por billete y moneda" className="grid grid-cols-3 gap-1 text-xs">
              {conteo.map(([d, n]) => <li key={d} className="rounded border border-border px-2 py-1 tabular-nums">{n} × {label(d)}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Cajón vacío.</p>
          )}
        </section>
        {close.observaciones && <p className="text-sm"><span className="text-muted-foreground">Observaciones: </span>{close.observaciones}</p>}
        {close.revisionEstado === 'observado' && (
          <p className={cn('rounded-md border px-3 py-2 text-sm', TONE.warning.badge)}>Observado por {close.revisadoPor?.name}: {close.revisionMotivo}</p>
        )}
        {observing && (
          <div className="space-y-1.5">
            <Label htmlFor="close-observe">Qué hay que revisar *</Label>
            <div className="flex flex-wrap gap-1.5">
              {REASONS.map((r) => (
                <button key={r} type="button" onClick={() => setMotivo(r)} className={cn('rounded-md border px-2 py-1 text-xs font-medium', motivo === r ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted')}>{r}</button>
              ))}
            </div>
            <Textarea id="close-observe" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
          {observing ? (
            <Button type="button" variant="destructive" disabled={review.isPending || !motivo.trim()} onClick={() => act('observar')}>Observar cierre</Button>
          ) : (
            <Button type="button" variant="outline" disabled={review.isPending} onClick={() => setObserving(true)}>Observar</Button>
          )}
          <Button type="button" variant="success" disabled={review.isPending} onClick={() => act('aprobar')}>Aprobar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
