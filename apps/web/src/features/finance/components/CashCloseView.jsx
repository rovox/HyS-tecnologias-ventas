import { useEffect, useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSucursales } from '@/features/catalogs';
import { useConfirm } from '@/shared/views';
import { businessDayOf, formatBs, formatDateTime } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { TONE } from '@/shared/lib/status.js';
import { cn } from '@/lib/utils';
import { useCashClosePreview, useCloseCash } from '../api.js';
import { CONCEPTO_LABEL } from '../constants.js';

/** Bolivian notes and coins, as the API counts them (cash-close.rules.ts). */
const NOTES = [200, 100, 50, 20, 10];
const COINS = [5, 2, 1, 0.5, 0.2, 0.1];
const REASONS = ['Error de cambio', 'Gasto sin registrar', 'Cobro sin registrar', 'Billete falso'];
const select = 'h-9 rounded-md border border-input bg-background px-2 text-sm';
const cents = (v) => Math.round(v * 100) / 100;
const label = (d) => (d < 1 ? `${Math.round(d * 100)} ctvs` : `Bs ${d}`);

/** Green = it adds up; amber = a difference with its reason; red = a difference without reason (cannot close). */
function light(diferencia, motivo) {
  if (diferencia === 0) return { tone: 'success', text: 'Cuadra' };
  return motivo.trim() ? { tone: 'warning', text: `${diferencia < 0 ? 'Faltante' : 'Sobrante'} con motivo` } : { tone: 'danger', text: `${diferencia < 0 ? 'Faltante' : 'Sobrante'}: falta el motivo` };
}

/**
 * Cierre del día (FIN-04): the cash of one branch for one day. The expected cash comes from the ledger (shown line by
 * line); the cashier counts notes and coins; a difference needs a reason and goes to validation. Closed = read-only.
 */
export function CashCloseView() {
  const { currentUser, isAdmin } = useAuth();
  const manager = isAdmin();
  const { data: sucursales = [] } = useSucursales();
  const today = businessDayOf();
  const [sucursalId, setSucursalId] = useState(currentUser?.sucursalId || 'suc_central');
  const [dia, setDia] = useState(today);
  const [conteo, setConteo] = useState({});
  const [inicial, setInicial] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const confirm = useConfirm();
  const close = useCloseCash();
  const { data: day, isLoading, isError, error } = useCashClosePreview(sucursalId, dia);
  useEffect(() => {
    setConteo({});
    setMotivo('');
    setObservaciones('');
    setInicial('');
  }, [sucursalId, dia]);

  const branches = manager ? sucursales : sucursales.filter((s) => s.id === currentUser?.sucursalId);
  const header = (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs text-muted-foreground">
        Sucursal
        <select aria-label="Sucursal del cierre" className={`${select} block`} value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
          {branches.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </label>
      <label className="text-xs text-muted-foreground">
        Día
        <Input type="date" aria-label="Día del cierre" className="block h-9 w-40" value={dia} max={today} onChange={(e) => e.target.value && setDia(e.target.value)} />
      </label>
    </div>
  );
  if (isError) return <div className="space-y-3">{header}<p className="text-sm text-danger-fg">No se pudo cargar el día: {error?.message}</p></div>;
  if (isLoading || !day) return <div className="space-y-3">{header}<Skeleton className="h-64 w-full" /></div>;

  const firstClose = day.saldoInicial === null;
  const saldoInicial = firstClose ? Number(inicial) || 0 : day.saldoInicial;
  const esperado = cents(saldoInicial + day.ingresosEfectivo - day.egresosEfectivo);
  const contado = cents([...NOTES, ...COINS].reduce((s, d) => s + d * (Number(conteo[d]) || 0), 0));
  const diferencia = cents(contado - esperado);
  const state = light(diferencia, motivo);
  const closed = day.cierre;

  async function submit() {
    const { ok } = await confirm({
      title: `¿Cerrar la caja de ${day.sucursal.nombre} del ${dia}?`,
      details: [['Esperado', formatBs(esperado)], ['Contado', formatBs(contado)], ['Diferencia', formatBs(diferencia)]],
      effect: diferencia ? `La diferencia (${formatBs(Math.abs(diferencia))}) queda por validar en la bandeja de Contabilidad` : 'Queda cerrado y no se edita',
      confirmLabel: 'Cerrar caja',
      tone: diferencia ? undefined : 'success',
    });
    if (!ok) return;
    try {
      await close.mutateAsync({
        sucursalId,
        dia,
        conteo: Object.fromEntries(Object.entries(conteo).filter(([, n]) => Number(n) > 0).map(([d, n]) => [String(Number(d)), Number(n)])),
        ...(firstClose ? { saldoInicial } : {}),
        ...(motivo.trim() ? { motivoDiferencia: motivo.trim() } : {}),
        ...(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
      });
      notify.success(`Caja de ${day.sucursal.nombre} cerrada`, { description: diferencia ? 'La diferencia queda por validar' : 'Cuadra' });
    } catch {
      /* shown by the query client */
    }
  }

  // A closed day shows what was saved when it was closed (a close is never edited).
  const figures = closed
    ? [
        ['Saldo inicial', formatBs(closed.saldoInicial), day.cierreAnterior ? `Contado el ${day.cierreAnterior.dia}` : 'Primer cierre'],
        ['Entró en efectivo', `+${formatBs(closed.ingresosEfectivo)}`, 'success'],
        ['Salió en efectivo', `−${formatBs(closed.egresosEfectivo)}`, 'danger'],
        ['Debe haber', formatBs(closed.efectivoEsperado), 'bold'],
      ]
    : [
        ['Saldo inicial', firstClose ? null : formatBs(day.saldoInicial), day.cierreAnterior ? `Contado el ${day.cierreAnterior.dia}` : 'Primer cierre'],
        ['Entró en efectivo', `+${formatBs(day.ingresosEfectivo)}`, 'success'],
        ['Salió en efectivo', `−${formatBs(day.egresosEfectivo)}`, 'danger'],
        ['Debe haber', formatBs(esperado), 'bold'],
      ];

  return (
    <div className="space-y-4">
      {header}
      <div className="flex flex-wrap gap-2">
        {figures.map(([title, value, hint]) => (
          <div key={title} className="rounded-md border border-border bg-card px-3 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
            {value === null ? (
              <Input aria-label="Saldo inicial" type="number" min="0" step="0.01" className="mt-1 h-8 w-28" placeholder="Bs" value={inicial} onChange={(e) => setInicial(e.target.value)} />
            ) : (
              <p className={cn('text-sm font-bold tabular-nums', hint === 'success' && TONE.success.text, hint === 'danger' && TONE.danger.text, hint === 'bold' && 'text-base')}>{value}</p>
            )}
            {hint && !['success', 'danger', 'bold'].includes(hint) && <p className="text-[10px] text-muted-foreground">{hint}</p>}
          </div>
        ))}
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <p>No van al cajón: QR {formatBs(day.qr)} · Transferencias {formatBs(day.transferencia)}</p>
          <p>Ventas del día: {day.ventas.cantidad} por {formatBs(day.ventas.total)}</p>
        </div>
      </div>

      <section className="rounded-md border border-border bg-card p-3">
        <h3 className="mb-2 text-sm font-semibold">Qué movió el efectivo ({day.movimientos.length})</h3>
        {day.movimientos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ningún movimiento en efectivo este día.</p>
        ) : (
          <ul className="max-h-60 space-y-1 overflow-y-auto text-sm">
            {day.movimientos.map((m) => (
              <li key={m.id} className="flex justify-between gap-2">
                <span className="truncate">{formatDateTime(m.fecha)} · {CONCEPTO_LABEL[m.concepto] || m.concepto}{m.nota ? ` · ${m.nota}` : ''}{m.estado === 'por_validar' ? ' (por validar)' : ''}</span>
                <span className={cn('shrink-0 font-semibold tabular-nums', m.efecto > 0 ? TONE.success.text : TONE.danger.text)}>{m.efecto > 0 ? '+' : '−'}{formatBs(Math.abs(m.efecto))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {closed ? (
        <section className={cn('space-y-1 rounded-md border p-3 text-sm', Number(closed.diferencia) === 0 ? TONE.success.badge : TONE.warning.badge)}>
          <p className="flex items-center gap-1.5 font-semibold"><Lock className="h-4 w-4" /> Cerrado por {closed.cerradoPor?.name} el {formatDateTime(closed.cerradoAt)}</p>
          <p>Contado {formatBs(closed.efectivoContado)} · Diferencia {formatBs(closed.diferencia)}{closed.motivoDiferencia ? ` · ${closed.motivoDiferencia}` : ''}</p>
          {closed.revisadoPor && <p className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Revisado por {closed.revisadoPor.name}</p>}
          <p className="text-xs">Un cierre no se edita: un error se corrige con un movimiento nuevo.</p>
        </section>
      ) : (
        <section className="space-y-3 rounded-md border border-border bg-card p-3">
          <h3 className="text-sm font-semibold">Conteo del cajón</h3>
          {[['Billetes', NOTES], ['Monedas', COINS]].map(([title, list]) => (
            <div key={title}>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">{title}</p>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {list.map((d) => (
                  <label key={d} className="text-xs">
                    {label(d)}
                    <Input aria-label={`Cantidad de ${label(d)}`} type="number" min="0" step="1" className="h-9" value={conteo[d] ?? ''} onChange={(e) => setConteo((c) => ({ ...c, [d]: e.target.value }))} />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm">Contado: <span className="font-bold tabular-nums">{formatBs(contado)}</span></p>
            <p className="text-sm">Diferencia: <span className="font-bold tabular-nums">{formatBs(diferencia)}</span></p>
            <span className={cn('rounded-md border px-2 py-1 text-sm font-semibold', TONE[state.tone].badge)} role="status">{state.text}</span>
          </div>
          {diferencia !== 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="close-reason">Motivo de la diferencia *</Label>
              <div className="flex flex-wrap gap-1.5">
                {REASONS.map((r) => (
                  <button key={r} type="button" onClick={() => setMotivo(r)} className={cn('rounded-md border px-2 py-1 text-xs font-medium', motivo === r ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted')}>{r}</button>
                ))}
              </div>
              <Textarea id="close-reason" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="close-notes">Observaciones (opcional)</Label>
            <Textarea id="close-notes" rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>
          <Button variant={state.tone === 'success' ? 'success' : 'default'} disabled={close.isPending || state.tone === 'danger' || (firstClose && inicial === '')} onClick={submit}>
            <Lock /> Cerrar caja
          </Button>
          {firstClose && inicial === '' && <p className="text-xs text-danger-fg">Es el primer cierre de esta sucursal: escribe el saldo inicial.</p>}
        </section>
      )}
    </div>
  );
}
