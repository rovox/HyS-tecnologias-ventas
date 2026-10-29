import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Building2, FolderTree, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { reportsService } from '@/services/reports/index.js';
import { formatBs } from '@/shared/lib/format.js';
import { cn } from '@/lib/utils.js';

const COLOR_COTIZ = '#0c4a6e';
const COLOR_VENTA = '#15803d';
const COLOR_REL = '#7c3aed';

const money = formatBs;
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : null);
const firstName = (name = '') => (name.length > 12 ? name.split(' ')[0] : name);

// Left margin 0 and a 32 px axis: the counts on the left stay readable (they were cut at -12).
const chartMargin = { top: 8, right: 8, left: 0, bottom: 0 };

/**
 * What each bar opens in Cotizaciones: the list already searched by that seller, branch or category, the open ones
 * for "Cotizaciones" and the approved ones for "Aprobadas" (`q` = search, `f` = filters of useListControls).
 */
function quotationsLink(kind, row, series) {
  const params = new URLSearchParams();
  if (series === 'ventas') {
    params.set('vista', 'cerradas');
    params.set('f', kind === 'categoria' ? `aprobado,${row.id}` : 'aprobado');
  } else if (kind === 'categoria') params.set('f', row.id);
  if (kind !== 'categoria') params.set('q', row.nombre);
  return `/quotations?${params}`;
}

const SERIES = [
  { key: 'cotizaciones', label: 'Cotizaciones', color: COLOR_COTIZ },
  { key: 'ventas', label: 'Aprobadas (ventas)', color: COLOR_VENTA },
  { key: 'relevamientos', label: 'Relevamientos', color: COLOR_REL },
];

/** The whole row of the hovered group: counts and money of each series, the goal and the approved quotations. */
function GroupTooltip({ active, payload, showGoal }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload || {};
  const ventas = row.ventasItems || [];
  const avance = pct(row.montoVentas, row.metaBs);
  return (
    <div className="max-w-[300px] space-y-1.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-bold text-foreground">{row.nombre}</p>
      <p style={{ color: COLOR_COTIZ }}>Cotizaciones: {row.cotizaciones} · {money(row.montoCotizaciones)}</p>
      <p style={{ color: COLOR_VENTA }}>Aprobadas (ventas): {row.ventas} · {money(row.montoVentas)}</p>
      <p style={{ color: COLOR_REL }}>Relevamientos: {row.relevamientos}</p>
      {showGoal && (
        <p className="font-semibold">
          {row.metaBs > 0 ? `Meta ${money(row.metaBs)} · ${avance}% alcanzado` : 'Sin meta cargada este mes'}
        </p>
      )}
      {ventas.length > 0 && (
        <ul className="space-y-0.5 border-t border-border pt-1 text-muted-foreground">
          {ventas.slice(0, 5).map((item) => (
            <li key={item.id} className="truncate">{[item.numero, item.titulo].filter(Boolean).join(' · ')} · {money(item.monto)}</li>
          ))}
          {ventas.length > 5 && <li>y {ventas.length - 5} más</li>}
        </ul>
      )}
      <p className="text-[11px] text-muted-foreground">Clic en una barra para verlas en Cotizaciones</p>
    </div>
  );
}

/** One line per seller or branch: sold against its goal, in Bs and %, with links to its quotations. */
function GoalLines({ kind, data }) {
  const rows = data.filter((r) => r.metaBs > 0 || r.montoVentas > 0);
  if (!rows.length) return null;
  return (
    <ul className="space-y-1 border-t border-border/60 px-1 pt-2 text-xs" aria-label="Avance de la meta">
      {rows.map((r) => {
        const avance = pct(r.montoVentas, r.metaBs);
        const tone = avance == null ? 'text-muted-foreground' : avance >= 100 ? 'text-success-fg' : avance >= 50 ? 'text-warning-fg' : 'text-danger-fg';
        return (
          <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-2">
            <span className="font-medium">{r.nombre}</span>
            <span className="tabular-nums">
              {money(r.montoVentas)} {r.metaBs > 0 ? <>de {money(r.metaBs)} <span className={cn('font-semibold', tone)}>({avance}%)</span></> : <span className="text-muted-foreground">sin meta</span>}
              {' · '}
              <Link className="text-primary hover:underline" to={quotationsLink(kind, r, 'ventas')}>ver ventas</Link>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const GroupedChart = ({ title, kind, icon: Icon, data, loading }) => {
  const navigate = useNavigate();
  const showGoal = kind !== 'categoria';
  return (
    <Card className="min-w-0 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <CardHeader className="space-y-0.5 border-b border-border/60 px-3 py-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
          <Icon className="h-4 w-4 shrink-0 text-primary" /> {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">Cantidad en el mes. Pasa el mouse sobre una barra para ver el detalle; clic para abrirlas.</p>
      </CardHeader>
      <CardContent className="min-w-0 space-y-2 p-2">
        <div className="h-48 min-w-0">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : data.length === 0 ? (
            <p className="py-8 text-center text-xs font-medium text-muted-foreground">Sin registros este mes.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={chartMargin} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.45} />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} interval={0} tickMargin={4} tickFormatter={firstName} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={32} />
                <Tooltip cursor={{ fill: 'rgba(15, 23, 42, 0.06)' }} content={(props) => <GroupTooltip {...props} showGoal={showGoal} />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 2 }} iconSize={9} />
                {SERIES.map((serie) => (
                  <Bar
                    key={serie.key}
                    dataKey={serie.key}
                    name={serie.label}
                    fill={serie.color}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={22}
                    cursor={serie.key === 'relevamientos' ? undefined : 'pointer'}
                    onClick={serie.key === 'relevamientos' ? undefined : (row) => navigate(quotationsLink(kind, row, serie.key))}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        {!loading && showGoal && <GoalLines kind={kind} data={data} />}
      </CardContent>
    </Card>
  );
};

/** Where each category is quoted most and what each seller quotes most (counted with its relevamientos). */
const CategoryInsights = ({ insights }) => {
  const topSuc = insights?.topSucursalPorCategoria || [];
  const topVend = insights?.topCategoriaPorVendedor || [];
  if (!topSuc.length && !topVend.length) return null;
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-card p-3 text-xs leading-snug shadow-sm sm:grid-cols-2">
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">Sucursal que más cotiza cada categoría</p>
        {topSuc.map((row) => (
          <p key={row.categoriaId} className="truncate text-muted-foreground">
            <span className="font-medium text-foreground">{row.categoria}</span> · {row.sucursal} <span className="tabular-nums">({row.total} registros)</span>
          </p>
        ))}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">Categoría que más cotiza cada vendedor</p>
        {topVend.map((row) => (
          <p key={row.vendedorId} className="truncate text-muted-foreground">
            <span className="font-medium text-foreground">{row.vendedor}</span> · {row.categoria} <span className="tabular-nums">({row.total} registros)</span>
          </p>
        ))}
      </div>
    </div>
  );
};

/** Each row's own goal (the API's per seller or per branch); never the team's total spread over every row. */
function withGoal(rows) {
  return (rows || []).map((row) => ({ ...row, metaBs: Number(row.metaBs || 0) }));
}

const SalesActivityCharts = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      .catch((err) => {
        console.error('[SalesActivityCharts] Error cargando actividad:', err?.message || err);
        if (alive) setError(err?.message || 'Error al cargar actividad');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        No se pudo cargar la actividad de ventas: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <GroupedChart title="Actividad por vendedor" kind="vendedor" icon={Users} data={withGoal(activity.byVendedor)} loading={loading} />
      <GroupedChart title="Actividad por sucursal" kind="sucursal" icon={Building2} data={withGoal(activity.bySucursal)} loading={loading} />
      <div className="space-y-2 md:col-span-2">
        <GroupedChart title="Registro por categoría" kind="categoria" icon={FolderTree} data={activity.byCategoria || []} loading={loading} />
        {!loading && <CategoryInsights insights={activity.categoryInsights} />}
      </div>
    </div>
  );
};

export default SalesActivityCharts;
