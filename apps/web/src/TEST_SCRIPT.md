# Guía de Pruebas Funcionales Completas (Test Script)

A continuación, se detalla el procedimiento para verificar que las correcciones implementadas funcionan correctamente en producción.

## Prueba 1: Crear y visualizar un Cronograma (Schedules)
1. Iniciar sesión como `ventas@company.com` (o admin).
2. Navegar a **Cronogramas > Instalaciones**.
3. Clic en **Nuevo**.
4. **Verificación:** El dropdown de "Vendedor Responsable" debe desplegarse y mostrar "Dennis Palacios" y "Wilson Fernandez".
5. Seleccionar cliente, vendedor, sucursal, fecha de hoy y completar campos requeridos. Clic en **Registrar**.
6. **Verificación:** El cronograma debe aparecer INMEDIATAMENTE en la columna del día de HOY en el calendario.

## Prueba 2: CRUD de Pedidos Internos
1. Navegar a **Pedidos Internos**.
2. Clic en **Nuevo Pedido**.
3. **Verificación:** Los dropdowns (Sucursal Origen, Destino y Vendedor Responsable) deben permitir selección libre sin estar bloqueados (readonly).
4. Agregar un material con cantidad y costo.
5. Clic en **Generar Pedido**.
6. **Verificación:** El pedido aparece en la lista.
7. Clic en el pedido creado para abrir `PedidoInternoDetailPage`.
8. Clic en **Editar Pedido**. Modificar la fecha estimada o la sucursal de destino. Guardar.
9. Recargar la página (F5).
10. **Verificación:** Los cambios realizados se mantienen persistentes.

## Prueba 3: Comentarios y Fotos en Detalles
1. Dentro de un pedido interno, escribir texto en el área de comentarios.
2. Adjuntar una imagen de prueba.
3. Clic en **Enviar**.
4. **Verificación:** El comentario aparece instantáneamente y la foto puede previsualizarse.

## Prueba 4: Verificación de Reportes Reales
1. Navegar a **Reportes Financieros** (`/reports/admin`).
2. **Verificación:** Ya no aparecen datos "perfectos" o hardcodeados (como 99.99%). Los números provienen de las sumatorias reales de la base de datos (Ingresos = Schedules, Gastos = Mantenimiento, combustible, etc.).
3. Navegar a **Panel de Control** (`/admin/management`).
4. **Verificación:** Muestra progreso real de los vendedores en base a los trabajos que tienen asignados con estado `completado`.

> **Nota:** Todos los errores de "readonly" en formularios modales han sido solucionados al eliminar el prop `disabled={true}` que estaba erróneamente condicionado por la presencia de `initialData`.