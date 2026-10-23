import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserDirectory } from '@/features/catalogs';
import { notify } from '@/shared/lib/notify.js';
import { useUpdateProject } from '../api.js';

const COMMERCIAL = ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN'];

/** Title, responsible and warranty months (the official amount is changed by Gerencia with the ledger, FIN-01). */
export function EditProjectDialog({ project, open, onOpenChange }) {
  const update = useUpdateProject();
  const { data: users = [] } = useUserDirectory();
  const [form, setForm] = useState({});
  useEffect(() => {
    if (open) setForm({ titulo: project.titulo, garantiaMeses: String(project.garantiaMeses), responsableId: project.responsable?.id || '' });
  }, [open, project]);

  async function submit(e) {
    e.preventDefault();
    const meses = Number(form.garantiaMeses);
    if (!form.titulo?.trim()) return notify.error('Escribe el título');
    if (!Number.isInteger(meses) || meses < 0 || meses > 120) return notify.error('La garantía va de 0 a 120 meses');
    try {
      await update.mutateAsync({ id: project.id, titulo: form.titulo.trim(), garantiaMeses: meses, responsableId: form.responsableId });
      notify.success('Proyecto guardado');
      onOpenChange(false);
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar {project.codigo}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pr-titulo">Título *</Label>
            <Input id="pr-titulo" value={form.titulo || ''} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="pr-garantia">Garantía (meses)</Label>
              <Input id="pr-garantia" type="number" min="0" max="120" value={form.garantiaMeses || ''} onChange={(e) => setForm({ ...form, garantiaMeses: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pr-resp">Responsable</Label>
              <select id="pr-resp" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.responsableId || ''} onChange={(e) => setForm({ ...form, responsableId: e.target.value })}>
                <option value="">Sin responsable</option>
                {users.filter((u) => COMMERCIAL.includes(u.role)).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={update.isPending}>Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
