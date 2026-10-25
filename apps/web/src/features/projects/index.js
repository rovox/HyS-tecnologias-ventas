// Public entry of the projects feature. Pages are lazy: finance and the cronograma use the project hooks, and that
// must not pull the project pages (which use finance dialogs) into their chunks.
import { lazy } from 'react';

export const ProjectsPage = lazy(() => import('./pages/ProjectsPage.jsx'));
export const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage.jsx'));
export { useProject, useProjects } from './api.js';
