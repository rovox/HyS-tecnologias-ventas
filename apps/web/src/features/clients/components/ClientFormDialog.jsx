import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSucursales } from '@/features/catalogs';
import { notify } from '@/shared/lib/notify.js';
import { useSaveClient } from '../api.js';

const RUBROS = ['Banco', 'Cooperativa', 'Institución pública', 'Empresa', 'Comercio', 'Persona'];
const FIELDS = ['nombre', 'tipo', 'contacto', 'telefono', 'email', 'direccion', 'sucursalId', 'observaciones'];

const initial = (client, user) => Object.fromEntries(FIELDS.map((f) => [f, client?.[f] ?? (f === 'sucursalId' ? user?.sucursalId || '' : '')]));

/** New client or edit one. Clients are never deleted. */
export function ClientFormDialog({ open, onOpenChange, client, onSaved }) {
  const { currentUser } = useAuth();
  const { data: sucursales = [] } = useSucursales();
  const save = useSaveClient();
  const [form, setForm] = useState(() => initial(client, currentUser));
  useEffect(() => {
    if (open) setForm(initial(client, currentUser));
  }, [open, client, currentUser]);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (form.nombre.trim().length < 2) return notify.error('Escribe el nombre del cliente');
    try {
      const saved = await save.mutateAsync({ id: client?.id, ...form, nombre: form.nombre.trim(), sucursalId: form.sucursalId || undefined });
      notify.success(client ? 'Cliente guardado' : 'Cliente registrado');
      onOpenChange(false);
      onSaved?.(saved);
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{client ? `Editar ${client.nombre}` : 'Nuevo cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cl-nombre">Nombre o razón social *</Label>
            <Input id="cl-nombre" autoFocus value={form.nombre} onChange={set('nombre')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-tipo">Rubro</Label>
            <Input id="cl-tipo" list="cl-rubros" value={form.tipo} onChange={set('tipo')} />
            <datalist id="cl-rubros">{RUBROS.map((r) => <option key={r} value={r} />)}</datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-suc">Sucursal</Label>
            <select id="cl-suc" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.sucursalId} onChange={set('sucursalId')}>
              {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-contacto">Persona de contacto</Label>
            <Input id="cl-contacto" value={form.contacto} onChange={set('contacto')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-tel">Teléfono</Label>
            <Input id="cl-tel" type="tel" value={form.telefono} onChange={set('telefono')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-email">Correo</Label>
            <Input id="cl-email" type="email" value={form.email} onChange={set('email')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-dir">Dirección</Label>
            <Input id="cl-dir" value={form.direccion} onChange={set('direccion')} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cl-obs">Observaciones</Label>
            <Textarea id="cl-obs" rows={2} value={form.observaciones} onChange={set('observaciones')} />
          </div>
          <DialogFooter className="gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>{client ? 'Guardar' : 'Registrar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
