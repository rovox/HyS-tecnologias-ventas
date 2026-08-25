import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge.jsx';
import { Briefcase } from 'lucide-react';
import schedulesService from '@/services/schedules/index.js';

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const clean = String(d).split(' ')[0].split('T')[0];
    const [y, m, day] = clean.split('-');
    return `${day}/${m}/${y}`;
  } catch {
    return String(d);
  }
};

const ESTADO_LABELS = {
  programado: 'Programado',
  en_proceso: 'En proceso',
  terminado: 'Terminado',
  cancelado: 'Cancelado',
};

/** Trabajos vinculados a una cotización — compacto para detalle de quote. */
const QuotationJobsBlock = ({ quotationId, jobs, onRefresh }) => {
  const [rows, setRows] = useState(jobs || []);
  const [loading, setLoading] = useState(!jobs);

  useEffect(() => {
    if (jobs) {
      setRows(jobs);
      setLoading(false);
      return;
    }
    if (!quotationId) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    schedulesService.getAll({ quotation_id: quotationId })
      .then((list) => { if (!cancelled) setRows(list || []); })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [quotationId, jobs, onRefresh]);

  if (loading) {
    return <p className="text-xs text-muted-foreground py-1">Cargando trabajos…</p>;
  }
  if (!rows.length) return null;

  return (
    <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Briefcase className="h-3.5 w-3.5" /> Trabajos ({rows.length})
      </p>
      <div className="space-y-2">
        {rows.map((job) => {
          const monto = Number(job.monto ?? job.costo_total ?? 0);
          const adelanto = Number(job.adelanto ?? 0);
          const saldo = Number(job.saldo ?? Math.max(0, monto - adelanto));
          return (
            <div key={job.id} className="rounded-lg border bg-card px-3 py-2 text-xs space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-foreground line-clamp-2">
                  {job.descripcion_trabajo || job.descripcion || 'Sin descripción'}
                </p>
                <Badge variant="outline" className="text-[9px] font-bold shrink-0 capitalize">
                  {ESTADO_LABELS[job.estado] || job.estado || '—'}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {fmtDate(job.fecha_programada)}
                {job.fecha_finalizacion ? ` → ${fmtDate(job.fecha_finalizacion)}` : ''}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums text-muted-foreground">
                <span>Monto <strong className="text-foreground">Bs {Number(monto ?? 0).toFixed(0)}</strong></span>
                <span>Adel. <strong className="text-foreground">Bs {Number(adelanto ?? 0).toFixed(0)}</strong></span>
                <span className={saldo > 0 ? 'text-destructive font-bold' : 'text-emerald-600 font-bold'}>
                  Saldo Bs {Number(saldo ?? 0).toFixed(0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuotationJobsBlock;
