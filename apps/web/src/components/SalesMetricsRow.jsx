import React, { useEffect, useState } from 'react';
import { FileStack, Handshake, Target, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import reportsService from '@/services/reports/index.js';
import { ROLES } from '@/mocks/users.js';

const fmtBs = (value) =>
  `Bs. ${Number(value || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;

const Metric = ({ icon: Icon, label, value, loading }) => (
  <div className="metric-card">
    <div className="flex items-start justify-between mb-4">
      <div className="bg-primary/10 p-3 rounded-xl text-primary">
        <Icon className="h-6 w-6" />
      </div>
    </div>
    <div className="space-y-2">
      <h3 className="text-3xl font-black tabular-nums">{loading ? <Skeleton className="h-8 w-28" /> : value}</h3>
      <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

/** KPIs comerciales del mes: cotizaciones, ventas, meta y faltante. No es un módulo de finanzas. */
const SalesMetricsRow = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const ownGoal = currentUser?.role === ROLES.VENTAS;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await reportsService.getSalesMetrics({
          userId: ownGoal ? currentUser.id : undefined,
        });
        if (!cancelled) setMetrics(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [currentUser?.id, ownGoal]);

  const scope = ownGoal ? 'tu mes' : 'equipo · mes';

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-muted-foreground">
        Cotizaciones y ventas ({scope})
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Metric icon={FileStack} label="Acumulado cotizaciones" value={fmtBs(metrics?.quotationsTotal)} loading={loading} />
        <Metric icon={Handshake} label="Acumulado ventas" value={fmtBs(metrics?.salesTotal)} loading={loading} />
        <Metric icon={Target} label="Meta mensual" value={fmtBs(metrics?.goalBs)} loading={loading} />
        <Metric icon={TrendingDown} label="Falta para la meta" value={fmtBs(metrics?.remainingBs)} loading={loading} />
      </div>
    </div>
  );
};

export default SalesMetricsRow;
