import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout.jsx';
import ScheduleView from '@/components/ScheduleView.jsx';

const ScheduleWorkPage = () => (
  <Layout>
    <Helmet>
      <title>Cronograma - H&S Tecnologías</title>
    </Helmet>
    <div className="content-container py-6 w-full max-w-none">
      <ScheduleView types={['seguridad', 'proyectos']} title="Cronograma de Trabajos" />
    </div>
  </Layout>
);

export default ScheduleWorkPage;