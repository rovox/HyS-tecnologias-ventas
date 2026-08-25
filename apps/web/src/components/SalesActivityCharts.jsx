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

const SERIES_META = {
  cotizaciones: { itemsKey: 'cotizacionesItems', totalKey: 'montoCotizaciones', color: COLOR_COTIZ, label: 'Cotizaciones' },
  ventas: { itemsKey: 'ventasItems', totalKey: 'montoVentas', color: COLOR_VENTA, label: 'Ventas' },
  relevamientos: { itemsKey: 'relevamientosItems', totalKey: null, color: COLOR_REL, label: 'Relevamientos' },
};

function formatFecha(value) {
  if (!value) return null;
  const raw = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return String(value).slice(0, 16);
  const [y, m, d] = raw.split('-');
  return `${d}/${m}/${y}`;
}

/** Guía horizontal punteada desde la barra activa hacia la derecha. */
function BarGuideCursor(props) {
  const {
    x, y, width, height, viewBox,
  } = props;
  if (x == null || y == null || width == null) return null;
  const vb = viewBox || {};
  const right = (vb.x || 0) + (vb.width || 0);
  const tipY = y; // cima de la barra vertical
  const startX = x + width;
  return (
    <g pointerEvents="none">
      <rect x={x} y={y} width={width} height={height || 0} fill="rgba(15, 23, 42, 0.06)" />
      <line
        x1={startX}
        y1={tipY}
        x2={Math.max(startX + 8, right - 4)}
        y2={tipY}
        stroke="#64748b"
        strokeWidth={1.25}
        strokeDasharray="4 3"
      />
    </g>
  );
}

function ActivityTooltip({ active, payload, label, activeKey }) {
  if (!active || !payload?.length) return null;

  // En ComposedChart a veces llegan varias series; usar la barra bajo el cursor.
  const entry = (activeKey && payload.find((row) => row.dataKey === activeKey))
    || payload.find((row) => SERIES_META[row.dataKey])
    || null;
  if (!entry) return null;

  const key = entry.dataKey;
  const meta = SERIES_META[key];
  if (!meta) return null;

  const row = entry.payload || {};
  const items = row[meta.itemsKey] || [];
  const count = Number(entry.value) || 0;
  let total = meta.totalKey ? Number(row[meta.totalKey] || 0) : null;
  if ((total == null || total === 0) && items.length) {
    const sums = items.map((i) => i.monto).filter((m) => m != null);
    total = sums.length ? sums.reduce((a, b) => a + Number(b), 0) : null;
  }

  return (
    <div className="rounded-lg border bg-popover text-popover-foreground shadow-md px-3 py-2 text-[11px] max-w-[280px] space-y-1.5">
      <p className="font-bold text-foreground truncate">{label}</p>
      <p className="font-semibold" style={{ color: meta.color }}>
        {meta.label}: {count}
        {total != null && total > 0 ? ` · Suma ${money(total)}` : ''}
      </p>
      {items.length === 0 ? (
        <p className="text-muted-foreground pl-1">Sin detalle</p>
      ) : (
        <ul className="pl-1 space-y-1 max-h-32 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id} className="text-muted-foreground leading-snug">
              <span className="truncate block">
                {[item.numero, item.titulo || item.lugar].filter(Boolean).join(' · ') || '—'}
                {item.monto != null ? ` · ${money(item.monto)}` : ''}
              </span>
              {key === 'relevamientos' ? (
                <span className="block text-[10px] text-muted-foreground/90">
                  {formatFecha(item.fecha) ? `Fecha ${formatFecha(item.fecha)}` : 'Sin fecha'}
                  {' · '}
                  {item.hasFotos || (item.fotosCount > 0)
                    ? `Fotos: ${item.fotosCount || 'sí'}`
                    : 'Sin fotografía'}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function useBarHover() {
  const [activeKey, setActiveKey] = useState(null);
  const bind = (dataKey) => ({
    onMouseMove: () => setActiveKey(dataKey),
    onMouseEnter: () => setActiveKey(dataKey),
    onMouseLeave: () => setActiveKey(null),
  });
  return { activeKey, bind };
}

const GroupedChart = ({ title, icon: Icon, data, loading, goalBs }) => {
  const { activeKey, bind } = useBarHover();

  return (
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
                shared={false}
                cursor={<BarGuideCursor />}
                content={(props) => <ActivityTooltip {...props} activeKey={activeKey} />}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 2 }} iconSize={8} />
              <Bar
                yAxisId="count"
                dataKey="cotizaciones"
                name="Cotizaciones"
                fill={COLOR_COTIZ}
                radius={[3, 3, 0, 0]}
                maxBarSize={18}
                {...bind('cotizaciones')}
              />
              <Bar
                yAxisId="count"
                dataKey="ventas"
                name="Ventas"
                fill={COLOR_VENTA}
                radius={[3, 3, 0, 0]}
                maxBarSize={18}
                {...bind('ventas')}
              />
              <Bar
                yAxisId="count"
                dataKey="relevamientos"
                name="Relevamientos"
                fill={COLOR_REL}
                radius={[3, 3, 0, 0]}
                maxBarSize={18}
                {...bind('relevamientos')}
              />
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
                activeDot={false}
                isAnimationActive={false}
                style={{ pointerEvents: 'none' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

const CategoryChart = ({ data, insights, loading }) => {
  const topSuc = insights?.topSucursalPorCategoria || [];
  const topVend = insights?.topCategoriaPorVendedor || [];
  const { activeKey, bind } = useBarHover();

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
                <Tooltip
                  shared={false}
                  cursor={<BarGuideCursor />}
                  content={(props) => <ActivityTooltip {...props} activeKey={activeKey} />}
                />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 2 }} iconSize={8} />
                <Bar dataKey="cotizaciones" name="Cotizaciones" fill={COLOR_COTIZ} radius={[3, 3, 0, 0]} maxBarSize={18} {...bind('cotizaciones')} />
                <Bar dataKey="ventas" name="Ventas" fill={COLOR_VENTA} radius={[3, 3, 0, 0]} maxBarSize={18} {...bind('ventas')} />
                <Bar dataKey="relevamientos" name="Relevamientos" fill={COLOR_REL} radius={[3, 3, 0, 0]} maxBarSize={18} {...bind('relevamientos')} />
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

function withGoal(rows, fallbackGoalBs) {
  return (rows || []).map((row) => ({
    ...row,
    metaBs: Number(row.metaBs ?? fallbackGoalBs ?? 0),
  }));
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
