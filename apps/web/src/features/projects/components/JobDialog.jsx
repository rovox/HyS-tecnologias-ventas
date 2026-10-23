import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserDirectory } from '@/features/catalogs';
import { notify } from '@/shared/lib/notify.js';
import { useAddProjectJob } from '../api.js';

const TECNICO = 'SEGURIDAD ELECTRÓNICA';
const EMPTY = { descripcionTrabajo: '', fechaProgramada: '', horario: '', tecnicoId: '', lugar: '' };

/** A new job of the project in the cronograma (instalación, certificación, entrega…). */
export function JobDialog({ project, open, onOpenChange }) {
  const add = useAddProjectJob();
  const { data: users = [] } = useUserDirectory();
  const [form, setForm] = useState(EMPTY);
  useEffect(() => {
    if (open) setForm({ ...EMPTY, lugar: project.cliente?.direccion || '' });
  }, [open, project.cliente]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function submit(e) {
    e.preventDefault();
    if (!form.descripcionTrabajo.trim()) return notify.error('Describe el trabajo');
    if (!form.fechaProgramada) return notify.error('Elige la fecha');
    try {
      await add.mutateAsync({ id: project.id, ...form, descripcionTrabajo: form.descripcionTrabajo.trim() });
      notify.success('Trabajo agregado al cronograma');
      onOpenChange(false);
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo trabajo · {project.codigo}</DialogTitle>
          <DialogDescription>Aparece en el cronograma con la categoría del proyecto ({project.categoria?.label}).</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="job-desc">Trabajo *</Label>
            <Input id="job-desc" autoFocus placeholder="Ej. Certificación Fluke" value={form.descripcionTrabajo} onChange={(e) => set({ descripcionTrabajo: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="job-fecha">Fecha *</Label>
              <Input id="job-fecha" type="date" value={form.fechaProgramada} onChange={(e) => set({ fechaProgramada: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-hora">Horario</Label>
              <Input id="job-hora" placeholder="09:00–12:00" value={form.horario} onChange={(e) => set({ horario: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-tec">Técnico</Label>
            <select id="job-tec" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.tecnicoId} onChange={(e) => set({ tecnicoId: e.target.value })}>
              <option value="">Sin asignar</option>
              {users.filter((u) => u.role === TECNICO).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-lugar">Lugar</Label>
            <Input id="job-lugar" value={form.lugar} onChange={(e) => set({ lugar: e.target.value })} />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={add.isPending}>Agregar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
