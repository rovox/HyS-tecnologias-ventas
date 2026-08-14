import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout.jsx';
import ScheduleView from '@/components/ScheduleView.jsx';

const ScheduleProjectsPage = () => (
  <Layout>
    <Helmet>
      <title>Proyectos - H&S Tecnologías</title>
    </Helmet>
    <div className="content-container py-6 w-full max-w-none">
      <ScheduleView type="proyectos" title="Proyectos y Ejecución" />
    </div>
  </Layout>
);

export default ScheduleProjectsPage;