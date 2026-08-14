# Reporte de Auditoría de Base de Datos (PocketBase)

**Fecha:** 2026-06-11
**Estado General:** Aprobado con observaciones menores.

## Colecciones y Reglas de Acceso

1. **users**
   - **Esquema:** Correcto. Campo `role` validado (`ADMINISTRADOR`, `VENTAS / ADMINISTRACIÓN`, `SEGURIDAD ELECTRÓNICA`).
   - **Reglas:** Lectura limitada al admin o a sí mismo. Modificación solo por el mismo usuario o admin.
   - **Estado:** ✅ OK

2. **schedules** (Cronogramas/Trabajos)
   - **Esquema:** Correcto. Estados validados. `vendedor_responsable_id` y `sucursal_id` son de texto (sin relaciones estrictas restrictivas).
   - **Reglas:** Lectura para autenticados o responsables. Edición limitada a creadores o admin.
   - **Estado:** ✅ OK

3. **pedidos_internos**
   - **Esquema:** Correcto. Prioridades y estados validados.
   - **Reglas:** Lectura autenticados. Edición por responsable o Admin.
   - **Estado:** ✅ OK

4. **vehiculos** & **registros_* (combustible, mantenimiento, aceite, observaciones, problemas)**
   - **Esquema:** Correcto. Enlaces a `vehiculo_id` implementados.
   - **Reglas:** Lectura autenticados. Creación autenticados. Borrado solo admin.
   - **Estado:** ✅ OK

5. **activity** & **historial_actividad**
   - **Esquema:** Correcto. Registro de logs y auditoría funcional.
   - **Reglas:** Lectura autenticados. Borrado solo Admin.
   - **Estado:** ✅ OK

6. **campaigns_new** & **campaign_metrics**
   - **Esquema:** Correcto. Datos financieros y leads.
   - **Reglas:** Restringido a VENTAS / ADMINISTRACIÓN y ADMINISTRADOR.
   - **Estado:** ✅ OK

7. **income** & **expenses** & **goals**
   - **Esquema:** Correcto.
   - **Reglas:** Restringido a roles ejecutivos.
   - **Estado:** ✅ OK

8. **clientes** & **trabajos_clientes** (Nuevas)
   - **Esquema:** Correcto.
   - **Reglas:** Lectura/Creación autenticados. Borrado solo admin.
   - **Estado:** ✅ OK

**Conclusión:** La integridad de la base de datos es robusta. Se evitaron campos relacionales obligatorios que causaban errores 404, usando IDs de texto. Las reglas bloquean accesos no autorizados correctamente.