# Manual Test Checklist: State Flow & Validation

This document provides a manual verification guide to ensure all validation points and state flows are working correctly.

## 1. Sucursal Validation & Display
- [ ] **Create/Edit Modal (Schedules & Pedidos):** Open the modal. Verify that the "Sucursal" dropdown is present and required. Try submitting without selecting a sucursal; verify a validation error appears.
- [ ] **List View (Pedidos):** Navigate to Pedidos Internos. Verify the "Ruta (Origen → Destino)" column displays the correct sucursales.
- [ ] **Detail View (Schedules & Pedidos):** Open a detail view. Verify the sucursal is prominently displayed with a MapPin or Building icon.

## 2. Vendedor Responsable Validation & Display
- [ ] **Create/Edit Modal (Schedules & Pedidos):** Open the modal. Verify the "Vendedor Responsable" dropdown is present, required, and populated with users (specifically those with the SEGURIDAD ELECTRÓNICA role if filtered). Try submitting without selecting one; verify a validation error appears.
- [ ] **List View (Pedidos):** Verify the "Vendedor" column displays the correct user name (not the ID).
- [ ] **Detail View (Schedules & Pedidos):** Open a detail view. Verify the "Vendedor Responsable" is displayed with the user's name.
- [ ] **Inline Edit (Admin only):** If logged in as Admin, verify you can change the Vendedor Responsable directly from the detail view and that it logs the change in the history.

## 3. State Transitions (Mandatory Flow)
- [ ] **Pedidos Internos Flow:** Open a Pedido Interno detail view. Click the state dropdown.
  - If current state is `solicitado`, verify only `aprobado` and `cancelado` are available.
  - If current state is `aprobado`, verify only `en_preparación` and `cancelado` are available.
  - If current state is `en_preparación`, verify only `entregado` and `cancelado` are available.
  - If current state is `entregado` or `cancelado`, verify the dropdown is disabled or no further states are available.
- [ ] **Schedules Flow:** Open a Schedule detail view. Click the state dropdown.
  - If current state is `programado`, verify only `en_proceso` and `cancelado` are available.
  - If current state is `en_proceso`, verify only `por_culminar`, `completado`, and `cancelado` are available.
  - If current state is `por_culminar`, verify only `completado` and `cancelado` are available.

## 4. Cancelado State
- [ ] **Cancel from any state:** Verify that `cancelado` is an available option from any active state (`solicitado`, `aprobado`, `en_preparación` for Pedidos; `programado`, `en_proceso`, `por_culminar` for Schedules).
- [ ] **Post-Cancelation:** Once a record is `cancelado`, verify that no further state changes can be made.

## 5. State Change Logging (historial_actividad)
- [ ] **Trigger a state change:** Change the state of a Schedule or Pedido Interno.
- [ ] **Verify History Section:** Look at the "Historial de Cambios" section at the bottom of the detail view.
- [ ] **Verify Data:** Ensure the new entry shows the correct user name, timestamp, and a description like "Estado cambiado de 'X' a 'Y'".

## 6. Notifications
- [ ] **Success Toast:** After successfully changing a state or updating a vendor, verify a green success toast appears.
- [ ] **Error Toast:** If an operation fails (e.g., network error), verify a red error toast appears.

## 7. Role-Based Permissions
- [ ] **Admin User:** Log in as an Admin. Verify you can see and use the state change dropdowns and inline vendor edit dropdowns.
- [ ] **Unauthorized User:** Log in as a user without permission (if applicable). Verify the state change dropdown is replaced by a static badge and the vendor edit dropdown is replaced by static text.

## 8. No Compilation Errors
- [ ] **Console Check:** Open the browser developer tools console. Navigate through the app, open modals, and change states. Verify there are no React errors, missing key warnings, or unhandled promise rejections.

## 9. Data Readiness
- [ ] **Database Check:** Open the PocketBase admin UI. Check the `schedules`, `pedidos_internos`, and `historial_actividad` collections. Verify that `sucursal_id`, `vendedor_responsable_id`, and `estado` are saving correctly and that history records are being created with the correct `entidad_tipo` and `entidad_id`.