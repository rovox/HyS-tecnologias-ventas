import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import ScheduleWorkPage from '@/pages/ScheduleWorkPage.jsx';
import ScheduleSurveysPage from '@/pages/ScheduleSurveysPage.jsx';
import ClientsPage from '@/pages/ClientsPage.jsx';
import ClientDetailPage from '@/pages/ClientDetailPage.jsx';
import MarketingPage from '@/pages/MarketingPage.jsx';
import ReportsPage from '@/pages/ReportsPage.jsx';
import ManagementPanelPage from '@/pages/ManagementPanelPage.jsx';
import ConfigurationPage from '@/pages/ConfigurationPage.jsx';
import ActivityWallPage from '@/pages/ActivityWallPage.jsx';
import VehicleControlPage from '@/pages/VehicleControlPage.jsx';
import VehicleDetailPage from '@/pages/VehicleDetailPage.jsx';
import MaintenancePage from '@/pages/MaintenancePage.jsx';
import QuotationsLibraryPage from '@/pages/QuotationsLibraryPage.jsx';
import MerchandiseOrdersPage from '@/pages/MerchandiseOrdersPage.jsx';
import PedidosInternosPage from '@/pages/PedidosInternosPage.jsx';
import PedidoInternoDetailPage from '@/pages/PedidoInternoDetailPage.jsx';
import AccountingPage from '@/pages/AccountingPage.jsx';
import GastosOperativosPage from '@/pages/GastosOperativosPage.jsx';
import FinanzasPage from '@/pages/FinanzasPage.jsx';
import { Toaster } from '@/components/ui/sonner';

const VehicleRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/vehicle-control/${id}`} replace />;
};

function App() {
  const ROLES = {
    ADMIN: 'ADMINISTRADOR',
    VENTAS: 'VENTAS / ADMINISTRACIÓN',
    TEC: 'SEGURIDAD ELECTRÓNICA',
    CONT: 'Contadora'
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/public-dashboard" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC, ROLES.CONT]}>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/schedule" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC, ROLES.CONT]}>
              <ScheduleWorkPage />
            </ProtectedRoute>
          } />
          
          <Route path="/surveys" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC, ROLES.CONT]}>
              <ScheduleSurveysPage />
            </ProtectedRoute>
          } />

          <Route path="/clientes" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.CONT, ROLES.TEC]}>
              <ClientsPage />
            </ProtectedRoute>
          } />

          <Route path="/clientes/:id" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.CONT, ROLES.TEC]}>
              <ClientDetailPage />
            </ProtectedRoute>
          } />

          <Route path="/clients" element={<Navigate to="/clientes" replace />} />

          <Route path="/activity-wall" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC, ROLES.CONT]}>
              <ActivityWallPage />
            </ProtectedRoute>
          } />

          <Route path="/pedidos-internos" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC, ROLES.CONT]}>
              <PedidosInternosPage />
            </ProtectedRoute>
          } />

          <Route path="/pedidos-internos/:id" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC, ROLES.CONT]}>
              <PedidoInternoDetailPage />
            </ProtectedRoute>
          } />

          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC, ROLES.CONT]}>
              <MerchandiseOrdersPage />
            </ProtectedRoute>
          } />

          <Route path="/vehicle-control" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC, ROLES.CONT]}>
              <VehicleControlPage />
            </ProtectedRoute>
          } />
          
          <Route path="/vehicle-control/:id" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC, ROLES.CONT]}>
              <VehicleDetailPage />
            </ProtectedRoute>
          } />

          <Route path="/maintenance" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC, ROLES.CONT]}>
              <MaintenancePage />
            </ProtectedRoute>
          } />

          <Route path="/quotations" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.CONT, ROLES.TEC]}>
              <QuotationsLibraryPage />
            </ProtectedRoute>
          } />

          <Route path="/marketing" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC]}>
              <MarketingPage />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.CONT]}>
              <ReportsPage />
            </ProtectedRoute>
          } />

          <Route path="/accounting" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.CONT]}>
              <AccountingPage />
            </ProtectedRoute>
          } />

          <Route path="/finanzas" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.CONT]}>
              <FinanzasPage />
            </ProtectedRoute>
          } />

          <Route path="/gastos-operativos" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC, ROLES.CONT]}>
              <GastosOperativosPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/management" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <ManagementPanelPage />
            </ProtectedRoute>
          } />

          <Route path="/configuration" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <ConfigurationPage />
            </ProtectedRoute>
          } />

          <Route path="/vehicles" element={<Navigate to="/vehicle-control" replace />} />
          <Route path="/vehicles/:id" element={<VehicleRedirect />} />
          
          <Route path="/reports/admin" element={<Navigate to="/reports" replace />} />
          <Route path="/campaigns" element={<Navigate to="/marketing" replace />} />

          <Route path="*" element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-4">
              <h1 className="text-5xl font-black mb-4 text-primary">404</h1>
              <p className="text-muted-foreground font-bold mb-6">La página que buscas no existe o no tienes permiso.</p>
              <a href="/dashboard" className="text-primary hover:underline font-bold">Volver al Dashboard</a>
            </div>
          } />
        </Routes>
        <Toaster position="top-center" richColors closeButton />
      </Router>
    </AuthProvider>
  );
}

export default App;