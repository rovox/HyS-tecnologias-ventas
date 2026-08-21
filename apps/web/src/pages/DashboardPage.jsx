import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import SalesMetricsRow from '@/components/SalesMetricsRow.jsx';
import SalesActivityCharts from '@/components/SalesActivityCharts.jsx';
import { Helmet } from 'react-helmet';
import { FileStack, Building2, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { ROLES } from '@/mocks/users.js';
import { canWriteQuotations } from '@/config/nav.js';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const isVentas = userRole === ROLES.VENTAS;
  const isTec = userRole === ROLES.TEC;
  const isCont = userRole === ROLES.CONT;

  const subtitle = isVentas
    ? 'Tus cotizaciones, ventas y meta del mes.'
    : isTec
      ? 'Relevamientos y tareas asignadas.'
      : isCont
        ? 'Métricas comerciales de lectura.'
        : 'Visión comercial de sucursales y vendedores.';

  return (
    <Layout>
      <Helmet><title>Dashboard - H&S Tecnologías</title></Helmet>
      <div className="space-y-4 pb-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Hola, {currentUser?.name || 'equipo'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {!isTec && <SalesMetricsRow />}
        {!isTec && <SalesActivityCharts />}

        <div className="flex flex-wrap gap-3">
          {canWriteQuotations(userRole) && (
            <Button className="min-h-11" onClick={() => navigate('/quotations')}>
              <FileStack className="h-4 w-4" /> Cotizaciones
            </Button>
          )}
          <Button variant="outline" className="min-h-11" onClick={() => navigate('/clientes')}>
            <Building2 className="h-4 w-4" /> Clientes
          </Button>
          {!isCont && (
            <Button variant="outline" className="min-h-11" onClick={() => navigate('/surveys')}>
              <ClipboardCheck className="h-4 w-4" /> Relevamientos
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
