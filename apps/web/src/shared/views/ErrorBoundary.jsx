import React from 'react';

/**
 * Last line against a white screen: a render error or a page chunk that failed to load (e.g. after a new deploy)
 * shows what happened and a way out instead of unmounting the whole app.
 */
export class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const chunk = /dynamically imported module|Loading chunk|Failed to fetch/i.test(String(this.state.error?.message));
    return (
      <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-background text-foreground">
        <h1 className="text-2xl font-bold">{chunk ? 'Hay una versión nueva del sistema' : 'Algo salió mal en esta pantalla'}</h1>
        <p className="text-muted-foreground max-w-md">
          {chunk ? 'Recarga la página para usarla.' : String(this.state.error?.message || 'Error inesperado')}
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={() => window.location.reload()} className="min-h-11 px-4 rounded-md bg-primary text-primary-foreground font-semibold">
            Recargar
          </button>
          <a href="/dashboard" className="min-h-11 px-4 inline-flex items-center rounded-md border font-semibold">Ir al inicio</a>
        </div>
      </div>
    );
  }
}
