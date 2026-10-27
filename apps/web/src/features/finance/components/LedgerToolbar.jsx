import { useState } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSucursales } from '@/features/catalogs';
import { businessDayOf } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { downloadLedger } from '../api.js';

const select = 'h-9 rounded-md border border-input bg-background px-2 text-sm';
const shift = (day, delta) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

/**
 * The daily ledger (FIN-06): one day (◀ ▶, Hoy) or a range, one branch or the whole company, and the same book as CSV
 * or Excel. `value` = { desde, hasta, sucursalId }; days are Bolivian days.
 */
export function LedgerToolbar({ value, onChange }) {
  const { data: sucursales = [] } = useSucursales();
  const [busy, setBusy] = useState(null);
  const today = businessDayOf();
  const range = value.desde !== value.hasta;
  const setDay = (day) => day && onChange({ ...value, desde: day, hasta: day });

  async function download(formato) {
    setBusy(formato);
    try {
      await downloadLedger(value, formato);
    } catch (e) {
      notify.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mb-3 flex flex-wrap items-end gap-2">
      <div className="flex items-end gap-1">
        {!range && (
          <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Día anterior" onClick={() => setDay(shift(value.desde, -1))}>
            <ChevronLeft />
          </Button>
        )}
        <label className="text-xs text-muted-foreground">
          {range ? 'Desde' : 'Día'}
          <Input type="date" aria-label={range ? 'Desde' : 'Día'} className="h-9 w-40" value={value.desde} max={value.hasta} onChange={(e) => (range ? e.target.value && onChange({ ...value, desde: e.target.value }) : setDay(e.target.value))} />
        </label>
        {range && (
          <label className="text-xs text-muted-foreground">
            Hasta
            <Input type="date" aria-label="Hasta" className="h-9 w-40" value={value.hasta} min={value.desde} onChange={(e) => e.target.value && onChange({ ...value, hasta: e.target.value })} />
          </label>
        )}
        {!range && (
          <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Día siguiente" disabled={value.desde >= today} onClick={() => setDay(shift(value.desde, 1))}>
            <ChevronRight />
          </Button>
        )}
      </div>
      <Button variant={!range && value.desde === today ? 'secondary' : 'ghost'} size="sm" className="h-9" onClick={() => setDay(today)}>
        Hoy
      </Button>
      <Button variant={range ? 'secondary' : 'ghost'} size="sm" className="h-9" onClick={() => (range ? setDay(value.hasta) : onChange({ ...value, desde: shift(value.hasta, -6) }))}>
        {range ? 'Un día' : 'Rango'}
      </Button>
      <label className="text-xs text-muted-foreground">
        Libro de
        <select aria-label="Libro de" className={`${select} block`} value={value.sucursalId} onChange={(e) => onChange({ ...value, sucursalId: e.target.value })}>
          <option value="">Toda la empresa</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              Sucursal {s.nombre}
            </option>
          ))}
        </select>
      </label>
      <div className="ml-auto flex gap-2">
        <Button variant="outline" size="sm" className="h-9" disabled={Boolean(busy)} onClick={() => download('csv')}>
          <FileText /> {busy === 'csv' ? 'Descargando…' : 'CSV'}
        </Button>
        <Button variant="outline" size="sm" className="h-9" disabled={Boolean(busy)} onClick={() => download('xlsx')}>
          <FileSpreadsheet /> {busy === 'xlsx' ? 'Descargando…' : 'Excel'}
        </Button>
      </div>
    </div>
  );
}
