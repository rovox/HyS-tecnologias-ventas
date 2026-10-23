import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { useCategories } from '@/features/catalogs';
import { QuotationTabs } from '@/features/quotations';
import { ControlPanel, ListView, useListControls } from '@/shared/views';
import { downloadCsv } from '@/shared/lib/csv.js';
import { formatBs } from '@/shared/lib/format.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { useProjects } from '../api.js';
import { PROJECT_STATE } from '../constants.js';
import { ProjectCard, projectColumns, projectCsv } from '../components/projectColumns.jsx';

const GROUPS = [
  { key: 'estado', label: 'Estado', of: (p) => PROJECT_STATE[p.estado]?.label },
  { key: 'categoria', label: 'Categoría', of: (p) => p.categoria?.label },
  { key: 'cliente', label: 'Cliente', of: (p) => p.cliente?.nombre },
  { key: 'responsable', label: 'Responsable', of: (p) => p.responsable?.name },
];

/** Projects with the money of each one: the transparent report of what was quoted, collected and owed. */
export default function ProjectsPage() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();
  const { data: categories } = useCategories();
  useDocumentTitle('Proyectos');

  const filters = useMemo(
    () => [
      ...Object.entries(PROJECT_STATE).map(([key, s]) => ({ key, label: s.label, section: 'Estado', test: (p) => p.estado === key })),
      ...(categories?.divisions || []).map((d) => ({ key: d.id, label: d.label, section: 'Categoría', test: (p) => p.categoriaId === d.id })),
      { key: 'con_saldo', label: 'Con saldo pendiente', section: 'Dinero', test: (p) => p.saldo > 0 },
      { key: 'en_garantia', label: 'En garantía', section: 'Garantía', test: (p) => p.garantiaVigente },
    ],
    [categories],
  );
  const { rows, groups, panel } = useListControls(projects, {
    filters,
    groupOptions: GROUPS,
    searchText: (p) => `${p.codigo} ${p.titulo} ${p.cliente?.nombre || ''} ${p.quotation?.numero || ''}`,
  });
  const owed = rows.reduce((sum, p) => sum + p.saldo, 0);

  return (
    <Layout>
      <QuotationTabs current="proyectos" />
      <ControlPanel
        breadcrumbs={[{ label: 'Proyectos' }]}
        searchPlaceholder="Buscar por código, título, cliente…"
        {...panel}
        onExport={() => downloadCsv('proyectos.csv', projectCsv, rows)}
        meta={`${rows.length} · por cobrar ${formatBs(owed)}`}
      />
      <div className="px-4 py-4 sm:px-6">
        <ListView
          columns={projectColumns}
          rows={rows}
          groups={groups}
          loading={isLoading}
          onRowClick={(p) => navigate(`/projects/${p.id}`)}
          empty="No hay proyectos con estos filtros"
          renderCard={(p) => <ProjectCard project={p} />}
        />
      </div>
    </Layout>
  );
}
