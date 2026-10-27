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
import { useCreateJob, useJobs, useUpdateJob } from '../api.js';
import { HOURS, JOB_STATE } from '../constants.js';
import { jobDay, today } from '../dates.js';
import { LocationField, SearchSelect } from '@/shared/views';
import { COMMERCIAL_ROLES, ROLES } from '@/constants/roles.js';

const TECNICO = ROLES.TEC;
const select = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm';
const STEPS = ['Qué', 'Cuándo', 'Quién'];
/** "09:00–12:00" → ['09:00', '12:00']; a free text from before SCH-04 is kept as it was. */
const splitHorario = (h) => {
  const m = /^(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})$/.exec(h || '') || /^(\d{2}:\d{2})$/.exec(h || '');
  return m ? [m[1], m[2] || ''] : null;
};

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
 * Program a stand-alone job (asistencia, mantenimiento…) with its own amount, in three steps (SCH-04): what, when
 * (date and hours, with the jobs already programmed that day) and who (técnico with his load that day). Jobs of a
 * project are added from the project, where the money is. With `job` it edits that job: the client and branch stay; a
 * project job has no amount and a quotation job keeps the quotation's category.
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
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (open) {
      setForm(job ? fromJob(job) : empty(currentUser, day));
      setStep(0);
    }
  }, [open, currentUser, day, job]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const { data: sameDay = [] } = useJobs(form.fechaProgramada, form.fechaProgramada);
  const others = sameDay.filter((j) => j.id !== job?.id && j.estado !== 'cancelado');
  const hours = splitHorario(form.horario);
  const setHours = (from, to) => set({ horario: from ? (to ? `${from}–${to}` : from) : '' });
  const loadOf = (userId) => others.filter((j) => j.tecnicoId === userId).length;
  const tecnicos = users.filter((u) => u.role === TECNICO).map((u) => {
    const load = loadOf(u.id);
    return { value: u.id, label: `${u.name} — ${load ? `${load} trabajo${load > 1 ? 's' : ''} ese día` : 'libre ese día'}` };
  });

  /** What is missing in a step, or null. */
  const missing = (i) => {
    if (i === 0) {
      if (!editing && !form.clienteId) return 'Selecciona el cliente';
      if (!form.categoriaId) return 'Selecciona la categoría';
      if (!form.descripcionTrabajo.trim()) return 'Describe el trabajo';
    }
    if (i === 1) {
      if (!form.fechaProgramada) return 'Elige la fecha';
      if (hours && hours[1] && hours[1] <= hours[0]) return 'La hora de fin debe ser después del inicio';
    }
    if (i === 2 && !editing && !form.sucursalId) return 'Selecciona la sucursal';
    return null;
  };
  const goTo = (i) => {
    for (let k = 0; k < i; k++) {
      const error = missing(k);
      if (error) {
        setStep(k);
        return notify.error(error);
      }
    }
    setStep(i);
  };

  async function submit(e) {
    e.preventDefault();
    if (step < STEPS.length - 1 && !editing) return goTo(step + 1);
    for (let k = 0; k < STEPS.length; k++) {
      const error = missing(k);
      if (error) {
        setStep(k);
        return notify.error(error);
      }
    }
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
      notify.success('Trabajo programado', { description: form.tecnicoId ? undefined : 'Todavía no tiene técnico: asígnalo desde el trabajo' });
      onOpenChange(false);
      onCreated?.(created);
    } catch {
      /* shown by the query client */
    }
  }

  const last = step === STEPS.length - 1;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar trabajo' : 'Programar trabajo'}</DialogTitle>
          <DialogDescription>
            {editing
              ? `${job.cliente?.nombre}${job.project ? `, proyecto ${job.project.codigo}: el monto es del proyecto` : ''}`
              : 'Un trabajo suelto con su monto. Para un trabajo de un proyecto, agrégalo desde el proyecto.'}
          </DialogDescription>
        </DialogHeader>
        <ol className="grid grid-cols-3 gap-1" aria-label="Pasos">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                aria-current={step === i ? 'step' : undefined}
                onClick={() => goTo(i)}
                className={cn(
                  'flex w-full items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-sm font-medium',
                  step === i ? 'border-primary bg-primary text-primary-foreground' : i < step ? 'border-success-border bg-success-soft text-success-fg' : 'border-border text-muted-foreground',
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs">{i + 1}</span>
                {label}
              </button>
            </li>
          ))}
        </ol>
        <form onSubmit={submit} className="space-y-3">
          {step === 0 && (
            <>
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
            </>
          )}
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="job-new-fecha">Fecha *</Label>
                <Input id="job-new-fecha" type="date" value={form.fechaProgramada} onChange={(e) => set({ fechaProgramada: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="job-new-desde">Desde</Label>
                  <select id="job-new-desde" className={select} value={hours ? hours[0] : ''} onChange={(e) => setHours(e.target.value, hours?.[1] && hours[1] > e.target.value ? hours[1] : '')}>
                    <option value="">Sin hora</option>
                    {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="job-new-hasta">Hasta</Label>
                  <select id="job-new-hasta" className={select} value={hours ? hours[1] : ''} disabled={!hours} onChange={(e) => setHours(hours[0], e.target.value)}>
                    <option value="">—</option>
                    {HOURS.filter((h) => !hours || h > hours[0]).map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              {form.horario && !hours && <p className="text-xs text-muted-foreground">Horario anterior: {form.horario} (elige las horas para cambiarlo)</p>}
              <section className="rounded-md border border-border p-2">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ya programados ese día ({others.length})</h3>
                {others.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ninguno: el día está libre.</p>
                ) : (
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                    {others.map((j) => (
                      <li key={j.id} className="flex justify-between gap-2">
                        <span className="truncate">
                          <span className="tabular-nums text-muted-foreground">{j.horario || 'sin hora'}</span> {j.cliente?.nombre}
                        </span>
                        <span className={cn('shrink-0 text-xs', !j.tecnico && 'font-semibold text-danger-fg')}>{j.tecnico?.name || 'Sin técnico'} · {JOB_STATE[j.estado]?.label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="job-new-tec" className={cn(!form.tecnicoId && 'text-danger-fg')}>Técnico{!form.tecnicoId && ' (sin asignar)'}</Label>
                <SearchSelect
                  id="job-new-tec"
                  aria-label="Técnico"
                  value={form.tecnicoId}
                  onChange={(tecnicoId) => set({ tecnicoId })}
                  emptyOption="Sin asignar"
                  searchPlaceholder="Buscar técnico…"
                  invalid={editing && !form.tecnicoId}
                  options={tecnicos}
                />
                <p className="text-xs text-muted-foreground">Al lado de cada técnico: cuántos trabajos tiene ese día.</p>
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
            </>
          )}
          <DialogFooter className="gap-2">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>Atrás</Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            )}
            {!last && (
              <Button type="button" variant={editing ? 'outline' : 'default'} onClick={() => goTo(step + 1)}>Siguiente</Button>
            )}
            {(last || editing) && (
              <Button type="submit" disabled={create.isPending || update.isPending}>{editing ? 'Guardar cambios' : 'Programar'}</Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
