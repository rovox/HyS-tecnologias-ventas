import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Plus, Trash2, Loader2, PackageSearch } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useInternalOrders } from '@/hooks/useInternalOrders.js';

const PRIORIDADES = ['Baja', 'Normal', 'Alta', 'Urgente'];
const ESTADOS = ['solicitado', 'aprobado', 'en_preparación', 'entregado', 'cancelado'];
const UNIDADES = ['unidades', 'kg', 'litros', 'metros', 'rollos', 'cajas', 'pares'];

const PedidoInternoFormModal = ({ isOpen, onClose, onSuccess, initialData = null, isViewOnly = false }) => {
  const { currentUser } = useAuth();
  const { createPedidoWithDetails, updatePedidoWithDetails } = useInternalOrders();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Referenced Data
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  
  // Form State
  const [tipo, setTipo] = useState('Para sucursal'); 
  const [formData, setFormData] = useState({
    responsable_id: currentUser?.id || '',
    sucursal_origen_id: '',
    sucursal_destino_id: '',
    cronograma_id: '',
    prioridad: 'Normal',
    estado: 'solicitado',
    fecha_entrega_estimada: format(new Date(), 'yyyy-MM-dd'),
    hora_estimada: '',
    observaciones: '',
    vendedor_responsable_id: currentUser?.id || ''
  });
  
  const [materiales, setMateriales] = useState([{ 
    id: 'temp-' + Date.now(), 
    material_nombre: '', 
    cantidad: 1, 
    unidad: 'unidades',
    costo_unitario: 0,
    observaciones_item: '' 
  }]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchDependencies = async () => {
      setLoading(true);
      try {
        const [usersRes, schedsRes, sucursalesRes] = await Promise.all([
          pb.collection('users').getFullList({ $autoCancel: false, sort: 'name' }),
          pb.collection('schedules').getFullList({ 
            filter: `estado != "terminado" && estado != "cancelado"`, 
            sort: '-fecha_programada', 
            $autoCancel: false 
          }),
          pb.collection('sucursales').getFullList({ $autoCancel: false, sort: 'nombre', filter: 'activa = true' })
        ]);
        
        setUsers(usersRes);
        setSchedules(schedsRes);
        setSucursales(sucursalesRes);

        if (initialData) {
          const detailsRes = await pb.collection('detalles_pedidos_internos').getFullList({
            filter: `pedido_id="${initialData.id}"`,
            $autoCancel: false
          }).catch(() => []);

          const isParaTrabajo = !!initialData.cronograma_id;
          setTipo(isParaTrabajo ? 'Para trabajo' : 'Para sucursal');
          
          let datePart = '';
          let timePart = '';
          if (initialData.fecha_entrega_estimada) {
            const dt = new Date(initialData.fecha_entrega_estimada);
            datePart = format(dt, 'yyyy-MM-dd');
            timePart = format(dt, 'HH:mm');
          }

          setFormData({
            responsable_id: initialData.responsable_id || '',
            sucursal_origen_id: initialData.sucursal_origen_id || sucursalesRes[0]?.nombre || '',
            sucursal_destino_id: initialData.sucursal_destino_id || '',
            cronograma_id: initialData.cronograma_id || '',
            prioridad: initialData.prioridad || 'Normal',
            estado: initialData.estado || 'solicitado',
            fecha_entrega_estimada: datePart,
            hora_estimada: timePart !== '00:00' ? timePart : '',
            observaciones: initialData.observaciones || '',
            vendedor_responsable_id: initialData.vendedor_responsable_id || initialData.responsable_id || currentUser?.id
          });

          if (detailsRes.length > 0) {
            setMateriales(detailsRes.map(d => ({
              id: d.id,
              material_nombre: d.material_nombre,
              cantidad: d.cantidad,
              unidad: d.unidad,
              costo_unitario: d.costo_unitario || 0,
              observaciones_item: d.observaciones_item || ''
            })));
          } else {
            setMateriales([]);
          }
        } else {
          setTipo('Para sucursal');
          setFormData({
            responsable_id: currentUser?.id || '',
            sucursal_origen_id: sucursalesRes[0]?.nombre || '',
            sucursal_destino_id: '',
            cronograma_id: '',
            prioridad: 'Normal',
            estado: 'solicitado',
            fecha_entrega_estimada: format(new Date(), 'yyyy-MM-dd'),
            hora_estimada: '',
            observaciones: '',
            vendedor_responsable_id: currentUser?.id || ''
          });
          setMateriales([{ id: 'temp-' + Date.now(), material_nombre: '', cantidad: 1, unidad: 'unidades', costo_unitario: 0, observaciones_item: '' }]);
        }
      } catch (err) {
        console.error('Error fetching modal dependencies:', err);
        toast.error('Error al cargar datos requeridos');
      } finally {
        setLoading(false);
      }
    };

    fetchDependencies();
  }, [isOpen, initialData, currentUser]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMaterial = () => {
    setMateriales(prev => [...prev, { 
      id: 'temp-' + Date.now(), 
      material_nombre: '', 
      cantidad: 1, 
      unidad: 'unidades',
      costo_unitario: 0,
      observaciones_item: '' 
    }]);
  };

  const handleRemoveMaterial = (index) => {
    setMateriales(prev => prev.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index, field, value) => {
    setMateriales(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewOnly) {
      onClose();
      return;
    }

    if (!formData.responsable_id) return toast.error('El solicitante es obligatorio');
    if (tipo === 'Para trabajo' && !formData.cronograma_id) return toast.error('Selecciona el trabajo relacionado');
    if (tipo === 'Para sucursal' && !formData.sucursal_destino_id) return toast.error('Selecciona la sucursal de destino');
    if (!formData.fecha_entrega_estimada) return toast.error('La fecha requerida es obligatoria');
    
    const validMaterials = materiales.filter(m => m.material_nombre.trim() !== '');
    if (validMaterials.length === 0) return toast.error('Debes incluir al menos un material válido');

    setSubmitting(true);
    try {
      let fechaISO = `${formData.fecha_entrega_estimada} 12:00:00.000Z`;
      if (formData.hora_estimada) {
        fechaISO = `${formData.fecha_entrega_estimada} ${formData.hora_estimada}:00.000Z`;
      }

      let dest = formData.sucursal_destino_id;
      if (tipo === 'Para trabajo') {
        const sched = schedules.find(s => s.id === formData.cronograma_id);
        dest = sched ? `Trabajo: ${sched.cliente} (${sched.lugar})` : 'En sitio';
      }

      const pedidoPayload = {
        responsable_id: formData.responsable_id,
        vendedor_responsable_id: formData.responsable_id,
        sucursal_origen_id: formData.sucursal_origen_id,
        sucursal_destino_id: dest,
        cronograma_id: tipo === 'Para trabajo' ? formData.cronograma_id : '',
        prioridad: formData.prioridad,
        estado: formData.estado,
        fecha_entrega_estimada: fechaISO,
        observaciones: formData.observaciones,
      };

      if (!initialData) {
        await createPedidoWithDetails(pedidoPayload, validMaterials);
        toast.success('Pedido generado exitosamente');
      } else {
        await updatePedidoWithDetails(initialData.id, pedidoPayload, validMaterials);
        toast.success('Pedido actualizado exitosamente');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Ocurrió un error al guardar el pedido. Revisa los datos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !submitting && onClose()}>
      <SheetContent className="w-full sm:max-w-3xl bg-background overflow-y-auto custom-scrollbar p-0 flex flex-col h-full">
        <div className="p-6 border-b shrink-0 bg-muted/30">
          <SheetHeader>
            <SheetTitle className="text-2xl font-extrabold flex items-center gap-2">
              <PackageSearch className="h-6 w-6 text-primary" />
              {isViewOnly ? 'Detalles del Pedido' : initialData ? 'Editar Pedido Interno' : 'Nuevo Pedido Interno'}
            </SheetTitle>
            <SheetDescription>
              {isViewOnly ? 'Vista de solo lectura del requerimiento.' : 'Ingresa los detalles del requerimiento de materiales o insumos.'}
            </SheetDescription>
          </SheetHeader>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
              
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">Información General</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Solicitante <span className="text-destructive">*</span></Label>
                    <Select value={formData.responsable_id} onValueChange={(v) => handleSelectChange('responsable_id', v)} disabled={isViewOnly || submitting}>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Seleccione usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prioridad <span className="text-destructive">*</span></Label>
                    <Select value={formData.prioridad} onValueChange={(v) => handleSelectChange('prioridad', v)} disabled={isViewOnly || submitting}>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORIDADES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Solicitud</Label>
                    <Select value={tipo} onValueChange={setTipo} disabled={isViewOnly || submitting}>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Para trabajo">Para un trabajo/proyecto</SelectItem>
                        <SelectItem value="Para sucursal">Abastecimiento de sucursal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {tipo === 'Para trabajo' ? (
                    <div className="space-y-2">
                      <Label>Trabajo Relacionado <span className="text-destructive">*</span></Label>
                      <Select value={formData.cronograma_id} onValueChange={(v) => handleSelectChange('cronograma_id', v)} disabled={isViewOnly || submitting}>
                        <SelectTrigger className="bg-card">
                          <SelectValue placeholder="Seleccione un trabajo" />
                        </SelectTrigger>
                        <SelectContent>
                          {schedules.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.cliente} - {format(new Date(s.fecha_programada), 'dd/MM')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Sucursal Relacionada (Destino) <span className="text-destructive">*</span></Label>
                      <Select value={formData.sucursal_destino_id} onValueChange={(v) => handleSelectChange('sucursal_destino_id', v)} disabled={isViewOnly || submitting}>
                        <SelectTrigger className="bg-card">
                          <SelectValue placeholder="Seleccione sucursal" />
                        </SelectTrigger>
                        <SelectContent>
                          {sucursales.map(s => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Fecha Requerida <span className="text-destructive">*</span></Label>
                    <Input type="date" name="fecha_entrega_estimada" value={formData.fecha_entrega_estimada} onChange={handleFormChange} disabled={isViewOnly || submitting} className="bg-card" />
                  </div>

                  <div className="space-y-2">
                    <Label>Hora (Opcional)</Label>
                    <Input type="time" name="hora_estimada" value={formData.hora_estimada} onChange={handleFormChange} disabled={isViewOnly || submitting} className="bg-card" />
                  </div>

                  {initialData && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Estado del Pedido</Label>
                      <Select value={formData.estado} onValueChange={(v) => handleSelectChange('estado', v)} disabled={isViewOnly || submitting}>
                        <SelectTrigger className="bg-card">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS.map(e => <SelectItem key={e} value={e} className="uppercase text-xs">{e.replace('_', ' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <Label>Observaciones Generales</Label>
                    <Textarea name="observaciones" value={formData.observaciones} onChange={handleFormChange} disabled={isViewOnly || submitting} className="bg-card resize-none min-h-[80px]" placeholder="Ej. Dejar con el portero..." />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Lista de Materiales / Insumos</h3>
                  {!isViewOnly && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAddMaterial} disabled={submitting} className="h-8 font-bold">
                      <Plus className="h-4 w-4 mr-1" /> Agregar Fila
                    </Button>
                  )}
                </div>

                <div className="hidden md:grid grid-cols-12 gap-3 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                  <span className="col-span-4">Material / insumo</span>
                  <span className="col-span-2">Cantidad</span>
                  <span className="col-span-2">Unidad</span>
                  <span className="col-span-3">Costo unitario estimado</span>
                  <span className="col-span-1"></span>
                </div>

                <div className="space-y-3">
                  {materiales.map((mat, index) => (
                    <div key={mat.id} className="grid grid-cols-12 gap-3 items-start bg-card p-3 rounded-xl border border-border shadow-sm">
                      <div className="col-span-12 md:col-span-4 space-y-1">
                        <Label className="text-xs md:hidden">Material / insumo</Label>
                        <Input 
                          placeholder="Ej. Cable UTP, Cámara domo..." 
                          value={mat.material_nombre} 
                          onChange={(e) => handleMaterialChange(index, 'material_nombre', e.target.value)}
                          disabled={isViewOnly || submitting}
                          className="bg-background h-9 text-sm"
                        />
                      </div>
                      
                      <div className="col-span-6 md:col-span-2 space-y-1">
                        <Label className="text-xs md:hidden">Cantidad</Label>
                        <Input 
                          type="number" 
                          min="0.1" 
                          step="0.1" 
                          value={mat.cantidad} 
                          onChange={(e) => handleMaterialChange(index, 'cantidad', e.target.value)}
                          disabled={isViewOnly || submitting}
                          className="bg-background h-9 text-sm font-variant-numeric tabular-nums"
                        />
                      </div>

                      <div className="col-span-6 md:col-span-2 space-y-1">
                        <Label className="text-xs md:hidden">Unidad</Label>
                        <Select value={mat.unidad} onValueChange={(v) => handleMaterialChange(index, 'unidad', v)} disabled={isViewOnly || submitting}>
                          <SelectTrigger className="bg-background h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIDADES.map(u => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-6 md:col-span-3 space-y-1">
                        <Label className="text-xs md:hidden">Costo unitario estimado ($)</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          value={mat.costo_unitario} 
                          onChange={(e) => handleMaterialChange(index, 'costo_unitario', e.target.value)}
                          disabled={isViewOnly || submitting}
                          className="bg-background h-9 text-sm font-variant-numeric tabular-nums"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="col-span-6 md:col-span-1 flex items-end justify-end h-full md:pb-1">
                        {!isViewOnly && materiales.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveMaterial(index)} disabled={submitting} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="col-span-12 space-y-1 mt-1 border-t border-border pt-2 border-dashed">
                        <Label className="text-xs text-muted-foreground/80">Observación (opcional)</Label>
                        <Input 
                          placeholder="Ej. Marca específica, color, urgencia..." 
                          value={mat.observaciones_item} 
                          onChange={(e) => handleMaterialChange(index, 'observaciones_item', e.target.value)}
                          disabled={isViewOnly || submitting}
                          className="bg-background h-8 text-xs italic text-muted-foreground"
                        />
                      </div>
                    </div>
                  ))}
                  {materiales.length === 0 && (
                    <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground font-medium bg-muted/20">
                      No hay materiales agregados.
                    </div>
                  )}
                </div>
              </div>
              
            </div>

            <div className="p-6 border-t bg-muted/30 shrink-0">
              <SheetFooter className="flex gap-3 sm:justify-end">
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="font-bold">
                  {isViewOnly ? 'Cerrar' : 'Cancelar'}
                </Button>
                {!isViewOnly && (
                  <Button type="submit" disabled={submitting} className="font-bold shadow-md">
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {initialData ? 'Guardar Cambios' : 'Generar Pedido'}
                  </Button>
                )}
              </SheetFooter>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default PedidoInternoFormModal;