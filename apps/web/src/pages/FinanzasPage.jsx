import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle, Wallet, Building2, Users, Target,
  Plus, Loader2, CheckCircle2, XCircle, Eye, FileText, Package, BarChart3,
  ChevronDown, Filter, Download, Banknote, CreditCard, ShoppingCart, Receipt,
  BadgeDollarSign, ArrowRightLeft, UserCheck, Percent, Clock, Trash2, Pencil
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
const fmtFecha = (d) => { if (!d) return '—'; try { return format(new Date(String(d).replace(' ', 'T')), 'dd/MM/yyyy'); } catch { return String(d).slice(0, 10); } };
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils.js';
import { calculateBalance } from '@/hooks/useSchedules.js';

const fmt = (n) => `$${(parseFloat(n) || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (v, t) => t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0;

const EstadoBadge = ({ v, map }) => {
  const cfg = map[v] || { cls: 'bg-slate-100 text-slate-700 border-slate-200', label: v || 'N/A' };
  return <Badge className={cn('text-[10px] font-bold uppercase border shadow-none', cfg.cls)}>{cfg.label}</Badge>;
};

const RENDICION_MAP = {
  'Pendiente rendición': { cls: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Pendiente' },
  'Pendiente': { cls: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Pendiente' },
  'Rendido': { cls: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Rendido' },
  'Confirmado': { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Confirmado' },
  'Observado': { cls: 'bg-red-100 text-red-700 border-red-200', label: 'Observado' },
};

const FACTURA_MAP = {
  'Sí': { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Con factura' },
  'No': { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Sin factura' },
  'Pendiente': { cls: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pendiente' },
};

// ── Confirm Delete Dialog ──
const ConfirmDeleteDialog = ({ open, onClose, onConfirm, saving, label }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-sm rounded-2xl">
      <DialogHeader><DialogTitle className="font-extrabold text-red-600">Confirmar eliminación</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground py-2">¿Estás seguro de que deseas eliminar <span className="font-bold text-foreground">{label}</span>? Esta acción no se puede deshacer.</p>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button className="bg-red-600 hover:bg-red-700 font-bold" onClick={onConfirm} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>} Eliminar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// ─────────────── RESUMEN TAB ───────────────
const ResumenTab = ({ data, filters, loading }) => {
  const { schedules, payments, costos, gastos, goalsSp, goalsBr, sucursales, usersMap } = data;

  const stats = useMemo(() => {
    const ventasMes = schedules.reduce((s, j) => s + (j.monto || 0), 0);
    const totalCobrado = payments.reduce((s, p) => s + (p.monto_cobrado || 0), 0);
    const cxc = schedules.reduce((s, j) => s + Math.max(0, j.saldo || 0), 0);
    const gastosMes = gastos.reduce((s, g) => s + (g.monto || 0), 0);
    const costosMes = costos.reduce((s, c) => s + (c.costo_total || 0), 0);
    const utilidadEstimada = ventasMes - costosMes - gastosMes;
    const gastosPendientes = gastos.filter(g => g.estado === 'Pendiente').reduce((s, g) => s + (g.monto || 0), 0);

    const branchMap = {};
    schedules.forEach(j => {
      const key = j.sucursal_id || 'Sin sucursal';
      if (!branchMap[key]) branchMap[key] = { ventas: 0, nombre: sucursales.find(s => s.id === key)?.nombre || key };
      branchMap[key].ventas += j.monto || 0;
    });
    const branchStats = Object.values(branchMap).sort((a, b) => b.ventas - a.ventas);

    const salesMap = {};
    schedules.forEach(j => {
      const key = j.vendedor_responsable_id || 'sin';
      if (!salesMap[key]) salesMap[key] = { ventas: 0, nombre: usersMap[key]?.name || 'Sin asignar' };
      salesMap[key].ventas += j.monto || 0;
    });
    const salesStats = Object.values(salesMap).sort((a, b) => b.ventas - a.ventas);

    const totalMeta = goalsSp.reduce((s, g) => s + (g.monthly_goal || 0), 0);
    const metaPct = pct(totalCobrado, totalMeta);

    return { ventasMes, totalCobrado, cxc, gastosMes, costosMes, utilidadEstimada, gastosPendientes, branchStats, salesStats, totalMeta, metaPct };
  }, [schedules, payments, costos, gastos, goalsSp, goalsBr, sucursales, usersMap]);

  const kpis = [
    { label: 'Ventas del Mes', value: fmt(stats.ventasMes), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { label: 'Total Cobrado', value: fmt(stats.totalCobrado), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Cuentas por Cobrar', value: fmt(stats.cxc), icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
    { label: 'Gastos del Mes', value: fmt(stats.gastosMes), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    { label: 'Costos por Trabajo', value: fmt(stats.costosMes), icon: Package, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    { label: 'Utilidad Estimada', value: fmt(stats.utilidadEstimada), icon: BadgeDollarSign, color: stats.utilidadEstimada >= 0 ? 'text-emerald-600' : 'text-red-600', bg: stats.utilidadEstimada >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200' },
    { label: 'Gastos Pendientes', value: fmt(stats.gastosPendientes), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { label: 'Meta Cumplimiento', value: `${stats.metaPct}%`, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />) :
          kpis.map((k, i) => (
            <div key={i} className={cn('rounded-xl border p-4 flex flex-col gap-2', k.bg)}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{k.label}</span>
                <k.icon className={cn('h-4 w-4', k.color)} />
              </div>
              <span className={cn('text-2xl font-black tabular-nums', k.color)}>{k.value}</span>
            </div>
          ))
        }
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="bg-muted/30 border-b pb-3">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary"/> Ventas por Sucursal</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {loading ? <Skeleton className="h-24 w-full" /> :
              stats.branchStats.length > 0 ? stats.branchStats.map((b, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold">{b.nombre}</span>
                    <span className="font-black text-primary tabular-nums">{fmt(b.ventas)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct(b.ventas, stats.ventasMes)}%` }} />
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">Sin datos este mes</p>
            }
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="bg-muted/30 border-b pb-3">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2"><Users className="h-4 w-4 text-primary"/> Ventas por Vendedor</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {loading ? <Skeleton className="h-24 w-full" /> :
              stats.salesStats.length > 0 ? stats.salesStats.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">{i+1}</div>
                    <span className="text-sm font-bold">{s.nombre}</span>
                  </div>
                  <span className="text-sm font-black tabular-nums text-emerald-600">{fmt(s.ventas)}</span>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">Sin datos este mes</p>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ─────────────── TRABAJOS FINANCIEROS TAB ───────────────
const TrabajosFinancierosTab = ({ data, loading, canAdmin, canContadora, onRefresh }) => {
  const { schedules, costos, usersMap } = data;
  const [search, setSearch] = useState('');
  const [editFactura, setEditFactura] = useState(null);
  const [facturaForm, setFacturaForm] = useState({ factura_estado: 'Pendiente', numero_factura: '', monto_facturado: '', debito_fiscal: '' });
  const [saving, setSaving] = useState(false);

  const costsByWork = useMemo(() => {
    const m = {};
    costos.forEach(c => { m[c.trabajo_id] = (m[c.trabajo_id] || 0) + (c.costo_total || 0); });
    return m;
  }, [costos]);

  const filtered = useMemo(() => {
    if (!search.trim()) return schedules;
    const q = search.toLowerCase();
    return schedules.filter(j => j.cliente_nombre?.toLowerCase().includes(q) || j.cliente?.toLowerCase().includes(q));
  }, [schedules, search]);

  const openFactura = (job) => {
    setEditFactura(job);
    setFacturaForm({
      factura_estado: job.factura_estado || 'Pendiente',
      numero_factura: job.numero_factura || '',
      monto_facturado: job.monto_facturado || '',
      debito_fiscal: job.debito_fiscal || '',
    });
  };

  const saveFactura = async () => {
    if (!editFactura) return;
    setSaving(true);
    try {
      const montoFact = parseFloat(facturaForm.monto_facturado) || 0;
      const debitoFisc = parseFloat(facturaForm.debito_fiscal) || 0;
      await pb.collection('schedules').update(editFactura.id, {
        factura_estado: facturaForm.factura_estado,
        numero_factura: facturaForm.numero_factura,
        monto_facturado: montoFact,
        debito_fiscal: debitoFisc
      }, { $autoCancel: false });

      // Auto-upsert facturas_control when estado = Sí
      if (facturaForm.factura_estado === 'Sí') {
        try {
          const existing = await pb.collection('facturas_control').getFirstListItem(
            `trabajo_id = "${editFactura.id}"`, { $autoCancel: false }
          ).catch(() => null);
          const payload = {
            trabajo_id: editFactura.id,
            cliente_nombre: editFactura.cliente_nombre || editFactura.cliente || '',
            tiene_factura: 'Sí',
            numero_factura: facturaForm.numero_factura,
            fecha_factura: editFactura.fecha_programada || format(new Date(), 'yyyy-MM-dd'),
            monto_facturado: montoFact,
            debito_fiscal: debitoFisc,
          };
          if (existing) {
            await pb.collection('facturas_control').update(existing.id, payload, { $autoCancel: false });
          } else {
            await pb.collection('facturas_control').create({ ...payload, created_by: pb.authStore.record?.id || '' }, { $autoCancel: false });
          }
        } catch (err) {
          console.warn('No se pudo sincronizar facturas_control:', err.message);
        }
      }

      toast.success('Factura actualizada');
      setEditFactura(null);
      if (onRefresh) onRefresh();
    } catch { toast.error('Error al guardar'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input placeholder="Buscar por cliente..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>
      <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
        <table className="w-full text-sm whitespace-nowrap min-w-[1200px]">
          <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Vendedor</th>
              <th className="px-4 py-3 text-left">Técnico</th>
              <th className="px-4 py-3 text-left">Sucursal</th>
              <th className="px-4 py-3 text-right">Valor total</th>
              <th className="px-4 py-3 text-right">Adelanto</th>
              <th className="px-4 py-3 text-right">Cobrado</th>
              <th className="px-4 py-3 text-right">Saldo</th>
              <th className="px-4 py-3 text-right">Costos</th>
              <th className="px-4 py-3 text-right">Utilidad</th>
              <th className="px-4 py-3 text-left">Estado op.</th>
              <th className="px-4 py-3 text-left">Factura</th>
              {(canAdmin || canContadora) && <th className="px-4 py-3 text-center">Factura</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan="14" className="px-4 py-6"><Skeleton className="h-8 w-full"/></td></tr>
              : filtered.length > 0 ? filtered.map(j => {
                const costoWork = costsByWork[j.id] || 0;
                const utilidad = (j.monto || 0) - costoWork;
                const cobros = j.cobros_realizados || 0;
                const saldo = Math.max(0, j.saldo || 0);
                const vendedor = usersMap[j.vendedor_responsable_id]?.name || j.vendedor_nombre || '—';
                const tecnico = usersMap[j.tecnico_responsable_id]?.name || j.tecnico_nombre || '—';
                const sucursal = j.sucursal_nombre || j.sucursal_id || '—';
                return (
                  <tr key={j.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-foreground max-w-[160px] truncate">{j.cliente_nombre || j.cliente || '—'}</td>
                    <td className="px-4 py-2.5">
                      <Badge className="text-[9px] bg-blue-100 text-blue-700 border-blue-200 border shadow-none">{j.type || j.tipo_trabajo || 'N/A'}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-[120px] truncate">{vendedor}</td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-[120px] truncate">{tecnico}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{sucursal}</td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums">{fmt(j.monto)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-blue-600">{fmt(j.adelanto)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">{fmt(cobros)}</td>
                    <td className={cn("px-4 py-2.5 text-right font-black tabular-nums", saldo > 0 ? 'text-red-600' : 'text-emerald-600')}>{fmt(saldo)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-orange-600">{fmt(costoWork)}</td>
                    <td className={cn("px-4 py-2.5 text-right font-bold tabular-nums", utilidad >= 0 ? 'text-emerald-600' : 'text-red-600')}>{fmt(utilidad)}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="text-[9px] uppercase shadow-none">{(j.estado || '').replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <EstadoBadge v={j.factura_estado || 'Pendiente'} map={FACTURA_MAP} />
                    </td>
                    {(canAdmin || canContadora) && (
                      <td className="px-4 py-2.5 text-center">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-primary" onClick={() => openFactura(j)}>
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              }) : <tr><td colSpan="14" className="px-4 py-10 text-center text-muted-foreground">Sin trabajos este período.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <Dialog open={!!editFactura} onOpenChange={() => setEditFactura(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="font-extrabold">Gestionar Factura</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/30 rounded-lg text-sm">
              <p className="font-bold">{editFactura?.cliente_nombre || editFactura?.cliente}</p>
              <p className="text-muted-foreground text-xs">{fmtFecha(editFactura?.fecha_programada)} · {fmt(editFactura?.monto)}</p>
            </div>
            <div className="space-y-2">
              <Label>Estado de Factura</Label>
              <Select value={facturaForm.factura_estado} onValueChange={v => setFacturaForm(p => ({...p, factura_estado: v}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Sí">Sí (con factura)</SelectItem>
                  <SelectItem value="No">No (sin factura)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {facturaForm.factura_estado === 'Sí' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Número de Factura</Label>
                    <Input value={facturaForm.numero_factura} onChange={e => setFacturaForm(p => ({...p, numero_factura: e.target.value}))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Monto Facturado</Label>
                    <Input type="number" value={facturaForm.monto_facturado} onChange={e => setFacturaForm(p => ({...p, monto_facturado: e.target.value}))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Débito Fiscal</Label>
                  <Input type="number" value={facturaForm.debito_fiscal} onChange={e => setFacturaForm(p => ({...p, debito_fiscal: e.target.value}))} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditFactura(null)}>Cancelar</Button>
            <Button onClick={saveFactura} disabled={saving} className="font-bold">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─────────────── CUENTAS POR COBRAR TAB ───────────────
const CuentasPorCobrarTab = ({ data, loading, userRole }) => {
  const { schedulesAll, usersMap } = data;

  const cxcList = useMemo(() => {
    return (schedulesAll || [])
      .filter(j => (j.saldo || 0) > 0)
      .sort((a, b) => (b.saldo || 0) - (a.saldo || 0));
  }, [schedulesAll]);

  const total = useMemo(() => cxcList.reduce((s, j) => s + (j.saldo || 0), 0), [cxcList]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 rounded-xl border border-orange-200 bg-orange-50">
        <AlertCircle className="h-6 w-6 text-orange-600 shrink-0"/>
        <div>
          <p className="font-bold text-orange-800">Total Cuentas por Cobrar</p>
          <p className="text-2xl font-black text-orange-600 tabular-nums">{fmt(total)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
        <table className="w-full text-sm whitespace-nowrap min-w-[900px]">
          <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Sucursal</th>
              <th className="px-4 py-3 text-left">Vendedor</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-right">Valor Total</th>
              <th className="px-4 py-3 text-right">Cobrado</th>
              <th className="px-4 py-3 text-right">Saldo Pendiente</th>
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan="8" className="px-4 py-6"><Skeleton className="h-8 w-full"/></td></tr>
              : cxcList.length > 0 ? cxcList.map(j => (
                <tr key={j.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-bold">{j.cliente_nombre || j.cliente || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{j.sucursal_nombre || j.sucursal_id || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{j.vendedor_nombre || usersMap[j.vendedor_responsable_id]?.name || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{j.fecha_programada ? format(parseISO(j.fecha_programada), 'dd MMM yyyy', { locale: es }) : '-'}</td>
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">{fmt(j.monto)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">{fmt(j.cobros_realizados || 0)}</td>
                  <td className="px-4 py-2.5 text-right font-black tabular-nums text-red-600">{fmt(j.saldo)}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-[9px] uppercase shadow-none border-orange-200 text-orange-700 bg-orange-50">{(j.estado || '').replace('_',' ')}</Badge>
                  </td>
                </tr>
              )) : <tr><td colSpan="8" className="px-4 py-10 text-center text-muted-foreground font-medium">🎉 Sin cuentas por cobrar.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─────────────── COBROS Y RENDICIONES TAB ───────────────
const CobrosRendicionesTab = ({ data, loading, canAdmin, canContadora, currentUser, onRefresh }) => {
  const { paymentsAll, payments: paymentsMes, schedulesMap, usersMap, cajasMap, cajas = [] } = data;
  const payments = (paymentsAll && paymentsAll.length) ? paymentsAll : paymentsMes;
  const [obsModal, setObsModal] = useState({ open: false, id: null, obs: '' });
  const [confirmModal, setConfirmModal] = useState({ open: false, payment: null, cajaId: 'none' });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, label: '' });
  const [saving, setSaving] = useState(false);
  const canManage = canAdmin || canContadora;

  const sorted = useMemo(() => [...payments].sort((a, b) => new Date(b.created) - new Date(a.created)), [payments]);

  // Normalize metodo_pago (lowercase) to medio_pago select values (capitalized)
  const normalizeMedioPago = (val) => {
    if (!val) return 'Efectivo';
    const map = { efectivo: 'Efectivo', qr: 'QR', transferencia: 'Transferencia', tarjeta: 'Tarjeta', cheque: 'Cheque', otro: 'Otro', 'tansferencia bancaria': 'Transferencia', 'transferencia bancaria': 'Transferencia' };
    return map[val.toLowerCase().trim()] || 'Efectivo';
  };

  const confirmRendicion = async () => {
    const { payment, cajaId } = confirmModal;
    if (!payment) return;
    if (cajaId === 'none') return toast.error('Debes seleccionar una caja/banco destino');
    setSaving(true);
    try {
      const caja = cajasMap[cajaId];
      const job = schedulesMap[payment.trabajo_id] || schedulesMap[payment.schedule_id];
      // 1. Update payment state
      await pb.collection('schedule_payments').update(payment.id, {
        estado_rendicion: 'Confirmado',
        estado: 'Confirmado',
        confirmado_por_id: currentUser?.id || '',
        confirmado_por_nombre: currentUser?.name || currentUser?.email || '',
        fecha_confirmacion: new Date().toISOString().split('T')[0],
        caja_banco_id: cajaId,
        caja_banco_nombre: caja?.nombre || '',
      }, { $autoCancel: false });
      // 2. Auto-create movimiento ingreso
      const medioPago = normalizeMedioPago(payment.metodo_pago);
      await pb.collection('movimientos').create({
        tipo: 'ingreso',
        categoria: 'Cobro de trabajo',
        descripcion: `Cobro confirmado - ${job?.cliente_nombre || job?.cliente || payment.cliente_nombre || '—'}`,
        fecha: format(new Date(), 'yyyy-MM-dd'),
        sucursal: job?.sucursal_nombre || job?.sucursal_id || '',
        caja_banco_id: cajaId,
        caja_banco_nombre: caja?.nombre || '',
        medio_pago: medioPago,
        monto: payment.monto_cobrado || 0,
        cliente_id: job?.cliente_id || '',
        cliente_nombre: job?.cliente_nombre || job?.cliente || payment.cliente_nombre || '',
        trabajo_id: payment.trabajo_id || payment.schedule_id || '',
        estado: 'confirmado',
        observacion: `Rendición confirmada por ${currentUser?.name || ''}. Cobrado por: ${payment.cobrado_por_nombre || usersMap[payment.cobrado_por_id]?.name || '—'}`,
        created_by: currentUser?.id || '',
      }, { $autoCancel: false });
      toast.success('Rendición confirmada y movimiento registrado');
      setConfirmModal({ open: false, payment: null, cajaId: 'none' });
      onRefresh();
    } catch (e) {
      console.error('Error al confirmar rendición:', e?.response?.data || e?.message || e);
      toast.error(`Error al confirmar: ${e?.response?.data ? JSON.stringify(e.response.data) : e?.message || 'Error desconocido'}`);
    } finally { setSaving(false); }
  };

  const observarRendicion = async (paymentId, obs) => {
    setSaving(true);
    try {
      await pb.collection('schedule_payments').update(paymentId, {
        estado_rendicion: 'Observado',
        confirmado_por_id: currentUser?.id || '',
        confirmado_por_nombre: currentUser?.name || currentUser?.email || '',
        observacion_rendicion: obs,
      }, { $autoCancel: false });
      toast.success('Rendición marcada como Observada');
      setObsModal({ open: false, id: null, obs: '' });
      onRefresh();
    } catch (e) { console.error('observarRendicion error:', e); toast.error('Error al actualizar'); } finally { setSaving(false); }
  };

  const deletePayment = async () => {
    setSaving(true);
    try {
      await pb.collection('schedule_payments').delete(deleteModal.id, { $autoCancel: false });
      toast.success('Cobro eliminado');
      setDeleteModal({ open: false, id: null, label: '' });
      onRefresh();
    } catch { toast.error('Error al eliminar'); } finally { setSaving(false); }
  };

  const colCount = canAdmin ? 10 : (canContadora ? 9 : 8);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
        <table className="w-full text-sm whitespace-nowrap min-w-[900px]">
          <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Trabajo / Cliente</th>
              <th className="px-4 py-3 text-left">Sucursal</th>
              <th className="px-4 py-3 text-left">Cobrado por</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-left">Método</th>
              <th className="px-4 py-3 text-left">Caja/Banco</th>
              <th className="px-4 py-3 text-left">Estado rendición</th>
              {canManage && <th className="px-4 py-3 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading
              ? <tr><td colSpan={colCount} className="px-4 py-6"><Skeleton className="h-8 w-full"/></td></tr>
              : sorted.length > 0 ? sorted.map(p => {
                const job = schedulesMap[p.trabajo_id] || schedulesMap[p.schedule_id];
                const clienteNombre = job?.cliente_nombre || job?.cliente || p.cliente_nombre || '—';
                const sucursal = job?.sucursal_nombre || job?.sucursal_id || p.sucursal || '—';
                const cobradoPorNombre = p.cobrado_por_nombre || usersMap[p.cobrado_por_id]?.name || '—';
                const cajaNombre = cajasMap[p.caja_banco_id]?.nombre || p.caja_banco_nombre || '—';
                const isConfirmed = p.estado_rendicion === 'Confirmado' || p.estado === 'Confirmado';
                const isPending = !isConfirmed;
                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground">{p.created ? format(new Date(p.created), 'dd MMM HH:mm', { locale: es }) : '-'}</td>
                    <td className="px-4 py-2.5">
                      {(p.tipo === 'Adelanto' || p.tipo_cobro === 'adelanto')
                        ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">Adelanto</span>
                        : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">{p.tipo || 'Cobro final'}</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-foreground">{clienteNombre}</div>
                      <div className="text-[11px] text-muted-foreground">{p.observacion || ''}</div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{sucursal}</td>
                    <td className="px-4 py-2.5 font-medium">{cobradoPorNombre}</td>
                    <td className="px-4 py-2.5 text-right font-black tabular-nums text-emerald-600">{fmt(p.monto_cobrado)}</td>
                    <td className="px-4 py-2.5 capitalize">{p.metodo_pago || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{cajaNombre}</td>
                    <td className="px-4 py-2.5"><EstadoBadge v={p.estado_rendicion || 'Pendiente rendición'} map={RENDICION_MAP} /></td>
                    {canManage && (
                      <td className="px-4 py-2.5">
                        <div className="flex justify-center gap-1">
                          {isPending && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-[11px] font-bold" onClick={() => setConfirmModal({ open: true, payment: p, cajaId: p.caja_banco_id || 'none' })}>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1"/> Confirmar
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-orange-600 hover:bg-orange-50 text-[11px] font-bold" onClick={() => setObsModal({ open: true, id: p.id, obs: '' })}>
                                Observar
                              </Button>
                            </>
                          )}
                          {canAdmin && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteModal({ open: true, id: p.id, label: `cobro de ${fmt(p.monto_cobrado)}` })}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!isPending && !canAdmin && <span className="text-[11px] text-muted-foreground">—</span>}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              }) : <tr><td colSpan={colCount} className="px-4 py-10 text-center text-muted-foreground">Sin cobros registrados.</td></tr>
            }
          </tbody>
        </table>
      </div>

      {/* Confirm rendición modal - requires caja selection */}
      <Dialog open={confirmModal.open} onOpenChange={() => setConfirmModal({ open: false, payment: null, cajaId: 'none' })}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="font-extrabold">Confirmar Rendición</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {confirmModal.payment && (
              <div className="bg-muted/30 rounded-xl p-3 text-sm space-y-1">
                <p><span className="font-bold">Monto:</span> {fmt(confirmModal.payment.monto_cobrado)}</p>
                <p><span className="font-bold">Cobrado por:</span> {confirmModal.payment.cobrado_por_nombre || usersMap[confirmModal.payment.cobrado_por_id]?.name || '—'}</p>
                <p><span className="font-bold">Método:</span> {confirmModal.payment.metodo_pago || '—'}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="font-bold">Caja / Banco destino *</Label>
              <Select value={confirmModal.cajaId} onValueChange={v => setConfirmModal(p => ({...p, cajaId: v}))}>
                <SelectTrigger><SelectValue placeholder="Selecciona caja/banco..."/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seleccionar...</SelectItem>
                  {cajas.filter(c => c.activo !== false).map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.tipo})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmModal({ open: false, payment: null, cajaId: 'none' })}>Cancelar</Button>
            <Button className="font-bold" onClick={confirmRendicion} disabled={saving || confirmModal.cajaId === 'none'}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>} Confirmar y crear movimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={obsModal.open} onOpenChange={() => setObsModal({ open: false, id: null, obs: '' })}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="font-extrabold">Observar Rendición</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Motivo de observación</Label>
            <Textarea value={obsModal.obs} onChange={e => setObsModal(p => ({...p, obs: e.target.value}))} className="min-h-[80px]" placeholder="Describe el motivo..." />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setObsModal({ open: false, id: null, obs: '' })}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 font-bold" onClick={() => observarRendicion(obsModal.id, obsModal.obs)} disabled={saving || !obsModal.obs.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>} Marcar como Observado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, label: '' })} onConfirm={deletePayment} saving={saving} label={deleteModal.label} />
    </div>
  );
};

// ─────────────── COSTOS POR TRABAJO TAB ───────────────
const CostosTab = ({ data, loading, currentUser, canAdmin, canContadora, onRefresh }) => {
  const { costos, schedulesAll, schedules } = data;
  const allSchedules = schedulesAll || schedules || [];
  const [form, setForm] = useState({ trabajo_id: 'none', concepto: '', cantidad: '1', precio_unitario: '', fecha: format(new Date(), 'yyyy-MM-dd'), observacion: '' });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localCostos, setLocalCostos] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, label: '' });
  const canManage = canAdmin || canContadora;

  useEffect(() => { setLocalCostos(costos); }, [costos]);

  const total = parseFloat(form.cantidad || 0) * parseFloat(form.precio_unitario || 0);

  const submit = async (e) => {
    e.preventDefault();
    if (form.trabajo_id === 'none') return toast.error('Selecciona un trabajo');
    if (!form.concepto.trim()) return toast.error('El concepto es requerido');
    setSaving(true);
    try {
      const job = allSchedules.find(j => j.id === form.trabajo_id);
      const rec = await pb.collection('costos_trabajo').create({
        trabajo_id: form.trabajo_id,
        cliente_id: job?.cliente_id || '',
        sucursal: job?.sucursal_id || '',
        concepto: form.concepto,
        cantidad: parseFloat(form.cantidad) || 0,
        precio_unitario: parseFloat(form.precio_unitario) || 0,
        costo_total: total,
        fecha: form.fecha,
        observacion: form.observacion,
        created_by: currentUser?.id || ''
      }, { $autoCancel: false });
      toast.success('Costo registrado');
      setLocalCostos(prev => [rec, ...prev]);
      setShowForm(false);
      setForm({ trabajo_id: 'none', concepto: '', cantidad: '1', precio_unitario: '', fecha: format(new Date(), 'yyyy-MM-dd'), observacion: '' });
    } catch { toast.error('Error al guardar'); } finally { setSaving(false); }
  };

  const deleteCosto = async () => {
    setSaving(true);
    try {
      await pb.collection('costos_trabajo').delete(deleteModal.id, { $autoCancel: false });
      toast.success('Costo eliminado');
      setLocalCostos(prev => prev.filter(c => c.id !== deleteModal.id));
      setDeleteModal({ open: false, id: null, label: '' });
    } catch { toast.error('Error al eliminar'); } finally { setSaving(false); }
  };

  const schedulesMap = useMemo(() => {
    const m = {};
    allSchedules.forEach(j => { m[j.id] = j; });
    return m;
  }, [allSchedules]);

  return (
    <div className="space-y-4">
      {canManage && (
        <Button onClick={() => setShowForm(v => !v)} className="font-bold">
          <Plus className="h-4 w-4 mr-2"/> {showForm ? 'Cancelar' : 'Registrar Costo'}
        </Button>
      )}

      {showForm && (
        <Card className="border rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <CardContent className="p-5">
            <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-bold">Trabajo *</Label>
                <Select value={form.trabajo_id} onValueChange={v => setForm(p => ({...p, trabajo_id: v}))} disabled={saving}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecciona un trabajo...</SelectItem>
                    {allSchedules.map(j => <SelectItem key={j.id} value={j.id}>{j.cliente_nombre || j.cliente} — {fmtFecha(j.fecha_programada)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-bold">Concepto / Material *</Label>
                <Input value={form.concepto} onChange={e => setForm(p => ({...p, concepto: e.target.value}))} placeholder="Ej. Cable UTP, Cámara IP..." disabled={saving} required/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Cantidad</Label>
                <Input type="number" step="0.01" value={form.cantidad} onChange={e => setForm(p => ({...p, cantidad: e.target.value}))} disabled={saving}/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">P. Unitario</Label>
                <Input type="number" step="0.01" value={form.precio_unitario} onChange={e => setForm(p => ({...p, precio_unitario: e.target.value}))} disabled={saving}/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Total</Label>
                <Input value={total.toFixed(2)} disabled className="bg-muted font-bold tabular-nums"/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Fecha *</Label>
                <Input type="date" value={form.fecha} onChange={e => setForm(p => ({...p, fecha: e.target.value}))} disabled={saving} required/>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-bold">Observación</Label>
                <Input value={form.observacion} onChange={e => setForm(p => ({...p, observacion: e.target.value}))} disabled={saving}/>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={saving} className="w-full font-bold">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>} Agregar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
        <table className="w-full text-sm whitespace-nowrap min-w-[800px]">
          <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Trabajo / Cliente</th>
              <th className="px-4 py-3 text-left">Concepto</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-right">P. Unitario</th>
              <th className="px-4 py-3 text-right">Total</th>
              {canAdmin && <th className="px-4 py-3 text-center">Acción</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan={canAdmin ? 7 : 6} className="px-4 py-6"><Skeleton className="h-8 w-full"/></td></tr>
              : localCostos.length > 0 ? localCostos.map(c => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{c.fecha ? format(new Date(c.fecha), 'dd MMM yyyy', { locale: es }) : '-'}</td>
                  <td className="px-4 py-2.5 font-medium">{schedulesMap[c.trabajo_id]?.cliente_nombre || schedulesMap[c.trabajo_id]?.cliente || c.trabajo_id?.slice(0,8) || '—'}</td>
                  <td className="px-4 py-2.5 font-bold">{c.concepto}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c.cantidad}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(c.precio_unitario)}</td>
                  <td className="px-4 py-2.5 text-right font-black tabular-nums text-orange-600">{fmt(c.costo_total)}</td>
                  {canAdmin && (
                    <td className="px-4 py-2.5 text-center">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteModal({ open: true, id: c.id, label: c.concepto })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              )) : <tr><td colSpan={canAdmin ? 7 : 6} className="px-4 py-10 text-center text-muted-foreground">Sin costos registrados.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <ConfirmDeleteDialog open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, label: '' })} onConfirm={deleteCosto} saving={saving} label={deleteModal.label} />
    </div>
  );
};

// ─────────────── CAJAS Y BANCOS TAB ───────────────
const CajasBancosTab = ({ data, loading, canAdmin, canContadora, currentUser, onRefresh }) => {
  const { cajas, sucursales = [], movimientos = [] } = data;
  const canManage = canAdmin || canContadora;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', tipo: 'Caja', sucursal: '', saldo_inicial: '', descripcion: '' });
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, label: '' });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.error('El nombre es requerido');
    setSaving(true);
    try {
      await pb.collection('cajas_bancos').create({
        ...form, saldo_inicial: parseFloat(form.saldo_inicial) || 0, activo: true, created_by: currentUser?.id || ''
      }, { $autoCancel: false });
      toast.success('Caja/Banco creado');
      setShowForm(false);
      setForm({ nombre: '', tipo: 'Caja', sucursal: '', saldo_inicial: '', descripcion: '' });
      onRefresh();
    } catch { toast.error('Error al guardar'); } finally { setSaving(false); }
  };

  const toggleActivo = async (id, activo) => {
    try {
      await pb.collection('cajas_bancos').update(id, { activo: !activo }, { $autoCancel: false });
      toast.success('Actualizado');
      onRefresh();
    } catch { toast.error('Error'); }
  };

  const deleteCaja = async () => {
    setSaving(true);
    try {
      await pb.collection('cajas_bancos').delete(deleteModal.id, { $autoCancel: false });
      toast.success('Eliminado');
      setDeleteModal({ open: false, id: null, label: '' });
      onRefresh();
    } catch { toast.error('Error al eliminar'); } finally { setSaving(false); }
  };

  const TIPO_ICONS = { Caja: Wallet, Banco: Banknote, QR: CreditCard, Digital: ArrowRightLeft };

  return (
    <div className="space-y-4">
      {canManage && (
        <Button onClick={() => setShowForm(v => !v)} className="font-bold">
          <Plus className="h-4 w-4 mr-2"/> Nueva Caja / Banco
        </Button>
      )}

      {showForm && (
        <Card className="border rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <CardContent className="p-5">
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-bold">Nombre *</Label><Input value={form.nombre} onChange={e => setForm(p => ({...p, nombre: e.target.value}))} placeholder="Ej. Caja Central" disabled={saving} required/></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({...p, tipo: v}))} disabled={saving}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{['Caja','Banco','QR','Digital'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Sucursal</Label><Select value={form.sucursal || 'none'} onValueChange={v => setForm(p => ({...p, sucursal: v === 'none' ? '' : v}))} disabled={saving}><SelectTrigger><SelectValue placeholder="Selecciona sucursal..."/></SelectTrigger><SelectContent><SelectItem value="none">Sin sucursal</SelectItem>{sucursales.map(s => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Saldo Inicial</Label><Input type="number" step="0.01" value={form.saldo_inicial} onChange={e => setForm(p => ({...p, saldo_inicial: e.target.value}))} disabled={saving}/></div>
              <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Descripción</Label><Input value={form.descripcion} onChange={e => setForm(p => ({...p, descripcion: e.target.value}))} disabled={saving}/></div>
              <div className="flex items-end col-span-3 justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving} className="font-bold">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>} Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl"/>) :
          cajas.length > 0 ? cajas.map(c => {
            const Icon = TIPO_ICONS[c.tipo] || Wallet;
            // Compute saldo actual from confirmed movimientos
            const confirmed = movimientos.filter(m => m.estado === 'confirmado');
            const ingresos = confirmed.filter(m => (m.tipo === 'ingreso' || m.tipo === 'cobro') && m.caja_banco_id === c.id).reduce((s, m) => s + (m.monto || 0), 0);
            const egresos = confirmed.filter(m => (m.tipo === 'egreso' || m.tipo === 'pago_proveedor') && m.caja_banco_id === c.id).reduce((s, m) => s + (m.monto || 0), 0);
            // Transferencias: destino suma, origen resta
            const transferIn = confirmed.filter(m => m.tipo === 'transferencia' && m.caja_banco_destino_id === c.id).reduce((s, m) => s + (m.monto || 0), 0);
            const transferOut = confirmed.filter(m => m.tipo === 'transferencia' && m.caja_banco_id === c.id).reduce((s, m) => s + (m.monto || 0), 0);
            const saldoActual = (c.saldo_inicial || 0) + ingresos - egresos + transferIn - transferOut;
            return (
              <div key={c.id} className={cn("rounded-xl border p-4 space-y-3 shadow-sm", c.activo ? 'bg-card' : 'bg-muted/30 opacity-60')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg"><Icon className="h-5 w-5 text-primary"/></div>
                    <div>
                      <p className="font-extrabold text-sm">{c.nombre}</p>
                      <p className="text-[11px] text-muted-foreground">{c.tipo} {c.sucursal ? `· ${c.sucursal}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {canManage && <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => toggleActivo(c.id, c.activo)}>{c.activo ? 'Desactivar' : 'Activar'}</Button>}
                    {canAdmin && <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteModal({ open: true, id: c.id, label: c.nombre })}><Trash2 className="h-3.5 w-3.5"/></Button>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-bold">Inicial</p>
                    <p className="text-sm font-black tabular-nums">{fmt(c.saldo_inicial)}</p>
                  </div>
                  <div className="bg-emerald-50 border-emerald-100 border rounded-lg p-2">
                    <p className="text-[10px] text-emerald-700 font-bold">Ingresos</p>
                    <p className="text-sm font-black tabular-nums text-emerald-600">{fmt(ingresos + transferIn)}</p>
                  </div>
                  <div className="bg-red-50 border-red-100 border rounded-lg p-2">
                    <p className="text-[10px] text-red-700 font-bold">Egresos</p>
                    <p className="text-sm font-black tabular-nums text-red-600">{fmt(egresos + transferOut)}</p>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <p className="text-[11px] text-muted-foreground font-medium">Saldo actual</p>
                  <p className={`text-xl font-black tabular-nums ${saldoActual >= 0 ? 'text-primary' : 'text-red-600'}`}>{fmt(saldoActual)}</p>
                </div>
                {c.descripcion && <p className="text-[11px] text-muted-foreground">{c.descripcion}</p>}
              </div>
            );
          }) : <div className="col-span-3 py-10 text-center text-muted-foreground font-medium">No hay cajas ni bancos. Crea uno para comenzar.</div>
        }
      </div>
      <ConfirmDeleteDialog open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, label: '' })} onConfirm={deleteCaja} saving={saving} label={deleteModal.label} />
    </div>
  );
};

// ─────────────── PROVEEDORES TAB ───────────────
const ProveedoresTab = ({ data, loading, canAdmin, canContadora, currentUser, onRefresh }) => {
  const { proveedores, compras, sucursales = [], cajasMap = {}, cajas = [] } = data;
  const canManage = canAdmin || canContadora;
  const [tab, setTab] = useState('proveedores');
  const [showProvForm, setShowProvForm] = useState(false);
  const [showCompraForm, setShowCompraForm] = useState(false);
  const [provForm, setProvForm] = useState({ nombre: '', telefono: '', nit: '', direccion: '', observacion: '' });
  const [compraForm, setCompraForm] = useState({ proveedor_id: 'none', concepto: '', monto: '', fecha: format(new Date(), 'yyyy-MM-dd'), estado_pago: 'Pendiente', sucursal: '', observacion: '' });
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, col: '', label: '' });

  const submitProv = async (e) => {
    e.preventDefault();
    if (!provForm.nombre.trim()) return toast.error('El nombre es requerido');
    setSaving(true);
    try {
      await pb.collection('proveedores').create({ ...provForm, activo: true, created_by: currentUser?.id || '' }, { $autoCancel: false });
      toast.success('Proveedor creado');
      setShowProvForm(false);
      setProvForm({ nombre: '', telefono: '', nit: '', direccion: '', observacion: '' });
      onRefresh();
    } catch { toast.error('Error al guardar'); } finally { setSaving(false); }
  };

  const submitCompra = async (e) => {
    e.preventDefault();
    if (compraForm.proveedor_id === 'none') return toast.error('Selecciona un proveedor');
    if (!compraForm.concepto.trim()) return toast.error('El concepto es requerido');
    if (!compraForm.monto) return toast.error('El monto es requerido');
    setSaving(true);
    try {
      const prov = proveedores.find(p => p.id === compraForm.proveedor_id);
      const montoNum = parseFloat(compraForm.monto) || 0;
      await pb.collection('compras_proveedores').create({
        ...compraForm, proveedor_id: compraForm.proveedor_id, proveedor_nombre: prov?.nombre || '',
        monto: montoNum,
        monto_pagado: compraForm.estado_pago === 'Pagado' ? montoNum : 0,
        created_by: currentUser?.id || ''
      }, { $autoCancel: false });
      // Auto-crear egreso en Movimientos
      try {
        await pb.collection('movimientos').create({
          fecha: compraForm.fecha,
          tipo: 'pago_proveedor',
          categoria: 'Pago a Proveedor',
          descripcion: `Compra a ${prov?.nombre || 'proveedor'}: ${compraForm.concepto}`,
          sucursal_id: sucursales.find(s => s.nombre === compraForm.sucursal)?.id || '',
          monto: montoNum,
          proveedor_id: compraForm.proveedor_id,
          registrado_por_id: currentUser?.id || '',
          estado: compraForm.estado_pago === 'Pagado' ? 'Confirmado' : 'Pendiente',
          observacion: compraForm.observacion || '',
          created_by: currentUser?.id || ''
        }, { $autoCancel: false });
      } catch { /* auto-egreso falla silenciosamente */ }
      toast.success('Compra registrada y egreso creado en Movimientos');
      setShowCompraForm(false);
      setCompraForm({ proveedor_id: 'none', concepto: '', monto: '', fecha: format(new Date(), 'yyyy-MM-dd'), estado_pago: 'Pendiente', sucursal: '', observacion: '' });
      onRefresh();
    } catch { toast.error('Error al guardar'); } finally { setSaving(false); }
  };

  const deleteRecord = async () => {
    setSaving(true);
    try {
      await pb.collection(deleteModal.col).delete(deleteModal.id, { $autoCancel: false });
      toast.success('Eliminado');
      setDeleteModal({ open: false, id: null, col: '', label: '' });
      onRefresh();
    } catch { toast.error('Error al eliminar'); } finally { setSaving(false); }
  };

  const totalPendiente = useMemo(() => compras.filter(c => c.estado_pago !== 'Pagado').reduce((s, c) => s + (c.monto || 0) - (c.monto_pagado || 0), 0), [compras]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b pb-3">
        <Button variant={tab === 'proveedores' ? 'default' : 'ghost'} size="sm" className="font-bold" onClick={() => setTab('proveedores')}>Proveedores</Button>
        <Button variant={tab === 'compras' ? 'default' : 'ghost'} size="sm" className="font-bold" onClick={() => setTab('compras')}>Compras / Pagos</Button>
      </div>

      {tab === 'proveedores' && (
        <>
          {canManage && <Button onClick={() => setShowProvForm(v => !v)} className="font-bold"><Plus className="h-4 w-4 mr-2"/>Nuevo Proveedor</Button>}
          {showProvForm && (
            <Card className="border rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <CardContent className="p-5">
                <form onSubmit={submitProv} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5"><Label className="text-xs font-bold">Nombre *</Label><Input value={provForm.nombre} onChange={e => setProvForm(p => ({...p, nombre: e.target.value}))} required disabled={saving}/></div>
                  <div className="space-y-1.5"><Label className="text-xs font-bold">Teléfono</Label><Input value={provForm.telefono} onChange={e => setProvForm(p => ({...p, telefono: e.target.value}))} disabled={saving}/></div>
                  <div className="space-y-1.5"><Label className="text-xs font-bold">NIT</Label><Input value={provForm.nit} onChange={e => setProvForm(p => ({...p, nit: e.target.value}))} disabled={saving}/></div>
                  <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Dirección</Label><Input value={provForm.direccion} onChange={e => setProvForm(p => ({...p, direccion: e.target.value}))} disabled={saving}/></div>
                  <div className="space-y-1.5"><Label className="text-xs font-bold">Observación</Label><Input value={provForm.observacion} onChange={e => setProvForm(p => ({...p, observacion: e.target.value}))} disabled={saving}/></div>
                  <div className="flex justify-end col-span-3 gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowProvForm(false)}>Cancelar</Button>
                    <Button type="submit" disabled={saving} className="font-bold">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Guardar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th><th className="px-4 py-3 text-left">Teléfono</th><th className="px-4 py-3 text-left">NIT</th><th className="px-4 py-3 text-left">Dirección</th>
                  {canAdmin && <th className="px-4 py-3 text-center">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? <tr><td colSpan={canAdmin ? 5 : 4} className="px-4 py-6"><Skeleton className="h-8 w-full"/></td></tr>
                  : proveedores.length > 0 ? proveedores.map(p => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-bold">{p.nombre}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{p.telefono || '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{p.nit || '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{p.direccion || '—'}</td>
                      {canAdmin && <td className="px-4 py-2.5 text-center"><Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteModal({ open: true, id: p.id, col: 'proveedores', label: p.nombre })}><Trash2 className="h-3.5 w-3.5"/></Button></td>}
                    </tr>
                  )) : <tr><td colSpan={canAdmin ? 5 : 4} className="px-4 py-10 text-center text-muted-foreground">Sin proveedores.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'compras' && (
        <>
          <div className="flex items-center gap-4 flex-wrap">
            {canManage && <Button onClick={() => setShowCompraForm(v => !v)} className="font-bold"><Plus className="h-4 w-4 mr-2"/>Registrar Compra</Button>}
            <div className="ml-auto p-3 rounded-xl border border-red-200 bg-red-50">
              <p className="text-[11px] font-bold text-red-700">Total pendiente a proveedores</p>
              <p className="text-lg font-black text-red-600 tabular-nums">{fmt(totalPendiente)}</p>
            </div>
          </div>
          {showCompraForm && (
            <Card className="border rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <CardContent className="p-5">
                <form onSubmit={submitCompra} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Proveedor *</Label>
                    <Select value={compraForm.proveedor_id} onValueChange={v => setCompraForm(p => ({...p, proveedor_id: v}))} disabled={saving}>
                      <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                      <SelectContent><SelectItem value="none">Selecciona...</SelectItem>{proveedores.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs font-bold">Fecha *</Label><Input type="date" value={compraForm.fecha} onChange={e => setCompraForm(p => ({...p, fecha: e.target.value}))} disabled={saving} required/></div>
                  <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Concepto *</Label><Input value={compraForm.concepto} onChange={e => setCompraForm(p => ({...p, concepto: e.target.value}))} disabled={saving} required/></div>
                  <div className="space-y-1.5"><Label className="text-xs font-bold">Monto *</Label><Input type="number" step="0.01" value={compraForm.monto} onChange={e => setCompraForm(p => ({...p, monto: e.target.value}))} disabled={saving} required/></div>
                  <div className="space-y-1.5"><Label className="text-xs font-bold">Estado Pago</Label>
                    <Select value={compraForm.estado_pago} onValueChange={v => setCompraForm(p => ({...p, estado_pago: v}))} disabled={saving}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>{['Pendiente','Parcial','Pagado'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs font-bold">Sucursal</Label><Select value={compraForm.sucursal || 'none'} onValueChange={v => setCompraForm(p => ({...p, sucursal: v === 'none' ? '' : v}))} disabled={saving}><SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger><SelectContent><SelectItem value="none">Sin sucursal</SelectItem>{sucursales.map(s => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-xs font-bold">Observación</Label><Input value={compraForm.observacion} onChange={e => setCompraForm(p => ({...p, observacion: e.target.value}))} disabled={saving}/></div>
                  <div className="flex justify-end col-span-3 gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowCompraForm(false)}>Cancelar</Button>
                    <Button type="submit" disabled={saving} className="font-bold">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Guardar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
            <table className="w-full text-sm whitespace-nowrap min-w-[800px]">
              <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                <tr><th className="px-4 py-3 text-left">Fecha</th><th className="px-4 py-3 text-left">Proveedor</th><th className="px-4 py-3 text-left">Concepto</th><th className="px-4 py-3 text-right">Monto</th><th className="px-4 py-3 text-left">Estado</th><th className="px-4 py-3 text-left">Sucursal</th>{canAdmin && <th className="px-4 py-3 text-center">Acción</th>}</tr>
              </thead>
              <tbody className="divide-y">
                {loading ? <tr><td colSpan={canAdmin ? 7 : 6} className="px-4 py-6"><Skeleton className="h-8 w-full"/></td></tr>
                  : compras.length > 0 ? compras.map(c => (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground">{c.fecha ? format(new Date(c.fecha), 'dd MMM yyyy', { locale: es }) : '-'}</td>
                      <td className="px-4 py-2.5 font-bold">{c.proveedor_nombre}</td>
                      <td className="px-4 py-2.5">{c.concepto}</td>
                      <td className="px-4 py-2.5 text-right font-black tabular-nums">{fmt(c.monto)}</td>
                      <td className="px-4 py-2.5"><Badge className={cn("text-[10px] font-bold border shadow-none", c.estado_pago === 'Pagado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : c.estado_pago === 'Parcial' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200')}>{c.estado_pago}</Badge></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.sucursal || '—'}</td>
                      {canAdmin && <td className="px-4 py-2.5 text-center"><Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteModal({ open: true, id: c.id, col: 'compras_proveedores', label: c.concepto })}><Trash2 className="h-3.5 w-3.5"/></Button></td>}
                    </tr>
                  )) : <tr><td colSpan={canAdmin ? 7 : 6} className="px-4 py-10 text-center text-muted-foreground">Sin compras.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </>
      )}
      <ConfirmDeleteDialog open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, col: '', label: '' })} onConfirm={deleteRecord} saving={saving} label={deleteModal.label} />
    </div>
  );
};

// ─────────────── FACTURAS TAB ───────────────
const FacturasTab = ({ data, loading, canAdmin, canContadora, currentUser, onRefresh }) => {
  const { facturas, schedulesAll, schedules } = data;
  const allSchedules = schedulesAll || schedules || [];
  const canManage = canAdmin || canContadora;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ trabajo_id: 'none', cliente_nombre: '', tiene_factura: 'Pendiente', numero_factura: '', fecha_factura: format(new Date(), 'yyyy-MM-dd'), monto_facturado: '', debito_fiscal: '', observacion: '' });
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, label: '' });

  // Combined facturas: facturas_control + schedules where factura_estado='Sí' not already in facturas_control
  const combinedFacturas = useMemo(() => {
    const facturasControlTrabajoIds = new Set(facturas.map(f => f.trabajo_id).filter(Boolean));
    const fromSchedules = allSchedules
      .filter(j => j.factura_estado === 'Sí' && j.numero_factura && !facturasControlTrabajoIds.has(j.id))
      .map(j => ({
        _fromSchedule: true,
        id: `sched_${j.id}`,
        trabajo_id: j.id,
        cliente_nombre: j.cliente_nombre || j.cliente || '—',
        tiene_factura: 'Sí',
        numero_factura: j.numero_factura,
        fecha_factura: j.fecha_programada,
        monto_facturado: j.monto_facturado || 0,
        debito_fiscal: j.debito_fiscal || 0,
        sucursal: j.sucursal_id,
      }));
    return [...facturas, ...fromSchedules].sort((a, b) => {
      const da = a.fecha_factura ? new Date(a.fecha_factura) : new Date(0);
      const db = b.fecha_factura ? new Date(b.fecha_factura) : new Date(0);
      return db - da;
    });
  }, [facturas, allSchedules]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const job = allSchedules.find(j => j.id === form.trabajo_id);
      await pb.collection('facturas_control').create({
        ...form,
        trabajo_id: form.trabajo_id === 'none' ? '' : form.trabajo_id,
        cliente_nombre: form.cliente_nombre || job?.cliente_nombre || '',
        monto_facturado: parseFloat(form.monto_facturado) || 0,
        debito_fiscal: parseFloat(form.debito_fiscal) || 0,
        created_by: currentUser?.id || ''
      }, { $autoCancel: false });
      toast.success('Factura registrada');
      setShowForm(false);
      setForm({ trabajo_id: 'none', cliente_nombre: '', tiene_factura: 'Pendiente', numero_factura: '', fecha_factura: format(new Date(), 'yyyy-MM-dd'), monto_facturado: '', debito_fiscal: '', observacion: '' });
      onRefresh();
    } catch { toast.error('Error al guardar'); } finally { setSaving(false); }
  };

  const deleteFactura = async () => {
    setSaving(true);
    try {
      await pb.collection('facturas_control').delete(deleteModal.id, { $autoCancel: false });
      toast.success('Factura eliminada');
      setDeleteModal({ open: false, id: null, label: '' });
      onRefresh();
    } catch { toast.error('Error al eliminar'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {canManage && <Button onClick={() => setShowForm(v => !v)} className="font-bold"><Plus className="h-4 w-4 mr-2"/>Registrar Factura</Button>}
      {showForm && (
        <Card className="border rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <CardContent className="p-5">
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-bold">Trabajo relacionado</Label>
                <Select value={form.trabajo_id} onValueChange={v => {
                  const job = allSchedules.find(j => j.id === v);
                  setForm(p => ({...p, trabajo_id: v, cliente_nombre: job?.cliente_nombre || p.cliente_nombre}));
                }} disabled={saving}>
                  <SelectTrigger><SelectValue placeholder="Opcional..."/></SelectTrigger>
                  <SelectContent><SelectItem value="none">Ninguno</SelectItem>{allSchedules.slice(0, 100).map(j => <SelectItem key={j.id} value={j.id}>{j.cliente_nombre || j.cliente} — {fmtFecha(j.fecha_programada)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Tiene Factura</Label>
                <Select value={form.tiene_factura} onValueChange={v => setForm(p => ({...p, tiene_factura: v}))} disabled={saving}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{['Sí','No','Pendiente'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Nº Factura</Label><Input value={form.numero_factura} onChange={e => setForm(p => ({...p, numero_factura: e.target.value}))} disabled={saving}/></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Fecha Factura</Label><Input type="date" value={form.fecha_factura} onChange={e => setForm(p => ({...p, fecha_factura: e.target.value}))} disabled={saving}/></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Monto Facturado</Label><Input type="number" step="0.01" value={form.monto_facturado} onChange={e => setForm(p => ({...p, monto_facturado: e.target.value}))} disabled={saving}/></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Débito Fiscal</Label><Input type="number" step="0.01" value={form.debito_fiscal} onChange={e => setForm(p => ({...p, debito_fiscal: e.target.value}))} disabled={saving}/></div>
              <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Observación</Label><Input value={form.observacion} onChange={e => setForm(p => ({...p, observacion: e.target.value}))} disabled={saving}/></div>
              <div className="flex justify-end col-span-3 gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving} className="font-bold">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
        <table className="w-full text-sm whitespace-nowrap min-w-[900px]">
          <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Nº Factura</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-right">Débito Fiscal</th>
              <th className="px-4 py-3 text-left">Estado</th>
              {canAdmin && <th className="px-4 py-3 text-center">Acción</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan={canAdmin ? 7 : 6} className="px-4 py-6"><Skeleton className="h-8 w-full"/></td></tr>
              : combinedFacturas.length > 0 ? combinedFacturas.map(f => (
                <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{f.fecha_factura ? format(new Date(f.fecha_factura), 'dd MMM yyyy', { locale: es }) : '—'}</td>
                  <td className="px-4 py-2.5 font-bold">{f.cliente_nombre || '—'}</td>
                  <td className="px-4 py-2.5 font-mono">{f.numero_factura || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">{fmt(f.monto_facturado)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-orange-600">{fmt(f.debito_fiscal)}</td>
                  <td className="px-4 py-2.5"><EstadoBadge v={f.tiene_factura || 'Pendiente'} map={FACTURA_MAP} /></td>
                  {canAdmin && (
                    <td className="px-4 py-2.5 text-center">
                      {!f._fromSchedule ? (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteModal({ open: true, id: f.id, label: `factura ${f.numero_factura || f.cliente_nombre}` })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Del trabajo</span>
                      )}
                    </td>
                  )}
                </tr>
              )) : <tr><td colSpan={canAdmin ? 7 : 6} className="px-4 py-10 text-center text-muted-foreground">Sin facturas registradas.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <ConfirmDeleteDialog open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, label: '' })} onConfirm={deleteFactura} saving={saving} label={deleteModal.label} />
    </div>
  );
};

// ─────────────── METAS TAB ───────────────
const MetasTab = ({ data, loading, canAdmin }) => {
  const { goalsSp, goalsBr, schedules, payments, usersMap } = data;

  const salesByUser = useMemo(() => {
    const m = {};
    schedules.forEach(j => {
      const id = j.vendedor_responsable_id;
      if (id) m[id] = (m[id] || 0) + (j.monto || 0);
    });
    return m;
  }, [schedules]);

  const cobrosByUser = useMemo(() => {
    const m = {};
    payments.forEach(p => {
      const id = p.cobrado_por_id;
      if (id) m[id] = (m[id] || 0) + (p.monto_cobrado || 0);
    });
    return m;
  }, [payments]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border rounded-2xl shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-3"><CardTitle className="text-sm font-extrabold flex items-center gap-2"><Users className="h-4 w-4 text-primary"/>Metas por Vendedor</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-4">
            {loading ? <Skeleton className="h-32 w-full"/> :
              goalsSp.length > 0 ? goalsSp.map((g, i) => {
                const matchUser = Object.values(usersMap).find(u => (u.name || '').toLowerCase().trim() === (g.salesperson_name || '').toLowerCase().trim());
                const ventas = matchUser ? (salesByUser[matchUser.id] || 0) : 0;
                const cobros = matchUser ? (cobrosByUser[matchUser.id] || 0) : 0;
                const pctVentas = pct(ventas, g.monthly_goal);
                const pctCobros = pct(cobros, g.monthly_goal);
                return (
                  <div key={i} className="p-3 rounded-xl border border-border space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">{g.salesperson_name}</span>
                      <span className="text-[11px] text-muted-foreground font-medium">Meta: {fmt(g.monthly_goal)}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-blue-600">Ventas: {fmt(ventas)}</span><span className="text-blue-500 font-bold">{pctVentas}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${pctVentas}%` }}/></div>
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-emerald-600">Cobros: {fmt(cobros)}</span><span className="text-emerald-500 font-bold">{pctCobros}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pctCobros}%` }}/></div>
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground text-center py-4">Sin metas configuradas.</p>
            }
          </CardContent>
        </Card>

        <Card className="border rounded-2xl shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-3"><CardTitle className="text-sm font-extrabold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary"/>Metas por Sucursal</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-4">
            {loading ? <Skeleton className="h-32 w-full"/> :
              goalsBr.length > 0 ? goalsBr.map((g, i) => {
                const branchScheds = schedules.filter(j => j.sucursal_id === g.branch_name || (j.sucursal_id || '').includes(g.branch_name));
                const ventas = branchScheds.reduce((s, j) => s + (j.monto || 0), 0);
                const p2 = pct(ventas, g.monthly_goal);
                return (
                  <div key={i} className="p-3 rounded-xl border border-border space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">{g.branch_name}</span>
                      <span className="text-[11px] text-muted-foreground">Meta: {fmt(g.monthly_goal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-blue-600">{fmt(ventas)}</span><span className="font-bold text-blue-500">{p2}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${p2}%` }}/></div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground text-center py-4">Sin metas por sucursal.</p>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ─────────────── REPORTES TAB ───────────────
const ReportesTab = ({ data, loading }) => {
  const { schedules, payments, costos, gastos, usersMap } = data;

  const byVendedor = useMemo(() => {
    const m = {};
    schedules.forEach(j => {
      const id = j.vendedor_responsable_id;
      const name = usersMap[id]?.name || 'Sin asignar';
      if (!m[name]) m[name] = { ventas: 0, cobrado: 0, cxc: 0 };
      m[name].ventas += j.monto || 0;
      m[name].cxc += Math.max(0, j.saldo || 0);
    });
    payments.forEach(p => {
      const name = usersMap[p.cobrado_por_id]?.name || p.cobrado_por_nombre || 'Sin asignar';
      if (!m[name]) m[name] = { ventas: 0, cobrado: 0, cxc: 0 };
      m[name].cobrado += p.monto_cobrado || 0;
    });
    return Object.entries(m).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.ventas - a.ventas);
  }, [schedules, payments, usersMap]);

  const byTipoGasto = useMemo(() => {
    const m = {};
    gastos.forEach(g => { const key = g.concepto || 'Otros'; m[key] = (m[key] || 0) + (g.monto || 0); });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [gastos]);

  const pendientesRendicion = useMemo(() => payments.filter(p => p.estado_rendicion !== 'Confirmado' && p.estado !== 'Confirmado'), [payments]);
  const factPendientes = useMemo(() => schedules.filter(j => !j.factura_estado || j.factura_estado === 'Pendiente'), [schedules]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border rounded-2xl shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-3"><CardTitle className="text-sm font-extrabold flex items-center gap-2"><Users className="h-4 w-4 text-primary"/>Ventas y Cobros por Vendedor</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-2.5 text-left">Vendedor</th><th className="px-4 py-2.5 text-right">Ventas</th><th className="px-4 py-2.5 text-right">Cobrado</th><th className="px-4 py-2.5 text-right">CxC</th></tr>
              </thead>
              <tbody className="divide-y">
                {loading ? <tr><td colSpan="4" className="px-4 py-6"><Skeleton className="h-8 w-full"/></td></tr> :
                  byVendedor.length > 0 ? byVendedor.map((v, i) => (
                    <tr key={i} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-2.5 font-bold">{v.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-blue-600">{fmt(v.ventas)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">{fmt(v.cobrado)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-orange-600">{fmt(v.cxc)}</td>
                    </tr>
                  )) : <tr><td colSpan="4" className="px-4 py-8 text-center text-muted-foreground">Sin datos</td></tr>
                }
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border rounded-2xl shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-3"><CardTitle className="text-sm font-extrabold flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-500"/>Gastos por Concepto</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-2">
            {loading ? <Skeleton className="h-24 w-full"/> :
              byTipoGasto.length > 0 ? byTipoGasto.map(([concepto, monto], i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <span className="text-sm font-bold">{concepto}</span>
                  <span className="text-sm font-black tabular-nums text-red-600">{fmt(monto)}</span>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">Sin gastos</p>
            }
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border rounded-2xl shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-3"><CardTitle className="text-sm font-extrabold flex items-center gap-2"><Clock className="h-4 w-4 text-orange-500"/>Rendiciones Pendientes ({pendientesRendicion.length})</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-2 max-h-[200px] overflow-y-auto">
            {loading ? <Skeleton className="h-12 w-full"/> :
              pendientesRendicion.length > 0 ? pendientesRendicion.map((p, i) => (
                <div key={i} className="flex justify-between text-sm p-2 rounded border">
                  <span className="font-medium">{p.cobrado_por_nombre || usersMap[p.cobrado_por_id]?.name || '—'}</span>
                  <span className="font-black tabular-nums text-emerald-600">{fmt(p.monto_cobrado)}</span>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">Sin rendiciones pendientes 🎉</p>
            }
          </CardContent>
        </Card>

        <Card className="border rounded-2xl shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-3"><CardTitle className="text-sm font-extrabold flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500"/>Facturas Pendientes ({factPendientes.length})</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-2 max-h-[200px] overflow-y-auto">
            {loading ? <Skeleton className="h-12 w-full"/> :
              factPendientes.length > 0 ? factPendientes.map((j, i) => (
                <div key={i} className="flex justify-between text-sm p-2 rounded border">
                  <span className="font-medium truncate max-w-[180px]">{j.cliente_nombre || j.cliente}</span>
                  <span className="font-black tabular-nums">{fmt(j.monto)}</span>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">Sin facturas pendientes 🎉</p>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ─────────────── MOVIMIENTOS TAB ───────────────
const TIPO_MOV_MAP = {
  ingreso: { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Ingreso', sign: 1 },
  egreso: { cls: 'bg-red-100 text-red-700 border-red-200', label: 'Egreso', sign: -1 },
  pago_proveedor: { cls: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Pago Proveedor', sign: -1 },
  cobro: { cls: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Cobro', sign: 1 },
  ajuste: { cls: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Ajuste', sign: 0 },
  transferencia: { cls: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Transferencia', sign: 0 },
};

const MovimientosTab = ({ data, loading: parentLoading, canAdmin, canContadora, currentUser, onRefresh }) => {
  const { cajas, cajasMap, sucursales, proveedores, schedulesAll } = data;
  const canManage = canAdmin || canContadora;
  const [movimientos, setMovimientos] = useState([]);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterTipo, setFilterTipo] = useState('todos');
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, label: '' });

  const emptyForm = () => ({
    tipo: 'ingreso', categoria: '', descripcion: '', fecha: format(new Date(), 'yyyy-MM-dd'),
    sucursal: 'none', caja_banco_id: 'none', caja_banco_destino_id: 'none',
    medio_pago: 'Efectivo', monto: '', proveedor_id: 'none', trabajo_id: 'none',
    estado: 'confirmado', observacion: '',
  });
  const [form, setForm] = useState(emptyForm());

  const fetchMovimientos = useCallback(async () => {
    setLoadingLocal(true);
    try {
      const res = await pb.collection('movimientos').getFullList({ sort: '-fecha,-created', $autoCancel: false });
      setMovimientos(res);
    } catch { setMovimientos([]); } finally { setLoadingLocal(false); }
  }, []);

  useEffect(() => { fetchMovimientos(); }, [fetchMovimientos]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.descripcion.trim()) return toast.error('La descripción es requerida');
    if (!form.monto) return toast.error('El monto es requerido');
    setSaving(true);
    try {
      const caja = cajasMap[form.caja_banco_id];
      const prov = proveedores.find(p => p.id === form.proveedor_id);
      const job = (schedulesAll || []).find(j => j.id === form.trabajo_id);
      await pb.collection('movimientos').create({
        tipo: form.tipo,
        categoria: form.categoria,
        descripcion: form.descripcion,
        fecha: form.fecha,
        sucursal: form.sucursal === 'none' ? '' : form.sucursal,
        caja_banco_id: form.caja_banco_id === 'none' ? '' : form.caja_banco_id,
        caja_banco_nombre: caja?.nombre || '',
        caja_banco_destino_id: form.caja_banco_destino_id === 'none' ? '' : form.caja_banco_destino_id,
        caja_banco_destino_nombre: cajasMap[form.caja_banco_destino_id]?.nombre || '',
        medio_pago: form.medio_pago,
        monto: parseFloat(form.monto) || 0,
        proveedor_id: form.proveedor_id === 'none' ? '' : form.proveedor_id,
        proveedor_nombre: prov?.nombre || '',
        trabajo_id: form.trabajo_id === 'none' ? '' : form.trabajo_id,
        cliente_nombre: job?.cliente_nombre || '',
        estado: form.estado,
        observacion: form.observacion,
        created_by: currentUser?.id || '',
      }, { $autoCancel: false });
      toast.success('Movimiento registrado');
      setShowForm(false);
      setForm(emptyForm());
      fetchMovimientos();
      if (onRefresh) onRefresh();
    } catch { toast.error('Error al guardar'); } finally { setSaving(false); }
  };

  const deleteMovimiento = async () => {
    setSaving(true);
    try {
      await pb.collection('movimientos').delete(deleteModal.id, { $autoCancel: false });
      toast.success('Movimiento eliminado');
      setMovimientos(prev => prev.filter(m => m.id !== deleteModal.id));
      setDeleteModal({ open: false, id: null, label: '' });
    } catch { toast.error('Error al eliminar'); } finally { setSaving(false); }
  };

  const filtered = filterTipo === 'todos' ? movimientos : movimientos.filter(m => m.tipo === filterTipo);

  const totales = useMemo(() => {
    let ingresos = 0, egresos = 0;
    filtered.forEach(m => {
      const s = TIPO_MOV_MAP[m.tipo]?.sign || 0;
      if (s > 0) ingresos += m.monto || 0;
      if (s < 0) egresos += m.monto || 0;
    });
    return { ingresos, egresos, neto: ingresos - egresos };
  }, [filtered]);

  const isTransferencia = form.tipo === 'transferencia';
  const showProveedor = form.tipo === 'pago_proveedor';
  const loading = loadingLocal || parentLoading;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground font-medium">Ingresos, egresos, pagos, cobros y ajustes del negocio.</p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ingresos', value: totales.ingresos, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Egresos', value: totales.egresos, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { label: 'Neto', value: totales.neto, color: totales.neto >= 0 ? 'text-blue-600' : 'text-red-600', bg: 'bg-blue-50 border-blue-200' },
        ].map((s, i) => (
          <div key={i} className={cn('rounded-xl border p-3', s.bg)}>
            <p className="text-[11px] font-bold text-muted-foreground uppercase">{s.label}</p>
            <p className={cn('text-xl font-black tabular-nums', s.color)}>{fmt(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters + Add */}
      <div className="flex flex-wrap items-center gap-2">
        {canManage && (
          <Button onClick={() => setShowForm(v => !v)} className="font-bold">
            <Plus className="h-4 w-4 mr-2"/>{showForm ? 'Cancelar' : 'Registrar Movimiento'}
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Label className="text-xs font-bold text-muted-foreground">Tipo:</Label>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-44 text-xs"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {Object.entries(TIPO_MOV_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <CardContent className="p-5">
            <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({...p, tipo: v}))} disabled={saving}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{Object.entries(TIPO_MOV_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Categoría</Label><Input value={form.categoria} onChange={e => setForm(p => ({...p, categoria: e.target.value}))} placeholder="Ej. Ventas, Sueldos..." disabled={saving}/></div>
              <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Descripción *</Label><Input value={form.descripcion} onChange={e => setForm(p => ({...p, descripcion: e.target.value}))} disabled={saving} required/></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Fecha *</Label><Input type="date" value={form.fecha} onChange={e => setForm(p => ({...p, fecha: e.target.value}))} disabled={saving} required/></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Sucursal</Label>
                <Select value={form.sucursal} onValueChange={v => setForm(p => ({...p, sucursal: v}))} disabled={saving}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                  <SelectContent><SelectItem value="none">Sin sucursal</SelectItem>{sucursales.map(s => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Caja / Banco {isTransferencia ? 'Origen' : ''}</Label>
                <Select value={form.caja_banco_id} onValueChange={v => setForm(p => ({...p, caja_banco_id: v}))} disabled={saving}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                  <SelectContent><SelectItem value="none">Sin caja</SelectItem>{cajas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {isTransferencia && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Caja / Banco Destino</Label>
                  <Select value={form.caja_banco_destino_id} onValueChange={v => setForm(p => ({...p, caja_banco_destino_id: v}))} disabled={saving}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                    <SelectContent><SelectItem value="none">Sin caja</SelectItem>{cajas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Medio de pago</Label>
                <Select value={form.medio_pago} onValueChange={v => setForm(p => ({...p, medio_pago: v}))} disabled={saving}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{['Efectivo','QR','Transferencia','Tarjeta','Cheque','Otro'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Monto *</Label><Input type="number" step="0.01" value={form.monto} onChange={e => setForm(p => ({...p, monto: e.target.value}))} disabled={saving} required/></div>
              {showProveedor && (
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-bold">Proveedor</Label>
                  <Select value={form.proveedor_id} onValueChange={v => setForm(p => ({...p, proveedor_id: v}))} disabled={saving}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                    <SelectContent><SelectItem value="none">Sin proveedor</SelectItem>{proveedores.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-bold">Trabajo relacionado (opcional)</Label>
                <Select value={form.trabajo_id} onValueChange={v => setForm(p => ({...p, trabajo_id: v}))} disabled={saving}>
                  <SelectTrigger><SelectValue placeholder="Sin trabajo..."/></SelectTrigger>
                  <SelectContent><SelectItem value="none">Sin trabajo</SelectItem>{(schedulesAll || []).slice(0,100).map(j => <SelectItem key={j.id} value={j.id}>{j.cliente_nombre} — {fmtFecha(j.fecha_programada)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Estado</Label>
                <Select value={form.estado} onValueChange={v => setForm(p => ({...p, estado: v}))} disabled={saving}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="pendiente">Pendiente</SelectItem><SelectItem value="confirmado">Confirmado</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-3"><Label className="text-xs font-bold">Observación</Label><Input value={form.observacion} onChange={e => setForm(p => ({...p, observacion: e.target.value}))} disabled={saving}/></div>
              <div className="flex justify-end col-span-4 gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving} className="font-bold">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
        <table className="w-full text-sm whitespace-nowrap min-w-[900px]">
          <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Descripción</th>
              <th className="px-4 py-3 text-left">Sucursal</th>
              <th className="px-4 py-3 text-left">Caja/Banco</th>
              <th className="px-4 py-3 text-left">Medio</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-left">Estado</th>
              {canAdmin && <th className="px-4 py-3 text-center">Acción</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan={canAdmin ? 9 : 8} className="px-4 py-6"><Skeleton className="h-8 w-full"/></td></tr>
              : filtered.length > 0 ? filtered.map(m => {
                const tipoInfo = TIPO_MOV_MAP[m.tipo] || { cls: 'bg-slate-100 text-slate-700 border-slate-200', label: m.tipo };
                const isPos = tipoInfo.sign >= 0;
                return (
                  <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground">{m.fecha ? format(new Date(m.fecha), 'dd MMM yyyy', { locale: es }) : '—'}</td>
                    <td className="px-4 py-2.5"><Badge className={cn('text-[10px] font-bold border shadow-none', tipoInfo.cls)}>{tipoInfo.label}</Badge></td>
                    <td className="px-4 py-2.5">
                      <div className="font-bold max-w-[200px] truncate">{m.descripcion}</div>
                      {m.cliente_nombre && <div className="text-[11px] text-muted-foreground">{m.cliente_nombre}</div>}
                      {m.proveedor_nombre && <div className="text-[11px] text-muted-foreground">{m.proveedor_nombre}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{m.sucursal || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{m.caja_banco_nombre || '—'}{m.caja_banco_destino_nombre ? ` → ${m.caja_banco_destino_nombre}` : ''}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{m.medio_pago || '—'}</td>
                    <td className={cn('px-4 py-2.5 text-right font-black tabular-nums', tipoInfo.sign > 0 ? 'text-emerald-600' : tipoInfo.sign < 0 ? 'text-red-600' : 'text-foreground')}>{fmt(m.monto)}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={cn('text-[10px] font-bold border shadow-none', m.estado === 'confirmado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : m.estado === 'anulado' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200')}>{m.estado || 'pendiente'}</Badge>
                    </td>
                    {canAdmin && (
                      <td className="px-4 py-2.5 text-center">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteModal({ open: true, id: m.id, label: m.descripcion })}>
                          <Trash2 className="h-3.5 w-3.5"/>
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              }) : <tr><td colSpan={canAdmin ? 9 : 8} className="px-4 py-10 text-center text-muted-foreground">Sin movimientos registrados. Registra el primer movimiento.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <ConfirmDeleteDialog open={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, label: '' })} onConfirm={deleteMovimiento} saving={saving} label={deleteModal.label} />
    </div>
  );
};

// ─────────────── MAIN PAGE ───────────────
const FinanzasPage = () => {
  const { currentUser, isAdmin, isContadora, isVentas, isVentasLevel, userRole } = useAuth();
  const canAdmin = isAdmin();
  // VENTAS / ADMINISTRACIÓN has the same operational level as Contadora in Finanzas
  const canContadora = isVentasLevel();
  const canManage = canAdmin || canContadora;

  const currentMes = format(new Date(), 'yyyy-MM');
  const [filters, setFilters] = useState({ mes: currentMes });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    schedulesAll: [], schedules: [], payments: [], paymentsAll: [], costos: [], gastos: [],
    goalsSp: [], goalsBr: [], sucursales: [], sucursalesMap: {}, users: [], usersMap: {},
    cajas: [], cajasMap: {}, schedulesMap: {}, proveedores: [], compras: [], facturas: [], movimientos: []
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const mesStart = `${filters.mes}-01`;
      const lastDay = endOfMonth(parseISO(`${filters.mes}-01`));
      const mesEnd = format(lastDay, 'yyyy-MM-dd');

      const [schedResAll, payRes, costRes, gastoRes, goalSpRes, goalBrRes, sucRes, userRes, cajaRes, provRes, compraRes, factRes, cliRes, movsRes] = await Promise.all([
        pb.collection('schedules').getFullList({ sort: '-fecha_programada', $autoCancel: false }).catch(() => []),
        pb.collection('schedule_payments').getFullList({ sort: '-created', $autoCancel: false }).catch(() => []),
        pb.collection('costos_trabajo').getFullList({ filter: `fecha >= "${mesStart}" && fecha <= "${mesEnd}"`, sort: '-fecha', $autoCancel: false }).catch(() => []),
        pb.collection('gastos_operativos').getFullList({ filter: `fecha >= "${mesStart}" && fecha <= "${mesEnd}"`, sort: '-fecha', $autoCancel: false }).catch(() => []),
        pb.collection('salesperson_goals').getFullList({ $autoCancel: false }).catch(() => []),
        pb.collection('branch_goals').getFullList({ $autoCancel: false }).catch(() => []),
        pb.collection('sucursales').getFullList({ filter: 'activa = true', sort: 'nombre', $autoCancel: false }).catch(() => []),
        pb.collection('users').getFullList({ $autoCancel: false }).catch(() => []),
        pb.collection('cajas_bancos').getFullList({ $autoCancel: false }).catch(() => []),
        pb.collection('proveedores').getFullList({ $autoCancel: false }).catch(() => []),
        pb.collection('compras_proveedores').getFullList({ sort: '-fecha', $autoCancel: false }).catch(() => []),
        pb.collection('facturas_control').getFullList({ sort: '-created', $autoCancel: false }).catch(() => []),
        pb.collection('clientes').getFullList({ $autoCancel: false }).catch(() => []),
        pb.collection('movimientos').getFullList({ sort: '-fecha,-created', $autoCancel: false }).catch(() => [])
      ]);


      const usersMap = {};
      userRes.forEach(u => { usersMap[u.id] = u; });

      const clientsMap = {};
      cliRes.forEach(c => { clientsMap[c.id] = c; });

      const cajasMap = {};
      cajaRes.forEach(c => { cajasMap[c.id] = c; });

      const sucursalesMap = {};
      sucRes.forEach(s => { sucursalesMap[s.id] = s.nombre; });

      // Normalize all schedules with balance and client name
      const normalizeSchedule = j => {
        const { saldo } = calculateBalance(j);
        return {
          ...j,
          saldo: Math.max(0, saldo),
          cliente_nombre: clientsMap[j.cliente_id]?.nombre || j.cliente || 'Sin cliente',
          vendedor_nombre: j.vendedor_nombre || usersMap[j.vendedor_responsable_id]?.name || '',
          tecnico_nombre: usersMap[j.tecnico_responsable_id]?.name || '',
          sucursal_nombre: sucursalesMap[j.sucursal_id] || j.sucursal_id || '—',
        };
      };

      const schedulesAll = schedResAll.map(normalizeSchedule);

      // Build full map for payment enrichment
      const schedulesMap = {};
      schedulesAll.forEach(j => { schedulesMap[j.id] = j; });

      // Filter to current month for month-specific tabs
      const schedules = schedulesAll.filter(j => {
        if (!j.fecha_programada) return false;
        const d = j.fecha_programada.slice(0, 7);
        return d === filters.mes;
      });

      // Filter payments to current month
      const payments = payRes.filter(p => {
        if (!p.created) return false;
        return p.created.slice(0, 7) === filters.mes;
      });

      setData({
        schedulesAll,
        schedules,
        payments,
        paymentsAll: payRes,
        costos: costRes,
        gastos: gastoRes,
        goalsSp: goalSpRes,
        goalsBr: goalBrRes,
        sucursales: sucRes,
        sucursalesMap,
        users: userRes,
        usersMap,
        cajas: cajaRes,
        cajasMap,
        schedulesMap,
        proveedores: provRes,
        compras: compraRes,
        facturas: factRes,
        movimientos: movsRes,
      });
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const MONTHS = Array.from({ length: 12 }, (_, i) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return format(d, 'yyyy-MM');
  });

  return (
    <Layout>
      <Helmet><title>Finanzas y Contabilidad - H&S</title></Helmet>
      <div className="content-container py-6 pb-24 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <BadgeDollarSign className="h-8 w-8 text-primary"/> Finanzas y Contabilidad
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">Control operativo financiero de H&S Tecnologías.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Período</Label>
              <Select value={filters.mes} onValueChange={v => setFilters(p => ({...p, mes: v}))}>
                <SelectTrigger className="w-40 font-bold"><SelectValue/></SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => <SelectItem key={m} value={m}>{format(parseISO(`${m}-01`), 'MMMM yyyy', { locale: es })}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="resumen" className="w-full">
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 bg-muted/50 p-1 gap-0.5 mb-1">
              <TabsTrigger value="resumen" className="font-bold text-xs whitespace-nowrap">Resumen</TabsTrigger>
              <TabsTrigger value="movimientos" className="font-bold text-xs whitespace-nowrap">Movimientos</TabsTrigger>
              <TabsTrigger value="trabajos" className="font-bold text-xs whitespace-nowrap">Trabajos</TabsTrigger>
              <TabsTrigger value="cxc" className="font-bold text-xs whitespace-nowrap">Ctas. Cobrar</TabsTrigger>
              <TabsTrigger value="cobros" className="font-bold text-xs whitespace-nowrap">Cobros / Rendición</TabsTrigger>
              <TabsTrigger value="costos" className="font-bold text-xs whitespace-nowrap">Costos</TabsTrigger>
              <TabsTrigger value="gastos" className="font-bold text-xs whitespace-nowrap">Gastos Op.</TabsTrigger>
              {canManage && <TabsTrigger value="cajas" className="font-bold text-xs whitespace-nowrap">Cajas / Bancos</TabsTrigger>}
              {canManage && <TabsTrigger value="proveedores" className="font-bold text-xs whitespace-nowrap">Proveedores</TabsTrigger>}
              {canManage && <TabsTrigger value="facturas" className="font-bold text-xs whitespace-nowrap">Facturas</TabsTrigger>}
              <TabsTrigger value="metas" className="font-bold text-xs whitespace-nowrap">Metas</TabsTrigger>
              <TabsTrigger value="reportes" className="font-bold text-xs whitespace-nowrap">Reportes</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="resumen">
            <ResumenTab data={data} filters={filters} loading={loading} />
          </TabsContent>

          <TabsContent value="movimientos">
            <MovimientosTab data={data} loading={loading} canAdmin={canAdmin} canContadora={canContadora} currentUser={currentUser} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="trabajos">
            <TrabajosFinancierosTab data={data} loading={loading} canAdmin={canAdmin} canContadora={canContadora} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="cxc">
            <CuentasPorCobrarTab data={data} loading={loading} userRole={userRole} />
          </TabsContent>

          <TabsContent value="cobros">
            <CobrosRendicionesTab data={data} loading={loading} canAdmin={canAdmin} canContadora={canContadora} currentUser={currentUser} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="costos">
            <CostosTab data={data} loading={loading} currentUser={currentUser} canAdmin={canAdmin} canContadora={canContadora} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="gastos">
            <div className="space-y-4">
              <div className="p-6 rounded-2xl border border-dashed border-border text-center space-y-3">
                <Receipt className="h-10 w-10 text-muted-foreground mx-auto"/>
                <p className="font-bold text-foreground">Módulo Gastos Operativos</p>
                <p className="text-sm text-muted-foreground">Los gastos operativos se gestionan en el módulo dedicado.</p>
                <Button asChild className="font-bold"><a href="/gastos-operativos">Ir a Gastos Operativos</a></Button>
              </div>
              <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
                <table className="w-full text-sm whitespace-nowrap min-w-[700px]">
                  <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                    <tr><th className="px-4 py-3 text-left">Fecha</th><th className="px-4 py-3 text-left">Persona</th><th className="px-4 py-3 text-left">Concepto</th><th className="px-4 py-3 text-left">Estado</th><th className="px-4 py-3 text-right">Monto</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? <tr><td colSpan="5" className="px-4 py-6"><Skeleton className="h-8 w-full"/></td></tr> :
                      data.gastos.length > 0 ? data.gastos.map(g => (
                        <tr key={g.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 text-muted-foreground">{g.fecha ? format(new Date(g.fecha), 'dd MMM yyyy', { locale: es }) : '-'}</td>
                          <td className="px-4 py-2.5 font-bold">{g.persona_nombre || '—'}</td>
                          <td className="px-4 py-2.5">{g.concepto}</td>
                          <td className="px-4 py-2.5">
                            <Badge className={cn("text-[10px] font-bold border shadow-none", g.estado === 'Devuelto' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : g.estado === 'Rechazado' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200')}>{g.estado || 'Pendiente'}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-right font-black tabular-nums">{fmt(g.monto)}</td>
                        </tr>
                      )) : <tr><td colSpan="5" className="px-4 py-10 text-center text-muted-foreground">Sin gastos este período.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {canManage && (
            <TabsContent value="cajas">
              <CajasBancosTab data={data} loading={loading} canAdmin={canAdmin} canContadora={canContadora} currentUser={currentUser} onRefresh={fetchData} />
            </TabsContent>
          )}

          {canManage && (
            <TabsContent value="proveedores">
              <ProveedoresTab data={data} loading={loading} canAdmin={canAdmin} canContadora={canContadora} currentUser={currentUser} onRefresh={fetchData} />
            </TabsContent>
          )}

          {canManage && (
            <TabsContent value="facturas">
              <FacturasTab data={data} loading={loading} canAdmin={canAdmin} canContadora={canContadora} currentUser={currentUser} onRefresh={fetchData} />
            </TabsContent>
          )}

          <TabsContent value="metas">
            <MetasTab data={data} loading={loading} canAdmin={canAdmin} />
          </TabsContent>

          <TabsContent value="reportes">
            <ReportesTab data={data} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default FinanzasPage;
