import React, { Suspense, lazy } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import { routeRoles } from '@/config/nav.js';
import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';

const LoginPage = lazy(() => import('@/pages/LoginPage.jsx'));
const NoAccessPage = lazy(() => import('@/pages/NoAccessPage.jsx'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage.jsx'));
const ScheduleSurveysPage = lazy(() => import('@/pages/ScheduleSurveysPage.jsx'));
const ClientsPage = lazy(() => import('@/pages/ClientsPage.jsx'));
const ClientDetailPage = lazy(() => import('@/pages/ClientDetailPage.jsx'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage.jsx'));
const ManagementPanelPage = lazy(() => import('@/pages/ManagementPanelPage.jsx'));
const ConfigurationPage = lazy(() => import('@/pages/ConfigurationPage.jsx'));
const ActivityWallPage = lazy(() => import('@/pages/ActivityWallPage.jsx'));
const QuotationsLibraryPage = lazy(() => import('@/pages/QuotationsLibraryPage.jsx'));
const ScheduleWorkPage = lazy(() => import('@/pages/ScheduleWorkPage.jsx'));
const PedidosInternosPage = lazy(() => import('@/pages/PedidosInternosPage.jsx'));
const PedidoInternoDetailPage = lazy(() => import('@/pages/PedidoInternoDetailPage.jsx'));
const GastosOperativosPage = lazy(() => import('@/pages/GastosOperativosPage.jsx'));
const VehicleControlPage = lazy(() => import('@/pages/VehicleControlPage.jsx'));
const VehicleDetailPage = lazy(() => import('@/pages/VehicleDetailPage.jsx'));
const VehiclesPage = lazy(() => import('@/pages/VehiclesPage.jsx'));
const MaintenancePage = lazy(() => import('@/pages/MaintenancePage.jsx'));
const MarketingPage = lazy(() => import('@/pages/MarketingPage.jsx'));
const CampaignPage = lazy(() => import('@/pages/CampaignPage.jsx'));
const AccountingPage = lazy(() => import('@/pages/AccountingPage.jsx'));
const FinanzasPage = lazy(() => import('@/pages/FinanzasPage.jsx'));

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

function App() {
  return (
    <AuthProvider>
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
                <QuotationsLibraryPage />
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
                <ScheduleSurveysPage />
              </ProtectedRoute>
            } />

            <Route path="/tareas" element={<Navigate to="/dashboard" replace />} />

            <Route path="/schedule" element={
              <ProtectedRoute allowedRoles={routeRoles.schedule}>
                <ScheduleWorkPage />
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

            <Route path="/pedidos-internos" element={
              <ProtectedRoute allowedRoles={routeRoles.pedidos}>
                <PedidosInternosPage />
              </ProtectedRoute>
            } />
            <Route path="/pedidos-internos/:id" element={
              <ProtectedRoute allowedRoles={routeRoles.pedidos}>
                <PedidoInternoDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={<Navigate to="/pedidos-internos" replace />} />

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

            <Route path="/accounting" element={
              <ProtectedRoute allowedRoles={routeRoles.frozen}>
                <AccountingPage />
              </ProtectedRoute>
            } />
            <Route path="/finanzas" element={
              <ProtectedRoute allowedRoles={routeRoles.frozen}>
                <FinanzasPage />
              </ProtectedRoute>
            } />
            <Route path="/gastos-operativos" element={
              <ProtectedRoute allowedRoles={routeRoles.frozen}>
                <GastosOperativosPage />
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
        <Toaster position="top-center" richColors closeButton />
      </Router>
    </AuthProvider>
  );
}

export default App;
