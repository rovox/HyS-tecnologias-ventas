import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import ScheduleSurveysPage from '@/pages/ScheduleSurveysPage.jsx';
import ClientsPage from '@/pages/ClientsPage.jsx';
import ClientDetailPage from '@/pages/ClientDetailPage.jsx';
import ReportsPage from '@/pages/ReportsPage.jsx';
import ManagementPanelPage from '@/pages/ManagementPanelPage.jsx';
import ConfigurationPage from '@/pages/ConfigurationPage.jsx';
import ActivityWallPage from '@/pages/ActivityWallPage.jsx';
import QuotationsLibraryPage from '@/pages/QuotationsLibraryPage.jsx';
import ScheduleWorkPage from '@/pages/ScheduleWorkPage.jsx';
import PedidosInternosPage from '@/pages/PedidosInternosPage.jsx';
import PedidoInternoDetailPage from '@/pages/PedidoInternoDetailPage.jsx';
import GastosOperativosPage from '@/pages/GastosOperativosPage.jsx';
import VehicleControlPage from '@/pages/VehicleControlPage.jsx';
import VehicleDetailPage from '@/pages/VehicleDetailPage.jsx';
import VehiclesPage from '@/pages/VehiclesPage.jsx';
import MaintenancePage from '@/pages/MaintenancePage.jsx';
import MarketingPage from '@/pages/MarketingPage.jsx';
import CampaignPage from '@/pages/CampaignPage.jsx';
import AccountingPage from '@/pages/AccountingPage.jsx';
import FinanzasPage from '@/pages/FinanzasPage.jsx';
import { routeRoles } from '@/config/nav.js';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/public-dashboard" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

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
        <Toaster position="top-center" richColors closeButton />
      </Router>
    </AuthProvider>
  );
}

export default App;
