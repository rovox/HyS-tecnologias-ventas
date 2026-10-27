import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { markToasterReady } from '@/shared/lib/toasterReady.js';

/** Loaded lazily by App (GATE-01). Its effect runs after the toaster's own, so the toaster already listens. */
export default function AppToaster() {
  useEffect(() => markToasterReady(), []);
  return <Toaster position="top-center" richColors closeButton />;
}
