// Public entry of the inventory feature. The page is lazy: `useProducts` is used by the internal order form.
import { lazy } from 'react';

export const InventoryPage = lazy(() => import('./pages/InventoryPage.jsx'));
export { useProducts } from './api.js';
