import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { tasksService } from '@/services/tasks/index.js';
import quotationsService from '@/services/quotations/index.js';
import { surveysService } from '@/services/surveys/index.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import authService from '@/services/auth/index.js';
import { cn } from '@/lib/utils.js';

const TABS = [
  { id: 'trabajo', label: 'Trabajo', primary: true },
  { id: 'tarea', label: 'Tarea', primary: true },
  { id: 'cotizacion', label: 'Cotización', primary: true },
  { id: 'visita', label: 'Visita', primary: false },
];

const CronogramaQuickModal = ({ open, onOpenChange, date, quotations = [], visits = [], onWork, onSaved }) => {
  const { currentUser } = useAuth();
  const day = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  const [tab, setTab] = useState('tarea');
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [task, setTask] = useState({ titulo: '', descripcion: '', asignadoId: '', horario: '', cotizacionId: '' });
  const [quoteId, setQuoteId] = useState('');
  const [workQuoteId, setWorkQuoteId] = useState('');
  const [visitaId, setVisitaId] = useState('');

  useEffect(() => {
    if (!open) return;
    setTab('tarea');
    setTask({ titulo: '', descripcion: '', asignadoId: '', horario: '', cotizacionId: '' });
    setQuoteId('');
    setWorkQuoteId('');
    setVisitaId('');
    authService.listUsers().then((rows) => setUsers((rows || []).filter((u) => u.active !== false))).catch(() => setUsers([]));
  }, [open, day]);

  const save = async (e) => {
    e.preventDefault();
    if (tab === 'trabajo') {
      onWork?.(day, workQuoteId || undefined);
      onOpenChange(false);
      return;
    }
    setSaving(true);
    try {
      if (tab === 'tarea') {
        if (!task.titulo.trim()) return toast.error('Escribe un título');
        const assignee = users.find((u) => u.id === task.asignadoId);
        await tasksService.create({
          titulo: task.titulo.trim(),
          descripcion: task.descripcion,
          plazo: day,
          horario: task.horario || null,
          asignadoId: task.asignadoId || null,
          asignado_nombre: assignee?.name || '',
          sucursalId: currentUser?.sucursalId || currentUser?.department,
          cotizacionId: task.cotizacionId || null,
        });
        toast.success('Tarea programada');
      }
      if (tab === 'cotizacion') {
        if (!quoteId) return toast.error('Elige una cotización');
        await quotationsService.update(quoteId, { plazo_final: day });
        toast.success('Plazo de cotización asignado');
      }
      if (tab === 'visita') {
        if (!visitaId) return toast.error('Elige una visita');
        await surveysService.update(visitaId, { fecha: day });
        toast.success('Visita programada');
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'No se pudo programar');
    } finally {
      setSaving(false);
    }
  };

  const openQuotes = quotations.filter((q) => q.estado !== 'rechazado');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Programar · {day}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-xl">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'flex-1 min-h-9 px-2 rounded-lg text-xs font-semibold',
                tab === item.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground',
                !item.primary && 'opacity-70 text-[11px]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <form onSubmit={save} className="space-y-3">
          {tab === 'trabajo' ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Abre el formulario completo de trabajo para este día.</p>
              <div className="space-y-1">
                <Label>Cotización (opcional)</Label>
                <Select value={workQuoteId || 'none'} onValueChange={(v) => setWorkQuoteId(v === 'none' ? '' : v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sin vincular" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin vincular</SelectItem>
                    {openQuotes.map((q) => (
                      <SelectItem key={q.id} value={q.id}>{q.numero} · {q.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          {tab === 'tarea' ? (
            <>
              <div className="space-y-1">
                <Label>Título</Label>
                <Input value={task.titulo} onChange={(e) => setTask({ ...task, titulo: e.target.value })} className="h-10" required />
              </div>
              <div className="space-y-1">
                <Label>Encargado</Label>
                <Select value={task.asignadoId || 'none'} onValueChange={(v) => setTask({ ...task, asignadoId: v === 'none' ? '' : v })}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Horario</Label>
                <Input type="time" className="h-10" value={task.horario} onChange={(e) => setTask({ ...task, horario: e.target.value })} />
              </div>
              <Textarea rows={2} placeholder="Detalle (opcional)" value={task.descripcion} onChange={(e) => setTask({ ...task, descripcion: e.target.value })} />
              <div className="space-y-1">
                <Label>Cotización (opcional)</Label>
                <Select value={task.cotizacionId || 'none'} onValueChange={(v) => setTask({ ...task, cotizacionId: v === 'none' ? '' : v })}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sin vincular" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin vincular</SelectItem>
                    {openQuotes.map((q) => (
                      <SelectItem key={q.id} value={q.id}>{q.numero} · {q.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}
          {tab === 'cotizacion' ? (
            <div className="space-y-1">
              <Label>Cotización existente</Label>
              <Select value={quoteId || 'none'} onValueChange={(v) => setQuoteId(v === 'none' ? '' : v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Seleccionar…</SelectItem>
                  {openQuotes.map((q) => (
                    <SelectItem key={q.id} value={q.id}>{q.numero} · {q.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {tab === 'visita' ? (
            <div className="space-y-1">
              <Label className="text-muted-foreground">Asistencia o relevamiento</Label>
              <Select value={visitaId || 'none'} onValueChange={(v) => setVisitaId(v === 'none' ? '' : v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Seleccionar…</SelectItem>
                  {visits.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.tipo_visita || 'Visita'} · {v.cliente_nombre || v.lugar || v.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" variant="action" disabled={saving}>
              {tab === 'trabajo' ? 'Abrir trabajo' : saving ? 'Guardando…' : 'Programar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CronogramaQuickModal;
