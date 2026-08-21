import React, { useEffect, useState } from 'react';
import { FileStack, Handshake, Target, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import reportsService from '@/services/reports/index.js';
import { ROLES } from '@/mocks/users.js';
import { cn } from '@/lib/utils.js';

const fmtBs = (value) =>
  `Bs. ${Number(value || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;

const TONES = {
  quotes: {
    value: 'text-sky-700 dark:text-sky-300',
    iconWrap: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
    label: 'text-sky-800/70 dark:text-sky-300/80',
  },
  sales: {
    value: 'text-emerald-700 dark:text-emerald-300',
    iconWrap: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    label: 'text-emerald-800/70 dark:text-emerald-300/80',
  },
  goal: {
    value: 'text-amber-700 dark:text-amber-300',
    iconWrap: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    label: 'text-amber-800/70 dark:text-amber-300/80',
  },
  remaining: {
    value: 'text-rose-700 dark:text-rose-300',
    iconWrap: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    label: 'text-rose-800/70 dark:text-rose-300/80',
  },
};

const Metric = ({ icon: Icon, label, value, loading, tone }) => {
  const t = TONES[tone] || TONES.quotes;
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border/70 bg-card px-3 py-2.5 shadow-sm">
      <div className={cn('shrink-0 rounded-lg p-2', t.iconWrap)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <div className={cn('truncate text-base font-bold tabular-nums leading-tight sm:text-lg', t.value)}>
          {loading ? <Skeleton className="h-5 w-20" /> : value}
        </div>
        <p className={cn('truncate text-[10px] font-semibold uppercase tracking-wide', t.label)}>
          {label}
        </p>
      </div>
    </div>
  );
};

/** KPIs comerciales del mes: cotizaciones, ventas, meta y faltante. No es un módulo de finanzas. */
const SalesMetricsRow = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const ownGoal = currentUser?.role === ROLES.VENTAS;

  useEffect(() => {
    if (!currentUser?.id) {
      setMetrics(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await reportsService.getSalesMetrics({
          userId: ownGoal ? currentUser.id : undefined,
        });
        if (!cancelled) setMetrics(data);
      } catch {
        if (!cancelled) setMetrics(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [currentUser?.id, ownGoal]);

  const scope = ownGoal ? 'tu mes' : 'equipo · mes';

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
        Cotizaciones y ventas ({scope})
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={FileStack}
          tone="quotes"
          label="Acumulado cotizaciones"
          value={fmtBs(metrics?.quotationsTotal)}
          loading={loading}
        />
        <Metric
          icon={Handshake}
          tone="sales"
          label="Acumulado ventas"
          value={fmtBs(metrics?.salesTotal)}
          loading={loading}
        />
        <Metric
          icon={Target}
          tone="goal"
          label="Meta mensual"
          value={fmtBs(metrics?.goalBs)}
          loading={loading}
        />
        <Metric
          icon={TrendingDown}
          tone="remaining"
          label="Falta para la meta"
          value={fmtBs(metrics?.remainingBs)}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default SalesMetricsRow;
