import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { formatDateTime } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { cn } from '@/lib/utils';
import { useDigicorp, useDigicorpProduct, useSyncDigicorp } from '../api.js';

const PAGE = 48;
const select = 'h-9 rounded-md border border-input bg-background px-2 text-sm';
const SYNC_STATE = { ok: 'Actualizado', en_curso: 'Actualizando…', bloqueado: 'Digicorp bloqueó la actualización', error: 'La actualización falló' };

function Product({ sku, onClose }) {
  const { data: p, isLoading, isError, error } = useDigicorpProduct(sku);
  return (
    <Dialog open={Boolean(sku)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
        {isLoading || !p ? (
          isError ? <p className="text-sm text-danger-fg">No se pudo abrir el producto: {error?.message}</p> : <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{p.nombre}</DialogTitle>
              <DialogDescription>{p.sku} · {p.marca}{p.seccion ? ` · ${p.seccion}` : ''}</DialogDescription>
            </DialogHeader>
            {p.aviso && <p className="rounded-md border border-warning-border bg-warning-soft px-2 py-1 text-xs text-warning-fg">{p.aviso}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              {p.imagenGrandeUrl || p.imagenUrl ? (
                <img src={p.imagenGrandeUrl || p.imagenUrl} alt={p.nombre} className="w-full rounded-md border border-border bg-white object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-md border border-border bg-muted text-sm text-muted-foreground">Sin foto</div>
              )}
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Stock en Digicorp: </span><span className={cn('font-semibold', p.stockTotal ? 'text-success-fg' : 'text-danger-fg')}>{p.stockTotal ?? '—'}</span></p>
                <p className="text-muted-foreground">El precio no se muestra: Digicorp lo da solo con una cuenta de cliente.</p>
                <Button asChild>
                  <a href={p.url} target="_blank" rel="noopener noreferrer"><ExternalLink /> Ver en Digicorp</a>
                </Button>
              </div>
            </div>
            {p.descripcion && <p className="whitespace-pre-wrap text-sm">{p.descripcion}</p>}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Tienda Digicorp (DIGI-01): the supplier's public catalog as a reference while quoting or selling — photo, name,
 * brand, stock and a link to their page. Loaded once and refreshed monthly; Gerencia can refresh it now.
 */
export function DigicorpView() {
  const { isAdmin } = useAuth();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [marca, setMarca] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState(null);
  const sync = useSyncDigicorp();
  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setLimit(PAGE), [search, marca]);
  const { data, isLoading, isError, error } = useDigicorp({ q: search || undefined, marca: marca || undefined, limit });
  const last = data?.ultimaSync;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input aria-label="Buscar en Digicorp" className="min-w-0 flex-1" placeholder="Buscar por código, nombre o marca…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Marca" className={select} value={marca} onChange={(e) => setMarca(e.target.value)}>
          <option value="">Todas las marcas</option>
          {(data?.marcas || []).map((m) => <option key={m.marca} value={m.marca}>{m.marca} ({m.cantidad})</option>)}
        </select>
        {isAdmin() && (
          <Button variant="outline" disabled={sync.isPending || data?.actualizando} onClick={() => sync.mutateAsync().then(() => notify.success('Actualizando la tienda Digicorp', { description: 'Tarda unos minutos' }), () => null)}>
            <RefreshCw className={cn(data?.actualizando && 'animate-spin')} /> Actualizar ahora
          </Button>
        )}
      </div>
      <p className={cn('text-xs', last && ['bloqueado', 'error'].includes(last.estado) ? 'text-danger-fg' : 'text-muted-foreground')}>
        {last ? `${SYNC_STATE[last.estado] || last.estado}: ${formatDateTime(last.terminadoAt || last.iniciadoAt)}${last.error ? ` — ${last.error}` : ''}` : 'Todavía no se cargó el catálogo.'}
        {data ? ` · ${data.total} productos` : ''} · Se actualiza cada mes. Fotos y datos de Digicorp, solo como referencia.
      </p>
      {isError && <p className="text-sm text-danger-fg">No se pudo cargar la tienda: {error?.message}</p>}
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (data?.items || []).length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{last ? 'No hay productos con esta búsqueda.' : 'Gerencia puede cargar el catálogo con “Actualizar ahora”.'}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {data.items.map((p) => (
            <li key={p.sku}>
              <button type="button" onClick={() => setOpen(p.sku)} className="flex h-full w-full flex-col overflow-hidden rounded-md border border-border bg-card text-left shadow-sm hover:shadow-md">
                {p.imagenUrl ? <img src={p.imagenUrl} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-36 w-full bg-white object-contain" /> : <div className="flex h-36 items-center justify-center bg-muted text-xs text-muted-foreground">Sin foto</div>}
                <span className="space-y-0.5 p-2">
                  <span className="line-clamp-2 block text-sm font-medium">{p.nombre}</span>
                  <span className="block text-xs text-muted-foreground">{p.marca} · {p.sku}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {data && data.items.length < data.total && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setLimit((l) => Math.min(l + PAGE, 120))} disabled={limit >= 120}>
            {limit >= 120 ? 'Afina la búsqueda para ver más' : `Ver más (${data.total - data.items.length} restantes)`}
          </Button>
        </div>
      )}
      <Product sku={open} onClose={() => setOpen(null)} />
    </div>
  );
}
