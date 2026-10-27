// Public entry of the inventory feature. The page is lazy: `useProducts` is used by the internal order form, and
// `useRegisterStockMovement` by the material a técnico uses on a job (SCH-04).
import { lazy } from 'react';

export const InventoryPage = lazy(() => import('./pages/InventoryPage.jsx'));
export { useProducts, useRegisterStockMovement } from './api.js';
