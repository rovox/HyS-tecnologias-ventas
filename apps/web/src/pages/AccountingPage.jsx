import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Plus, Loader2, Trash2, Package, Cpu, Receipt, RotateCcw, History, CheckCircle, XCircle, TrendingUp, TrendingDown, FileText, Copy, ChevronDown } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
const fmt = n => `Bs. ${(parseFloat(n) || 0).toLocaleString('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;
const fmtFecha = d => {
  if (!d) return '—';
  try {
    return format(new Date(String(d).replace(' ', 'T')), 'dd/MM/yyyy');
  } catch {
    return String(d).slice(0, 10);
  }
};
const ESTADO_COLORS = {
  pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
  validado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  anulado: 'bg-red-100 text-red-700 border-red-200',
  instalado: 'bg-blue-100 text-blue-700 border-blue-200',
  devuelto: 'bg-purple-100 text-purple-700 border-purple-200',
  dañado: 'bg-red-100 text-red-700 border-red-200'
};
const TIPO_COLORS = {
  Material: 'bg-orange-100 text-orange-700 border-orange-200',
  Equipo: 'bg-blue-100 text-blue-700 border-blue-200',
  'Gasto directo': 'bg-red-100 text-red-700 border-red-200',
  Sobrante: 'bg-purple-100 text-purple-700 border-purple-200'
};
const EstadoBadge = ({
  v
}) => <Badge className={cn('text-[10px] font-bold border shadow-none capitalize', ESTADO_COLORS[v] || 'bg-muted text-muted-foreground border-border')}>{v || '—'}</Badge>;
const TipoBadge = ({
  v
}) => <Badge className={cn('text-[10px] font-bold border shadow-none', TIPO_COLORS[v] || 'bg-muted text-muted-foreground border-border')}>{v || '—'}</Badge>;
const ConfirmDeleteDialog = ({
  open,
  onClose,
  onConfirm,
  saving,
  label
}) => <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>Confirmar eliminación</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">¿Eliminar <strong>{label}</strong>? Esta acción no se puede deshacer.</p>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="destructive" onClick={onConfirm} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Eliminar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;

// ─── KIT TEMPLATES ────────────────────────────────────────────────────────────
const KITS = {
  'Kit 2 Cámaras': [{
    tipo: 'Equipo',
    descripcion: 'Cámara IP',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 2,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Equipo',
    descripcion: 'DVR 4CH',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Equipo',
    descripcion: 'Disco duro 1TB',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Balun pasivo',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 4,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Fuente de alimentación 12V',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Cable UTP Cat6',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 50,
    unidad: 'metros',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Gasto directo',
    descripcion: 'Tornillos y tarugos',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'juego',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }],
  'Kit 4 Cámaras': [{
    tipo: 'Equipo',
    descripcion: 'Cámara IP',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 4,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Equipo',
    descripcion: 'DVR 8CH',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Equipo',
    descripcion: 'Disco duro 1TB',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Balun pasivo',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 8,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Fuente de alimentación 12V',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Cable UTP Cat6',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 100,
    unidad: 'metros',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Gasto directo',
    descripcion: 'Tornillos y tarugos',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'juego',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Gasto directo',
    descripcion: 'Canaleta plástica',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 5,
    unidad: 'metros',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }],
  'Kit 8 Cámaras': [{
    tipo: 'Equipo',
    descripcion: 'Cámara IP',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 8,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Equipo',
    descripcion: 'DVR 16CH',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Equipo',
    descripcion: 'Disco duro 2TB',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Balun pasivo',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 16,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Fuente 12V 10A',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 2,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Cable UTP Cat6',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 200,
    unidad: 'metros',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Gasto directo',
    descripcion: 'Tornillos y tarugos',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'juego',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Gasto directo',
    descripcion: 'Canaleta plástica',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 10,
    unidad: 'metros',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }],
  'Cableado de red': [{
    tipo: 'Material',
    descripcion: 'Cable UTP Cat6',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 100,
    unidad: 'metros',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Conectores RJ45',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 20,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Equipo',
    descripcion: 'Switch 8 puertos',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Keystone RJ45',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 8,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Gasto directo',
    descripcion: 'Canaleta plástica',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 10,
    unidad: 'metros',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Gasto directo',
    descripcion: 'Herramientas / consumibles',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'juego',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }],
  'Access Point': [{
    tipo: 'Equipo',
    descripcion: 'Access Point WiFi',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Cable UTP Cat6',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 30,
    unidad: 'metros',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Conectores RJ45',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 4,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Gasto directo',
    descripcion: 'Tornillos y tarugos',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'juego',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }],
  'DVR/NVR': [{
    tipo: 'Equipo',
    descripcion: 'DVR/NVR',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Equipo',
    descripcion: 'Disco duro 1TB',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'unidades',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Material',
    descripcion: 'Mouse y teclado',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'juego',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }, {
    tipo: 'Gasto directo',
    descripcion: 'Configuración y puesta en marcha',
    marca_modelo: '',
    numero_serie: '',
    cantidad: 1,
    unidad: 'servicio',
    costo_unitario: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    estado: 'pendiente',
    observacion: ''
  }]
};
const emptyRow = () => ({
  _key: Math.random().toString(36).slice(2),
  tipo: 'Material',
  descripcion: '',
  marca_modelo: '',
  numero_serie: '',
  cantidad: 1,
  unidad: 'unidades',
  costo_unitario: '',
  sucursal_origen: '',
  tecnico_id: 'none',
  estado: 'pendiente',
  observacion: ''
});
const UNIDADES = ['unidades', 'metros', 'kg', 'litros', 'rollos', 'cajas', 'juegos', 'servicio', 'otros'];
const TIPOS_ITEM = ['Material', 'Equipo', 'Gasto directo', 'Sobrante'];

// ─── FICHA DE COSTOS POR TRABAJO ─────────────────────────────────────────────
const FichaTab = ({
  schedules,
  users,
  currentUser,
  canAdmin,
  canContadora,
  canTecnico,
  sucursalesList,
  tecnicosList
}) => {
  const canCreate = canAdmin || canContadora || canTecnico;
  const [selectedJobId, setSelectedJobId] = useState('none');
  const [jobInfo, setJobInfo] = useState(null);
  const [existingItems, setExistingItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [batchRows, setBatchRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState({
    open: false,
    id: null,
    collection: '',
    label: ''
  });
  const [deletingSaved, setDeletingSaved] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [dbTemplates, setDbTemplates] = useState([]);
  const [templateForm, setTemplateForm] = useState({
    nombre: '',
    descripcion: '',
    items: []
  });
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const loadDbTemplates = useCallback(async () => {
    try {
      const res = await pb.collection('plantillas_costos').getFullList({
        sort: 'nombre',
        $autoCancel: false
      }).catch(() => []);
      setDbTemplates(res);
    } catch {}
  }, []);
  useEffect(() => {
    if (showTemplateManager) loadDbTemplates();
  }, [showTemplateManager, loadDbTemplates]);
  const loadDbTemplate = tpl => {
    const items = Array.isArray(tpl.items) ? tpl.items : [];
    const rows = items.map(r => ({
      ...r,
      _key: Math.random().toString(36).slice(2),
      tecnico_id: r.tecnico_id || 'none'
    }));
    setBatchRows(prev => [...prev.filter(r => r.descripcion.trim()), ...rows]);
    setShowTemplateManager(false);
  };
  const saveTemplate = async () => {
    if (!templateForm.nombre.trim()) return toast.error('El nombre es requerido');
    setSavingTemplate(true);
    try {
      if (editingTemplate) {
        await pb.collection('plantillas_costos').update(editingTemplate, {
          nombre: templateForm.nombre,
          descripcion: templateForm.descripcion,
          items: templateForm.items
        }, {
          $autoCancel: false
        });
        toast.success('Plantilla actualizada');
      } else {
        await pb.collection('plantillas_costos').create({
          nombre: templateForm.nombre,
          descripcion: templateForm.descripcion,
          items: templateForm.items,
          created_by: currentUser?.id || ''
        }, {
          $autoCancel: false
        });
        toast.success('Plantilla creada');
      }
      setTemplateForm({
        nombre: '',
        descripcion: '',
        items: []
      });
      setEditingTemplate(null);
      loadDbTemplates();
    } catch {
      toast.error('Error al guardar plantilla');
    } finally {
      setSavingTemplate(false);
    }
  };
  const deleteTemplate = async id => {
    try {
      await pb.collection('plantillas_costos').delete(id, {
        $autoCancel: false
      });
      toast.success('Plantilla eliminada');
      loadDbTemplates();
    } catch {
      toast.error('Error');
    }
  };
  const addTemplateItem = () => setTemplateForm(p => ({
    ...p,
    items: [...p.items, {
      tipo: 'Material',
      descripcion: '',
      cantidad: 1,
      unidad: 'unidades',
      costo_unitario: ''
    }]
  }));
  const updateTemplateItem = (idx, field, val) => setTemplateForm(p => {
    const items = [...p.items];
    items[idx] = {
      ...items[idx],
      [field]: val
    };
    return {
      ...p,
      items
    };
  });
  const removeTemplateItem = idx => setTemplateForm(p => ({
    ...p,
    items: p.items.filter((_, i) => i !== idx)
  }));
  const loadJobItems = useCallback(async jobId => {
    if (!jobId || jobId === 'none') {
      setExistingItems([]);
      return;
    }
    setLoadingItems(true);
    try {
      const [mats, equipos, gastos, sobrantes] = await Promise.all([pb.collection('materiales_trabajo').getFullList({
        filter: `trabajo_id="${jobId}"`,
        sort: '-created',
        $autoCancel: false
      }).catch(() => []), pb.collection('equipos_instalados').getFullList({
        filter: `trabajo_id="${jobId}"`,
        sort: '-created',
        $autoCancel: false
      }).catch(() => []), pb.collection('gastos_directos').getFullList({
        filter: `trabajo_id="${jobId}"`,
        sort: '-created',
        $autoCancel: false
      }).catch(() => []), pb.collection('sobrantes_devoluciones').getFullList({
        filter: `trabajo_id="${jobId}"`,
        sort: '-created',
        $autoCancel: false
      }).catch(() => [])]);
      const all = [...mats.map(r => ({
        ...r,
        _tipo: 'Material',
        _collection: 'materiales_trabajo',
        _monto: r.costo_total || 0,
        _desc: r.material_nombre
      })), ...equipos.map(r => ({
        ...r,
        _tipo: 'Equipo',
        _collection: 'equipos_instalados',
        _monto: r.costo_total || 0,
        _desc: r.equipo_nombre
      })), ...gastos.map(r => ({
        ...r,
        _tipo: 'Gasto directo',
        _collection: 'gastos_directos',
        _monto: r.monto || 0,
        _desc: r.descripcion
      })), ...sobrantes.map(r => ({
        ...r,
        _tipo: 'Sobrante',
        _collection: 'sobrantes_devoluciones',
        _monto: 0,
        _desc: r.material_nombre
      }))].sort((a, b) => new Date(b.created) - new Date(a.created));
      setExistingItems(all);
    } catch {} finally {
      setLoadingItems(false);
    }
  }, []);
  const handleJobChange = jobId => {
    setSelectedJobId(jobId);
    const job = schedules.find(j => j.id === jobId);
    setJobInfo(job || null);
    loadJobItems(jobId);
  };
  const summary = useMemo(() => {
    const mats = existingItems.filter(i => i._tipo === 'Material').reduce((s, i) => s + i._monto, 0);
    const equipos = existingItems.filter(i => i._tipo === 'Equipo').reduce((s, i) => s + i._monto, 0);
    const gastos = existingItems.filter(i => i._tipo === 'Gasto directo').reduce((s, i) => s + i._monto, 0);
    const costoTotal = mats + equipos + gastos;
    const valorTrabajo = parseFloat(jobInfo?.monto || jobInfo?.costo_total || 0);
    const utilidad = valorTrabajo - costoTotal;
    const pctUtil = valorTrabajo > 0 ? Math.round(utilidad / valorTrabajo * 100) : 0;
    const adelanto = parseFloat(jobInfo?.adelanto || 0);
    const cobros = parseFloat(jobInfo?.cobros_realizados || 0);
    const saldo = valorTrabajo - adelanto - cobros;
    return {
      mats,
      equipos,
      gastos,
      costoTotal,
      valorTrabajo,
      utilidad,
      pctUtil,
      saldo
    };
  }, [existingItems, jobInfo]);
  const updateRow = (key, field, value) => {
    setBatchRows(prev => prev.map(r => r._key === key ? {
      ...r,
      [field]: value
    } : r));
  };
  const addRow = () => setBatchRows(prev => [...prev, emptyRow()]);
  const duplicateRow = key => {
    const idx = batchRows.findIndex(r => r._key === key);
    const copy = {
      ...batchRows[idx],
      _key: Math.random().toString(36).slice(2)
    };
    setBatchRows(prev => {
      const n = [...prev];
      n.splice(idx + 1, 0, copy);
      return n;
    });
  };
  const removeRow = key => setBatchRows(prev => prev.filter(r => r._key !== key));
  const loadKit = kitName => {
    const rows = (KITS[kitName] || []).map(r => ({
      ...r,
      _key: Math.random().toString(36).slice(2)
    }));
    setBatchRows(prev => [...prev.filter(r => r.descripcion.trim()), ...rows]);
  };
  const saveAll = async () => {
    const validRows = batchRows.filter(r => r.descripcion.trim());
    if (!selectedJobId || selectedJobId === 'none') return toast.error('Selecciona un trabajo primero');
    if (validRows.length === 0) return toast.error('Agrega al menos un ítem con descripción');
    setSaving(true);
    try {
      const job = schedules.find(j => j.id === selectedJobId);
      const fecha = format(new Date(), 'yyyy-MM-dd');
      await Promise.all(validRows.map((row, i) => {
        const tec = tecnicosList.find(t => t.id === row.tecnico_id);
        const tecNombre = tec?.nombre || '';
        const qty = parseFloat(row.cantidad) || 0;
        const cu = parseFloat(row.costo_unitario) || 0;
        const total = qty * cu;
        const base = {
          trabajo_id: selectedJobId,
          cliente_nombre: job?.cliente_nombre || '',
          fecha,
          created_by: currentUser?.id || '',
          observacion: row.observacion,
          estado: row.estado || 'pendiente'
        };
        if (row.tipo === 'Material') {
          return pb.collection('materiales_trabajo').create({
            ...base,
            material_nombre: row.descripcion,
            cantidad: qty,
            unidad: row.unidad,
            costo_unitario: cu,
            costo_total: total,
            sucursal_trabajo: job?.sucursal_id || '',
            sucursal_origen: row.sucursal_origen,
            tecnico_id: row.tecnico_id !== 'none' ? row.tecnico_id : '',
            tecnico_nombre: tecNombre,
            registrado_por_id: currentUser?.id || '',
            registrado_por_nombre: currentUser?.name || ''
          }, {
            requestKey: `mat-${i}-${Date.now()}`
          });
        } else if (row.tipo === 'Equipo') {
          return pb.collection('equipos_instalados').create({
            ...base,
            equipo_nombre: row.descripcion,
            marca_modelo: row.marca_modelo || '',
            numero_serie: row.numero_serie || '',
            cantidad: qty,
            costo_unitario: cu,
            costo_total: total,
            sucursal_origen: row.sucursal_origen,
            tecnico_id: row.tecnico_id !== 'none' ? row.tecnico_id : '',
            tecnico_nombre: tecNombre
          }, {
            requestKey: `eq-${i}-${Date.now()}`
          });
        } else if (row.tipo === 'Gasto directo') {
          return pb.collection('gastos_directos').create({
            ...base,
            descripcion: row.descripcion,
            tipo: 'otros',
            monto: total || cu,
            sucursal: row.sucursal_origen,
            persona_id: row.tecnico_id !== 'none' ? row.tecnico_id : '',
            persona_nombre: tecNombre
          }, {
            requestKey: `gd-${i}-${Date.now()}`
          });
        } else if (row.tipo === 'Sobrante') {
          return pb.collection('sobrantes_devoluciones').create({
            ...base,
            material_nombre: row.descripcion,
            cantidad_devuelta: qty,
            unidad: row.unidad,
            sucursal_destino: row.sucursal_origen,
            tecnico_id: row.tecnico_id !== 'none' ? row.tecnico_id : '',
            tecnico_nombre: tecNombre
          }, {
            requestKey: `sob-${i}-${Date.now()}`
          });
        }
        return Promise.resolve();
      }));
      toast.success(`${validRows.length} ítem(s) guardados correctamente`);
      setBatchRows([emptyRow()]);
      await loadJobItems(selectedJobId);
    } catch (err) {
      toast.error('Error al guardar algunos ítems');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  const deleteExistingItem = async () => {
    setDeletingSaved(true);
    try {
      await pb.collection(del.collection).delete(del.id, {
        $autoCancel: false
      });
      setExistingItems(prev => prev.filter(r => r.id !== del.id));
      setDel({
        open: false,
        id: null,
        collection: '',
        label: ''
      });
      toast.success('Eliminado');
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeletingSaved(false);
    }
  };
  const validateItem = async (item, estado) => {
    try {
      await pb.collection(item._collection).update(item.id, {
        estado
      }, {
        $autoCancel: false
      });
      setExistingItems(prev => prev.map(r => r.id === item.id ? {
        ...r,
        estado
      } : r));
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error');
    }
  };
  return <div className="space-y-6">
      {/* Job Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-bold">Seleccionar trabajo</Label>
        <Select value={selectedJobId} onValueChange={handleJobChange}>
          <SelectTrigger className="w-full max-w-xl">
            <SelectValue placeholder="Busca y selecciona un trabajo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Sin selección —</SelectItem>
            {schedules.map(j => <SelectItem key={j.id} value={j.id}>
                {j.cliente_nombre} — {fmtFecha(j.fecha_programada)} {j.sucursal_nombre && j.sucursal_nombre !== '—' ? `· ${j.sucursal_nombre}` : ''}
              </SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedJobId !== 'none' && jobInfo && <>
          {/* Job Info Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl border bg-muted/30">
            <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cliente</p><p className="font-bold text-sm">{jobInfo.cliente_nombre || '—'}</p></div>
            <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fecha</p><p className="font-bold text-sm">{fmtFecha(jobInfo.fecha_programada)}</p></div>
            <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sucursal</p><p className="font-bold text-sm">{jobInfo.sucursal_nombre || jobInfo.sucursal_id || '—'}</p></div>
            <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estado</p><p className="font-bold text-sm capitalize">{jobInfo.estado || '—'}</p></div>
          </div>

          {/* Summary KPIs */}
          {(canAdmin || canContadora) && <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[{
          label: 'Valor trabajo',
          val: summary.valorTrabajo,
          color: 'text-primary',
          bg: 'bg-blue-50 border-blue-200'
        }, {
          label: 'Adelanto / cobrado',
          val: parseFloat(jobInfo?.adelanto || 0) + parseFloat(jobInfo?.cobros_realizados || 0),
          color: 'text-emerald-600',
          bg: 'bg-emerald-50 border-emerald-200'
        }, {
          label: 'Saldo pendiente',
          val: summary.saldo,
          color: summary.saldo > 0 ? 'text-amber-600' : 'text-emerald-600',
          bg: 'bg-amber-50 border-amber-200'
        }, {
          label: 'Total materiales',
          val: summary.mats,
          color: 'text-orange-600',
          bg: 'bg-orange-50 border-orange-200'
        }, {
          label: 'Total equipos',
          val: summary.equipos,
          color: 'text-blue-600',
          bg: 'bg-blue-50 border-blue-200'
        }, {
          label: 'Gastos directos',
          val: summary.gastos,
          color: 'text-red-600',
          bg: 'bg-red-50 border-red-200'
        }, {
          label: 'Costo operativo',
          val: summary.costoTotal,
          color: 'text-foreground',
          bg: 'bg-muted/50 border-border'
        }].map(({
          label,
          val,
          color,
          bg
        }) => <div key={label} className={cn('p-3 rounded-xl border', bg)}>
                  <p className="text-[10px] font-bold text-muted-foreground leading-tight">{label}</p>
                  <p className={cn('text-sm font-black tabular-nums mt-1', color)}>{fmt(val)}</p>
                </div>)}
            </div>}

          {/* Utilidad */}
          {(canAdmin || canContadora) && <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border font-bold', summary.utilidad >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700')}>
              {summary.utilidad >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              <span>Utilidad estimada: {fmt(summary.utilidad)}</span>
              <span className="text-sm font-medium">({summary.pctUtil}%)</span>
              <div className="ml-auto h-2 w-24 bg-white/60 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', summary.utilidad >= 0 ? 'bg-emerald-500' : 'bg-red-500')} style={{
            width: `${Math.min(100, Math.abs(summary.pctUtil))}%`
          }} />
              </div>
            </div>}

          {/* Existing items table */}
          {loadingItems ? <Skeleton className="h-24 w-full rounded-xl" /> : existingItems.length > 0 ? <div>
              <h3 className="text-sm font-bold mb-2">Ítems registrados ({existingItems.length})</h3>
              <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
                <table className="w-full text-sm whitespace-nowrap min-w-[800px]">
                  <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5 text-left">Tipo</th>
                      <th className="px-3 py-2.5 text-left">Descripción</th>
                      <th className="px-3 py-2.5 text-left">Marca/Modelo</th>
                      <th className="px-3 py-2.5 text-right">Cant.</th>
                      <th className="px-3 py-2.5 text-left">Unidad</th>
                      {(canAdmin || canContadora) && <th className="px-3 py-2.5 text-right">Monto</th>}
                      <th className="px-3 py-2.5 text-left">Técnico</th>
                      <th className="px-3 py-2.5 text-left">Estado</th>
                      {(canAdmin || canContadora) && <th className="px-3 py-2.5 text-center">Acción</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {existingItems.map(r => <tr key={`${r._collection}-${r.id}`} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2"><TipoBadge v={r._tipo} /></td>
                        <td className="px-3 py-2 font-bold max-w-[200px] truncate">{r._desc}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{r.marca_modelo || '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.cantidad || r.cantidad_devuelta || '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{r.unidad || '—'}</td>
                        {(canAdmin || canContadora) && <td className="px-3 py-2 text-right font-black tabular-nums">{fmt(r._monto)}</td>}
                        <td className="px-3 py-2 text-muted-foreground text-xs">{r.tecnico_nombre || r.persona_nombre || '—'}</td>
                        <td className="px-3 py-2"><EstadoBadge v={r.estado} /></td>
                        {(canAdmin || canContadora) && <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {r.estado === 'pendiente' && (canAdmin || canContadora) && <Button size="sm" variant="ghost" className="h-6 px-1.5 text-emerald-600 hover:bg-emerald-50" onClick={() => validateItem(r, 'validado')} title="Validar">
                                  <CheckCircle className="h-3 w-3" />
                                </Button>}
                              {canAdmin && r.estado !== 'anulado' && <Button size="sm" variant="ghost" className="h-6 px-1.5 text-amber-600 hover:bg-amber-50" onClick={() => validateItem(r, 'anulado')} title="Anular">
                                  <XCircle className="h-3 w-3" />
                                </Button>}
                              {canAdmin && <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-600 hover:bg-red-50" onClick={() => setDel({
                      open: true,
                      id: r.id,
                      collection: r._collection,
                      label: r._desc
                    })}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>}
                            </div>
                          </td>}
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div> : <div className="text-center py-8 text-muted-foreground border rounded-xl bg-muted/20">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin ítems registrados para este trabajo.</p>
            </div>}

          {/* Batch add section */}
          {canCreate && <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold">Agregar nuevos ítems</h3>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="font-bold text-xs gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Cargar plantilla / kit <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {Object.keys(KITS).map(k => <DropdownMenuItem key={k} onClick={() => loadKit(k)} className="text-sm">{k}</DropdownMenuItem>)}
                      {dbTemplates.length > 0 && <DropdownMenuSeparator />}
                      {dbTemplates.map(tpl => <DropdownMenuItem key={tpl.id} onClick={() => loadDbTemplate(tpl)} className="text-sm">{tpl.nombre}</DropdownMenuItem>)}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowTemplateManager(true)} className="text-sm font-bold text-primary">
                        ⚙ Administrar plantillas
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" className="font-bold text-xs gap-1.5" onClick={addRow}>
                    <Plus className="h-3.5 w-3.5" /> Agregar fila
                  </Button>
                </div>
              </div>

              {/* Batch rows table */}
              <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
                <table className="w-full text-xs min-w-[1100px]">
                  <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-2 py-2.5 text-left w-32">Tipo</th>
                      <th className="px-2 py-2.5 text-left">Descripción *</th>
                      <th className="px-2 py-2.5 text-left w-32">Marca/Modelo</th>
                      <th className="px-2 py-2.5 text-left w-28">N° Serie</th>
                      <th className="px-2 py-2.5 text-right w-16">Cant.</th>
                      <th className="px-2 py-2.5 text-left w-24">Unidad</th>
                      <th className="px-2 py-2.5 text-right w-24">Costo unitario (Bs)</th>
                      <th className="px-2 py-2.5 text-right w-24">Total</th>
                      <th className="px-2 py-2.5 text-left w-28">Sucursal origen</th>
                      <th className="px-2 py-2.5 text-left w-36">Técnico</th>
                      <th className="px-2 py-2.5 text-left w-24">Estado</th>
                      <th className="px-2 py-2.5 text-left">Observación</th>
                      <th className="px-2 py-2.5 text-center w-20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {batchRows.map(row => {
                const total = (parseFloat(row.cantidad) || 0) * (parseFloat(row.costo_unitario) || 0);
                return <tr key={row._key} className="hover:bg-muted/10">
                          <td className="px-2 py-1.5">
                            <Select value={row.tipo} onValueChange={v => updateRow(row._key, 'tipo', v)}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{TIPOS_ITEM.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1.5"><Input className="h-7 text-xs min-w-[140px]" value={row.descripcion} onChange={e => updateRow(row._key, 'descripcion', e.target.value)} placeholder="Ej. Cámara IP Dahua..." /></td>
                          <td className="px-2 py-1.5"><Input className="h-7 text-xs" value={row.marca_modelo} onChange={e => updateRow(row._key, 'marca_modelo', e.target.value)} placeholder="Dahua..." /></td>
                          <td className="px-2 py-1.5"><Input className="h-7 text-xs font-mono" value={row.numero_serie} onChange={e => updateRow(row._key, 'numero_serie', e.target.value)} placeholder="SN-..." /></td>
                          <td className="px-2 py-1.5"><Input type="number" step="0.01" className="h-7 text-xs text-right" value={row.cantidad} onChange={e => updateRow(row._key, 'cantidad', e.target.value)} /></td>
                          <td className="px-2 py-1.5">
                            <Select value={row.unidad} onValueChange={v => updateRow(row._key, 'unidad', v)}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1.5"><Input type="number" step="0.01" className="h-7 text-xs text-right" value={row.costo_unitario} onChange={e => updateRow(row._key, 'costo_unitario', e.target.value)} placeholder="0.00" /></td>
                          <td className="px-2 py-1.5"><Input className="h-7 text-xs text-right font-bold bg-muted" value={total > 0 ? `Bs. ${total.toFixed(2)}` : '—'} disabled /></td>
                          <td className="px-2 py-1.5"><Select value={row.sucursal_origen || 'none'} onValueChange={v => updateRow(row._key, 'sucursal_origen', v === 'none' ? '' : v)}><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Sucursal..." /></SelectTrigger><SelectContent><SelectItem value="none">Sin sucursal</SelectItem>{sucursalesList.map(s => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}</SelectContent></Select></td>
                          <td className="px-2 py-1.5">
                            <Select value={row.tecnico_id} onValueChange={v => updateRow(row._key, 'tecnico_id', v)}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Técnico..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sin asignar</SelectItem>
                                {tecnicosList.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1.5">
                            <Select value={row.estado} onValueChange={v => updateRow(row._key, 'estado', v)}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                {(canAdmin || canContadora) && <SelectItem value="validado">Validado</SelectItem>}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1.5"><Input className="h-7 text-xs min-w-[100px]" value={row.observacion} onChange={e => updateRow(row._key, 'observacion', e.target.value)} placeholder="Notas..." /></td>
                          <td className="px-2 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => duplicateRow(row._key)} title="Duplicar">
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeRow(row._key)} title="Eliminar fila">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>;
              })}
                  </tbody>
                </table>
              </div>

              {/* Save button */}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setBatchRows([emptyRow()])} disabled={saving}>Limpiar filas</Button>
                <Button onClick={saveAll} disabled={saving} className="font-bold px-6">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Guardar costos del trabajo ({batchRows.filter(r => r.descripcion.trim()).length} ítems)
                </Button>
              </div>
            </div>}
        </>}

      {selectedJobId === 'none' && <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-2xl">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-base">Selecciona un trabajo para ver y registrar costos</p>
          <p className="text-sm mt-1">Todos los materiales, equipos y gastos se registran en una sola pantalla.</p>
        </div>}

      <ConfirmDeleteDialog open={del.open} onClose={() => setDel({
      open: false,
      id: null,
      collection: '',
      label: ''
    })} onConfirm={deleteExistingItem} saving={deletingSaved} label={del.label} />

      {/* Template Manager Modal */}
      <Dialog open={showTemplateManager} onOpenChange={open => {
      if (!open) {
        setShowTemplateManager(false);
        setEditingTemplate(null);
        setTemplateForm({
          nombre: '',
          descripcion: '',
          items: []
        });
      }
    }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-extrabold">Administrar plantillas / kits</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Saved templates list */}
            {dbTemplates.length > 0 && <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Plantillas guardadas</p>
                <div className="space-y-1.5">
                  {dbTemplates.map(tpl => <div key={tpl.id} className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                      <div>
                        <p className="font-bold text-sm">{tpl.nombre}</p>
                        {tpl.descripcion && <p className="text-xs text-muted-foreground">{tpl.descripcion}</p>}
                        <p className="text-xs text-muted-foreground">{Array.isArray(tpl.items) ? tpl.items.length : 0} ítems</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => {
                    setEditingTemplate(tpl.id);
                    setTemplateForm({
                      nombre: tpl.nombre,
                      descripcion: tpl.descripcion || '',
                      items: Array.isArray(tpl.items) ? tpl.items : []
                    });
                  }}>Editar</Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary" onClick={() => {
                    loadDbTemplate(tpl);
                  }}>Cargar</Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => deleteTemplate(tpl.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>)}
                </div>
              </div>}

            {/* Create/Edit form */}
            <div className="border rounded-xl p-4 space-y-3 bg-card">
              <p className="font-bold text-sm">{editingTemplate ? 'Editar plantilla' : 'Nueva plantilla'}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs font-bold">Nombre *</Label><Input value={templateForm.nombre} onChange={e => setTemplateForm(p => ({
                  ...p,
                  nombre: e.target.value
                }))} placeholder="Ej. Kit 2 Cámaras" disabled={savingTemplate} /></div>
                <div className="space-y-1"><Label className="text-xs font-bold">Descripción</Label><Input value={templateForm.descripcion} onChange={e => setTemplateForm(p => ({
                  ...p,
                  descripcion: e.target.value
                }))} placeholder="Descripción opcional" disabled={savingTemplate} /></div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">Ítems de la plantilla</Label>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addTemplateItem}><Plus className="h-3 w-3 mr-1" />Agregar fila</Button>
                </div>
                {templateForm.items.length > 0 && <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[700px]">
                      <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase"><tr>
                        <th className="px-2 py-1.5 text-left">Tipo</th><th className="px-2 py-1.5 text-left">Descripción</th><th className="px-2 py-1.5 text-left">Marca/Modelo</th>
                        <th className="px-2 py-1.5 text-right">Cant.</th><th className="px-2 py-1.5 text-left">Unidad</th><th className="px-2 py-1.5 text-right">C. Unit.</th><th className="px-2 py-1.5"></th>
                      </tr></thead>
                      <tbody className="divide-y">
                        {templateForm.items.map((item, idx) => <tr key={idx}>
                            <td className="px-1 py-1"><Select value={item.tipo} onValueChange={v => updateTemplateItem(idx, 'tipo', v)}><SelectTrigger className="h-6 text-xs w-28"><SelectValue /></SelectTrigger><SelectContent>{TIPOS_ITEM.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></td>
                            <td className="px-1 py-1"><Input className="h-6 text-xs min-w-[120px]" value={item.descripcion} onChange={e => updateTemplateItem(idx, 'descripcion', e.target.value)} placeholder="Descripción..." /></td>
                            <td className="px-1 py-1"><Input className="h-6 text-xs min-w-[100px]" value={item.marca_modelo || ''} onChange={e => updateTemplateItem(idx, 'marca_modelo', e.target.value)} placeholder="Marca..." /></td>
                            <td className="px-1 py-1"><Input type="number" className="h-6 text-xs w-14 text-right" value={item.cantidad} onChange={e => updateTemplateItem(idx, 'cantidad', parseFloat(e.target.value) || 1)} /></td>
                            <td className="px-1 py-1"><Select value={item.unidad} onValueChange={v => updateTemplateItem(idx, 'unidad', v)}><SelectTrigger className="h-6 text-xs w-24"><SelectValue /></SelectTrigger><SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></td>
                            <td className="px-1 py-1"><Input type="number" className="h-6 text-xs w-20 text-right" value={item.costo_unitario || ''} onChange={e => updateTemplateItem(idx, 'costo_unitario', e.target.value)} placeholder="0.00" /></td>
                            <td className="px-1 py-1"><Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={() => removeTemplateItem(idx)}><Trash2 className="h-3 w-3" /></Button></td>
                          </tr>)}
                      </tbody>
                    </table>
                  </div>}
                {templateForm.items.length === 0 && <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">Sin ítems. Agrega filas para definir la plantilla.</p>}
              </div>

              <div className="flex justify-end gap-2">
                {editingTemplate && <Button variant="ghost" size="sm" onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({
                  nombre: '',
                  descripcion: '',
                  items: []
                });
              }}>Cancelar edición</Button>}
                <Button size="sm" className="font-bold" onClick={saveTemplate} disabled={savingTemplate}>
                  {savingTemplate && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {editingTemplate ? 'Actualizar' : 'Guardar plantilla'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};

// ─── SHARED WORK SELECTOR ────────────────────────────────────────────────────
const WorkSelector = ({
  value,
  onChange,
  schedules,
  disabled
}) => <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger><SelectValue placeholder="Selecciona trabajo..." /></SelectTrigger>
    <SelectContent>
      <SelectItem value="none">Sin trabajo relacionado</SelectItem>
      {schedules.map(j => <SelectItem key={j.id} value={j.id}>{j.cliente_nombre || j.cliente} — {fmtFecha(j.fecha_programada)}</SelectItem>)}
    </SelectContent>
  </Select>;

// ─── MATERIALES POR TRABAJO ──────────────────────────────────────────────────
const MaterialesTab = ({
  schedules,
  users,
  currentUser,
  canAdmin,
  canContadora,
  canTecnico,
  sucursalesList,
  tecnicosList
}) => {
  const canCreate = canAdmin || canContadora || canTecnico;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState({
    open: false,
    id: null,
    label: ''
  });
  const [filterJob, setFilterJob] = useState('all');
  const [form, setForm] = useState({
    trabajo_id: 'none',
    sucursal_trabajo: '',
    sucursal_origen: '',
    tecnico_id: 'none',
    material_nombre: '',
    cantidad: '1',
    unidad: 'unidades',
    costo_unitario: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    observacion: '',
    estado: 'pendiente'
  });
  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pb.collection('materiales_trabajo').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setRows(res);
    } catch {} finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchRows();
  }, [fetchRows]);
  const total = (parseFloat(form.cantidad) || 0) * (parseFloat(form.costo_unitario) || 0);
  const submit = async e => {
    e.preventDefault();
    if (!form.material_nombre.trim()) return toast.error('El material es requerido');
    setSaving(true);
    try {
      const job = schedules.find(j => j.id === form.trabajo_id);
      const tec = tecnicosList.find(t => t.id === form.tecnico_id);
      await pb.collection('materiales_trabajo').create({
        ...form,
        trabajo_id: form.trabajo_id === 'none' ? '' : form.trabajo_id,
        tecnico_id: form.tecnico_id === 'none' ? '' : form.tecnico_id,
        cliente_nombre: job?.cliente_nombre || '',
        tecnico_nombre: tec?.nombre || '',
        cantidad: parseFloat(form.cantidad) || 0,
        costo_unitario: parseFloat(form.costo_unitario) || 0,
        costo_total: total,
        registrado_por_id: currentUser?.id || '',
        registrado_por_nombre: currentUser?.name || '',
        created_by: currentUser?.id || ''
      }, {
        $autoCancel: false
      });
      toast.success('Material registrado');
      setShowForm(false);
      setForm({
        trabajo_id: 'none',
        sucursal_trabajo: '',
        sucursal_origen: '',
        tecnico_id: 'none',
        material_nombre: '',
        cantidad: '1',
        unidad: 'unidades',
        costo_unitario: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        observacion: '',
        estado: 'pendiente'
      });
      fetchRows();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };
  const validateRow = async (id, estado) => {
    try {
      await pb.collection('materiales_trabajo').update(id, {
        estado
      }, {
        $autoCancel: false
      });
      setRows(prev => prev.map(r => r.id === id ? {
        ...r,
        estado
      } : r));
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error');
    }
  };
  const deleteRow = async () => {
    setSaving(true);
    try {
      await pb.collection('materiales_trabajo').delete(del.id, {
        $autoCancel: false
      });
      setRows(prev => prev.filter(r => r.id !== del.id));
      setDel({
        open: false,
        id: null,
        label: ''
      });
      toast.success('Eliminado');
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setSaving(false);
    }
  };
  const filtered = filterJob === 'all' ? rows : rows.filter(r => r.trabajo_id === filterJob);
  const total_all = filtered.reduce((s, r) => s + (r.costo_total || 0), 0);
  const schedulesMap = useMemo(() => {
    const m = {};
    schedules.forEach(j => {
      m[j.id] = j;
    });
    return m;
  }, [schedules]);
  return <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {canCreate && <Button onClick={() => setShowForm(v => !v)} className="font-bold">
            <Plus className="h-4 w-4 mr-2" />{showForm ? 'Cancelar' : 'Registrar Material'}
          </Button>}
        <div className="ml-auto flex items-center gap-2">
          <Label className="text-xs font-bold text-muted-foreground whitespace-nowrap">Filtrar trabajo:</Label>
          <Select value={filterJob} onValueChange={setFilterJob}>
            <SelectTrigger className="w-52 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los trabajos</SelectItem>
              {schedules.map(j => <SelectItem key={j.id} value={j.id}>{j.cliente_nombre} — {fmtFecha(j.fecha_programada)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="px-3 py-2 rounded-xl border bg-orange-50 border-orange-200">
          <p className="text-[10px] font-bold text-orange-700">Total materiales</p>
          <p className="text-base font-black tabular-nums text-orange-600">{fmt(total_all)}</p>
        </div>
      </div>

      {showForm && <div className="border rounded-2xl shadow-sm p-5 bg-card animate-in fade-in slide-in-from-bottom-2">
          <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-bold">Trabajo relacionado</Label>
              <WorkSelector value={form.trabajo_id} onChange={v => setForm(p => ({
            ...p,
            trabajo_id: v
          }))} schedules={schedules} disabled={saving} />
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Sucursal del trabajo</Label><Select value={form.sucursal_trabajo || 'none'} onValueChange={v => setForm(p => ({
            ...p,
            sucursal_trabajo: v === 'none' ? '' : v
          }))} disabled={saving}><SelectTrigger><SelectValue placeholder="Sucursal..." /></SelectTrigger><SelectContent><SelectItem value="none">Sin sucursal</SelectItem>{sucursalesList.map(s => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Sucursal origen material</Label><Select value={form.sucursal_origen || 'none'} onValueChange={v => setForm(p => ({
            ...p,
            sucursal_origen: v === 'none' ? '' : v
          }))} disabled={saving}><SelectTrigger><SelectValue placeholder="Sucursal..." /></SelectTrigger><SelectContent><SelectItem value="none">Sin sucursal</SelectItem>{sucursalesList.map(s => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-bold">Técnico que recibió</Label>
              <Select value={form.tecnico_id} onValueChange={v => setForm(p => ({
            ...p,
            tecnico_id: v
          }))} disabled={saving}>
                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent><SelectItem value="none">Sin asignar</SelectItem>{tecnicosList.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Material / Insumo *</Label><Input value={form.material_nombre} onChange={e => setForm(p => ({
            ...p,
            material_nombre: e.target.value
          }))} disabled={saving} placeholder="Ej. Cable UTP Cat6..." required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Cantidad</Label><Input type="number" step="0.01" value={form.cantidad} onChange={e => setForm(p => ({
            ...p,
            cantidad: e.target.value
          }))} disabled={saving} /></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Unidad</Label>
              <Select value={form.unidad} onValueChange={v => setForm(p => ({
            ...p,
            unidad: v
          }))} disabled={saving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Costo unitario</Label><Input type="number" step="0.01" value={form.costo_unitario} onChange={e => setForm(p => ({
            ...p,
            costo_unitario: e.target.value
          }))} disabled={saving} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Total</Label><Input value={`Bs. ${total.toFixed(2)}`} disabled className="bg-muted font-bold tabular-nums" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Fecha *</Label><Input type="date" value={form.fecha} onChange={e => setForm(p => ({
            ...p,
            fecha: e.target.value
          }))} disabled={saving} required /></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Estado</Label>
              <Select value={form.estado} onValueChange={v => setForm(p => ({
            ...p,
            estado: v
          }))} disabled={saving || !canAdmin && !canContadora}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  {(canAdmin || canContadora) && <SelectItem value="validado">Validado</SelectItem>}
                  {canAdmin && <SelectItem value="anulado">Anulado</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Observación</Label><Input value={form.observacion} onChange={e => setForm(p => ({
            ...p,
            observacion: e.target.value
          }))} disabled={saving} /></div>
            <div className="flex items-end col-span-4 justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="font-bold">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar</Button>
            </div>
          </form>
        </div>}

      <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
        <table className="w-full text-sm whitespace-nowrap min-w-[900px]">
          <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Trabajo / Cliente</th>
              <th className="px-4 py-3 text-left">Material</th>
              <th className="px-4 py-3 text-right">Cant.</th>
              <th className="px-4 py-3 text-left">Unidad</th>
              {(canAdmin || canContadora) && <th className="px-4 py-3 text-right">Costo unit. (Bs)</th>}
              {(canAdmin || canContadora) && <th className="px-4 py-3 text-right">Total</th>}
              <th className="px-4 py-3 text-left">Técnico</th>
              <th className="px-4 py-3 text-left">Estado</th>
              {(canAdmin || canContadora) && <th className="px-4 py-3 text-center">Acción</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan={10} className="px-4 py-6"><Skeleton className="h-8 w-full" /></td></tr> : filtered.length > 0 ? filtered.map(r => <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{r.fecha ? format(new Date(r.fecha), 'dd MMM yy', {
                locale: es
              }) : '—'}</td>
                  <td className="px-4 py-2.5 font-medium max-w-[160px] truncate">{r.cliente_nombre || schedulesMap[r.trabajo_id]?.cliente_nombre || '—'}</td>
                  <td className="px-4 py-2.5 font-bold">{r.material_nombre}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.cantidad}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.unidad}</td>
                  {(canAdmin || canContadora) && <td className="px-4 py-2.5 text-right tabular-nums">{fmt(r.costo_unitario)}</td>}
                  {(canAdmin || canContadora) && <td className="px-4 py-2.5 text-right font-black tabular-nums text-orange-600">{fmt(r.costo_total)}</td>}
                  <td className="px-4 py-2.5 text-muted-foreground">{r.tecnico_nombre || '—'}</td>
                  <td className="px-4 py-2.5"><EstadoBadge v={r.estado} /></td>
                  {(canAdmin || canContadora) && <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {r.estado === 'pendiente' && <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-600 hover:bg-emerald-50" onClick={() => validateRow(r.id, 'validado')}><CheckCircle className="h-3.5 w-3.5" /></Button>}
                        {r.estado !== 'anulado' && canAdmin && <Button size="sm" variant="ghost" className="h-7 px-2 text-amber-600 hover:bg-amber-50" onClick={() => validateRow(r.id, 'anulado')}><XCircle className="h-3.5 w-3.5" /></Button>}
                        {canAdmin && <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => setDel({
                  open: true,
                  id: r.id,
                  label: r.material_nombre
                })}><Trash2 className="h-3.5 w-3.5" /></Button>}
                      </div>
                    </td>}
                </tr>) : <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">Sin materiales registrados.</td></tr>}
          </tbody>
        </table>
      </div>
      <ConfirmDeleteDialog open={del.open} onClose={() => setDel({
      open: false,
      id: null,
      label: ''
    })} onConfirm={deleteRow} saving={saving} label={del.label} />
    </div>;
};

// ─── EQUIPOS INSTALADOS ──────────────────────────────────────────────────────
const EquiposTab = ({
  schedules,
  users,
  currentUser,
  canAdmin,
  canContadora,
  canTecnico,
  sucursalesList,
  tecnicosList
}) => {
  const canCreate = canAdmin || canContadora || canTecnico;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState({
    open: false,
    id: null,
    label: ''
  });
  const [form, setForm] = useState({
    equipo_nombre: '',
    marca_modelo: '',
    numero_serie: '',
    cantidad: '1',
    costo_unitario: '',
    trabajo_id: 'none',
    sucursal_origen: '',
    tecnico_id: 'none',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    estado: 'instalado',
    observacion: ''
  });
  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pb.collection('equipos_instalados').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setRows(res);
    } catch {} finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchRows();
  }, [fetchRows]);
  const total = (parseFloat(form.cantidad) || 0) * (parseFloat(form.costo_unitario) || 0);
  const submit = async e => {
    e.preventDefault();
    if (!form.equipo_nombre.trim()) return toast.error('El equipo es requerido');
    setSaving(true);
    try {
      const job = schedules.find(j => j.id === form.trabajo_id);
      const tec = tecnicosList.find(t => t.id === form.tecnico_id);
      await pb.collection('equipos_instalados').create({
        ...form,
        trabajo_id: form.trabajo_id === 'none' ? '' : form.trabajo_id,
        tecnico_id: form.tecnico_id === 'none' ? '' : form.tecnico_id,
        cliente_nombre: job?.cliente_nombre || '',
        tecnico_nombre: tec?.nombre || '',
        cantidad: parseFloat(form.cantidad) || 0,
        costo_unitario: parseFloat(form.costo_unitario) || 0,
        costo_total: total,
        created_by: currentUser?.id || ''
      }, {
        $autoCancel: false
      });
      toast.success('Equipo registrado');
      setShowForm(false);
      setForm({
        equipo_nombre: '',
        marca_modelo: '',
        numero_serie: '',
        cantidad: '1',
        costo_unitario: '',
        trabajo_id: 'none',
        sucursal_origen: '',
        tecnico_id: 'none',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        estado: 'instalado',
        observacion: ''
      });
      fetchRows();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };
  const deleteRow = async () => {
    setSaving(true);
    try {
      await pb.collection('equipos_instalados').delete(del.id, {
        $autoCancel: false
      });
      setRows(prev => prev.filter(r => r.id !== del.id));
      setDel({
        open: false,
        id: null,
        label: ''
      });
      toast.success('Eliminado');
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setSaving(false);
    }
  };
  const totalAll = rows.reduce((s, r) => s + (r.costo_total || 0), 0);
  return <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {canCreate && <Button onClick={() => setShowForm(v => !v)} className="font-bold">
            <Plus className="h-4 w-4 mr-2" />{showForm ? 'Cancelar' : 'Registrar Equipo'}
          </Button>}
        <div className="ml-auto px-3 py-2 rounded-xl border bg-blue-50 border-blue-200">
          <p className="text-[10px] font-bold text-blue-700">Total equipos</p>
          <p className="text-base font-black tabular-nums text-blue-600">{fmt(totalAll)}</p>
        </div>
      </div>

      {showForm && <div className="border rounded-2xl shadow-sm p-5 bg-card animate-in fade-in slide-in-from-bottom-2">
          <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Equipo / Nombre *</Label><Input value={form.equipo_nombre} onChange={e => setForm(p => ({
            ...p,
            equipo_nombre: e.target.value
          }))} disabled={saving} placeholder="Ej. Cámara IP Dahua, DVR 8CH..." required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Marca / Modelo</Label><Input value={form.marca_modelo} onChange={e => setForm(p => ({
            ...p,
            marca_modelo: e.target.value
          }))} disabled={saving} placeholder="Dahua IPC-HDW..." /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">N° Serie</Label><Input value={form.numero_serie} onChange={e => setForm(p => ({
            ...p,
            numero_serie: e.target.value
          }))} disabled={saving} /></div>
            <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Trabajo relacionado</Label><WorkSelector value={form.trabajo_id} onChange={v => setForm(p => ({
            ...p,
            trabajo_id: v
          }))} schedules={schedules} disabled={saving} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Sucursal origen</Label><Select value={form.sucursal_origen || 'none'} onValueChange={v => setForm(p => ({
            ...p,
            sucursal_origen: v === 'none' ? '' : v
          }))} disabled={saving}><SelectTrigger><SelectValue placeholder="Sucursal..." /></SelectTrigger><SelectContent><SelectItem value="none">Sin sucursal</SelectItem>{sucursalesList.map(s => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Técnico responsable</Label>
              <Select value={form.tecnico_id} onValueChange={v => setForm(p => ({
            ...p,
            tecnico_id: v
          }))} disabled={saving}>
                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent><SelectItem value="none">Sin asignar</SelectItem>{tecnicosList.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Cantidad</Label><Input type="number" step="1" value={form.cantidad} onChange={e => setForm(p => ({
            ...p,
            cantidad: e.target.value
          }))} disabled={saving} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Costo unitario</Label><Input type="number" step="0.01" value={form.costo_unitario} onChange={e => setForm(p => ({
            ...p,
            costo_unitario: e.target.value
          }))} disabled={saving} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Total</Label><Input value={`Bs. ${total.toFixed(2)}`} disabled className="bg-muted font-bold tabular-nums" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Fecha *</Label><Input type="date" value={form.fecha} onChange={e => setForm(p => ({
            ...p,
            fecha: e.target.value
          }))} disabled={saving} required /></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Estado</Label>
              <Select value={form.estado} onValueChange={v => setForm(p => ({
            ...p,
            estado: v
          }))} disabled={saving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['instalado', 'devuelto', 'dañado', 'pendiente'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Observación</Label><Input value={form.observacion} onChange={e => setForm(p => ({
            ...p,
            observacion: e.target.value
          }))} disabled={saving} /></div>
            <div className="flex items-end col-span-4 justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="font-bold">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar</Button>
            </div>
          </form>
        </div>}

      <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
        <table className="w-full text-sm whitespace-nowrap min-w-[900px]">
          <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Equipo</th>
              <th className="px-4 py-3 text-left">Marca / Modelo</th>
              <th className="px-4 py-3 text-left">Serie</th>
              <th className="px-4 py-3 text-right">Cant.</th>
              {(canAdmin || canContadora) && <th className="px-4 py-3 text-right">Total</th>}
              <th className="px-4 py-3 text-left">Trabajo</th>
              <th className="px-4 py-3 text-left">Técnico</th>
              <th className="px-4 py-3 text-left">Estado</th>
              {canAdmin && <th className="px-4 py-3 text-center">Acción</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan={10} className="px-4 py-6"><Skeleton className="h-8 w-full" /></td></tr> : rows.length > 0 ? rows.map(r => <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{r.fecha ? format(new Date(r.fecha), 'dd MMM yy', {
                locale: es
              }) : '—'}</td>
                  <td className="px-4 py-2.5 font-bold">{r.equipo_nombre}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.marca_modelo || '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.numero_serie || '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.cantidad}</td>
                  {(canAdmin || canContadora) && <td className="px-4 py-2.5 text-right font-black tabular-nums text-blue-600">{fmt(r.costo_total)}</td>}
                  <td className="px-4 py-2.5 text-muted-foreground max-w-[140px] truncate">{r.cliente_nombre || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.tecnico_nombre || '—'}</td>
                  <td className="px-4 py-2.5"><EstadoBadge v={r.estado} /></td>
                  {canAdmin && <td className="px-4 py-2.5 text-center">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => setDel({
                open: true,
                id: r.id,
                label: r.equipo_nombre
              })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>}
                </tr>) : <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">Sin equipos registrados.</td></tr>}
          </tbody>
        </table>
      </div>
      <ConfirmDeleteDialog open={del.open} onClose={() => setDel({
      open: false,
      id: null,
      label: ''
    })} onConfirm={deleteRow} saving={saving} label={del.label} />
    </div>;
};

// ─── GASTOS DIRECTOS ─────────────────────────────────────────────────────────
const GastosDirectosTab = ({
  schedules,
  users,
  currentUser,
  canAdmin,
  canContadora,
  canTecnico,
  sucursalesList,
  tecnicosList
}) => {
  const canCreate = canAdmin || canContadora || canTecnico;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState({
    open: false,
    id: null,
    label: ''
  });
  const [form, setForm] = useState({
    tipo: 'combustible',
    descripcion: '',
    monto: '',
    trabajo_id: 'none',
    sucursal: '',
    persona_id: 'none',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    estado: 'pendiente',
    observacion: ''
  });
  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pb.collection('gastos_directos').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setRows(res);
    } catch {} finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchRows();
  }, [fetchRows]);
  const submit = async e => {
    e.preventDefault();
    if (!form.descripcion.trim()) return toast.error('La descripción es requerida');
    if (!form.monto) return toast.error('El monto es requerido');
    setSaving(true);
    try {
      const job = schedules.find(j => j.id === form.trabajo_id);
      const persona = tecnicosList.find(t => t.id === form.persona_id);
      await pb.collection('gastos_directos').create({
        ...form,
        trabajo_id: form.trabajo_id === 'none' ? '' : form.trabajo_id,
        persona_id: form.persona_id === 'none' ? '' : form.persona_id,
        cliente_nombre: job?.cliente_nombre || '',
        persona_nombre: persona?.nombre || currentUser?.name || '',
        monto: parseFloat(form.monto) || 0,
        created_by: currentUser?.id || ''
      }, {
        $autoCancel: false
      });
      toast.success('Gasto registrado');
      setShowForm(false);
      setForm({
        tipo: 'combustible',
        descripcion: '',
        monto: '',
        trabajo_id: 'none',
        sucursal: '',
        persona_id: 'none',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        estado: 'pendiente',
        observacion: ''
      });
      fetchRows();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };
  const validateRow = async (id, estado) => {
    try {
      await pb.collection('gastos_directos').update(id, {
        estado
      }, {
        $autoCancel: false
      });
      setRows(prev => prev.map(r => r.id === id ? {
        ...r,
        estado
      } : r));
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error');
    }
  };
  const deleteRow = async () => {
    setSaving(true);
    try {
      await pb.collection('gastos_directos').delete(del.id, {
        $autoCancel: false
      });
      setRows(prev => prev.filter(r => r.id !== del.id));
      setDel({
        open: false,
        id: null,
        label: ''
      });
      toast.success('Eliminado');
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setSaving(false);
    }
  };
  const totalAll = rows.reduce((s, r) => s + (r.monto || 0), 0);
  const TIPOS = ['combustible', 'pasajes', 'viáticos', 'compra urgente', 'mano de obra externa', 'herramientas menores', 'otros'];
  return <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {canCreate && <Button onClick={() => setShowForm(v => !v)} className="font-bold">
            <Plus className="h-4 w-4 mr-2" />{showForm ? 'Cancelar' : 'Registrar Gasto Directo'}
          </Button>}
        <div className="ml-auto px-3 py-2 rounded-xl border bg-red-50 border-red-200">
          <p className="text-[10px] font-bold text-red-700">Total gastos directos</p>
          <p className="text-base font-black tabular-nums text-red-600">{fmt(totalAll)}</p>
        </div>
      </div>

      {showForm && <div className="border rounded-2xl shadow-sm p-5 bg-card animate-in fade-in slide-in-from-bottom-2">
          <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Tipo de gasto</Label>
              <Select value={form.tipo} onValueChange={v => setForm(p => ({
            ...p,
            tipo: v
          }))} disabled={saving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Descripción *</Label><Input value={form.descripcion} onChange={e => setForm(p => ({
            ...p,
            descripcion: e.target.value
          }))} disabled={saving} placeholder="Ej. Combustible viaje a Quillacollo" required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Monto *</Label><Input type="number" step="0.01" value={form.monto} onChange={e => setForm(p => ({
            ...p,
            monto: e.target.value
          }))} disabled={saving} required /></div>
            <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Trabajo relacionado</Label><WorkSelector value={form.trabajo_id} onChange={v => setForm(p => ({
            ...p,
            trabajo_id: v
          }))} schedules={schedules} disabled={saving} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Sucursal</Label><Select value={form.sucursal || 'none'} onValueChange={v => setForm(p => ({
            ...p,
            sucursal: v === 'none' ? '' : v
          }))} disabled={saving}><SelectTrigger><SelectValue placeholder="Sucursal..." /></SelectTrigger><SelectContent><SelectItem value="none">Sin sucursal</SelectItem>{sucursalesList.map(s => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Persona responsable</Label>
              <Select value={form.persona_id} onValueChange={v => setForm(p => ({
            ...p,
            persona_id: v
          }))} disabled={saving}>
                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent><SelectItem value="none">Sin asignar</SelectItem>{tecnicosList.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Fecha *</Label><Input type="date" value={form.fecha} onChange={e => setForm(p => ({
            ...p,
            fecha: e.target.value
          }))} disabled={saving} required /></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Estado</Label>
              <Select value={form.estado} onValueChange={v => setForm(p => ({
            ...p,
            estado: v
          }))} disabled={saving || !canAdmin && !canContadora}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  {(canAdmin || canContadora) && <SelectItem value="validado">Validado</SelectItem>}
                  {canAdmin && <SelectItem value="anulado">Anulado</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Observación</Label><Input value={form.observacion} onChange={e => setForm(p => ({
            ...p,
            observacion: e.target.value
          }))} disabled={saving} /></div>
            <div className="flex items-end col-span-4 justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="font-bold">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar</Button>
            </div>
          </form>
        </div>}

      <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
        <table className="w-full text-sm whitespace-nowrap min-w-[800px]">
          <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Descripción</th>
              <th className="px-4 py-3 text-left">Trabajo</th>
              <th className="px-4 py-3 text-left">Persona</th>
              {(canAdmin || canContadora) && <th className="px-4 py-3 text-right">Monto</th>}
              <th className="px-4 py-3 text-left">Estado</th>
              {(canAdmin || canContadora) && <th className="px-4 py-3 text-center">Acción</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan={8} className="px-4 py-6"><Skeleton className="h-8 w-full" /></td></tr> : rows.length > 0 ? rows.map(r => <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{r.fecha ? format(new Date(r.fecha), 'dd MMM yy', {
                locale: es
              }) : '—'}</td>
                  <td className="px-4 py-2.5 capitalize text-muted-foreground">{r.tipo}</td>
                  <td className="px-4 py-2.5 font-bold">{r.descripcion}</td>
                  <td className="px-4 py-2.5 text-muted-foreground max-w-[140px] truncate">{r.cliente_nombre || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.persona_nombre || '—'}</td>
                  {(canAdmin || canContadora) && <td className="px-4 py-2.5 text-right font-black tabular-nums text-red-600">{fmt(r.monto)}</td>}
                  <td className="px-4 py-2.5"><EstadoBadge v={r.estado} /></td>
                  {(canAdmin || canContadora) && <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {r.estado === 'pendiente' && <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-600 hover:bg-emerald-50" onClick={() => validateRow(r.id, 'validado')}><CheckCircle className="h-3.5 w-3.5" /></Button>}
                        {canAdmin && r.estado !== 'anulado' && <Button size="sm" variant="ghost" className="h-7 px-2 text-amber-600 hover:bg-amber-50" onClick={() => validateRow(r.id, 'anulado')}><XCircle className="h-3.5 w-3.5" /></Button>}
                        {canAdmin && <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => setDel({
                  open: true,
                  id: r.id,
                  label: r.descripcion
                })}><Trash2 className="h-3.5 w-3.5" /></Button>}
                      </div>
                    </td>}
                </tr>) : <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Sin gastos directos registrados.</td></tr>}
          </tbody>
        </table>
      </div>
      <ConfirmDeleteDialog open={del.open} onClose={() => setDel({
      open: false,
      id: null,
      label: ''
    })} onConfirm={deleteRow} saving={saving} label={del.label} />
    </div>;
};

// ─── SOBRANTES / DEVOLUCIONES ────────────────────────────────────────────────
const SobrantesTab = ({
  schedules,
  users,
  currentUser,
  canAdmin,
  canContadora,
  canTecnico,
  sucursalesList,
  tecnicosList
}) => {
  const canCreate = canAdmin || canContadora || canTecnico;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState({
    open: false,
    id: null,
    label: ''
  });
  const [form, setForm] = useState({
    trabajo_id: 'none',
    material_nombre: '',
    cantidad_devuelta: '1',
    unidad: 'unidades',
    sucursal_destino: '',
    tecnico_id: 'none',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    observacion: ''
  });
  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pb.collection('sobrantes_devoluciones').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setRows(res);
    } catch {} finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchRows();
  }, [fetchRows]);
  const submit = async e => {
    e.preventDefault();
    if (!form.material_nombre.trim()) return toast.error('El material es requerido');
    setSaving(true);
    try {
      const job = schedules.find(j => j.id === form.trabajo_id);
      const tec = tecnicosList.find(t => t.id === form.tecnico_id);
      await pb.collection('sobrantes_devoluciones').create({
        ...form,
        trabajo_id: form.trabajo_id === 'none' ? '' : form.trabajo_id,
        tecnico_id: form.tecnico_id === 'none' ? '' : form.tecnico_id,
        cliente_nombre: job?.cliente_nombre || '',
        tecnico_nombre: tec?.nombre || '',
        cantidad_devuelta: parseFloat(form.cantidad_devuelta) || 0,
        created_by: currentUser?.id || ''
      }, {
        $autoCancel: false
      });
      toast.success('Sobrante registrado');
      setShowForm(false);
      setForm({
        trabajo_id: 'none',
        material_nombre: '',
        cantidad_devuelta: '1',
        unidad: 'unidades',
        sucursal_destino: '',
        tecnico_id: 'none',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        observacion: ''
      });
      fetchRows();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };
  const deleteRow = async () => {
    setSaving(true);
    try {
      await pb.collection('sobrantes_devoluciones').delete(del.id, {
        $autoCancel: false
      });
      setRows(prev => prev.filter(r => r.id !== del.id));
      setDel({
        open: false,
        id: null,
        label: ''
      });
      toast.success('Eliminado');
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setSaving(false);
    }
  };
  return <div className="space-y-4">
      {canCreate && <Button onClick={() => setShowForm(v => !v)} className="font-bold">
          <Plus className="h-4 w-4 mr-2" />{showForm ? 'Cancelar' : 'Registrar Sobrante / Devolución'}
        </Button>}

      {showForm && <div className="border rounded-2xl shadow-sm p-5 bg-card animate-in fade-in slide-in-from-bottom-2">
          <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Trabajo origen</Label><WorkSelector value={form.trabajo_id} onChange={v => setForm(p => ({
            ...p,
            trabajo_id: v
          }))} schedules={schedules} disabled={saving} /></div>
            <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Material devuelto *</Label><Input value={form.material_nombre} onChange={e => setForm(p => ({
            ...p,
            material_nombre: e.target.value
          }))} disabled={saving} placeholder="Ej. Cable UTP sobrante..." required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Cantidad devuelta</Label><Input type="number" step="0.01" value={form.cantidad_devuelta} onChange={e => setForm(p => ({
            ...p,
            cantidad_devuelta: e.target.value
          }))} disabled={saving} /></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Unidad</Label>
              <Select value={form.unidad} onValueChange={v => setForm(p => ({
            ...p,
            unidad: v
          }))} disabled={saving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Sucursal destino</Label><Select value={form.sucursal_destino || 'none'} onValueChange={v => setForm(p => ({
            ...p,
            sucursal_destino: v === 'none' ? '' : v
          }))} disabled={saving}><SelectTrigger><SelectValue placeholder="Sucursal..." /></SelectTrigger><SelectContent><SelectItem value="none">Sin sucursal</SelectItem>{sucursalesList.map(s => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Técnico que devuelve</Label>
              <Select value={form.tecnico_id} onValueChange={v => setForm(p => ({
            ...p,
            tecnico_id: v
          }))} disabled={saving}>
                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent><SelectItem value="none">Sin asignar</SelectItem>{tecnicosList.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Fecha *</Label><Input type="date" value={form.fecha} onChange={e => setForm(p => ({
            ...p,
            fecha: e.target.value
          }))} disabled={saving} required /></div>
            <div className="space-y-1.5 col-span-3"><Label className="text-xs font-bold">Observación</Label><Input value={form.observacion} onChange={e => setForm(p => ({
            ...p,
            observacion: e.target.value
          }))} disabled={saving} /></div>
            <div className="flex items-end col-span-4 justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="font-bold">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar</Button>
            </div>
          </form>
        </div>}

      <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
        <table className="w-full text-sm whitespace-nowrap min-w-[700px]">
          <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Material</th>
              <th className="px-4 py-3 text-right">Cant.</th>
              <th className="px-4 py-3 text-left">Unidad</th>
              <th className="px-4 py-3 text-left">Trabajo</th>
              <th className="px-4 py-3 text-left">Sucursal destino</th>
              <th className="px-4 py-3 text-left">Técnico</th>
              {canAdmin && <th className="px-4 py-3 text-center">Acción</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan={8} className="px-4 py-6"><Skeleton className="h-8 w-full" /></td></tr> : rows.length > 0 ? rows.map(r => <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{r.fecha ? format(new Date(r.fecha), 'dd MMM yy', {
                locale: es
              }) : '—'}</td>
                  <td className="px-4 py-2.5 font-bold">{r.material_nombre}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.cantidad_devuelta}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.unidad}</td>
                  <td className="px-4 py-2.5 text-muted-foreground max-w-[140px] truncate">{r.cliente_nombre || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.sucursal_destino || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.tecnico_nombre || '—'}</td>
                  {canAdmin && <td className="px-4 py-2.5 text-center">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => setDel({
                open: true,
                id: r.id,
                label: r.material_nombre
              })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>}
                </tr>) : <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Sin sobrantes o devoluciones registradas.</td></tr>}
          </tbody>
        </table>
      </div>
      <ConfirmDeleteDialog open={del.open} onClose={() => setDel({
      open: false,
      id: null,
      label: ''
    })} onConfirm={deleteRow} saving={saving} label={del.label} />
    </div>;
};

// ─── HISTORIAL DE COSTOS ─────────────────────────────────────────────────────
const HistorialTab = ({
  schedules,
  canAdmin,
  canContadora
}) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterJob, setFilterJob] = useState('all');
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mats, equipos, gastos] = await Promise.all([pb.collection('materiales_trabajo').getFullList({
        sort: '-created',
        $autoCancel: false
      }).catch(() => []), pb.collection('equipos_instalados').getFullList({
        sort: '-created',
        $autoCancel: false
      }).catch(() => []), pb.collection('gastos_directos').getFullList({
        sort: '-created',
        $autoCancel: false
      }).catch(() => [])]);
      const combined = [...mats.map(r => ({
        ...r,
        _tipo: 'Material',
        _monto: r.costo_total || 0,
        material_nombre: r.material_nombre
      })), ...equipos.map(r => ({
        ...r,
        _tipo: 'Equipo',
        _monto: r.costo_total || 0,
        material_nombre: r.equipo_nombre
      })), ...gastos.map(r => ({
        ...r,
        _tipo: 'Gasto directo',
        _monto: r.monto || 0,
        material_nombre: r.descripcion
      }))].sort((a, b) => new Date(b.created) - new Date(a.created));
      setRows(combined);
    } catch {} finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  const filtered = filterJob === 'all' ? rows : rows.filter(r => r.trabajo_id === filterJob);
  const byJob = useMemo(() => {
    const m = {};
    filtered.forEach(r => {
      const jid = r.trabajo_id || '_sin_trabajo';
      if (!m[jid]) m[jid] = {
        label: r.cliente_nombre || '—',
        mats: 0,
        equipos: 0,
        gastos: 0
      };
      if (r._tipo === 'Material') m[jid].mats += r._monto;
      if (r._tipo === 'Equipo') m[jid].equipos += r._monto;
      if (r._tipo === 'Gasto directo') m[jid].gastos += r._monto;
    });
    return Object.entries(m).map(([jid, v]) => ({
      jid,
      ...v,
      total: v.mats + v.equipos + v.gastos,
      job: schedules.find(j => j.id === jid)
    })).sort((a, b) => b.total - a.total);
  }, [filtered, schedules]);
  return <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Label className="text-xs font-bold text-muted-foreground">Filtrar trabajo:</Label>
        <Select value={filterJob} onValueChange={setFilterJob}>
          <SelectTrigger className="w-64 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los trabajos</SelectItem>
            {schedules.map(j => <SelectItem key={j.id} value={j.id}>{j.cliente_nombre} — {fmtFecha(j.fecha_programada)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {byJob.length > 0 && (canAdmin || canContadora) && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {byJob.slice(0, 6).map(({
        jid,
        label,
        mats,
        equipos,
        gastos,
        total,
        job
      }) => {
        const valor = parseFloat(job?.monto || 0);
        const utilidad = valor - total;
        const pctU = valor > 0 ? Math.min(100, Math.round(utilidad / valor * 100)) : 0;
        return <div key={jid} className="border rounded-2xl p-4 space-y-3 bg-card shadow-sm">
                <p className="font-extrabold text-sm truncate">{label}</p>
                {job && <p className="text-[11px] text-muted-foreground">{fmtFecha(job.fecha_programada)}</p>}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Valor del trabajo</span><span className="font-bold tabular-nums">{fmt(valor)}</span></div>
                  <div className="flex justify-between"><span className="text-orange-600">Materiales</span><span className="font-bold tabular-nums">{fmt(mats)}</span></div>
                  <div className="flex justify-between"><span className="text-blue-600">Equipos</span><span className="font-bold tabular-nums">{fmt(equipos)}</span></div>
                  <div className="flex justify-between"><span className="text-red-600">Gastos directos</span><span className="font-bold tabular-nums">{fmt(gastos)}</span></div>
                  <div className="border-t pt-1.5 flex justify-between font-bold"><span>Costo operativo</span><span className="tabular-nums">{fmt(total)}</span></div>
                  <div className={cn('flex justify-between font-extrabold', utilidad >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    <span>Utilidad estimada</span><span className="tabular-nums">{fmt(utilidad)} ({pctU}%)</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', pctU >= 0 ? 'bg-emerald-500' : 'bg-red-500')} style={{
              width: `${Math.min(100, Math.abs(pctU))}%`
            }} />
                </div>
              </div>;
      })}
        </div>}

      <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
        <table className="w-full text-sm whitespace-nowrap min-w-[700px]">
          <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Concepto</th>
              <th className="px-4 py-3 text-left">Trabajo / Cliente</th>
              {(canAdmin || canContadora) && <th className="px-4 py-3 text-right">Monto</th>}
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan={6} className="px-4 py-6"><Skeleton className="h-8 w-full" /></td></tr> : filtered.length > 0 ? filtered.map((r, i) => <tr key={`${r._tipo}-${r.id}-${i}`} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{r.fecha ? format(new Date(r.fecha), 'dd MMM yy', {
                locale: es
              }) : '—'}</td>
                  <td className="px-4 py-2.5"><TipoBadge v={r._tipo} /></td>
                  <td className="px-4 py-2.5 font-bold">{r.material_nombre}</td>
                  <td className="px-4 py-2.5 text-muted-foreground max-w-[150px] truncate">{r.cliente_nombre || '—'}</td>
                  {(canAdmin || canContadora) && <td className="px-4 py-2.5 text-right font-black tabular-nums">{fmt(r._monto)}</td>}
                  <td className="px-4 py-2.5"><EstadoBadge v={r.estado} /></td>
                </tr>) : <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Sin registros de costos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>;
};

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
const AccountingPage = () => {
  const {
    currentUser,
    isAdmin,
    isContadora,
    isSeguridad,
    isVentasLevel
  } = useAuth();
  const canAdmin = isAdmin();
  const canContadora = isVentasLevel(); // VENTAS / ADMINISTRACIÓN has same level as Contadora
  const canTecnico = isSeguridad();
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [sucursalesList, setSucursalesList] = useState([]);
  const [tecnicosList, setTecnicosList] = useState([]);
  useEffect(() => {
    const load = async () => {
      try {
        const [schRes, userRes, cliRes, sucRes, tecRes] = await Promise.all([pb.collection('schedules').getFullList({
          sort: '-fecha_programada',
          $autoCancel: false
        }).catch(() => []), pb.collection('users').getFullList({
          $autoCancel: false
        }).catch(() => []), pb.collection('clientes').getFullList({
          $autoCancel: false
        }).catch(() => []), pb.collection('sucursales').getFullList({
          filter: 'activa = true',
          sort: 'nombre',
          $autoCancel: false
        }).catch(() => []), pb.collection('tecnicos').getFullList({
          sort: 'nombre',
          $autoCancel: false
        }).catch(() => [])]);
        const clientsMap = {};
        cliRes.forEach(c => {
          clientsMap[c.id] = c;
        });
        const sucursalesMap = {};
        sucRes.forEach(s => {
          sucursalesMap[s.id] = s.nombre;
        });
        const normalized = schRes.map(j => ({
          ...j,
          cliente_nombre: clientsMap[j.cliente_id]?.nombre || j.cliente || 'Sin cliente',
          sucursal_nombre: sucursalesMap[j.sucursal_id] || j.sucursal_id || '—'
        }));
        setSchedules(normalized);
        setUsers(userRes);
        setSucursalesList(sucRes);
        setTecnicosList(tecRes);
      } catch {}
    };
    load();
  }, []);
  const sharedProps = {
    schedules,
    users,
    currentUser,
    canAdmin,
    canContadora,
    canTecnico,
    sucursalesList,
    tecnicosList
  };
  return <Layout>
      <Helmet><title>Costos Operativos - H&S</title></Helmet>
      <div className="content-container py-6 pb-24 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" /> Costos Operativos
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Ficha de costos por trabajo — materiales, equipos y gastos&nbsp;</p>
        </div>

        <Tabs defaultValue="ficha" className="w-full">
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 bg-muted/50 p-1 gap-0.5 mb-1">
              <TabsTrigger value="ficha" className="font-bold text-xs whitespace-nowrap flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Ficha de Costos por Trabajo</TabsTrigger>
              <TabsTrigger value="materiales" className="font-bold text-xs whitespace-nowrap flex items-center gap-1.5"><Package className="h-3.5 w-3.5" />Materiales usados</TabsTrigger>
              <TabsTrigger value="equipos" className="font-bold text-xs whitespace-nowrap flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5" />Equipos instalados</TabsTrigger>
              <TabsTrigger value="gastos" className="font-bold text-xs whitespace-nowrap flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5" />Gastos directos</TabsTrigger>
              <TabsTrigger value="sobrantes" className="font-bold text-xs whitespace-nowrap flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" />Sobrantes / Devoluciones</TabsTrigger>
              <TabsTrigger value="historial" className="font-bold text-xs whitespace-nowrap flex items-center gap-1.5"><History className="h-3.5 w-3.5" />Historial</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ficha">
            <FichaTab {...sharedProps} />
          </TabsContent>
          <TabsContent value="materiales">
            <MaterialesTab {...sharedProps} />
          </TabsContent>
          <TabsContent value="equipos">
            <EquiposTab {...sharedProps} />
          </TabsContent>
          <TabsContent value="gastos">
            <GastosDirectosTab {...sharedProps} />
          </TabsContent>
          <TabsContent value="sobrantes">
            <SobrantesTab {...sharedProps} />
          </TabsContent>
          <TabsContent value="historial">
            <HistorialTab schedules={schedules} canAdmin={canAdmin} canContadora={canContadora} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>;
};
export default AccountingPage;