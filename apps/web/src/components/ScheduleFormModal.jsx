import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.jsx';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command.jsx';
import { Image as ImageIcon, X, Loader2, DollarSign, Calculator, UserPlus, AlertCircle, Search, MapPinned, Copy, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { useVendedorList } from '@/hooks/useVendedorList.js';
import { useTecnicosList } from '@/hooks/useTecnicosList.js';
import { useSucursalesList } from '@/hooks/useSucursalesList.js';
import { useSchedules } from '@/hooks/useSchedules.js';
import LocationPickerModal from '@/components/LocationPickerModal.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { cn } from '@/lib/utils.js';
import { crearCobroRendicion } from '@/utils/cobrosRendicion.js';

const ScheduleFormModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const { vendors, loading: vendorsLoading } = useVendedorList();
  const { tecnicos, loading: tecnicosLoading } = useTecnicosList();
  const { sucursales, loading: sucursalesLoading } = useSucursalesList();
  const { createSchedule, updateSchedule, createClient } = useSchedules();
  
  const [clientsList, setClientsList] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStats, setPaymentStats] = useState({ cobros: 0, descuentos: 0, adicionales: 0 });

  const [clientFormData, setClientFormData] = useState({
    nombre: '', direccion: '', telefono: '', email: '', observaciones: '', tipo: 'Seguridad Electrónica'
  });

  const [formData, setFormData] = useState({
    sucursal_id: '',
    vendedor_responsable_id: '',
    tecnico_responsable_id: '',
    type: 'seguridad',
    lugar: '',
    descripcion_trabajo: '',
    fecha_programada: format(new Date(), 'yyyy-MM-dd'),
    estado: 'programado',
    monto: '',
    adelanto: '',
    observaciones: '',
    maps_link: ''
  });
  
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  // Adelanto financial handling
  const [adelantoTipo, setAdelantoTipo] = useState('directo'); // 'directo' | 'persona'
  const [adelantoCajaId, setAdelantoCajaId] = useState('');
  const [cajasList, setCajasList] = useState([]);

  // Asistencia / Relevamiento
  const [tipoEntrada, setTipoEntrada] = useState('trabajo');
  const [visitasList, setVisitasList] = useState([]);
  const [visitasLoading, setVisitasLoading] = useState(false);
  const [selectedVisitaId, setSelectedVisitaId] = useState('');
  const [selectedVisita, setSelectedVisita] = useState(null);

  const fetchVisitas = async (tipo) => {
    setVisitasLoading(true);
    try {
      const tipoVisita = tipo === 'asistencia' ? 'Asistencia' : 'Relevamiento';
      const records = await pb.collection('visitas_tecnicas').getFullList({
        filter: pb.filter('tipo_visita = {:t}', { t: tipoVisita }),
        sort: '-fecha', $autoCancel: false
      });
      setVisitasList(records);
    } catch (e) { setVisitasList([]); } finally { setVisitasLoading(false); }
  };

  const fetchCajas = async () => {
    try {
      const res = await pb.collection('cajas_bancos').getFullList({ sort: 'nombre', $autoCancel: false });
      setCajasList(res);
    } catch (_) {}
  };

  const fetchClients = async () => {
    setClientsLoading(true);
    try {
      const records = await pb.collection('clientes').getFullList({ sort: 'nombre', $autoCancel: false });
      setClientsList(records);
    } catch (e) {
      toast.error('Error al cargar la lista de clientes');
    } finally {
      setClientsLoading(false);
    }
  };

  const fetchPaymentStats = async (workId) => {
    try {
      const pays = await pb.collection('schedule_payments').getList(1, 500, {
        filter: `trabajo_id="${workId}"`,
        $autoCancel: false
      });
      const cobros = pays.items.reduce((sum, p) => sum + (p.monto_cobrado || 0), 0);
      const descuentos = pays.items.reduce((sum, p) => sum + (p.descuento || 0), 0);
      const adicionales = pays.items.reduce((sum, p) => sum + (p.adicional || 0), 0);
      setPaymentStats({ cobros, descuentos, adicionales });
    } catch (err) {
      console.error("Error fetching payment stats:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchCajas();
      setShowClientForm(false);
      setFormErrors({});
      setIsSubmitting(false);
      setPaymentStats({ cobros: 0, descuentos: 0, adicionales: 0 });
      const tipoEntradaInit = initialData?.tipo_entrada || 'trabajo';
      setTipoEntrada(tipoEntradaInit);
      setSelectedVisitaId(initialData?.visita_id || '');
      setSelectedVisita(null); setVisitasList([]);

      if (initialData) {
        setSelectedClientId(initialData.cliente_id || null);
        setFormData({
          sucursal_id: initialData.sucursal_id || '',
          vendedor_responsable_id: initialData.vendedor_id || initialData.vendedor_responsable_id || '',
          tecnico_responsable_id: initialData.tecnico_id || initialData.tecnico_responsable_id || '',
          type: initialData.tipo_trabajo || initialData.type || 'seguridad',
          lugar: initialData.lugar || '',
          descripcion_trabajo: initialData.descripcion_trabajo || '',
          fecha_programada: initialData.fecha_programada || format(new Date(), 'yyyy-MM-dd'),
          estado: initialData.estado || 'programado',
          monto: initialData.costo_total || initialData.monto || '',
          adelanto: initialData.adelanto || '',
          observaciones: initialData.observaciones || '',
          maps_link: initialData.maps_link || '',
          latitud: initialData.latitud ?? '',
          longitud: initialData.longitud ?? ''
        });
        if (initialData.id) {
          fetchPaymentStats(initialData.id);
        }
        setAdelantoTipo('directo');
        setAdelantoCajaId('');
        // Cargar visitas técnicas si se está editando una Asistencia/Relevamiento
        if (tipoEntradaInit !== 'trabajo') {
          fetchVisitas(tipoEntradaInit);
        }
      } else {
        setSelectedClientId(null);
        setAdelantoTipo('directo');
        setAdelantoCajaId('');
        setFormData({
          sucursal_id: '',
          vendedor_responsable_id: '',
          tecnico_responsable_id: '',
          type: 'seguridad',
          lugar: '',
          descripcion_trabajo: '',
          fecha_programada: format(new Date(), 'yyyy-MM-dd'),
          estado: 'programado',
          monto: '',
          adelanto: '',
          observaciones: '',
          maps_link: '',
          latitud: '',
          longitud: ''
        });
      }
      setClientFormData({ nombre: '', direccion: '', telefono: '', email: '', observaciones: '', tipo: 'Seguridad Electrónica' });
      setClientSearch('');
      setFiles([]);
      setPreviewUrls([]);
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClientSelection = (value) => {
    if (value === 'new') {
      setShowClientForm(true);
      setSelectedClientId(null);
      setFormErrors(prev => ({ ...prev, cliente: null }));
    } else {
      setShowClientForm(false);
      setSelectedClientId(value);
      setFormErrors(prev => ({ ...prev, cliente: null }));
      
      setClientPopoverOpen(false);
      const selectedClient = clientsList.find(c => c.id === value);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          lugar: (!prev.lugar || prev.lugar.trim() === '') ? (selectedClient.direccion || '') : prev.lugar
        }));
      }
    }
  };

  const handleClientFormChange = (e) => {
    const { name, value } = e.target;
    setClientFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateClientSubmit = async () => {
    if (!clientFormData.nombre.trim()) {
      setFormErrors(prev => ({ ...prev, newClientNombre: 'El nombre del cliente es obligatorio' }));
      return;
    }
    
    setFormErrors(prev => ({ ...prev, newClientNombre: null }));
    setIsCreatingClient(true);
    try {
      const newClient = await createClient(clientFormData);
      
      setSelectedClientId(newClient.id);
      setFormData(prev => ({
        ...prev,
        lugar: prev.lugar || newClient.direccion || ''
      }));
      
      await fetchClients();
      setShowClientForm(false);
      setClientFormData({ nombre: '', direccion: '', telefono: '', email: '', observaciones: '', tipo: 'Seguridad Electrónica' });
      toast.success('Cliente creado correctamente');
    } catch (err) {
      toast.error(err.message || 'Error al crear el cliente');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 10) {
      toast.error("Máximo 10 imágenes permitidas.");
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitVisita = async () => {
    if (!selectedVisitaId) { toast.error('Selecciona una asistencia/relevamiento'); return; }
    if (!formData.fecha_programada) { toast.error('La fecha programada es obligatoria'); return; }
    setIsSubmitting(true);
    try {
      const visita = selectedVisita || visitasList.find(v => v.id === selectedVisitaId);
      const authUserId = pb.authStore.record?.id || '';
      const etiqueta = tipoEntrada === 'asistencia' ? 'Asistencia' : 'Relevamiento';
      const clienteNombre = visita?.cliente_nombre || 'Sin cliente';
      const payload = {
        tipo_entrada: tipoEntrada,
        type: 'seguridad',
        visita_id: selectedVisitaId,
        cliente_id: visita?.cliente_id || '',
        cliente: clienteNombre,
        lugar: visita?.lugar || 'Sin ubicación',
        fecha_programada: formData.fecha_programada,
        estado: 'programado',
        monto: 0,
        adelanto: 0,
        saldo: 0,
        descripcion_trabajo: `${etiqueta} — ${clienteNombre}`,
        tecnico_responsable_id: formData.tecnico_responsable_id || visita?.tecnico_id || '',
        sucursal_id: visita?.sucursal_id || '',
        sucursal: visita?.sucursal_nombre || '',
        created_by: authUserId,
      };
      if (initialData?.id) {
        await pb.collection('schedules').update(initialData.id, payload, { $autoCancel: false });
        toast.success(`${tipoEntrada === 'asistencia' ? 'Asistencia' : 'Relevamiento'} actualizado`);
      } else {
        await pb.collection('schedules').create(payload, { $autoCancel: false });
        toast.success(`${tipoEntrada === 'asistencia' ? 'Asistencia' : 'Relevamiento'} agregada al cronograma`);
      }
      if (onSave) onSave(); onClose();
    } catch (err) {
      console.error('Error guardando visita en cronograma:', err?.response?.data || err);
      const d = err?.response?.data || err?.data;
      const first = d && typeof d === 'object' ? Object.keys(d)[0] : null;
      toast.error(first ? `Error en campo ${first}: ${d[first]?.message || ''}` : (err.message || 'Error al guardar'));
    } finally { setIsSubmitting(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tipoEntrada !== 'trabajo') { return handleSubmitVisita(); }

    if (!selectedClientId || selectedClientId.trim() === '') { 
      setFormErrors(prev => ({ ...prev, cliente: "Debe seleccionar o registrar un Cliente H&S válido" }));
      toast.error("Debe seleccionar un cliente"); 
      return; 
    }

    if (!formData.type) { toast.error("Selecciona un tipo de trabajo."); return; }
    if (!formData.fecha_programada) { toast.error("La fecha programada es obligatoria."); return; }
    if (!formData.lugar?.trim()) { toast.error("El lugar del trabajo es obligatorio."); return; }
    if (formData.monto === '' || formData.monto === null) { toast.error("El costo total es obligatorio."); return; }

    setFormErrors({});
    setIsSubmitting(true);

    const selectedClientObj = clientsList.find(c => c.id === selectedClientId);
    const clientName = selectedClientObj ? selectedClientObj.nombre : 'Sin cliente';

    const costo_total = parseFloat(formData.monto) || 0;
    const adelanto_recibido = parseFloat(formData.adelanto) || 0;
    const saldo = costo_total - adelanto_recibido - paymentStats.cobros - paymentStats.descuentos + paymentStats.adicionales;
    const estado_pago = saldo === 0 ? 'Pagado' : (saldo > 0 ? 'Saldo pendiente' : 'Saldo a favor');

    const data = new FormData();
    data.append('cliente_id', selectedClientId);
    data.append('cliente', clientName);
    data.append('type', formData.type);
    data.append('lugar', formData.lugar);
    data.append('fecha_programada', formData.fecha_programada);
    data.append('monto', costo_total);
    data.append('adelanto', adelanto_recibido);
    data.append('saldo', saldo);
    data.append('estado_pago', estado_pago);
    data.append('estado', formData.estado);
    
    if (formData.sucursal_id) data.append('sucursal_id', formData.sucursal_id);
    if (formData.vendedor_responsable_id) data.append('vendedor_responsable_id', formData.vendedor_responsable_id);
    if (formData.tecnico_responsable_id) data.append('tecnico_responsable_id', formData.tecnico_responsable_id);
    // Persist vendedor_id + vendedor_nombre for Cronograma/Finanzas/Dashboard/Reportes
    const vendedorObj = vendors?.find(v => v.id === formData.vendedor_responsable_id);
    data.append('vendedor_id', formData.vendedor_responsable_id || '');
    data.append('vendedor_nombre', vendedorObj?.name || '');
    if (formData.descripcion_trabajo) data.append('descripcion_trabajo', formData.descripcion_trabajo);
    if (formData.observaciones) data.append('observaciones', formData.observaciones);
    data.append('maps_link', formData.maps_link || '');
    if (formData.latitud !== '' && formData.latitud !== null && formData.latitud !== undefined) data.append('latitud', formData.latitud);
    if (formData.longitud !== '' && formData.longitud !== null && formData.longitud !== undefined) data.append('longitud', formData.longitud);

    files.forEach(file => data.append('fotografias', file));

    try {
      let savedRecord;
      if (initialData?.id) {
        savedRecord = await updateSchedule(initialData.id, data);
      } else {
        savedRecord = await createSchedule(data);
      }
      const savedJobId = savedRecord?.id || initialData?.id;

      // Handle adelanto — create schedule_payments record (Cobros/Rendición)
      if (adelanto_recibido > 0 && savedJobId) {
        const authUserId = pb.authStore.record?.id || '';
        const sucursalNombre = sucursales?.find(s => s.id === formData.sucursal_id)?.nombre || '';
        const cobradorId = authUserId;
        const cobradorNombre = vendors?.find(v => v.id === formData.vendedor_responsable_id)?.name
          || tecnicos?.find(t => t.id === formData.tecnico_responsable_id)?.nombre
          || pb.authStore.record?.name || '';
        const vendNombre = vendors?.find(v => v.id === formData.vendedor_responsable_id)?.name || '';

        // Dedup: skip if Adelanto already registered for this job
        let alreadyExists = false;
        try {
          const check = await pb.collection('schedule_payments').getList(1, 1, {
            filter: pb.filter('trabajo_id = {:jid} && tipo = "Adelanto"', { jid: savedJobId }),
            $autoCancel: false,
          });
          alreadyExists = check.totalItems > 0;
        } catch (_) { alreadyExists = false; }

        if (!alreadyExists) {
          const cajaSel = adelantoCajaId ? cajasList.find(c => c.id === adelantoCajaId) : null;
          const esDirecto = adelantoTipo === 'directo' && !!adelantoCajaId;
          try {
            await crearCobroRendicion({
              trabajo_id: savedJobId,
              tipo: 'Adelanto',
              monto: adelanto_recibido,
              metodo_pago: 'efectivo',
              cliente_nombre: clientName,
              sucursal_nombre: sucursalNombre,
              vendedor_nombre: vendNombre,
              cobrado_por_id: cobradorId,
              cobrado_por_nombre: cobradorNombre,
              origen: 'trabajo_adelanto',
              confirmado: esDirecto,
              caja_banco_id: adelantoCajaId || '',
              caja_banco_nombre: cajaSel?.nombre || '',
              observacion: 'Adelanto de trabajo',
            });
          } catch (spErr) {
            console.error('Error creando Cobro/Rendición (adelanto):', spErr?.response?.data || spErr);
            toast.error('Trabajo guardado, pero el adelanto no se registró en Cobros/Rendición.');
          }

          // If Admin/Ventas selected direct-to-caja, also create movimiento immediately
          if (esDirecto) {
            try {
              const caja = adelantoCajaId ? cajasList.find(c => c.id === adelantoCajaId) : null;
              await pb.collection('movimientos').create({
                tipo: 'ingreso',
                categoria: 'Cobro de trabajo',
                descripcion: `Adelanto trabajo — ${clientName}`,
                fecha: formData.fecha_programada,
                monto: adelanto_recibido,
                caja_banco_id: adelantoCajaId || '',
                caja_banco_nombre: caja?.nombre || '',
                trabajo_id: savedJobId,
                cliente_nombre: clientName,
                estado: 'confirmado',
                origen: 'adelanto_trabajo',
                id_origen: savedJobId,
                created_by: authUserId,
              }, { $autoCancel: false });
            } catch (movErr) {
              console.error('Error registrando movimiento del adelanto:', movErr?.response?.data || movErr);
            }
          }
        }
      }

      toast.success("Trabajo guardado correctamente");
      if (onSave) onSave();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar la información.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const costo = parseFloat(formData.monto) || 0;
  const adelanto = parseFloat(formData.adelanto) || 0;
  const saldoCalculado = costo - adelanto - paymentStats.cobros - paymentStats.descuentos + paymentStats.adicionales;

  const isVisitaMode = tipoEntrada !== 'trabajo';
  const isSaveDisabled = isSubmitting || isCreatingClient || showClientForm || !selectedClientId;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !isCreatingClient && onClose(open)}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-background rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold tracking-tight">
            {initialData
              ? (isVisitaMode
                  ? `Editar ${tipoEntrada === 'asistencia' ? 'Asistencia' : 'Relevamiento'}`
                  : 'Editar Trabajo')
              : 'Registrar Trabajo H&S'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Completa los detalles para asignar o actualizar una orden de trabajo.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-2">

          {!initialData && (
            <div className="flex gap-1 p-1 bg-muted rounded-xl border border-border">
              {[{k:'trabajo',l:'Trabajo'},{k:'asistencia',l:'Asistencia'},{k:'relevamiento',l:'Relevamiento'}].map(({k,l}) => (
                <button key={k} type="button"
                  onClick={() => { setTipoEntrada(k); setSelectedVisitaId(''); setSelectedVisita(null); if (k !== 'trabajo') fetchVisitas(k); }}
                  className={`flex-1 px-3 py-2 rounded-lg font-bold text-sm transition-all ${tipoEntrada===k ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                >{l}</button>
              ))}
            </div>
          )}

          {isVisitaMode && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Fecha Programada <span className="text-destructive">*</span></Label>
                <Input type="date" name="fecha_programada" value={formData.fecha_programada} onChange={handleChange} className="bg-card font-medium" disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label>{tipoEntrada === 'asistencia' ? 'Asistencia' : 'Relevamiento'} existente <span className="text-destructive">*</span></Label>
                {visitasLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</div> : (
                  <Select value={selectedVisitaId} onValueChange={(val) => { setSelectedVisitaId(val); setSelectedVisita(visitasList.find(x => x.id === val) || null); }} disabled={isSubmitting}>
                    <SelectTrigger className="bg-card font-medium"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {visitasList.length === 0 && <SelectItem value="_vacio">Sin registros disponibles</SelectItem>}
                      {visitasList.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.cliente_nombre || '—'} — {v.fecha ? String(v.fecha).split(' ')[0].split('T')[0] : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedVisita && (
                  <div className="mt-2 p-3 rounded-lg border border-border bg-muted/30 text-sm space-y-1">
                    <p className="font-bold">{selectedVisita.cliente_nombre}</p>
                    {selectedVisita.lugar && <p className="text-muted-foreground text-xs">{selectedVisita.lugar}</p>}
                    {parseFloat(selectedVisita.cobro || selectedVisita.monto_cobrado || 0) > 0 && (
                      <p className="text-xs text-orange-600 font-medium">Cobro registrado: ${parseFloat(selectedVisita.cobro || selectedVisita.monto_cobrado || 0).toFixed(2)}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Técnico</Label>
                <Select value={formData.tecnico_responsable_id} onValueChange={(val) => handleChange({ target: { name: 'tecnico_responsable_id', value: val }})} disabled={isSubmitting}>
                  <SelectTrigger className="bg-card">{tecnicosLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue placeholder="Opcional" />}</SelectTrigger>
                  <SelectContent>{tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selectedVisita?.sucursal_nombre && (
                <div className="p-3 rounded-lg border border-border bg-muted/30 text-sm">
                  <span className="text-muted-foreground text-xs font-medium">Sucursal (heredada de la {tipoEntrada === 'asistencia' ? 'asistencia' : 'relevamiento'}): </span>
                  <span className="font-bold">{selectedVisita.sucursal_nombre}</span>
                </div>
              )}
            </div>
          )}

          {!isVisitaMode && (
          <div className="bg-muted/40 p-5 rounded-2xl border border-border">
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente H&S <span className="text-destructive">*</span></Label>
              <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                <PopoverTrigger asChild disabled={isSubmitting || isCreatingClient}>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientPopoverOpen}
                    className={cn("w-full justify-between bg-card text-foreground font-bold h-10", formErrors.cliente ? "border-destructive/50 ring-1 ring-destructive/20" : "border-primary/20")}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Search className="h-4 w-4 shrink-0 opacity-60" />
                      {clientsLoading ? 'Cargando clientes...' : (
                        selectedClientId
                          ? (clientsList.find(c => c.id === selectedClientId)?.nombre || 'Cliente seleccionado')
                          : <span className="text-muted-foreground font-medium">Buscar cliente por nombre, teléfono o contacto</span>
                      )}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command
                    filter={(value, search) => {
                      if (value === 'new') return 1;
                      return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                    }}
                  >
                    <CommandInput placeholder="Buscar por nombre, teléfono o contacto..." value={clientSearch} onValueChange={setClientSearch} />
                    <CommandList>
                      <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="new" onSelect={() => handleClientSelection('new')} className="font-black text-primary">
                          <UserPlus className="h-4 w-4 mr-2" /> Registrar Nuevo Cliente
                        </CommandItem>
                        {clientsList.map(c => (
                          <CommandItem
                            key={c.id}
                            value={`${c.nombre} ${c.telefono || ''} ${c.contacto || ''} ${c.email || ''}`}
                            onSelect={() => handleClientSelection(c.id)}
                            className="font-medium"
                          >
                            <Check className={cn("h-4 w-4 mr-2", selectedClientId === c.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col">
                              <span className="font-bold">{c.nombre}</span>
                              {(c.telefono || c.contacto) && (
                                <span className="text-xs text-muted-foreground">{[c.contacto, c.telefono].filter(Boolean).join(' · ')}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {formErrors.cliente && (
                <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {formErrors.cliente}
                </p>
              )}
            </div>

            {showClientForm && (
              <div className="mt-4 p-5 border border-primary/30 rounded-xl bg-card shadow-md space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Crear Nuevo Cliente</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nombre / Razón Social <span className="text-destructive">*</span></Label>
                    <Input name="nombre" value={clientFormData.nombre} onChange={handleClientFormChange} placeholder="Empresa S.A." disabled={isCreatingClient} className={formErrors.newClientNombre ? "border-destructive" : ""} />
                    {formErrors.newClientNombre && <p className="text-xs text-destructive">{formErrors.newClientNombre}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input name="telefono" value={clientFormData.telefono} onChange={handleClientFormChange} placeholder="Celular/Fijo" disabled={isCreatingClient} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input name="email" type="email" value={clientFormData.email} onChange={handleClientFormChange} placeholder="correo@ejemplo.com" disabled={isCreatingClient} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Dirección</Label>
                    <Input name="direccion" value={clientFormData.direccion} onChange={handleClientFormChange} placeholder="Dirección principal" disabled={isCreatingClient} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Observaciones</Label>
                    <Textarea name="observaciones" value={clientFormData.observaciones} onChange={handleClientFormChange} placeholder="Detalles adicionales del cliente" disabled={isCreatingClient} className="min-h-[60px]" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setShowClientForm(false); setFormErrors(prev => ({...prev, newClientNombre: null})); }} disabled={isCreatingClient}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleCreateClientSubmit} disabled={isCreatingClient || !clientFormData.nombre.trim()} className="bg-primary text-primary-foreground font-bold">
                    {isCreatingClient ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Crear Cliente
                  </Button>
                </div>
              </div>
            )}
          </div>
          )}

          {!isVisitaMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2">
              <Label>Lugar del trabajo <span className="text-destructive">*</span></Label>
              <Input name="lugar" value={formData.lugar} onChange={handleChange} className="bg-card font-medium" required disabled={isSubmitting} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-1.5"><MapPinned className="h-3.5 w-3.5" /> Link de Google Maps (opcional)</Label>
              <Input name="maps_link" value={formData.maps_link} onChange={handleChange} placeholder="https://maps.google.com/..." className="bg-card font-medium" disabled={isSubmitting} />
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-bold text-xs h-8"
                  disabled={!formData.maps_link?.trim() && !formData.lugar?.trim()}
                  onClick={() => {
                    const link = formData.maps_link?.trim();
                    const url = link
                      ? link
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.lugar?.trim() || '')}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <MapPinned className="h-3.5 w-3.5 mr-1.5" /> Abrir en Google Maps
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="font-bold text-xs h-8"
                  onClick={() => {
                    const pasted = window.prompt('Pega el link de Google Maps de la ubicación (o busca la dirección en Google Maps y copia el enlace):', formData.maps_link || '');
                    if (pasted === null) return;
                    const trimmed = pasted.trim();
                    setFormData(prev => ({ ...prev, maps_link: trimmed }));
                    if (trimmed) toast.success('Ubicación guardada en el link de Google Maps');
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Seleccionar ubicación
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-bold text-xs h-8"
                  disabled={isSubmitting}
                  onClick={() => setIsLocationPickerOpen(true)}
                >
                  <MapPinned className="h-3.5 w-3.5 mr-1.5" /> Marcar ubicación en mapa
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sucursal (Base)</Label>
              <Select value={formData.sucursal_id} onValueChange={(val) => handleChange({ target: { name: 'sucursal_id', value: val }})} disabled={isSubmitting}>
                <SelectTrigger className="bg-card">
                  {sucursalesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue placeholder="Opcional" />}
                </SelectTrigger>
                <SelectContent>
                  {sucursales.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Trabajo <span className="text-destructive">*</span></Label>
              <Select value={formData.type} onValueChange={(val) => handleChange({ target: { name: 'type', value: val }})} disabled={isSubmitting}>
                <SelectTrigger className="bg-card font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seguridad" className="font-medium text-blue-600 focus:bg-blue-50">Seguridad Electrónica</SelectItem>
                  <SelectItem value="proyectos" className="font-medium text-red-600 focus:bg-red-50">Proyecto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vendedor Responsable</Label>
              <Select value={formData.vendedor_responsable_id} onValueChange={(val) => handleChange({ target: { name: 'vendedor_responsable_id', value: val }})} disabled={isSubmitting}>
                <SelectTrigger className="bg-card">
                  {vendorsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue placeholder="Seleccionar (Opcional)" />}
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Técnico a Cargo</Label>
              <Select value={formData.tecnico_responsable_id} onValueChange={(val) => handleChange({ target: { name: 'tecnico_responsable_id', value: val }})} disabled={isSubmitting}>
                <SelectTrigger className="bg-card">
                  {tecnicosLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue placeholder="Seleccionar (Opcional)" />}
                </SelectTrigger>
                <SelectContent>
                  {tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Descripción de la labor</Label>
              <Textarea name="descripcion_trabajo" value={formData.descripcion_trabajo} onChange={handleChange} className="bg-card min-h-[80px]" disabled={isSubmitting} />
            </div>
            
            <div className="space-y-2">
              <Label>Fecha Programada <span className="text-destructive">*</span></Label>
              <Input type="date" name="fecha_programada" value={formData.fecha_programada} onChange={handleChange} className="bg-card font-medium" required disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <Label>Estado Inicial</Label>
              <Select value={formData.estado} onValueChange={(val) => handleChange({ target: { name: 'estado', value: val }})} disabled={isSubmitting}>
                <SelectTrigger className="bg-card font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="programado">Pendiente (Programado)</SelectItem>
                  <SelectItem value="en_proceso">En progreso</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="terminado">Cancelado / Terminado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-border bg-card mt-2 shadow-sm">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5"/> Costo Total <span className="text-destructive">*</span></Label>
                <Input name="monto" type="number" step="0.01" value={formData.monto} onChange={handleChange} className="font-variant-numeric tabular-nums font-bold" required disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-blue-600"><DollarSign className="h-3.5 w-3.5"/> Adelanto Recibido</Label>
                <Input name="adelanto" type="number" step="0.01" value={formData.adelanto} onChange={handleChange} className="font-variant-numeric tabular-nums text-blue-600 font-bold border-blue-200" disabled={isSubmitting} />
                {adelanto > 0 && (
                  <div className="mt-2 space-y-2 p-3 rounded-lg border border-blue-200 bg-blue-50">
                    <p className="text-[11px] font-bold text-blue-700">¿Cómo se recibió el adelanto?</p>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium">
                        <input type="radio" name="adelantoTipo" value="directo" checked={adelantoTipo === 'directo'} onChange={() => setAdelantoTipo('directo')} className="accent-blue-600" />
                        Directo a caja/banco
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium">
                        <input type="radio" name="adelantoTipo" value="persona" checked={adelantoTipo === 'persona'} onChange={() => setAdelantoTipo('persona')} className="accent-blue-600" />
                        Lo cobró vendedor/técnico
                      </label>
                    </div>
                    {adelantoTipo === 'directo' && (
                      <select
                        value={adelantoCajaId}
                        onChange={e => setAdelantoCajaId(e.target.value)}
                        className="w-full text-xs border border-blue-200 rounded-md px-2 py-1.5 bg-white font-medium"
                        disabled={isSubmitting}
                      >
                        <option value="">Sin caja específica</option>
                        {cajasList.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>)}
                      </select>
                    )}
                    {adelantoTipo === 'persona' && (
                      <p className="text-[11px] text-blue-600 font-medium">Se creará una rendición pendiente a nombre del vendedor/técnico asignado.</p>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-destructive"><Calculator className="h-3.5 w-3.5"/> Saldo (Calculado)</Label>
                <Input value={saldoCalculado.toFixed(2)} readOnly className="font-variant-numeric tabular-nums bg-muted/50 text-destructive font-black border-destructive/20 focus-visible:ring-0" tabIndex={-1} />
              </div>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Observaciones Internas</Label>
              <Textarea name="observaciones" value={formData.observaciones} onChange={handleChange} className="bg-card min-h-[60px]" disabled={isSubmitting} />
            </div>
          </div>
          )}

          {!isVisitaMode && (
          <div className="space-y-2 pt-4 border-t border-border">
            <Label>Evidencia Fotográfica</Label>
            {previewUrls.length > 0 && (
              <div className="flex gap-3 overflow-x-auto py-2">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden border shadow-sm">
                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black" disabled={isSubmitting}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center pt-1">
              <label className={cn("cursor-pointer flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-2.5 rounded-lg border border-primary/20", isSubmitting && "opacity-50 pointer-events-none")}>
                <ImageIcon className="h-5 w-5" /> Subir fotografías (Máx 10)
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} disabled={isSubmitting} />
              </label>
            </div>
          </div>
          )}

          <DialogFooter className="pt-6 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="font-bold">Cancelar</Button>
            <Button type="submit"
              disabled={isVisitaMode ? (isSubmitting || !selectedVisitaId) : isSaveDisabled}
              className="font-bold px-8 shadow-md hover:-translate-y-0.5 transition-transform">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (
                isVisitaMode ? (initialData ? 'Guardar Cambios' : 'Agregar al Cronograma') : initialData ? 'Guardar Cambios' : 'Guardar Trabajo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        initialLugar={formData.lugar}
        initialMapsLink={formData.maps_link}
        initialLat={formData.latitud}
        initialLng={formData.longitud}
        onConfirm={({ lugar, latitud, longitud, google_maps_link }) => {
          setFormData(prev => ({
            ...prev,
            lugar: lugar || prev.lugar,
            maps_link: google_maps_link || prev.maps_link,
            latitud: latitud ?? prev.latitud,
            longitud: longitud ?? prev.longitud
          }));
          toast.success('Ubicación confirmada correctamente');
        }}
      />
    </Dialog>
  );
};

export default ScheduleFormModal;