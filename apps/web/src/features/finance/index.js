// Public entry of the finance feature. The page is lazy: projects and the cronograma import the payment dialog, and
// that must not pull the whole finance page into their chunks.
import { lazy } from 'react';

export const FinancePage = lazy(() => import('./pages/FinancePage.jsx'));
export { IncomeDialog } from './components/IncomeDialog.jsx';
export { MovementDialog } from './components/MovementDialog.jsx';
