import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useCategories, useSucursales, useUserDirectory } from '@/features/catalogs';
import { ClientPicker } from '@/features/clients';
import { notify } from '@/shared/lib/notify.js';
import { cn } from '@/lib/utils';
import { useCreateJob, useUpdateJob } from '../api.js';
import { jobDay, today } from '../dates.js';
import { LocationField, SearchSelect } from '@/shared/views';
import { COMMERCIAL_ROLES, ROLES } from '@/constants/roles.js';

const TECNICO = ROLES.TEC;
const select = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm';

const empty = (user, day) => ({
  clienteId: '',
  categoriaId: '',
  descripcionTrabajo: '',
  fechaProgramada: day || today(),
  horario: '',
  tecnicoId: '',
  lugar: '',
  mapsLink: '',
  monto: '',
  sucursalId: user?.sucursalId || '',
  vendedorId: '',
});

const fromJob = (job) => ({
  clienteId: job.clienteId,
  categoriaId: job.categoriaId,
  descripcionTrabajo: job.descripcionTrabajo,
  fechaProgramada: jobDay(job),
  horario: job.horario || '',
  tecnicoId: job.tecnicoId || '',
  lugar: job.lugar || '',
  mapsLink: job.mapsLink || '',
  monto: job.projectId ? '' : String(Number(job.monto) || ''),
  sucursalId: job.sucursalId,
  vendedorId: job.vendedorId || '',
});

/**
 * A stand-alone job (asistencia, mantenimiento…) with its own amount. Jobs of a project are added from the project,
 * where the money is. With `job` it edits that job: the client and branch stay; a project job has no amount and a
 * quotation job keeps the quotation's category.
 */
export function JobFormDialog({ open, onOpenChange, day, onCreated, job }) {
  const { currentUser } = useAuth();
  const { data: categories } = useCategories();
  const { data: sucursales = [] } = useSucursales();
  const { data: users = [] } = useUserDirectory();
  const create = useCreateJob();
  const update = useUpdateJob();
  const editing = Boolean(job);
  const [form, setForm] = useState(() => (job ? fromJob(job) : empty(currentUser, day)));
  useEffect(() => {
    if (open) setForm(job ? fromJob(job) : empty(currentUser, day));
  }, [open, currentUser, day, job]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function submit(e) {
    e.preventDefault();
    if (!form.clienteId) return notify.error('Selecciona el cliente');
    if (!form.categoriaId) return notify.error('Selecciona la categoría');
    if (!form.descripcionTrabajo.trim()) return notify.error('Describe el trabajo');
    if (!form.sucursalId) return notify.error('Selecciona la sucursal');
    if (editing) {
      try {
        await update.mutateAsync({
          id: job.id,
          ...(job.quotationId ? {} : { categoriaId: form.categoriaId }),
          descripcionTrabajo: form.descripcionTrabajo.trim(),
          fechaProgramada: form.fechaProgramada,
          horario: form.horario,
          tecnicoId: form.tecnicoId,
          vendedorId: form.vendedorId,
          lugar: form.lugar,
          mapsLink: form.mapsLink,
          ...(job.projectId ? {} : { monto: Number(form.monto) || 0 }),
        });
        notify.success('Trabajo actualizado', { description: form.tecnicoId ? undefined : 'Todavía no tiene técnico' });
        onOpenChange(false);
      } catch {
        /* shown by the query client */
      }
      return;
    }
    try {
      const created = await create.mutateAsync({
        ...form,
        descripcionTrabajo: form.descripcionTrabajo.trim(),
        monto: Number(form.monto) || 0,
        tecnicoId: form.tecnicoId || undefined,
        horario: form.horario || undefined,
        lugar: form.lugar || undefined,
        mapsLink: form.mapsLink || undefined,
      });
      notify.success('Trabajo programado');
      onOpenChange(false);
      onCreated?.(created);
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar trabajo' : 'Nuevo trabajo'}</DialogTitle>
          <DialogDescription>
            {editing
              ? `${job.cliente?.nombre}${job.project ? `, proyecto ${job.project.codigo}: el monto es del proyecto` : ''}`
              : 'Para un trabajo de un proyecto, agrégalo desde el proyecto.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {!editing && (
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <ClientPicker value={form.clienteId} onChange={(clienteId) => set({ clienteId })} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Categoría *{job?.quotationId && <span className="font-normal text-muted-foreground"> (la de la cotización)</span>}</Label>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
              {(categories?.divisions || []).map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={form.categoriaId === c.id} disabled={Boolean(job?.quotationId)} onClick={() => set({ categoriaId: c.id })}
                  className={cn('min-h-11 rounded-md border px-2 text-sm font-medium disabled:cursor-not-allowed', form.categoriaId === c.id ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:bg-muted disabled:opacity-50')}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-new-desc">Trabajo *</Label>
            <Input id="job-new-desc" placeholder="Ej. Revisión de cámaras, mantenimiento de DVR" value={form.descripcionTrabajo} onChange={(e) => set({ descripcionTrabajo: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="job-new-fecha">Fecha *</Label>
              <Input id="job-new-fecha" type="date" value={form.fechaProgramada} onChange={(e) => set({ fechaProgramada: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-new-hora">Horario</Label>
              <Input id="job-new-hora" placeholder="09:00–12:00" value={form.horario} onChange={(e) => set({ horario: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="job-new-tec" className={cn(!form.tecnicoId && 'text-danger-fg')}>Técnico{!form.tecnicoId && ' (sin asignar)'}</Label>
              <SearchSelect
                id="job-new-tec"
                value={form.tecnicoId}
                onChange={(tecnicoId) => set({ tecnicoId })}
                emptyOption="Sin asignar"
                searchPlaceholder="Buscar técnico…"
                invalid={editing && !form.tecnicoId}
                options={users.filter((u) => u.role === TECNICO).map((u) => ({ value: u.id, label: u.name }))}
              />
            </div>
            {editing ? (
              <div className="space-y-1.5">
                <Label htmlFor="job-edit-vend">Vendedor</Label>
                <SearchSelect
                  id="job-edit-vend"
                  value={form.vendedorId}
                  onChange={(vendedorId) => set({ vendedorId })}
                  emptyOption="Sin vendedor"
                  searchPlaceholder="Buscar vendedor…"
                  options={users.filter((u) => COMMERCIAL_ROLES.includes(u.role)).map((u) => ({ value: u.id, label: u.name }))}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="job-new-suc">Sucursal *</Label>
                <select id="job-new-suc" className={select} value={form.sucursalId} onChange={(e) => set({ sucursalId: e.target.value })}>
                  <option value="">Selecciona</option>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            )}
          </div>
          <LocationField
            id="job-new-lugar"
            address={form.lugar}
            link={form.mapsLink}
            placeholder="Dirección del cliente"
            onChange={({ address, link }) => set({ lugar: address, mapsLink: link })}
          />
          {!job?.projectId && (
            <div className="space-y-1.5">
              <Label htmlFor="job-new-monto">Monto a cobrar (Bs)</Label>
              <Input id="job-new-monto" type="number" min="0" step="0.01" value={form.monto} onChange={(e) => set({ monto: e.target.value })} />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>{editing ? 'Guardar cambios' : 'Programar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
