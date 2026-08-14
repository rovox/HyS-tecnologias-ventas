# Registro de Errores Solucionados (Bugfixes)

- **Fallo en carga de Vendedores (Dropdown vacío):** Solucionado en `useVendedorList`. Se implementó un fallback en caso de error de sintaxis en el listRule de roles.
- **Transiciones de Estado Bloqueadas:** Se actualizaron `ScheduleView` y `PedidoInternoDetailPage` para validar estados correctamente y registrar el log en `historial_actividad`.
- **Errores 404 en APIs Relacionales:** Se cambió el enfoque de `Relation` a `Text` para IDs en referencias, permitiendo guardados parciales.
- **Console Errors en Gráficos Recharts:** Se añadieron validaciones `if (!data) return null` y Skeleton loaders antes de renderizar gráficos para evitar fallos de hidratación.
- **Fuga de Memoria en Listeners Auth:** Se limpió la suscripción de `pb.authStore.onChange` en el AuthContext.
- **Excepciones no capturadas en formularios:** Se envolvió todo submit en `try/catch` con `toast.error` utilizando Sonner para un feedback claro al usuario.