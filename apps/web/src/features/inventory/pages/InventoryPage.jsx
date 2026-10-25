import { useMemo, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Layout from '@/components/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useCategories, useSucursales } from '@/features/catalogs';
import { ControlPanel, ListView, useConfirm, useListControls } from '@/shared/views';
import { downloadCsv } from '@/shared/lib/csv.js';
import { formatBs, formatDay } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { cn } from '@/lib/utils';
import { useProducts, useSaveProduct, useStockMovements } from '../api.js';
import { ProductDialog } from '../components/ProductDialog.jsx';
import { MOVEMENT, StockMovementDialog } from '../components/StockMovementDialog.jsx';

const TIPO = { equipo: 'Equipo', material: 'Material', servicio: 'Servicio' };

const movementColumns = [
  { key: 'fecha', header: 'Fecha', cell: (m) => formatDay(m.fecha) },
  { key: 'producto', header: 'Producto', cell: (m) => <div><p className="font-medium">{m.producto.nombre}</p><p className="text-xs text-muted-foreground">{m.producto.codigo}</p></div> },
  { key: 'tipo', header: 'Movimiento', cell: (m) => MOVEMENT[m.tipo]?.title || m.tipo },
  { key: 'cantidad', header: 'Cantidad', align: 'right', cell: (m) => `${Number(m.cantidad)} ${m.producto.unidad}` },
  { key: 'ruta', header: 'De → a', cell: (m) => `${m.sucursalOrigen?.nombre || '—'} → ${m.project?.codigo || m.sucursalDestino?.nombre || '—'}` },
  { key: 'origen', header: 'Origen', cell: (m) => (m.pedidoInterno ? 'Pedido interno' : m.motivo || m.nota || '—') },
  { key: 'por', header: 'Registró', cell: (m) => m.registradoPor?.name },
];

/** Inventario: products with stock per branch (computed from movements) and the movements themselves. */
export default function InventoryPage() {
  const { canManageMoney, isVentasLevel } = useAuth();
  const manage = isVentasLevel();
  const [params] = useSearchParams();
  const vista = params.get('vista') === 'movimientos' ? 'movimientos' : 'productos';
  const { data: products = [], isLoading } = useProducts();
  const { data: movements = [], isLoading: loadingMoves } = useStockMovements();
  const { data: sucursales = [] } = useSucursales();
  const { data: categories } = useCategories();
  const save = useSaveProduct();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null);
  const [moving, setMoving] = useState(null);
  useDocumentTitle('Inventario');

  const filters = useMemo(
    () => [
      { key: 'bajo', label: 'Stock bajo', section: 'Stock', test: (p) => p.stockBajo },
      { key: 'archivados', label: 'Archivados', section: 'Stock', test: (p) => !p.active },
      ...Object.entries(TIPO).map(([k, label]) => ({ key: k, label, section: 'Tipo', test: (p) => p.tipo === k })),
      ...(categories?.divisions || []).map((d) => ({ key: d.id, label: d.label, section: 'Categoría', test: (p) => p.categoriaId === d.id })),
    ],
    [categories],
  );
  const visibleProducts = products.filter((p) => p.active || (params.get('f') || '').includes('archivados'));
  const list = useListControls(visibleProducts, {
    filters,
    groupOptions: [
      { key: 'categoria', label: 'Categoría', of: (p) => p.categoria?.label },
      { key: 'tipo', label: 'Tipo', of: (p) => TIPO[p.tipo] },
      { key: 'marca', label: 'Marca', of: (p) => p.marca || 'Sin marca' },
    ],
    searchText: (p) => `${p.codigo} ${p.nombre} ${p.marca}`,
  });
  const moves = useListControls(movements, { searchText: (m) => `${m.producto.codigo} ${m.producto.nombre} ${m.nota} ${m.motivo || ''} ${m.project?.codigo || ''}` });

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

  const actions = (p) =>
    manage && (
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
              {canManageMoney() && <DropdownMenuItem onSelect={() => setMoving({ product: p, tipo: 'ajuste' })}>Ajustar</DropdownMenuItem>}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onSelect={() => setEditing(p)}>Editar</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toggleArchive(p)}>{p.active ? 'Archivar' : 'Reactivar'}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

  const columns = [
    { key: 'producto', header: 'Producto', cell: (p) => <div><p className="font-medium">{p.nombre}</p><p className="text-xs text-muted-foreground">{p.codigo}{p.marca ? `, marca ${p.marca}` : ''}</p></div> },
    { key: 'categoria', header: 'Categoría', cell: (p) => <div><p>{p.categoria?.label}</p><p className="text-xs text-muted-foreground">{TIPO[p.tipo]}</p></div> },
    ...sucursales.map((s) => ({ key: s.id, header: s.nombre, align: 'right', cell: (p) => (p.tipo === 'servicio' ? '—' : p.stock[s.id] ?? 0) })),
    { key: 'total', header: 'Total', align: 'right', cell: (p) => (p.tipo === 'servicio' ? '—' : <span className={cn('font-semibold', p.stockBajo && 'text-destructive')} title={p.stockBajo ? `Mínimo ${Number(p.stockMinimo)}` : undefined}>{p.stockTotal} {p.unidad}</span>) },
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
  const low = products.filter((p) => p.stockBajo).length;

  return (
    <Layout>
      <nav className="flex gap-1 border-b border-border bg-card px-4 sm:px-6" aria-label="Vistas de inventario">
        {[['productos', 'Productos'], ['movimientos', 'Movimientos']].map(([key, label]) => (
          <NavLink key={key} to={`/inventario?vista=${key}`} className={cn('-mb-px border-b-2 px-3 py-2 text-sm font-medium', vista === key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {label}
          </NavLink>
        ))}
      </nav>
      <ControlPanel
        breadcrumbs={[{ label: 'Inventario' }, { label: vista === 'productos' ? 'Productos' : 'Movimientos' }]}
        actions={manage && vista === 'productos' && <Button onClick={() => setEditing({})}><Plus /> Nuevo producto</Button>}
        searchPlaceholder="Buscar por código, nombre, marca…"
        {...(vista === 'productos' ? list.panel : moves.panel)}
        onExport={vista === 'productos' ? () => downloadCsv('inventario.csv', csv, list.rows) : undefined}
        meta={vista === 'productos' ? `${list.rows.length} productos${low ? `, ${low} con stock bajo` : ''}` : `${moves.rows.length} movimientos`}
      />
      <div className="px-4 py-4 sm:px-6">
        {vista === 'productos' ? (
          <ListView
            columns={columns}
            rows={list.rows}
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
          <ListView columns={movementColumns} rows={moves.rows} loading={loadingMoves} empty="Sin movimientos" />
        )}
      </div>
      <ProductDialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} product={editing?.id ? editing : null} />
      <StockMovementDialog product={moving?.product} tipo={moving?.tipo} onClose={() => setMoving(null)} />
    </Layout>
  );
}
