import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout.jsx';
import ScheduleBoard from '@/components/ScheduleBoard.jsx';

const PageWrapper = ({ type, title }) => (
  <Layout>
    <Helmet>
      <title>{title} - H&S Tecnologías</title>
    </Helmet>
    <ScheduleBoard type={type} title={title} />
  </Layout>
);

export const ScheduleSecurityPage = () => <PageWrapper type="seguridad" title="Cronograma de Seguridad Electrónica" />;
export const ScheduleProjectsPage = () => <PageWrapper type="proyectos" title="Cronograma de Proyectos" />;
export const ScheduleRelevamentsPage = () => <PageWrapper type="relevamientos" title="Cronograma de Relevamientos" />;