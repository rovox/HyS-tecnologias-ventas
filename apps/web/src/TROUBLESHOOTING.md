# Solución de Problemas (Troubleshooting)

- **El dropdown de sucursales o vendedores está vacío:**
  - *Causa:* Error de red o no existen registros activos.
  - *Solución:* Verifica en PocketBase que los usuarios tengan el rol correcto. El sistema tiene un fallback para mostrar todos los usuarios si el rol falla.
- **Error "Transición Inválida" al cambiar estado:**
  - *Causa:* Intentar pasar de 'Programado' a 'Terminado' directamente sin pasar por 'En Proceso'.
  - *Solución:* Sigue el flujo lógico (Programado -> En Proceso -> Completado -> Terminado).
- **Las fotos no se visualizan:**
  - *Causa:* Archivo demasiado pesado o tipo no soportado.
  - *Solución:* Sube imágenes JPG/PNG de menos de 20MB.