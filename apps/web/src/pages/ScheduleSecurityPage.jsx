import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout.jsx';
import ScheduleView from '@/components/ScheduleView.jsx';

const ScheduleSecurityPage = () => (
  <Layout>
    <Helmet>
      <title>Seguridad Electrónica - H&S Tecnologías</title>
    </Helmet>
    <div className="content-container py-6 w-full max-w-none">
      <ScheduleView type="seguridad" title="Seguridad Electrónica" />
    </div>
  </Layout>
);

export default ScheduleSecurityPage;