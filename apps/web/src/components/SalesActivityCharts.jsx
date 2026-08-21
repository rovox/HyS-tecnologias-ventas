import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Building2, FolderTree, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { reportsService } from '@/services/reports/index.js';

const COLOR_COTIZ = '#0c4a6e';
const COLOR_VENTA = '#15803d';
const COLOR_REL = '#0284c7';
const COLOR_META = '#be123c';

const money = (value) => `Bs ${Number(value || 0).toLocaleString('es-BO')}`;

const chartMargin = { top: 4, right: 4, left: -12, bottom: 0 };

const GroupedChart = ({ title, icon: Icon, data, loading, goalBs }) => (
  <Card className="border border-border/70 shadow-sm rounded-xl bg-card overflow-hidden min-w-0">
    <CardHeader className="border-b border-border/60 px-3 py-2 space-y-0">
      <CardTitle className="text-xs font-semibold flex items-center gap-1.5 tracking-tight">
        <Icon className="h-3.5 w-3.5 text-primary shrink-0" /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-2 h-44 sm:h-48 min-w-0">
      {loading ? (
        <Skeleton className="h-full w-full" />
      ) : data.length === 0 ? (
        <p className="text-xs text-muted-foreground font-medium text-center py-8">Sin registros este mes.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={chartMargin} barCategoryGap="18%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.45} />
            <XAxis dataKey="nombre" tick={{ fontSize: 10 }} interval={0} tickMargin={4} />
            <YAxis yAxisId="count" tick={{ fontSize: 10 }} allowDecimals={false} width={28} />
            <YAxis yAxisId="money" orientation="right" tick={{ fontSize: 9 }} width={36} />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value, name) => (String(name).includes('Monto') || name === 'Meta' ? money(value) : value)}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 2 }} iconSize={8} />
            <Bar yAxisId="count" dataKey="cotizaciones" name="Cotizaciones" fill={COLOR_COTIZ} radius={[3, 3, 0, 0]} maxBarSize={18} />
            <Bar yAxisId="count" dataKey="ventas" name="Ventas" fill={COLOR_VENTA} radius={[3, 3, 0, 0]} maxBarSize={18} />
            <Bar yAxisId="count" dataKey="relevamientos" name="Relevamientos" fill={COLOR_REL} radius={[3, 3, 0, 0]} maxBarSize={18} />
            {goalBs > 0 && (
              <ReferenceLine
                yAxisId="money"
                y={goalBs}
                stroke={COLOR_META}
                strokeDasharray="4 4"
                label={{ value: 'Meta', fill: COLOR_META, fontSize: 9 }}
              />
            )}
            <Line
              yAxisId="money"
              type="monotone"
              dataKey="metaBs"
              name="Meta"
              stroke={COLOR_META}
              strokeWidth={1.5}
              dot={{ r: 2.5, fill: COLOR_META }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </CardContent>
  </Card>
);

const CategoryChart = ({ data, insights, loading }) => {
  const topSuc = insights?.topSucursalPorCategoria || [];
  const topVend = insights?.topCategoriaPorVendedor || [];

  return (
    <Card className="border border-border/70 shadow-sm rounded-xl bg-card overflow-hidden min-w-0">
      <CardHeader className="border-b border-border/60 px-3 py-2 space-y-0">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5 tracking-tight">
          <FolderTree className="h-3.5 w-3.5 text-primary shrink-0" /> Registro por categoría
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-2 min-w-0">
        <div className="h-36 sm:h-40 min-w-0">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={chartMargin} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.45} />
                <XAxis dataKey="nombre" tick={{ fontSize: 9 }} interval={0} tickMargin={4} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={28} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 2 }} iconSize={8} />
                <Bar dataKey="cotizaciones" name="Cotizaciones" fill={COLOR_COTIZ} radius={[3, 3, 0, 0]} maxBarSize={18} />
                <Bar dataKey="ventas" name="Ventas" fill={COLOR_VENTA} radius={[3, 3, 0, 0]} maxBarSize={18} />
                <Bar dataKey="relevamientos" name="Relevamientos" fill={COLOR_REL} radius={[3, 3, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {!loading && (topSuc.length > 0 || topVend.length > 0) && (
          <div className="grid grid-cols-1 gap-2 border-t border-border/60 pt-2 text-[11px] leading-snug sm:grid-cols-2">
            <div className="min-w-0 space-y-1">
              <p className="font-semibold text-sky-800 dark:text-sky-300">Sucursal líder por categoría</p>
              {topSuc.length === 0 ? (
                <p className="text-muted-foreground">Sin datos.</p>
              ) : topSuc.map((row) => (
                <p key={row.categoriaId} className="truncate text-muted-foreground">
                  <span className="font-medium text-foreground">{row.categoria}</span>
                  {' · '}{row.sucursal}
                  <span className="tabular-nums text-sky-700 dark:text-sky-300"> ({row.total})</span>
                </p>
              ))}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">Categoría más registrada por vendedor</p>
              {topVend.length === 0 ? (
                <p className="text-muted-foreground">Sin datos.</p>
              ) : topVend.map((row) => (
                <p key={row.vendedorId} className="truncate text-muted-foreground">
                  <span className="font-medium text-foreground">{row.vendedor}</span>
                  {' · '}{row.categoria}
                  <span className="tabular-nums text-emerald-700 dark:text-emerald-300"> ({row.total})</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function withGoal(rows, goalBs) {
  return (rows || []).map((row) => ({ ...row, metaBs: goalBs || 0 }));
}

const SalesActivityCharts = () => {
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState({
    byVendedor: [],
    bySucursal: [],
    byCategoria: [],
    goalBs: 0,
    categoryInsights: { topSucursalPorCategoria: [], topCategoriaPorVendedor: [] },
  });

  useEffect(() => {
    let alive = true;
    reportsService.getSalesActivity()
      .then((row) => { if (alive) setActivity(row); })
      .catch(() => {
        if (alive) {
          setActivity({
            byVendedor: [],
            bySucursal: [],
            byCategoria: [],
            goalBs: 0,
            categoryInsights: { topSucursalPorCategoria: [], topCategoriaPorVendedor: [] },
          });
        }
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <GroupedChart
        title="Actividad por vendedor"
        icon={Users}
        data={withGoal(activity.byVendedor, activity.goalBs)}
        loading={loading}
        goalBs={activity.goalBs}
      />
      <GroupedChart
        title="Actividad por sucursal"
        icon={Building2}
        data={withGoal(activity.bySucursal, activity.goalBs)}
        loading={loading}
        goalBs={activity.goalBs}
      />
      <div className="md:col-span-2">
        <CategoryChart
          data={activity.byCategoria || []}
          insights={activity.categoryInsights}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default SalesActivityCharts;
