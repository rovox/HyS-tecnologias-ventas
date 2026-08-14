# Flujos de Trabajo Completos

## Flujo 1: Venta a Instalación
1. **Ventas** crea el Cliente en módulo *Clientes*.
2. **Ventas** registra el Ingreso en *Reportes*.
3. **Ventas** crea el Cronograma en *Cronogramas*, asignando al técnico.
4. **Técnico** (Seguridad Electrónica) revisa el cronograma. Pide materiales vía *Pedidos Internos*.
5. **Admin** aprueba el pedido interno.
6. **Técnico** ejecuta el trabajo, sube fotos en el detalle del cronograma y cambia estado a `completado`.

## Flujo 2: Marketing y Cierre
1. **Ventas** crea Campaña con Presupuesto X.
2. Al final de la campaña, se registran Métricas (Leads y Cotizaciones generadas).
3. El sistema calcula automáticamente la conversión y el ROI en el Dashboard de Marketing.