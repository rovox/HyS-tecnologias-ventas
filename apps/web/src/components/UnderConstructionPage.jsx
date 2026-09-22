import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout.jsx';
import { Construction } from 'lucide-react';

const UnderConstructionPage = ({ moduleName = 'Este módulo' }) => (
  <Layout>
    <Helmet><title>{moduleName} - H&S Tecnologías</title></Helmet>
    <div className="content-container py-16 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <div className="h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
        <Construction className="h-10 w-10 text-amber-600" />
      </div>
      <h2 className="text-2xl font-extrabold text-foreground mb-2">{moduleName}</h2>
      <p className="text-muted-foreground font-medium max-w-sm">
        Este módulo está en desarrollo y estará disponible próximamente.
      </p>
    </div>
  </Layout>
);

export default UnderConstructionPage;
