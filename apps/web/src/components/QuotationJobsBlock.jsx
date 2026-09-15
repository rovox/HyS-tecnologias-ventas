import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Briefcase, ExternalLink } from 'lucide-react';
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

function moneySummary(job, payments = []) {
  const monto = Number(job.monto ?? job.costo_total ?? 0);
  const budgetPays = payments.filter((p) => p.tipo === 'adelanto' || p.tipo === 'cobro' || !p.tipo);
  const extras = payments.filter((p) => p.tipo === 'extra_asistencia');
  const cobrado = budgetPays.reduce((s, p) => s + Number(p.monto_cobrado ?? p.monto ?? 0), 0)
    || Number(job.adelanto ?? 0);
  const saldo = Number(job.saldo ?? Math.max(0, monto - cobrado));
  const extrasTotal = extras.reduce((s, p) => s + Number(p.monto_cobrado ?? p.monto ?? 0), 0);
  return { monto, cobrado, saldo, extrasTotal };
}

/** Trabajos vinculados a una cotización — compacto para detalle de quote. */
const QuotationJobsBlock = ({ quotationId, jobs, onRefresh, onOpenJob }) => {
  const [rows, setRows] = useState(jobs || []);
  const [paymentsByJob, setPaymentsByJob] = useState({});
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
      .then(async (list) => {
        if (cancelled) return;
        const listRows = list || [];
        setRows(listRows);
        const payMap = {};
        await Promise.all(listRows.map(async (job) => {
          try {
            payMap[job.id] = await schedulesService.getPayments(job.id);
          } catch {
            payMap[job.id] = [];
          }
        }));
        if (!cancelled) setPaymentsByJob(payMap);
      })
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
          const { monto, cobrado, saldo, extrasTotal } = moneySummary(job, paymentsByJob[job.id] || []);
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
                <span>Cobrado <strong className="text-foreground">Bs {Number(cobrado ?? 0).toFixed(0)}</strong></span>
                <span className={saldo > 0 ? 'text-destructive font-bold' : 'text-emerald-600 font-bold'}>
                  Saldo Bs {Number(saldo ?? 0).toFixed(0)}
                </span>
                {extrasTotal > 0 ? (
                  <span className="text-amber-700 font-bold">Extra asistencia Bs {Number(extrasTotal).toFixed(0)}</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {onOpenJob ? (
                  <Button type="button" size="sm" variant="outline" className="h-7 text-[10px] font-bold" onClick={() => onOpenJob(job)}>
                    Ver trabajo
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="outline" className="h-7 text-[10px] font-bold" asChild>
                    <Link to="/schedule"><ExternalLink className="h-3 w-3 mr-1" /> Cronograma</Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuotationJobsBlock;
