/**
 * Dashboard helpers. Live KPIs are computed in reportsService from the mock store
 * so mutations (payments, job status) are reflected. This file only documents
 * the expected demo snapshot at seed time.
 */

export const DASHBOARD_SEED_NOTES = {
  month: '2026-08',
  ventasMesEstimadas: 18500 + 4200 + 9100,
  cobradoMes: 5000 + 9100,
  jobs: {
    programado: 1,
    en_proceso: 1,
    terminado: 1,
    cancelado: 1,
  },
};
