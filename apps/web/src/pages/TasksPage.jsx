import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { toast } from 'sonner';
import { tasksService } from '@/services/tasks/index.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { CheckCircle2, Plus } from 'lucide-react';

const PRIORIDAD = { alta: 'Alta', media: 'Media', baja: 'Baja' };

const TasksPage = () => {
  const { currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setRows(await tasksService.getAll());
    } catch {
      setRows([]);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return toast.error('Escribe un título');
    setSaving(true);
    try {
      await tasksService.create({
        titulo: titulo.trim(),
        descripcion,
        prioridad,
        sucursalId: currentUser?.sucursalId || currentUser?.department,
      });
      setTitulo('');
      setDescripcion('');
      toast.success('Tarea creada');
      await load();
    } catch {
      toast.error('No se pudo crear');
    } finally {
      setSaving(false);
    }
  };

  const complete = async (id) => {
    try {
      await tasksService.update(id, { estado: 'completada' });
      toast.success('Marcada como completada. Se oculta a las 24 h.');
      await load();
    } catch {
      toast.error('No se pudo completar');
    }
  };

  return (
    <Layout>
      <Helmet><title>Tareas - H&S Tecnologías</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Tareas compartidas</h1>
          <p className="text-sm text-muted-foreground mt-1">No se borran. Las completadas desaparecen del tablero a las 24 horas.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5" /> Nueva tarea
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-3">
              <Input className="min-h-11" placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              <Textarea placeholder="Detalle (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={prioridad} onValueChange={setPrioridad}>
                  <SelectTrigger className="min-h-11 sm:w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" variant="action" disabled={saving} className="min-h-11">Crear</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay tareas visibles.</p>
          ) : rows.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{task.titulo}</p>
                  {task.descripcion ? <p className="text-sm text-muted-foreground mt-1">{task.descripcion}</p> : null}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">{PRIORIDAD[task.prioridad] || task.prioridad}</Badge>
                    <Badge variant="outline">{task.estado}</Badge>
                    {(task.asignado?.name || task.asignado_nombre) && (
                      <Badge variant="secondary">{task.asignado?.name || task.asignado_nombre}</Badge>
                    )}
                  </div>
                </div>
                {task.estado !== 'completada' && (
                  <Button variant="outline" className="min-h-11 shrink-0" onClick={() => complete(task.id)}>
                    <CheckCircle2 className="h-4 w-4" /> Completar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default TasksPage;
