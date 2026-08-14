# Manual Test Checklist: Database Persistence & State Flow

This document provides step-by-step instructions to manually verify that database persistence, state flows, and permissions are working correctly.

## 1. Database Persistence Verification

### Schedules (Cronogramas)
1. Navigate to any Schedule page (e.g., Instalaciones).
2. Click **Nuevo** to open the creation modal.
3. Fill out all required fields, ensuring you select a **Sucursal** and a **Vendedor Responsable**.
4. Open your browser's Developer Tools (F12) and go to the **Console** tab.
5. Click **Registrar**.
6. **Verify Console Logs:**
   - Look for `[ScheduleFormModal] BEFORE CREATE - Payload: {...}` and verify `sucursal_id` and `vendedor_responsable_id` are present.
   - Look for `[ScheduleFormModal] AFTER CREATE - Record: {...}`.
   - Look for `[ScheduleFormModal] FETCHED BACK AFTER CREATE: {...}` and verify the fields are present in the fetched record.
7. **Verify UI:**
   - A green success toast should appear saying: `Cronograma creado: sucursal=[value], vendedor=[value]`.
8. Click on the newly created schedule card to open the detail view.
9. **Verify Detail View:**
   - The console should log `[ScheduleView] Loaded full record: {...}`.
   - The UI should prominently display `Sucursal: [value]` and the Vendedor's name.
10. Click the **Verificar BD** button.
    - A modal should appear showing the raw JSON values directly from PocketBase. Confirm `sucursal_id` and `vendedor_responsable_id` match what you entered.

### Pedidos Internos
1. Navigate to Pedidos Internos.
2. Click **Nuevo Pedido**.
3. Fill out all required fields, ensuring you select **Sucursal Origen**, **Sucursal Destino**, and **Vendedor Responsable**. Add at least one material.
4. Open the browser Console.
5. Click **Generar Pedido**.
6. **Verify Console Logs:**
   - Look for `[PedidoInternoFormModal] BEFORE SUBMIT - Payload: {...}`.
   - Look for `[PedidoInternoFormModal] AFTER SUBMIT - Fetched latest record: {...}` and verify the fields.
7. **Verify UI:**
   - A green success toast should appear saying: `Pedido guardado: sucursal=[origen]->[destino], vendedor=[value]`.
8. Click the eye icon to open the detail view of the new pedido.
9. **Verify Detail View:**
   - The console should log `[PedidoInternoDetailPage] Loaded full record: {...}`.
   - The UI should prominently display the route and the Vendedor's name.
10. Click the **Verificar BD** button.
    - Confirm the raw JSON values match what you entered.

## 2. State Flow Validation

### Pedidos Internos Flow
1. In a Pedido Interno detail view, open the Console.
2. Change the state from `solicitado` to `entregado` (skipping states).
   - **Verify Console:** `[StateFlowValidator] Result: invalid (Cannot skip states or move backwards)`.
   - **Verify UI:** A red error toast should appear. The state should not change.
3. Change the state from `solicitado` to `aprobado`.
   - **Verify Console:** `[StateFlowValidator] Result: valid (Standard flow)`.
   - **Verify Console:** `[StateChangeLogger] Record created with ID: ...` and `FETCHED BACK RECORD TO CONFIRM PERSISTENCE`.
   - **Verify UI:** A green success toast should appear with the historial ID.
4. Click **Ver Historial**.
   - A modal should appear showing the state change from `solicitado` to `aprobado`.
5. Test the rest of the flow: `aprobado` -> `en_preparación` -> `entregado`.
6. Test `cancelado`: Create a new pedido and immediately change it to `cancelado`. It should succeed.

### Schedules Flow
1. In a Schedule detail view, open the Console.
2. Change the state from `programado` to `completado` (skipping states).
   - **Verify Console:** `[StateFlowValidator] Result: invalid`.
   - **Verify UI:** Red error toast.
3. Change the state from `programado` to `en_proceso`.
   - **Verify Console:** `[StateFlowValidator] Result: valid`.
   - **Verify Console:** `[StateChangeLogger]` logs confirming persistence.
   - **Verify UI:** Green success toast with historial ID.
4. Click **Ver Historial** to confirm the log appears.

## 3. Permission Validation

1. Log in as a user with the role `ADMINISTRADOR`.
   - Open a detail view.
   - **Verify Console:** When changing state, look for `[StateFlowValidator] Checking permissions for role: ADMINISTRADOR` -> `Permission result: true`.
   - The state change should succeed.
2. Log in as a user with a role NOT in the allowed list (if you have one, e.g., a basic user).
   - Open a detail view.
   - The state dropdown should be replaced by a static badge.
   - If you somehow trigger a state change, the console should log `Permission result: false` and a red toast should appear.

## Final Checklist
- [ ] Schedule creation logs payload, fetches back, and shows toast with values.
- [ ] Schedule detail view logs full record on load.
- [ ] Schedule detail view has working "Verificar BD" button.
- [ ] Pedido creation logs payload, fetches back, and shows toast with values.
- [ ] Pedido detail view logs full record on load.
- [ ] Pedido detail view has working "Verificar BD" button.
- [ ] StateFlowValidator correctly blocks skipping states.
- [ ] StateFlowValidator correctly allows 'cancelado' from any state.
- [ ] StateFlowValidator correctly checks user roles.
- [ ] StateChangeLogger creates record, fetches it back, and logs it.
- [ ] "Ver Historial" buttons work and display the logged state changes.