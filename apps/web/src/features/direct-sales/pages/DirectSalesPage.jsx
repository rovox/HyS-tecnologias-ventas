import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSucursales } from '@/features/catalogs';
import { ControlPanel, ListView, RowQuickActions, StatusBadge, useConfirm, useListControls } from '@/shared/views';
import { PdfViewer } from '@/shared/views/PdfViewer.jsx';
import { businessDayOf, formatBs, formatDateTime } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { cn } from '@/lib/utils';
import { fetchSaleNote, useAnnulDirectSale, useDirectSales } from '../api.js';
import { SaleDialog } from '../components/SaleDialog.jsx';

const METHOD = { efectivo: 'Efectivo', qr: 'QR', transferencia: 'Transferencia' };
const select = 'h-9 rounded-md border border-input bg-background px-2 text-sm';
const shift = (day, delta) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};
const live = (rows) => rows.filter((s) => s.estado === 'registrada');
const sum = (rows) => rows.reduce((t, s) => t + Number(s.total), 0);
const byMethod = (rows, medio) => live(rows).flatMap((s) => s.cobros).filter((c) => c.medioPago === medio).reduce((t, c) => t + Number(c.monto), 0);

/**
 * Ventas directas (VD-02): the sales of a day in one branch (a seller starts on his own) or the whole company, the
 * button to sell, and the stored note of each sale. Gerencia annuls with a reason or corrects (annul + a new linked sale).
 */
export default function DirectSalesPage() {
  const { currentUser, isAdmin } = useAuth();
  const manager = isAdmin();
  const confirm = useConfirm();
  const annul = useAnnulDirectSale();
  const { data: sucursales = [] } = useSucursales();
  const [params, setParams] = useSearchParams();
  const today = businessDayOf();
  const day = params.get('dia') || today;
  const sucursalId = params.has('suc') ? params.get('suc') : manager ? '' : currentUser?.sucursalId || '';
  const { data: sales = [], isLoading, isError, error } = useDirectSales({ desde: day, hasta: day, sucursalId });
  const [selling, setSelling] = useState(null);
  const [note, setNote] = useState(null);
  useDocumentTitle('Ventas directas');
  // "Vender" from Inventario or the Dashboard opens the sale at once.
  useEffect(() => {
    if (params.get('vender') !== '1') return;
    setSelling({});
    setParams((p) => { const n = new URLSearchParams(p); n.delete('vender'); return n; }, { replace: true });
  }, [params, setParams]);

  const go = (patch) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(patch)) n.set(k, v); return n; }, { replace: true });

  async function openNote(sale, original = false) {
    try {
      setNote({ sale, file: await fetchSaleNote(sale.id, original) });
    } catch (e) {
      notify.error(e.message);
    }
  }

  async function annulSale(sale, then) {
    const { ok, reason } = await confirm({
      title: `¿Anular la venta ${sale.codigo}?`,
      details: [['Cliente', sale.clienteNombre], ['Total', formatBs(sale.total)], ['Sucursal', sale.sucursal?.nombre]],
      effect: ['El stock vuelve a la sucursal', 'Los cobros salen de sus cajas', 'La nota queda guardada y se marca ANULADA'],
      reason: 'Motivo de la anulación',
      reasonOptions: ['Precio mal cargado', 'Producto equivocado', 'El cliente devolvió', 'Venta duplicada'],
      confirmLabel: 'Anular',
      destructive: true,
    });
    if (!ok) return;
    try {
      const annulled = await annul.mutateAsync({ id: sale.id, motivo: reason });
      notify.success(`Venta ${sale.codigo} anulada`);
      then?.(annulled);
    } catch {
      /* shown by the query client */
    }
  }

  const columns = useMemo(
    () => [
      { key: 'numero', header: 'Nota', cell: (s) => <span className={cn('font-semibold', s.estado === 'anulada' && 'line-through')}>{s.codigo}</span> },
      { key: 'fecha', header: 'Hora', cell: (s) => formatDateTime(s.fecha) },
      { key: 'sucursal', header: 'Sale de', cell: (s) => s.sucursal?.nombre },
      {
        key: 'cliente',
        header: 'Cliente',
        cell: (s) => (
          <div>
            <p className="font-medium">{s.clienteNombre}</p>
            <p className="text-xs text-muted-foreground">{s.items.map((i) => `${Number(i.cantidad)} ${i.descripcion}`).join(', ')}</p>
          </div>
        ),
      },
      { key: 'vendedor', header: 'Vendió', cell: (s) => s.vendedor?.name },
      { key: 'pagos', header: 'Pagos', cell: (s) => s.cobros.map((c) => `${METHOD[c.medioPago] || c.medioPago} ${formatBs(c.monto)}`).join(' · ') },
      {
        key: 'estado',
        header: 'Estado',
        cell: (s) => (
          <div>
            <StatusBadge entity="directSale" state={s.estado} />
            {s.estado === 'anulada' && <p className="mt-0.5 text-xs text-danger-fg">{s.motivoAnulacion}</p>}
            {s.reemplazadaPor && <p className="text-xs">Corregida en NV-{String(s.reemplazadaPor.numero).padStart(4, '0')}</p>}
            {s.reemplazaA && <p className="text-xs text-muted-foreground">Corrige NV-{String(s.reemplazaA.numero).padStart(4, '0')}</p>}
          </div>
        ),
      },
      { key: 'total', header: 'Total', align: 'right', cell: (s) => <span className={cn('font-semibold', s.estado === 'anulada' && 'text-muted-foreground line-through')}>{formatBs(s.total)}</span>, total: (rows) => formatBs(sum(live(rows))), menuLabel: 'Total' },
      {
        key: 'acciones',
        header: '',
        cell: (s) => (
          <RowQuickActions
            actions={[
              { key: 'nota', icon: FileText, label: `Ver nota ${s.codigo}`, onClick: () => openNote(s) },
              { key: 'corregir', icon: Pencil, label: 'Corregir: anula y abre una venta nueva con lo mismo', hidden: !manager || s.estado !== 'registrada', disabled: annul.isPending, onClick: () => annulSale(s, (annulled) => setSelling({ replaces: annulled })) },
              { key: 'anular', icon: Trash2, label: 'Anular (pide motivo)', tone: 'danger', hidden: !manager || s.estado !== 'registrada', disabled: annul.isPending, onClick: () => annulSale(s) },
            ]}
          />
        ),
      },
    ],
    [manager, annul.isPending], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const filters = useMemo(
    () => [
      { key: 'registrada', label: 'Canceladas', section: 'Estado', tone: 'success', test: (s) => s.estado === 'registrada' },
      { key: 'anulada', label: 'Anuladas', section: 'Estado', tone: 'danger', test: (s) => s.estado === 'anulada' },
    ],
    [],
  );
  const { rows, groups, panel } = useListControls(sales, {
    filters,
    groupOptions: [
      { key: 'vendedor', label: 'Vendió', of: (s) => s.vendedor?.name },
      { key: 'sucursal', label: 'Sucursal', of: (s) => s.sucursal?.nombre },
    ],
    searchText: (s) => `${s.codigo} ${s.clienteNombre} ${s.clienteNit} ${s.vendedor?.name || ''} ${s.items.map((i) => `${i.codigo} ${i.descripcion}`).join(' ')}`,
  });
  const summary = (list) => [
    { label: `Ventas (${live(list).length})`, value: formatBs(sum(live(list))), tone: 'success' },
    { label: 'Efectivo', value: formatBs(byMethod(list, 'efectivo')) },
    { label: 'QR', value: formatBs(byMethod(list, 'qr')) },
    { label: 'Transferencia', value: formatBs(byMethod(list, 'transferencia')) },
    ...(list.some((s) => s.estado === 'anulada') ? [{ label: `Anuladas (${list.filter((s) => s.estado === 'anulada').length})`, value: formatBs(sum(list.filter((s) => s.estado === 'anulada'))), tone: 'danger' }] : []),
  ];

  return (
    <Layout>
      <ControlPanel
        breadcrumbs={[{ label: 'Ventas directas' }]}
        actions={
          <Button variant="success" onClick={() => setSelling({})}>
            <Plus /> Nueva venta
          </Button>
        }
        searchPlaceholder="Buscar nota, cliente, NIT, producto…"
        {...panel}
        meta={`${rows.length} ventas`}
      />
      <div className="space-y-3 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-end gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Día anterior" onClick={() => go({ dia: shift(day, -1) })}>
            <ChevronLeft />
          </Button>
          <Input type="date" aria-label="Día" className="h-9 w-40" value={day} max={today} onChange={(e) => e.target.value && go({ dia: e.target.value })} />
          <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Día siguiente" disabled={day >= today} onClick={() => go({ dia: shift(day, 1) })}>
            <ChevronRight />
          </Button>
          <Button variant={day === today ? 'secondary' : 'ghost'} size="sm" className="h-9" onClick={() => go({ dia: today })}>
            Hoy
          </Button>
          <select aria-label="Sucursal" className={select} value={sucursalId} onChange={(e) => go({ suc: e.target.value })}>
            <option value="">Toda la empresa</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>Sucursal {s.nombre}</option>
            ))}
          </select>
          <Link to={`/finanzas?vista=movimientos&desde=${day}&hasta=${day}&suc=${sucursalId}`} className="ml-auto text-sm text-primary hover:underline">
            Ver el libro de este día
          </Link>
        </div>
        {isError && <p className="text-sm text-danger-fg">No se pudieron cargar las ventas: {error?.message}</p>}
        <ListView
          id="ventas-directas"
          columns={columns}
          rows={rows}
          groups={groups}
          loading={isLoading}
          summary={summary}
          tone={(s) => (s.estado === 'anulada' ? 'danger' : undefined)}
          onRowClick={(s) => openNote(s)}
          empty="No hay ventas en este día"
        />
      </div>
      <SaleDialog open={Boolean(selling)} onOpenChange={(o) => !o && setSelling(null)} replaces={selling?.replaces} onSaved={(sale) => openNote(sale)} />
      <PdfViewer
        file={note?.file}
        title={note ? `Nota de venta ${note.sale.codigo}` : ''}
        description={note?.sale.estado === 'anulada' ? 'Copia marcada ANULADA. La original queda guardada.' : note ? `${note.sale.clienteNombre} · ${formatBs(note.sale.total)}` : undefined}
        onClose={() => {
          URL.revokeObjectURL(note.file.url);
          setNote(null);
        }}
      />
    </Layout>
  );
}
