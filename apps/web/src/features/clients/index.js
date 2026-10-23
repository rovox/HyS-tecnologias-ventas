// Public entry of the clients feature. Pages are lazy: the picker is used from the header (tasks), so importing this
// entry must not pull the client pages into the main bundle.
import { lazy } from 'react';

export const ClientsPage = lazy(() => import('./pages/ClientsPage.jsx'));
export const ClientDetailPage = lazy(() => import('./pages/ClientDetailPage.jsx'));
export { ClientPicker } from './components/ClientPicker.jsx';
