import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Archive, ArrowLeftRight, History, MoreHorizontal, PackageMinus, PackagePlus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Layout from '@/components/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useCategories, useSucursales } from '@/features/catalogs';
import { ControlPanel, ListView, RowQuickActions, ToneTag, useConfirm, useListControls } from '@/shared/views';
import { OrdersView } from '@/features/orders';
import { downloadCsv } from '@/shared/lib/csv.js';
import { businessDayOf, formatBs, formatDateTime } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { cn } from '@/lib/utils';
import { useProducts, useSaveProduct, useStockMovements } from '../api.js';
import { ProductDialog } from '../components/ProductDialog.jsx';
import { MOVEMENT, StockMovementDialog } from '../components/StockMovementDialog.jsx';
import { BatchMovementDialog } from '../components/BatchMovementDialog.jsx';
import { KardexDialog } from '../components/KardexDialog.jsx';
import { DigicorpView } from '../components/DigicorpView.jsx';

const TIPO = { equipo: 'Equipo', material: 'Material', servicio: 'Servicio' };

const movementColumns = [
  { key: 'fecha', header: 'Fecha', cell: (m) => formatDateTime(m.fecha) },
  { key: 'producto', header: 'Producto', cell: (m) => <div><p className="font-medium">{m.producto.nombre}</p><p className="text-xs text-muted-foreground">{m.producto.codigo}</p></div> },
  { key: 'tipo', header: 'Movimiento', cell: (m) => MOVEMENT[m.tipo]?.title || m.tipo },
  { key: 'cantidad', header: 'Cantidad', align: 'right', cell: (m) => `${Number(m.cantidad)} ${m.producto.unidad}` },
  { key: 'ruta', header: 'De → a', cell: (m) => `${m.sucursalOrigen?.nombre || '—'} → ${m.project?.codigo || m.sucursalDestino?.nombre || '—'}` },
  {
    key: 'origen',
    header: 'Origen',
    cell: (m) =>
      m.pedidoInterno ? (
        <Link className="font-semibold text-primary hover:underline" to={`/inventario/pedidos/${m.pedidoInterno.id}`} onClick={(e) => e.stopPropagation()}>
          Pedido {m.pedidoInterno.codigo}
        </Link>
      ) : m.ventaDirecta ? (
        <Link className="font-semibold text-primary hover:underline" to="/ventas-directas" onClick={(e) => e.stopPropagation()}>
          Venta NV-{String(m.ventaDirecta.numero).padStart(4, '0')}
        </Link>
      ) : (
        m.motivo || m.nota || '—'
      ),
  },
  { key: 'por', header: 'Registró', cell: (m) => m.registradoPor?.name },
];

/** The types of the history, in plain words (INV-03); a filter chip each. */
const HISTORY_TYPES = [
  ['entrada', 'Entradas (compras)'],
  ['salida_venta_directa', 'Ventas'],
  ['devolucion_venta', 'Ventas anuladas'],
  ['transferencia', 'Movidos entre sucursales'],
  ['salida_proyecto', 'Salidas a proyecto'],
  ['baja', 'Quitados'],
  ['ajuste', 'Ajustes'],
];
const select = 'h-9 rounded-md border border-input bg-background px-2 text-sm';
const daysAgo = (n) => {
  const d = new Date(`${businessDayOf()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

/**
 * Inventario: products with stock per branch (computed from movements) and their history. A seller starts on his
 * branch (only what it has); "Toda la empresa" shows every branch. Quick actions move several products at once (INV-03).
 */
export default function InventoryPage() {
  const { canManageMoney, isVentasLevel, readsAll, currentUser, isAdmin } = useAuth();
  const manage = isVentasLevel();
  const [params, setParams] = useSearchParams();
  const vistas = [['productos', 'Productos'], ...(readsAll() ? [['pedidos', 'Pedidos internos']] : []), ['movimientos', 'Historial'], ['digicorp', 'Tienda Digicorp']];
  const vista = vistas.some(([k]) => k === params.get('vista')) ? params.get('vista') : 'productos';
  // A seller starts on his branch; Gerencia on the whole company (kept in the URL, both can change it).
  const suc = params.has('suc') ? params.get('suc') : isAdmin() ? '' : currentUser?.sucursalId || '';
  // "Only what this branch has": products never stocked anywhere (just created) stay visible.
  const onlyHere = Boolean(suc) && params.get('todos') !== '1';
  const desde = params.get('desde') || daysAgo(30);
  const hasta = params.get('hasta') || businessDayOf();
  const go = (patch) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(patch)) n.set(k, v); return n; }, { replace: true });
  const { data: products = [], isLoading } = useProducts();
  const { data: movements = [], isLoading: loadingMoves } = useStockMovements({ desde, hasta, ...(suc ? { sucursalId: suc } : {}) }, vista === 'movimientos');
  const { data: sucursales = [] } = useSucursales();
  const { data: categories } = useCategories();
  const save = useSaveProduct();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null);
  const [moving, setMoving] = useState(null);
  const [batch, setBatch] = useState(null);
  const [kardexOf, setKardexOf] = useState(null);
  // "Agregar material" / "Mover material" from the dashboard open the quick action at once.
  useEffect(() => {
    const accion = params.get('accion');
    if (!['entrada', 'transferencia', 'baja'].includes(accion)) return;
    setBatch(accion);
    setParams((p) => { const n = new URLSearchParams(p); n.delete('accion'); return n; }, { replace: true });
  }, [params, setParams]);
  useDocumentTitle('Inventario');

  const active = products.filter((p) => p.active);
  const archived = products.length - active.length;
  const low = active.filter((p) => p.stockBajo).length;
  const filters = useMemo(
    () => [
      { key: 'bajo', label: 'Stock bajo', section: 'Stock', tone: 'danger', count: low, test: (p) => p.stockBajo && p.active },
      { key: 'archivados', label: 'Archivados (ya no se tienen)', section: 'Stock', tone: 'neutral', count: archived, test: (p) => !p.active },
      ...Object.entries(TIPO).map(([k, label]) => ({ key: k, label, section: 'Tipo', test: (p) => p.tipo === k })),
      ...(categories?.divisions || []).map((d) => ({ key: d.id, label: d.label, section: 'Categoría', test: (p) => p.categoriaId === d.id })),
    ],
    [categories, low, archived],
  );
  const visibleProducts = products.filter((p) => (p.active || (params.get('f') || '').includes('archivados')) && (!onlyHere || p.tipo === 'servicio' || Number(p.stock[suc] ?? 0) > 0 || !p.stockTotal));
  const list = useListControls(visibleProducts, {
    filters,
    groupOptions: [
      { key: 'categoria', label: 'Categoría', of: (p) => p.categoria?.label },
      { key: 'tipo', label: 'Tipo', of: (p) => TIPO[p.tipo] },
      { key: 'marca', label: 'Marca', of: (p) => p.marca || 'Sin marca' },
    ],
    searchText: (p) => `${p.codigo} ${p.nombre} ${p.marca}`,
  });
  const moveFilters = useMemo(() => HISTORY_TYPES.map(([key, label]) => ({ key, label, section: 'Tipo', count: movements.filter((m) => m.tipo === key).length, test: (m) => m.tipo === key })), [movements]);
  const moves = useListControls(movements, {
    filters: moveFilters,
    groupOptions: [
      { key: 'producto', label: 'Producto', of: (m) => m.producto.nombre },
      { key: 'tipo', label: 'Tipo', of: (m) => MOVEMENT[m.tipo]?.title || m.tipo },
      { key: 'registro', label: 'Registró', of: (m) => m.registradoPor?.name },
    ],
    searchText: (m) => `${m.producto.codigo} ${m.producto.nombre} ${m.nota} ${m.motivo || ''} ${m.project?.codigo || ''}`,
  });
  const movesCsv = [
    { header: 'Fecha', value: (m) => formatDateTime(m.fecha) },
    { header: 'Código', value: (m) => m.producto.codigo },
    { header: 'Producto', value: (m) => m.producto.nombre },
    { header: 'Movimiento', value: (m) => MOVEMENT[m.tipo]?.title || m.tipo },
    { header: 'Cantidad', value: (m) => Number(m.cantidad) },
    { header: 'De', value: (m) => m.sucursalOrigen?.nombre || '' },
    { header: 'A', value: (m) => m.project?.codigo || m.sucursalDestino?.nombre || '' },
    { header: 'Motivo / nota', value: (m) => m.motivo || m.nota },
    { header: 'Registró', value: (m) => m.registradoPor?.name },
  ];

  async function toggleArchive(product) {
    const { ok } = await confirm({
      title: product.active ? `¿Archivar ${product.codigo}?` : `¿Reactivar ${product.codigo}?`,
      description: product.active ? 'Deja de ofrecerse en pedidos; su historial se conserva.' : 'Vuelve a estar disponible.',
      confirmLabel: product.active ? 'Archivar' : 'Reactivar',
    });
    if (!ok) return;
    try {
      await save.mutateAsync({ id: product.id, active: !product.active });
      notify.success(product.active ? 'Producto archivado' : 'Producto reactivado');
    } catch {
      /* shown by the query client */
    }
  }

  const actions = (p) => (
    <RowQuickActions actions={[{ key: 'kardex', icon: History, label: `Kardex de ${p.codigo}`, hidden: p.tipo === 'servicio', onClick: () => setKardexOf(p) }]}>
      {manage && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Acciones de ${p.codigo}`}><MoreHorizontal /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {p.tipo !== 'servicio' && p.active && (
            <>
              <DropdownMenuItem onSelect={() => setMoving({ product: p, tipo: 'entrada' })}>Entrada (compra)</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setMoving({ product: p, tipo: 'transferencia' })}>Transferir</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setMoving({ product: p, tipo: 'salida_proyecto' })}>Salida a proyecto</DropdownMenuItem>
              <DropdownMenuItem className="text-danger-fg" onSelect={() => setBatch('baja')}>Quitar material…</DropdownMenuItem>
              {canManageMoney() && <DropdownMenuItem onSelect={() => setMoving({ product: p, tipo: 'ajuste' })}>Ajustar</DropdownMenuItem>}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onSelect={() => setEditing(p)}>Editar</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toggleArchive(p)}>{p.active ? 'Archivar' : 'Reactivar'}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      )}
    </RowQuickActions>
  );

  const columns = [
    {
      key: 'producto',
      header: 'Producto',
      cell: (p) => (
        <div className={cn(!p.active && 'opacity-70')}>
          <p className={cn('font-medium', !p.active && 'line-through')}>{p.nombre}</p>
          <p className="text-xs text-muted-foreground">{p.codigo}{p.marca ? `, marca ${p.marca}` : ''}</p>
          {!p.active && <ToneTag tone="neutral" icon={Archive}>Archivado</ToneTag>}
          {p.active && p.stockBajo && <ToneTag tone="danger" icon={AlertTriangle}>Stock bajo (mínimo {Number(p.stockMinimo)})</ToneTag>}
        </div>
      ),
    },
    { key: 'categoria', header: 'Categoría', cell: (p) => <div><p>{p.categoria?.label}</p><p className="text-xs text-muted-foreground">{TIPO[p.tipo]}</p></div> },
    ...sucursales.filter((s) => !suc || s.id === suc).map((s) => ({ key: s.id, header: suc ? `En ${s.nombre}` : s.nombre, align: 'right', cell: (p) => (p.tipo === 'servicio' ? '—' : <span className={cn(suc && 'font-semibold')}>{p.stock[s.id] ?? 0} {suc ? p.unidad : ''}</span>) })),
    { key: 'total', header: suc ? 'Toda la empresa' : 'Total', align: 'right', cell: (p) => (p.tipo === 'servicio' ? '—' : <span className={cn('font-semibold', p.active && p.stockBajo && 'text-danger-fg')} title={p.stockBajo ? `Mínimo ${Number(p.stockMinimo)}` : undefined}>{p.stockTotal} {p.unidad}</span>) },
    { key: 'costo', header: 'Costo', align: 'right', cell: (p) => formatBs(p.costo) },
    { key: 'precio', header: 'Precio', align: 'right', cell: (p) => formatBs(p.precio) },
    { key: 'acciones', header: '', cell: actions },
  ];
  const csv = [
    { header: 'Código', value: (p) => p.codigo },
    { header: 'Producto', value: (p) => p.nombre },
    { header: 'Marca', value: (p) => p.marca },
    { header: 'Categoría', value: (p) => p.categoria?.label },
    { header: 'Tipo', value: (p) => p.tipo },
    ...sucursales.map((s) => ({ header: s.nombre, value: (p) => p.stock[s.id] ?? 0 })),
    { header: 'Total', value: (p) => p.stockTotal },
    { header: 'Mínimo', value: (p) => Number(p.stockMinimo) },
    { header: 'Costo Bs', value: (p) => Number(p.costo).toFixed(2) },
  ];

  const tabs = (
    <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 sm:px-6" aria-label="Vistas de inventario">
      {vistas.map(([key, label]) => (
        <NavLink key={key} to={`/inventario?vista=${key}`} className={cn('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium', vista === key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
          {label}
          {key === 'productos' && low > 0 && <span className="ml-1.5 rounded-full bg-danger px-1.5 py-0.5 text-xs font-bold text-danger-foreground" title="Productos con stock bajo">{low}</span>}
        </NavLink>
      ))}
    </nav>
  );

  if (vista === 'pedidos') return <Layout><OrdersView tabs={tabs} /></Layout>;
  if (vista === 'digicorp') {
    return (
      <Layout>
        {tabs}
        <ControlPanel breadcrumbs={[{ label: 'Inventario' }, { label: 'Tienda Digicorp' }]} />
        <div className="px-4 py-4 sm:px-6">
          <DigicorpView />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {tabs}
      <ControlPanel
        breadcrumbs={[{ label: 'Inventario' }, { label: vista === 'productos' ? 'Productos' : 'Historial' }]}
        actions={manage && vista === 'productos' && <Button variant="outline" onClick={() => setEditing({})}><Plus /> Nuevo producto</Button>}
        searchPlaceholder="Buscar por código, nombre, marca…"
        {...(vista === 'productos' ? list.panel : moves.panel)}
        onExport={vista === 'productos' ? () => downloadCsv('inventario.csv', csv, list.rows) : () => downloadCsv(`historial-${desde}_${hasta}.csv`, movesCsv, moves.rows)}
        meta={vista === 'productos' ? `${list.rows.length} productos${low ? `, ${low} con stock bajo` : ''}${archived ? `, ${archived} archivados` : ''}` : `${moves.rows.length} movimientos`}
      />
      <div className="space-y-3 px-4 py-4 sm:px-6">
        {manage && (
          <div className="flex flex-wrap gap-2" aria-label="Acciones rápidas">
            <Button variant="success" asChild>
              <Link to="/ventas-directas?vender=1"><ShoppingCart /> Vender</Link>
            </Button>
            <Button variant="outline" onClick={() => setBatch('entrada')}><PackagePlus /> Agregar material</Button>
            <Button variant="outline" onClick={() => setBatch('transferencia')}><ArrowLeftRight /> Mover a otra sucursal</Button>
            <Button variant="outline" className="text-danger-fg" onClick={() => setBatch('baja')}><PackageMinus /> Quitar material</Button>
          </div>
        )}
        <div className="flex flex-wrap items-end gap-2">
          <select aria-label="Sucursal" className={select} value={suc} onChange={(e) => go({ suc: e.target.value })}>
            <option value="">Toda la empresa</option>
            {sucursales.map((s) => <option key={s.id} value={s.id}>Sucursal {s.nombre}</option>)}
          </select>
          {vista === 'productos' && suc && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={onlyHere} onChange={(e) => go({ todos: e.target.checked ? '0' : '1' })} />
              Solo lo que hay en esta sucursal
            </label>
          )}
          {vista === 'movimientos' && (
            <>
              <label className="text-xs text-muted-foreground">Desde<input type="date" aria-label="Desde" className={`${select} block`} value={desde} max={hasta} onChange={(e) => e.target.value && go({ desde: e.target.value })} /></label>
              <label className="text-xs text-muted-foreground">Hasta<input type="date" aria-label="Hasta" className={`${select} block`} value={hasta} min={desde} onChange={(e) => e.target.value && go({ hasta: e.target.value })} /></label>
            </>
          )}
        </div>
        {vista === 'productos' ? (
          <ListView
            id="inventario-productos"
            columns={columns}
            rows={list.rows}
            tone={(p) => (!p.active ? 'neutral' : p.stockBajo ? 'danger' : undefined)}
            groups={list.groups}
            loading={isLoading}
            empty="No hay productos con estos filtros"
            renderCard={(p) => (
              <div className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground">{p.codigo} — {sucursales.map((s) => `${s.nombre}: ${p.stock[s.id] ?? 0}`).join(', ')}</p>
                </div>
                <div className="flex items-center gap-1">
                  {p.tipo !== 'servicio' && <span className={cn('font-semibold', p.stockBajo && 'text-destructive')}>{p.stockTotal}</span>}
                  {actions(p)}
                </div>
              </div>
            )}
          />
        ) : (
          <ListView id="inventario-movimientos" columns={movementColumns} rows={moves.rows} groups={moves.groups} loading={loadingMoves} empty="Sin movimientos en estas fechas" />
        )}
      </div>
      <ProductDialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} product={editing?.id ? editing : null} />
      <StockMovementDialog product={moving?.product} tipo={moving?.tipo} onClose={() => setMoving(null)} />
      {batch && <BatchMovementDialog tipo={batch} onClose={() => setBatch(null)} />}
      <KardexDialog product={kardexOf} sucursalId={suc} onClose={() => setKardexOf(null)} />
    </Layout>
  );
}
