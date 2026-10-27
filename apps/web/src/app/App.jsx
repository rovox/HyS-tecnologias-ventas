import React, { Suspense, lazy } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import { routeRoles } from '@/config/nav.js';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient.js';
import { RealtimeProvider } from './RealtimeProvider.jsx';
// Straight from their files, not from the barrels: a barrel also re-exports dialogs and pickers, which would land in
// the entry bundle (GATE-01).
import { ConfirmProvider } from '@/shared/views/confirm.jsx';

const ClientsPage = lazy(() => import('@/features/clients/pages/ClientsPage.jsx'));
const ClientDetailPage = lazy(() => import('@/features/clients/pages/ClientDetailPage.jsx'));
const FinancePage = lazy(() => import('@/features/finance/pages/FinancePage.jsx'));
const ProjectsPage = lazy(() => import('@/features/projects/pages/ProjectsPage.jsx'));
const ProjectDetailPage = lazy(() => import('@/features/projects/pages/ProjectDetailPage.jsx'));
const SurveysPage = lazy(() => import('@/features/surveys/pages/SurveysPage.jsx'));
const InventoryPage = lazy(() => import('@/features/inventory/pages/InventoryPage.jsx'));
const OrderDetailPage = lazy(() => import('@/features/orders/pages/OrderDetailPage.jsx'));
const DirectSalesPage = lazy(() => import('@/features/direct-sales/pages/DirectSalesPage.jsx'));

const AppToaster = lazy(() => import('./AppToaster.jsx'));
const LoginPage = lazy(() => import('@/pages/LoginPage.jsx'));
const NoAccessPage = lazy(() => import('@/pages/NoAccessPage.jsx'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage.jsx'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage.jsx'));
const ManagementPanelPage = lazy(() => import('@/pages/ManagementPanelPage.jsx'));
const ConfigurationPage = lazy(() => import('@/pages/ConfigurationPage.jsx'));
const ActivityWallPage = lazy(() => import('@/pages/ActivityWallPage.jsx'));
const QuotationsPage = lazy(() => import('@/features/quotations/pages/QuotationsPage.jsx'));
const QuotationDetailPage = lazy(() => import('@/features/quotations/pages/QuotationDetailPage.jsx'));
const SchedulePage = lazy(() => import('@/features/schedule/pages/SchedulePage.jsx'));
const SolicitudesWebPage = lazy(() => import('@/pages/SolicitudesWebPage.jsx'));
const VehicleControlPage = lazy(() => import('@/pages/VehicleControlPage.jsx'));
const VehicleDetailPage = lazy(() => import('@/pages/VehicleDetailPage.jsx'));
const VehiclesPage = lazy(() => import('@/pages/VehiclesPage.jsx'));
const MaintenancePage = lazy(() => import('@/pages/MaintenancePage.jsx'));
const MarketingPage = lazy(() => import('@/pages/MarketingPage.jsx'));
const CampaignPage = lazy(() => import('@/pages/CampaignPage.jsx'));
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage.jsx'));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}


/** /pedidos-internos/:id (old links) → the order page inside Inventario. */
function OldOrderLink() {
  const { id } = useParams();
  return <Navigate to={`/inventario/pedidos/${id}`} replace />;
}
function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <RealtimeProvider>
    <ConfirmProvider>
      <Router>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/public-dashboard" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/sin-acceso" element={
              <ProtectedRoute>
                <NoAccessPage />
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={routeRoles.dashboard}>
                <DashboardPage />
              </ProtectedRoute>
            } />

            <Route path="/quotations" element={
              <ProtectedRoute allowedRoles={routeRoles.quotations}>
                <QuotationsPage />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute allowedRoles={routeRoles.quotations}>
                <ProjectsPage />
              </ProtectedRoute>
            } />
            <Route path="/projects/:id" element={
              <ProtectedRoute allowedRoles={routeRoles.quotations}>
                <ProjectDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/quotations/:id" element={
              <ProtectedRoute allowedRoles={routeRoles.quotations}>
                <QuotationDetailPage />
              </ProtectedRoute>
            } />

            <Route path="/clientes" element={
              <ProtectedRoute allowedRoles={routeRoles.clientes}>
                <ClientsPage />
              </ProtectedRoute>
            } />

            <Route path="/clientes/:id" element={
              <ProtectedRoute allowedRoles={routeRoles.clientes}>
                <ClientDetailPage />
              </ProtectedRoute>
            } />

            <Route path="/clients" element={<Navigate to="/clientes" replace />} />

            <Route path="/surveys" element={
              <ProtectedRoute allowedRoles={routeRoles.surveys}>
                <SurveysPage />
              </ProtectedRoute>
            } />

            <Route path="/tareas" element={<Navigate to="/dashboard" replace />} />

            <Route path="/schedule" element={
              <ProtectedRoute allowedRoles={routeRoles.schedule}>
                <SchedulePage />
              </ProtectedRoute>
            } />

            <Route path="/activity-wall" element={
              <ProtectedRoute allowedRoles={routeRoles.activity}>
                <ActivityWallPage />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={routeRoles.reports}>
                <ReportsPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/management" element={
              <ProtectedRoute allowedRoles={routeRoles.admin}>
                <ManagementPanelPage />
              </ProtectedRoute>
            } />

            <Route path="/configuration" element={
              <ProtectedRoute allowedRoles={routeRoles.admin}>
                <ConfigurationPage />
              </ProtectedRoute>
            } />

            <Route path="/solicitudes-web" element={
              <ProtectedRoute allowedRoles={routeRoles.solicitudesWeb}>
                <SolicitudesWebPage />
              </ProtectedRoute>
            } />

            {/* Pedidos internos live in Inventario (INV-02); old links redirect. */}
            <Route path="/inventario/pedidos/:id" element={
              <ProtectedRoute allowedRoles={routeRoles.pedidos}>
                <OrderDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/pedidos-internos" element={<Navigate to="/inventario?vista=pedidos" replace />} />
            <Route path="/pedidos-internos/:id" element={<OldOrderLink />} />
            <Route path="/orders" element={<Navigate to="/inventario?vista=pedidos" replace />} />

            <Route path="/vehicle-control" element={
              <ProtectedRoute allowedRoles={routeRoles.frozen}>
                <VehicleControlPage />
              </ProtectedRoute>
            } />
            <Route path="/vehicle-control/:id" element={
              <ProtectedRoute allowedRoles={routeRoles.frozen}>
                <VehicleDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/vehicles" element={
              <ProtectedRoute allowedRoles={routeRoles.frozen}>
                <VehiclesPage />
              </ProtectedRoute>
            } />
            <Route path="/vehicles/:id" element={
              <ProtectedRoute allowedRoles={routeRoles.frozen}>
                <VehicleDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/maintenance" element={
              <ProtectedRoute allowedRoles={routeRoles.frozen}>
                <MaintenancePage />
              </ProtectedRoute>
            } />

            <Route path="/marketing" element={
              <ProtectedRoute allowedRoles={routeRoles.frozen}>
                <MarketingPage />
              </ProtectedRoute>
            } />
            <Route path="/campaigns" element={
              <ProtectedRoute allowedRoles={routeRoles.frozen}>
                <CampaignPage />
              </ProtectedRoute>
            } />

            <Route path="/ventas-directas" element={
              <ProtectedRoute allowedRoles={routeRoles.ventasDirectas}>
                <DirectSalesPage />
              </ProtectedRoute>
            } />
            <Route path="/inventario" element={
              <ProtectedRoute allowedRoles={routeRoles.inventario}>
                <InventoryPage />
              </ProtectedRoute>
            } />
            <Route path="/finanzas" element={
              <ProtectedRoute allowedRoles={routeRoles.finanzas}>
                <FinancePage />
              </ProtectedRoute>
            } />
            <Route path="/usuarios/:id" element={
              <ProtectedRoute allowedRoles={routeRoles.users}>
                <UserProfilePage />
              </ProtectedRoute>
            } />

            <Route path="/reports/admin" element={<Navigate to="/reports" replace />} />

            <Route path="*" element={
              <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-4">
                <h1 className="text-4xl font-bold mb-4 text-primary">404</h1>
                <p className="text-muted-foreground font-semibold mb-6">La página no existe o no tienes permiso.</p>
                <a href="/dashboard" className="text-primary hover:underline font-bold min-h-11 inline-flex items-center">Volver al Dashboard</a>
              </div>
            } />
          </Routes>
        </Suspense>
        <Suspense fallback={null}>
          <AppToaster />
        </Suspense>
      </Router>
    </ConfirmProvider>
    </RealtimeProvider>
    </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
