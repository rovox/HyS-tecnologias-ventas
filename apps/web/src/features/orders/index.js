// Public entry of the internal orders feature: the orders tab of Inventario and the order page (lazy: the inventory
// feature imports this entry).
import { lazy } from 'react';

export const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage.jsx'));
export { OrdersView } from './components/OrdersView.jsx';
