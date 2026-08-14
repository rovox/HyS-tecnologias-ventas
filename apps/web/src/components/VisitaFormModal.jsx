import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.jsx';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Search, UserPlus, Loader2 } from 'lucide-react';

const calcGarantiaHasta = (fechaInstalacion) => {
  if (!fechaInstalacion) return '';
  try {
    const d = new Date(fechaInstalacion);
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  } catch { return ''; }
};

const calcEstadoGarantia = (garantiaHasta) => {
  if (!garantiaHasta) return 'Verificar';
  try {
    const hoy = new Date();
    const hasta = new Date(garantiaHasta);
    return hoy <= hasta ? 'En garantía' : 'Fuera de garantía';
  } catch { return 'Verificar'; }
};

const fmtDateShort = (d) => {
  if (!d) return '';
  const s = String(d).split(' ')[0].split('T')[0];
  const parts = s.split('-');
  if (parts.length !== 3) return s;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// Searchable combobox component
const SearchableSelect = ({ items, value, onSelect, placeholder, displayFn, keyFn, searchFn, onCreateNew, createNewLabel }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 80);
    const q = query.toLowerCase();
    return items.filter(item => searchFn(item, q)).slice(0, 80);
  }, [items, query, searchFn]);

  const selectedItem = items.find(item => keyFn(item) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open}
          className="w-full justify-between font-normal text-left h-10 px-3">
          <span className="truncate">{selectedItem ? displayFn(selectedItem) : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar..." value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              <CommandItem value="_none" onSelect={() => { onSelect(''); setOpen(false); setQuery(''); }}>
                <span className="text-muted-foreground italic">Sin seleccionar</span>
              </CommandItem>
              {onCreateNew && (
                <CommandItem value="_new" onSelect={() => { onCreateNew(); setOpen(false); setQuery(''); }} className="font-black text-primary">
                  <UserPlus className="mr-2 h-4 w-4" /> {createNewLabel || 'Crear nuevo cliente'}
                </CommandItem>
              )}
              {filtered.map(item => (
                <CommandItem key={keyFn(item)} value={keyFn(item)}
                  onSelect={() => { onSelect(keyFn(item)); setOpen(false); setQuery(''); }}>
                  <Check className={`mr-2 h-4 w-4 ${keyFn(item) === value ? 'opacity-100' : 'opacity-0'}`} />
                  <span className="truncate">{displayFn(item)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const VisitaFormModal = ({ isOpen, onClose, onSave, initialData = {} }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [trabajosAll, setTrabajosAll] = useState([]);
  const [equiposByTrabajo, setEquiposByTrabajo] = useState([]);

  // New client creation modal
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ nombre: '', telefono: '', email: '', direccion: '' });
  const [creatingClient, setCreatingClient] = useState(false);

  const [form, setForm] = useState({
    cliente_id: '',
    tipo_visita: 'Asistencia',
    sucursal_id: '',
    lugar: '',
    google_maps_link: '',
    tecnico_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '',
    prioridad: 'media',
    estado: 'programado',
    // Asistencia
    motivo: '',
    problema_reportado: '',
    equipo_afectado: '',
    causa_probable: '',
    diagnostico: '',
    solucion: '',
    requiere_material: false,
    requiere_volver: false,
    dentro_garantia: false,
    // Garantía
    trabajo_relacionado_id: '',
    fecha_instalacion_relacionada: '',
    garantia_hasta: '',
    estado_garantia: 'Verificar',
    se_cobra: false,
    monto_cobrado: '',
    medio_pago: '',
    cobro_pendiente_rendicion: false,
    // Relevamiento
    necesidad_cliente: '',
    area_revisar: '',
    medidas_puntos: '',
    cantidad_estimada: '',
    observacion_tecnica: '',
    requiere_cotizacion: false,
    // Common
    observacion_final: '',
  });

  useEffect(() => {
    if (initialData && initialData.id) {
      setForm(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData?.id]);

  useEffect(() => {
    const load = async () => {
      const [c, t, s, tr] = await Promise.all([
        pb.collection('clientes').getFullList({ sort: 'nombre', requestKey: 'vfm-clientes' }).catch(() => []),
        pb.collection('tecnicos').getFullList({ sort: 'nombre', requestKey: 'vfm-tecnicos' }).catch(() => []),
        pb.collection('sucursales').getFullList({ filter: 'activa = true', sort: 'nombre', requestKey: 'vfm-sucursales' }).catch(() => []),
        pb.collection('schedules').getFullList({ sort: '-fecha_programada', fields: 'id,lugar,cliente_id,fecha_programada,google_maps_link,sucursal,sucursal_nombre,tipo', requestKey: 'vfm-trabajos' }).catch(() => []),
      ]);
      setClientes(c);
      setTecnicos(t);
      setSucursales(s);
      setTrabajosAll(tr);
    };
    if (isOpen) load();
  }, [isOpen]);

  // Filter trabajos by selected cliente
  const trabajosFiltrados = useMemo(() => {
    if (!form.cliente_id) return trabajosAll;
    return trabajosAll.filter(t => t.cliente_id === form.cliente_id);
  }, [form.cliente_id, trabajosAll]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleFechaInstalacion = (v) => {
    const gh = calcGarantiaHasta(v);
    const eg = calcEstadoGarantia(gh);
    setForm(prev => ({ ...prev, fecha_instalacion_relacionada: v, garantia_hasta: gh, estado_garantia: eg }));
  };

  const handleGarantiaHasta = (v) => {
    const eg = calcEstadoGarantia(v);
    setForm(prev => ({ ...prev, garantia_hasta: v, estado_garantia: eg }));
  };

  // Auto-fill when trabajo relacionado is selected
  const handleTrabajoRelacionado = async (trabajoId) => {
    set('trabajo_relacionado_id', trabajoId);
    if (!trabajoId) {
      setEquiposByTrabajo([]);
      return;
    }
    const trabajo = trabajosAll.find(t => t.id === trabajoId);
    if (trabajo) {
      const fechaInst = trabajo.fecha_programada ? trabajo.fecha_programada.split(' ')[0].split('T')[0] : '';
      const gh = calcGarantiaHasta(fechaInst);
      const eg = calcEstadoGarantia(gh);
      setForm(prev => ({
        ...prev,
        trabajo_relacionado_id: trabajoId,
        fecha_instalacion_relacionada: fechaInst,
        garantia_hasta: gh,
        estado_garantia: eg,
        lugar: trabajo.lugar || prev.lugar,
        google_maps_link: trabajo.google_maps_link || prev.google_maps_link,
      }));
      // Load equipos installed for this trabajo
      try {
        const equipos = await pb.collection('equipos_instalados').getFullList({
          filter: `trabajo_id="${trabajoId}"`,
          fields: 'id,equipo_nombre,marca_modelo,cantidad',
          requestKey: 'vfm-equipos',
        });
        setEquiposByTrabajo(equipos);
      } catch { setEquiposByTrabajo([]); }
    }
  };

  const openNewClientModal = () => {
    setNewClient({ nombre: '', telefono: '', email: '', direccion: '' });
    setShowNewClientModal(true);
  };

  const handleCreateNewClient = async () => {
    if (!newClient.nombre.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }
    setCreatingClient(true);
    try {
      // Check duplicate by exact name
      const existing = await pb.collection('clientes').getList(1, 1, {
        filter: `nombre = "${newClient.nombre.trim()}"`,
        requestKey: 'vfm-dup',
      });
      if (existing.items.length > 0) {
        toast.error('Ya existe un cliente con ese nombre');
        return;
      }
      const record = await pb.collection('clientes').create({
        nombre: newClient.nombre.trim(),
        telefono: newClient.telefono || '',
        email: newClient.email || '',
        direccion: newClient.direccion || '',
        tipo: 'Seguridad Electrónica',
        created_by: currentUser?.id || '',
      }, { requestKey: 'vfm-create-client' });
      // Refresh client list and auto-select
      const refreshed = await pb.collection('clientes').getFullList({ sort: 'nombre', requestKey: 'vfm-clientes-refresh' }).catch(() => []);
      setClientes(refreshed);
      setForm(prev => ({ ...prev, cliente_id: record.id, lugar: prev.lugar || newClient.direccion || '' }));
      setShowNewClientModal(false);
      toast.success('Cliente creado correctamente');
    } catch (err) {
      toast.error('Error al crear cliente: ' + (err.message || 'Error desconocido'));
    } finally {
      setCreatingClient(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const clienteObj = clientes.find(c => c.id === form.cliente_id);
      const tecnicoObj = tecnicos.find(t => t.id === form.tecnico_id);
      const sucursalObj = sucursales.find(s => s.id === form.sucursal_id);

      const data = {
        ...form,
        cliente_nombre: clienteObj?.nombre || '',
        tecnico_nombre: tecnicoObj?.nombre || '',
        sucursal_nombre: sucursalObj?.nombre || '',
        cantidad_estimada: form.cantidad_estimada ? Number(form.cantidad_estimada) : null,
        monto_cobrado: form.monto_cobrado ? Number(form.monto_cobrado) : null,
        created_by: currentUser?.id || '',
        updated_by: currentUser?.id || '',
      };

      if (initialData?.id) {
        await pb.collection('visitas_tecnicas').update(initialData.id, data);
        toast.success('Visita actualizada');
      } else {
        await pb.collection('visitas_tecnicas').create(data);
        toast.success('Visita registrada');
      }
      onSave();
    } catch (err) {
      toast.error('Error al guardar: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const esNuevo = !initialData?.id;
  const esAsistencia = form.tipo_visita === 'Asistencia' && !esNuevo;
  const esRelevamiento = form.tipo_visita === 'Relevamiento' && !esNuevo;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {initialData?.id ? 'Editar visita' : 'Nueva visita técnica'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Base fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <Label>Cliente H&S *</Label>
              <SearchableSelect
                items={clientes}
                value={form.cliente_id}
                onSelect={v => { set('cliente_id', v); set('trabajo_relacionado_id', ''); setEquiposByTrabajo([]); }}
                placeholder="Buscar cliente..."
                displayFn={c => c.nombre}
                keyFn={c => c.id}
                searchFn={(c, q) => (c.nombre || '').toLowerCase().includes(q)}
                onCreateNew={openNewClientModal}
                createNewLabel="Crear nuevo cliente"
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo de visita *</Label>
              <Select value={form.tipo_visita} onValueChange={v => set('tipo_visita', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asistencia">Asistencia</SelectItem>
                  <SelectItem value="Relevamiento">Relevamiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Sucursal</Label>
              <Select value={form.sucursal_id || 'none'} onValueChange={v => set('sucursal_id', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar sucursal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {sucursales.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Técnico asignado</Label>
              <SearchableSelect
                items={tecnicos}
                value={form.tecnico_id}
                onSelect={v => set('tecnico_id', v)}
                placeholder="Buscar técnico..."
                displayFn={t => t.nombre}
                keyFn={t => t.id}
                searchFn={(t, q) => (t.nombre || '').toLowerCase().includes(q)}
              />
            </div>
            <div className="space-y-1">
              <Label>Fecha *</Label>
              <Input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required />
            </div>
            {!esNuevo && (<div className="space-y-1">
              <Label>Hora aproximada</Label>
              <Input type="time" value={form.hora} onChange={e => set('hora', e.target.value)} />
            </div>)}
            {!esNuevo && (<div className="space-y-1">
              <Label>Prioridad</Label>
              <Select value={form.prioridad} onValueChange={v => set('prioridad', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>)}
            {!esNuevo && (<div className="space-y-1">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={v => set('estado', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="programado">Programado</SelectItem>
                  <SelectItem value="en_camino">En camino</SelectItem>
                  <SelectItem value="en_atencion">En atención</SelectItem>
                  <SelectItem value="resuelto">Resuelto</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>)}
          </div>

          <div className="space-y-1">
            <Label>Dirección / Lugar</Label>
            <Input value={form.lugar} onChange={e => set('lugar', e.target.value)} placeholder="Ej: Calle Lanza #123, Cochabamba" />
          </div>
          {!esNuevo && (<div className="space-y-1">
            <Label>URL Google Maps</Label>
            <Input value={form.google_maps_link} onChange={e => set('google_maps_link', e.target.value)} placeholder="https://maps.google.com/..." />
          </div>)}

          {/* Asistencia fields */}
          {esAsistencia && (
            <>
              <div className="space-y-4 border rounded-xl p-4 bg-blue-50 dark:bg-blue-950/20">
                <p className="font-extrabold text-sm text-blue-700 dark:text-blue-300">Datos de asistencia</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Motivo de asistencia</Label>
                    <Input value={form.motivo} onChange={e => set('motivo', e.target.value)} placeholder="Motivo..." />
                  </div>
                  <div className="space-y-1">
                    <Label>Equipo afectado</Label>
                    <Input value={form.equipo_afectado} onChange={e => set('equipo_afectado', e.target.value)} placeholder="Cámara, DVR, NVR, alarma, red..." />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Problema reportado por el cliente</Label>
                  <Textarea value={form.problema_reportado} onChange={e => set('problema_reportado', e.target.value)} rows={2} placeholder="Descripción del problema..." />
                </div>
                <div className="space-y-1">
                  <Label>Causa probable</Label>
                  <Input value={form.causa_probable} onChange={e => set('causa_probable', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Diagnóstico técnico</Label>
                  <Textarea value={form.diagnostico} onChange={e => set('diagnostico', e.target.value)} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label>Solución realizada</Label>
                  <Textarea value={form.solucion} onChange={e => set('solucion', e.target.value)} rows={2} />
                </div>
                <div className="flex gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Switch checked={!!form.requiere_material} onCheckedChange={v => set('requiere_material', v)} id="req-mat" />
                    <Label htmlFor="req-mat">Requiere material</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={!!form.requiere_volver} onCheckedChange={v => set('requiere_volver', v)} id="req-vol" />
                    <Label htmlFor="req-vol">Requiere volver</Label>
                  </div>
                </div>
              </div>

              {/* Garantía y cobro */}
              <div className="space-y-4 border rounded-xl p-4 bg-amber-50 dark:bg-amber-950/20">
                <p className="font-extrabold text-sm text-amber-700 dark:text-amber-300">Garantía y cobro</p>

                {/* Trabajo relacionado con buscador */}
                <div className="space-y-1">
                  <Label>Trabajo relacionado (instalación previa del cliente)</Label>
                  <SearchableSelect
                    items={trabajosFiltrados}
                    value={form.trabajo_relacionado_id}
                    onSelect={handleTrabajoRelacionado}
                    placeholder={form.cliente_id ? 'Buscar trabajo del cliente...' : 'Seleccione cliente primero'}
                    displayFn={t => {
                      const fecha = fmtDateShort(t.fecha_programada);
                      return `${t.lugar || 'Sin lugar'} — ${fecha}${t.sucursal ? ` — ${t.sucursal}` : ''}`;
                    }}
                    keyFn={t => t.id}
                    searchFn={(t, q) => {
                      const haystack = `${t.lugar || ''} ${t.sucursal || ''} ${t.fecha_programada || ''}`.toLowerCase();
                      return haystack.includes(q);
                    }}
                  />
                  {!form.cliente_id && (
                    <p className="text-xs text-muted-foreground">Seleccione un cliente para filtrar sus trabajos</p>
                  )}
                  {form.cliente_id && trabajosFiltrados.length === 0 && (
                    <p className="text-xs text-amber-600">Este cliente no tiene trabajos registrados</p>
                  )}
                </div>

                {/* Equipos instalados del trabajo */}
                {equiposByTrabajo.length > 0 && (
                  <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 px-3 py-2 text-xs space-y-1">
                    <p className="font-bold text-amber-800 dark:text-amber-200">Equipos instalados en ese trabajo:</p>
                    {equiposByTrabajo.map(eq => (
                      <div key={eq.id} className="text-amber-700 dark:text-amber-300">
                        • {eq.equipo_nombre}{eq.marca_modelo ? ` (${eq.marca_modelo})` : ''}{eq.cantidad > 1 ? ` ×${eq.cantidad}` : ''}
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Fecha de instalación relacionada</Label>
                    <Input type="date" value={form.fecha_instalacion_relacionada} onChange={e => handleFechaInstalacion(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Garantía hasta (auto: +1 año)</Label>
                    <Input type="date" value={form.garantia_hasta} onChange={e => handleGarantiaHasta(e.target.value)} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Estado de garantía</Label>
                    <Select value={form.estado_garantia || 'Verificar'} onValueChange={v => set('estado_garantia', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="En garantía">En garantía</SelectItem>
                        <SelectItem value="Fuera de garantía">Fuera de garantía</SelectItem>
                        <SelectItem value="Verificar">Verificar</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.garantia_hasta && (
                      <p className={`text-xs font-bold mt-1 ${form.estado_garantia === 'En garantía' ? 'text-green-600' : form.estado_garantia === 'Fuera de garantía' ? 'text-red-600' : 'text-amber-600'}`}>
                        {form.estado_garantia === 'En garantía' && `Garantía vigente hasta ${fmtDateShort(form.garantia_hasta)}`}
                        {form.estado_garantia === 'Fuera de garantía' && `Garantía venció el ${fmtDateShort(form.garantia_hasta)}`}
                        {form.estado_garantia === 'Verificar' && 'Verificar manualmente'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Switch checked={!!form.se_cobra} onCheckedChange={v => set('se_cobra', v)} id="se-cobra" />
                  <Label htmlFor="se-cobra" className="font-bold">¿Se cobra esta asistencia?</Label>
                </div>

                {form.se_cobra && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <Label>Monto cobrado (Bs)</Label>
                      <Input type="number" min={0} step={0.01} value={form.monto_cobrado} onChange={e => set('monto_cobrado', e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-1">
                      <Label>Medio de pago</Label>
                      <Select value={form.medio_pago || 'none'} onValueChange={v => set('medio_pago', v === 'none' ? '' : v)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin especificar</SelectItem>
                          <SelectItem value="Efectivo">Efectivo</SelectItem>
                          <SelectItem value="QR">QR</SelectItem>
                          <SelectItem value="Transferencia">Transferencia</SelectItem>
                          <SelectItem value="Débito">Débito</SelectItem>
                          <SelectItem value="Crédito">Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <Switch checked={!!form.cobro_pendiente_rendicion} onCheckedChange={v => set('cobro_pendiente_rendicion', v)} id="cobro-rend" />
                      <Label htmlFor="cobro-rend">Cobro pendiente de rendición (técnico cobró)</Label>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Relevamiento fields */}
          {esRelevamiento && (
            <div className="space-y-4 border rounded-xl p-4 bg-green-50 dark:bg-green-950/20">
              <p className="font-extrabold text-sm text-green-700 dark:text-green-300">Datos de relevamiento</p>
              <div className="space-y-1">
                <Label>Necesidad del cliente</Label>
                <Input value={form.necesidad_cliente} onChange={e => set('necesidad_cliente', e.target.value)} placeholder="¿Qué necesita el cliente?" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Área a revisar</Label>
                  <Input value={form.area_revisar} onChange={e => set('area_revisar', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Cantidad estimada cámaras/puntos</Label>
                  <Input type="number" value={form.cantidad_estimada} onChange={e => set('cantidad_estimada', e.target.value)} min={0} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Medidas / puntos requeridos</Label>
                <Textarea value={form.medidas_puntos} onChange={e => set('medidas_puntos', e.target.value)} rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Observación técnica</Label>
                <Textarea value={form.observacion_tecnica} onChange={e => set('observacion_tecnica', e.target.value)} rows={2} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!form.requiere_cotizacion} onCheckedChange={v => set('requiere_cotizacion', v)} id="req-cot" />
                <Label htmlFor="req-cot">Requiere cotización</Label>
              </div>
            </div>
          )}

          {!esNuevo && (<div className="space-y-1">
            <Label>Observación final</Label>
            <Textarea value={form.observacion_final} onChange={e => set('observacion_final', e.target.value)} rows={2} placeholder="Observaciones generales..." />
          </div>)}

          {/* Creation-time fields for Asistencia */}
          {esNuevo && form.tipo_visita === 'Asistencia' && (
            <div className="space-y-4 border rounded-xl p-4 bg-blue-50 dark:bg-blue-950/20">
              <p className="font-extrabold text-sm text-blue-700 dark:text-blue-300">Datos de asistencia</p>
              <div className="flex items-center gap-3">
                <Switch checked={!!form.dentro_garantia} onCheckedChange={v => set('dentro_garantia', v)} id="dentro-gar" />
                <Label htmlFor="dentro-gar" className="font-bold">¿Dentro de garantía?</Label>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${form.dentro_garantia ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  {form.dentro_garantia ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="space-y-1">
                <Label>Descripción del problema</Label>
                <Textarea value={form.problema_reportado} onChange={e => set('problema_reportado', e.target.value)} rows={3} placeholder="Describe el problema reportado..." />
              </div>
            </div>
          )}

          {/* Creation-time fields for Relevamiento */}
          {esNuevo && form.tipo_visita === 'Relevamiento' && (
            <div className="space-y-4 border rounded-xl p-4 bg-green-50 dark:bg-green-950/20">
              <p className="font-extrabold text-sm text-green-700 dark:text-green-300">Datos de relevamiento</p>
              <div className="space-y-1">
                <Label>¿Qué relevamiento se hará?</Label>
                <Textarea value={form.necesidad_cliente} onChange={e => set('necesidad_cliente', e.target.value)} rows={3} placeholder="Describe el relevamiento a realizar..." />
              </div>
            </div>
          )}

          {esNuevo && (
            <p className="text-xs text-muted-foreground font-medium">
              El diagnóstico, la solución y el cobro se registran al finalizar la visita.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={loading} className="flex-1 font-bold">
              {loading ? 'Guardando...' : (initialData?.id ? 'Actualizar visita' : 'Registrar visita')}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* New client creation modal */}
      <Dialog open={showNewClientModal} onOpenChange={(open) => !creatingClient && setShowNewClientModal(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Crear nuevo cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre / Razón Social *</Label>
              <Input value={newClient.nombre} onChange={e => setNewClient(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Empresa S.A." disabled={creatingClient} autoFocus />
            </div>
            <div className="space-y-1">
              <Label>Teléfono</Label>
              <Input value={newClient.telefono} onChange={e => setNewClient(prev => ({ ...prev, telefono: e.target.value }))} placeholder="Celular/Fijo" disabled={creatingClient} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={newClient.email} onChange={e => setNewClient(prev => ({ ...prev, email: e.target.value }))} placeholder="correo@ejemplo.com" disabled={creatingClient} />
            </div>
            <div className="space-y-1">
              <Label>Dirección</Label>
              <Input value={newClient.direccion} onChange={e => setNewClient(prev => ({ ...prev, direccion: e.target.value }))} placeholder="Dirección principal" disabled={creatingClient} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowNewClientModal(false)} disabled={creatingClient} className="flex-1">Cancelar</Button>
            <Button type="button" onClick={handleCreateNewClient} disabled={creatingClient || !newClient.nombre.trim()} className="flex-1 font-bold">
              {creatingClient ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default VisitaFormModal;
