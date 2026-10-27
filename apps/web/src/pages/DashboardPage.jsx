import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, CalendarPlus, FilePlus2, Lock, PackagePlus, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import SalesMetricsRow from '@/components/SalesMetricsRow.jsx';
import { ActivityFeed } from '@/features/activity';
import { MoneySummary } from '@/features/finance';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';

// Recharts is heavy: the charts load after the page (performance.md, route chunk <= 100 kB).
const SalesActivityCharts = lazy(() => import('@/components/SalesActivityCharts.jsx'));

/**
 * Dashboard (DASH-01/02): quick actions of the day for each role, the real money of the month and today per branch,
 * the commercial metrics and, for Gerencia, the latest activity (Panel de control and Reportes merged here).
 */
const DashboardPage = () => {
  useDocumentTitle('Dashboard');
  const navigate = useNavigate();
  const { currentUser, isAdmin, isVentasLevel, isSeguridad } = useAuth();
  const commercial = isVentasLevel();
  const tec = isSeguridad();

  const actions = [
    commercial && { label: 'Nueva venta', icon: ShoppingCart, to: '/ventas-directas?vender=1', variant: 'success' },
    commercial && { label: 'Cierre del día', icon: Lock, to: '/finanzas?vista=cierre' },
    commercial && { label: 'Nueva cotización', icon: FilePlus2, to: '/quotations' },
    commercial && { label: 'Programar trabajo', icon: CalendarPlus, to: '/schedule?programar=1' },
    commercial && { label: 'Agregar material', icon: PackagePlus, to: '/inventario?accion=entrada' },
    commercial && { label: 'Mover material', icon: ArrowLeftRight, to: '/inventario?accion=transferencia' },
    tec && { label: 'Mis trabajos', icon: CalendarPlus, to: '/schedule' },
  ].filter(Boolean);

  return (
    <Layout>
      <div className="content-container space-y-6 py-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Hola, {currentUser?.name || 'equipo'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tec ? 'Tus trabajos y visitas del día.' : 'Lo del día, el dinero del mes y cómo van las ventas.'}</p>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Acciones rápidas">
          {actions.map((a) => (
            <Button key={a.label} variant={a.variant || 'outline'} className="min-h-11" onClick={() => navigate(a.to)}>
              <a.icon className="h-4 w-4" /> {a.label}
            </Button>
          ))}
        </div>

        {commercial && <MoneySummary />}
        {!tec && <SalesMetricsRow />}
        {!tec && (
          <Suspense fallback={<Skeleton className="h-72 w-full" />}>
            <SalesActivityCharts />
          </Suspense>
        )}
        {isAdmin() && <ActivityFeed />}
      </div>
    </Layout>
  );
};

export default DashboardPage;
