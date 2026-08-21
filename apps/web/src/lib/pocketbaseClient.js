/**
 * Data client used by existing UI.
 *
 * POC (`VITE_API_MODE=mock`, default): in-memory adapter. No PocketBase SDK, no /hcgi/platform.
 * Future (`VITE_API_MODE=api`): pages should call services/* which will use api/client.js.
 */

import mockAdapter from '@/api/mockAdapter.js';
import { isMockMode } from '@/api/config.js';

if (!isMockMode) {
  console.warn('[dataClient] VITE_API_MODE=api: clientes, cotizaciones y métricas van por HTTP. El resto de pantallas sigue en el adaptador mock.');
}

const pocketbaseClient = mockAdapter;

export default pocketbaseClient;
export { pocketbaseClient };
