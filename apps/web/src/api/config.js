/**
 * Frontend API configuration.
 *
 * Production Hostinger: VITE_API_MODE=api + absolute VITE_API_URL to lime-chamois.
 * Local default: VITE_API_MODE=mock (in-memory repositories).
 *
 * Never put secrets in VITE_* variables — they are embedded in the browser bundle.
 */

export const API_MODE = import.meta.env.VITE_API_MODE || 'mock';
export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const isMockMode = API_MODE !== 'api';

export const DEMO_NOTICE = 'POC / datos ficticios — no hay conexión a PocketBase ni NestJS';
