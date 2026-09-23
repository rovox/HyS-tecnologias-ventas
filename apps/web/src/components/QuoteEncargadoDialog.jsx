import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import quotationsService from '@/services/quotations/index.js';

const emptyRow = () => ({ user_id: '', nombre: '', comision_pct: 100 });

const QuoteEncargadoDialog = ({ open, onOpenChange, quote, vendors = [], onSaved }) => {
  const [rows, setRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !quote) return;
    const current = Array.isArray(quote.vendedores) && quote.vendedores.length
      ? quote.vendedores.map((row) => ({
        user_id: row.user_id,
        nombre: row.nombre,
        comision_pct: Number(row.comision_pct ?? 100),
      }))
      : [{ user_id: quote.vendedor_id || '', nombre: quote.vendedor_nombre || '', comision_pct: 100 }];
    setRows(current);
  }, [open, quote]);

  const total = rows.reduce((sum, row) => sum + (Number(row.comision_pct) || 0), 0);

  const save = async (e) => {
    e.preventDefault();
    const active = rows.filter((row) => row.user_id);
    if (active.length === 0) return toast.error('Selecciona al menos un encargado');
    if (active.length > 1 && Math.abs(total - 100) > 0.05) return toast.error('Las comisiones deben sumar 100%');
    setSaving(true);
    try {
      await quotationsService.update(quote.id, {
        vendedores: active.map((row) => {
          const vendor = vendors.find((u) => u.id === row.user_id);
          return {
            user_id: row.user_id,
            nombre: vendor?.name || row.nombre || '',
            comision_pct: Number(row.comision_pct) || 0,
          };
        }),
      });
      toast.success('Encargado actualizado');
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'No se pudo cambiar el encargado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cambiar encargado</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex-1 min-w-0 space-y-1">
                <Label className="text-xs font-semibold">Encargado</Label>
                <Select
                  value={row.user_id || 'none'}
                  onValueChange={(v) => {
                    const vendor = vendors.find((u) => u.id === v);
                    setRows((prev) => prev.map((item, i) => (
                      i === index ? { ...item, user_id: v === 'none' ? '' : v, nombre: vendor?.name || '' } : item
                    )));
                  }}
                >
                  <SelectTrigger className="h-10"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Seleccionar…</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-24 space-y-1">
                <Label className="text-xs font-semibold">% Com.</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  className="h-10 tabular-nums"
                  value={row.comision_pct}
                  onChange={(e) => setRows((prev) => prev.map((item, i) => (
                    i === index ? { ...item, comision_pct: Number(e.target.value) } : item
                  )))}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRows((prev) => [...prev, { user_id: '', nombre: '', comision_pct: 0 }])}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
            </Button>
            <p className="text-xs text-muted-foreground">Total {total}%</p>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" variant="action" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteEncargadoDialog;
