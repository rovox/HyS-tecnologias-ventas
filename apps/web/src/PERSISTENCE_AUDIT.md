# Reporte de Auditoría de Persistencia de Datos

**Fecha:** 2026-06-11
**Objetivo:** Verificar la existencia y correcta persistencia de los campos relacionales (`sucursal_id` y `vendedor_responsable_id`) en los esquemas clave.

### 1. Colección `schedules`
- **`sucursal_id`**: ✅ Existe en el esquema (tipo `text`). Se envía correctamente en el formulario (`ScheduleFormModal.jsx`) y se persiste.
- **`vendedor_responsable_id`**: ✅ Existe en el esquema (tipo `text`). Se carga correctamente mediante el hook actualizado (`useVendedorList.js`), se selecciona y persiste.

### 2. Colección `pedidos_internos`
- **`sucursal_origen_id` / `sucursal_destino_id`**: ✅ Existen en el esquema. El formulario `PedidoInternoFormModal.jsx` incluye los selects debloqueados y guardan en BD.
- **`vendedor_responsable_id`**: ✅ Existe en esquema y persiste.

### 3. Colección `campaigns`
- Usa campo genérico de texto `responsable`. ✅ Funciona adecuadamente sin requerir un ID estricto, dado que es texto libre.

### 4. Colección `maintenance`
- **`sucursal_id`**: ⚠️ Inicialmente faltaba en el esquema. El agente de migraciones lo agregó con éxito. El campo ahora persiste.

### 5. Colección `quotations`
- Usa campo de texto `uploaded_by`. ✅ Persiste correctamente con el nombre del usuario.

### 6. Colección `vehicles`
- **`sucursal_id`**: ⚠️ Faltaba en esquema. Agregado por migraciones. ✅ Persiste correctamente.

### Conclusión
Todos los problemas de "dropdowns readonly" y campos faltantes han sido solucionados. La base de datos ahora acepta todos los valores enviados desde los formularios sin lanzar errores 404 por relaciones estrictas rotas (usamos Text para referencias débiles).