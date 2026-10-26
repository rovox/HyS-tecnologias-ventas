-- Hostinger delta: migrations after 20260923010000_pedidos_internos (the last one deployed to
-- lime-chamois-337700, checked 2026-10-26) up to 20261025010000_order_requester.
-- For the EXISTING production DB only (phpMyAdmin import, in this exact order). Does not touch the
-- Sale/SaleJob/SalePayment tables: Project/CashMovement/Product are new, parallel tables for the new
-- flow, so this import is additive and the old sales data is untouched.
--
-- BEFORE IMPORTING: back up the database (hPanel -> Databases -> Backups, or mysqldump over SSH).
--
-- ** 20261022010000_categories_divisions needs a manual check first. ** It reclassifies every existing
-- quotation and job into one of the 3 divisions (computo_comunicacion / seguridad_electronica /
-- cableado_estructurado); anything that is not already one of those 3 categories becomes
-- seguridad_electronica. Before running this section, in phpMyAdmin or via SSH mysql, run:
--   SELECT id, numero, titulo, categoriaId FROM quotations
--   WHERE categoriaId NOT IN ('seguridad_electronica', 'insumos_tecnologicos', 'proyectos');
-- and confirm with the owner that falling back to seguridad_electronica is correct for those rows
-- (there were 0 as of the last local check against the migration's own comment, but production data
-- was not read in this session -- see docs/deployment/hostinger-api.md "Schema diff 2026-10-26").
--
-- Regenerated 2026-10-26 from apps/api/prisma/migrations/*/migration.sql (do not edit by hand).

-- ===== BEGIN 20261016000000_solicitudes_web =====
-- WEB-01: contact-form requests from hstecnologias.com, separate from clients.
CREATE TABLE `solicitudes_web` (
  `id` VARCHAR(191) NOT NULL,
  `nombre` VARCHAR(200) NOT NULL,
  `empresa` VARCHAR(200) NOT NULL DEFAULT '',
  `email` VARCHAR(200) NOT NULL DEFAULT '',
  `telefono` VARCHAR(50) NOT NULL DEFAULT '',
  `departamento` VARCHAR(50) NOT NULL DEFAULT '',
  `servicio` VARCHAR(100) NOT NULL DEFAULT '',
  `detalle` TEXT NOT NULL,
  `origen` VARCHAR(32) NOT NULL DEFAULT 'web',
  `pagina` VARCHAR(500) NOT NULL DEFAULT '',
  `estado` VARCHAR(32) NOT NULL DEFAULT 'nueva',
  `notas` TEXT NOT NULL,
  `clienteId` VARCHAR(191) NULL,
  `convertidaAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `solicitudes_web_estado_idx`(`estado`),
  INDEX `solicitudes_web_email_idx`(`email`),
  INDEX `solicitudes_web_telefono_idx`(`telefono`),
  INDEX `solicitudes_web_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ===== END 20261016000000_solicitudes_web =====

-- ===== BEGIN 20261022000000_activity_detalle =====
-- ARCH-01: field-level audit (AuditService.record) and lookup of a record's history (chatter).
ALTER TABLE `activities` ADD COLUMN `detalle` JSON NULL;
CREATE INDEX `activities_entityType_entityId_idx` ON `activities`(`entityType`, `entityId`);
-- ===== END 20261022000000_activity_detalle =====

-- ===== BEGIN 20261022010000_categories_divisions =====
-- CAT-01: the 3 divisions are the mandatory category of quotations and jobs (owner decision 2026-10-22).
-- Before applying in production, review the rows that had no real category (they are moved to seguridad_electronica):
--   SELECT id, numero, titulo, categoriaId FROM quotations
--   WHERE categoriaId NOT IN ('seguridad_electronica', 'insumos_tecnologicos', 'proyectos');

ALTER TABLE `quotation_categories` ADD COLUMN `principal` BOOLEAN NOT NULL DEFAULT false;

INSERT INTO `quotation_categories` (`id`, `label`, `active`, `principal`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
  ('computo_comunicacion', 'Cómputo y comunicación', true, true, 1, NOW(3), NOW(3)),
  ('seguridad_electronica', 'Seguridad electrónica', true, true, 2, NOW(3), NOW(3)),
  ('cableado_estructurado', 'Cableado estructurado', true, true, 3, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `active` = true, `principal` = true, `sortOrder` = VALUES(`sortOrder`);

-- A quotation filed under a user chip keeps that chip as its subcategory.
UPDATE `quotations` q
  JOIN `quotation_categories` c ON c.`id` = q.`categoriaId`
  SET q.`subcategoria` = c.`label`
  WHERE c.`principal` = false AND c.`id` NOT IN ('insumos_tecnologicos', 'proyectos') AND q.`subcategoria` = '';

UPDATE `quotations` SET `categoriaId` = 'computo_comunicacion' WHERE `categoriaId` = 'insumos_tecnologicos';
UPDATE `quotations` SET `categoriaId` = 'cableado_estructurado' WHERE `categoriaId` = 'proyectos';
UPDATE `quotations` SET `categoriaId` = 'seguridad_electronica'
  WHERE `categoriaId` NOT IN ('computo_comunicacion', 'seguridad_electronica', 'cableado_estructurado');

-- The label column duplicated the category: the relation is the only source now.
ALTER TABLE `quotations` DROP COLUMN `categoria`;

-- Jobs: the category replaces `type` (seguridad | proyectos), taken from the quotation when there is one.
ALTER TABLE `schedules` ADD COLUMN `categoriaId` VARCHAR(191) NULL;
UPDATE `schedules` s JOIN `quotations` q ON q.`id` = s.`quotationId` SET s.`categoriaId` = q.`categoriaId`;
UPDATE `schedules` SET `categoriaId` = IF(`type` = 'proyectos', 'cableado_estructurado', 'seguridad_electronica')
  WHERE `categoriaId` IS NULL;
ALTER TABLE `schedules` MODIFY `categoriaId` VARCHAR(191) NOT NULL;
ALTER TABLE `schedules` DROP COLUMN `type`;

-- The old main categories are now divisions.
DELETE FROM `quotation_categories` WHERE `id` IN ('insumos_tecnologicos', 'proyectos');

CREATE INDEX `quotations_categoriaId_idx` ON `quotations`(`categoriaId`);
CREATE INDEX `schedules_categoriaId_idx` ON `schedules`(`categoriaId`);
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `quotation_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `quotation_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- ===== END 20261022010000_categories_divisions =====

-- ===== BEGIN 20261022020000_quotations_close_states =====
-- QUO-02: closed states aprobada/rechazada/vencida/eliminada (owner decision 2026-10-22).
-- `aceptado` is renamed `aprobado` (stored status value).
UPDATE `quotations` SET `estado` = 'aprobado' WHERE `estado` = 'aceptado';

-- A deleted quotation is hidden from the lists, keeps who/when/why, and can be restored.
ALTER TABLE `quotations`
  ADD COLUMN `eliminadaAt` DATETIME(3) NULL,
  ADD COLUMN `eliminadaPorId` VARCHAR(191) NULL,
  ADD COLUMN `motivoEliminacion` TEXT NULL;
CREATE INDEX `quotations_eliminadaAt_idx` ON `quotations`(`eliminadaAt`);
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_eliminadaPorId_fkey` FOREIGN KEY (`eliminadaPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
-- ===== END 20261022020000_quotations_close_states =====

-- ===== BEGIN 20261023000000_task_client =====
-- TSK-01: a task may be about a client; the client is carried into the quotation when the task is converted.
ALTER TABLE `tasks` ADD COLUMN `clienteId` VARCHAR(191) NULL;
CREATE INDEX `tasks_clienteId_idx` ON `tasks`(`clienteId`);
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
-- Tasks taken from a quotation already belong to that quotation's client.
UPDATE `tasks` t JOIN `quotations` q ON q.`id` = t.`cotizacionId` SET t.`clienteId` = q.`clienteId` WHERE t.`clienteId` IS NULL;
-- ===== END 20261023000000_task_client =====

-- ===== BEGIN 20261023010000_projects =====
-- PRO-01: an approved quotation is a Project (official amount, state, warranty); its jobs point to it.
CREATE TABLE `projects` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `quotationId` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `categoriaId` VARCHAR(191) NOT NULL,
    `sucursalId` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(300) NOT NULL,
    `montoOficial` DECIMAL(12, 2) NOT NULL,
    `estado` VARCHAR(32) NOT NULL DEFAULT 'planificado',
    `motivoAnulacion` TEXT NULL,
    `garantiaMeses` INTEGER NOT NULL DEFAULT 12,
    `entregadoAt` DATETIME(3) NULL,
    `cerradoAt` DATETIME(3) NULL,
    `responsableId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `projects_codigo_key`(`codigo`),
    UNIQUE INDEX `projects_quotationId_key`(`quotationId`),
    INDEX `projects_estado_idx`(`estado`),
    INDEX `projects_clienteId_idx`(`clienteId`),
    INDEX `projects_categoriaId_idx`(`categoriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `schedules` ADD COLUMN `projectId` VARCHAR(191) NULL;
CREATE INDEX `schedules_projectId_idx` ON `schedules`(`projectId`);

-- One project per approved quotation. Its state comes from its jobs: one in progress → en_ejecucion; all cancelled →
-- anulado; all finished or cancelled with at least one finished → entregado (warranty from the last finish); else planificado.
INSERT INTO `projects` (`id`, `codigo`, `quotationId`, `clienteId`, `categoriaId`, `sucursalId`, `titulo`, `montoOficial`,
                        `estado`, `motivoAnulacion`, `entregadoAt`, `createdAt`, `updatedAt`)
SELECT UUID(), REPLACE(q.`numero`, 'COT-', 'PRY-'), q.`id`, q.`clienteId`, q.`categoriaId`, q.`sucursalId`, LEFT(q.`titulo`, 300), q.`monto`,
  CASE
    WHEN EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id` AND s.`estado` = 'en_proceso') THEN 'en_ejecucion'
    WHEN EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id`)
     AND NOT EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id` AND s.`estado` <> 'cancelado') THEN 'anulado'
    WHEN EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id` AND s.`estado` = 'terminado')
     AND NOT EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id` AND s.`estado` IN ('programado', 'en_proceso')) THEN 'entregado'
    ELSE 'planificado'
  END,
  IF(EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id`)
     AND NOT EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id` AND s.`estado` <> 'cancelado'),
     'Migración: todos sus trabajos estaban cancelados', NULL),
  (SELECT MAX(COALESCE(s.`fechaFinalizacion`, s.`updatedAt`)) FROM `schedules` s WHERE s.`quotationId` = q.`id` AND s.`estado` = 'terminado'),
  q.`updatedAt`, NOW(3)
FROM `quotations` q
WHERE q.`estado` = 'aprobado' AND q.`clienteId` IS NOT NULL;

-- A project is delivered only if it was not left in progress or planned.
UPDATE `projects` SET `entregadoAt` = NULL WHERE `estado` <> 'entregado';

UPDATE `schedules` s JOIN `projects` p ON p.`quotationId` = s.`quotationId` SET s.`projectId` = p.`id`;

ALTER TABLE `schedules` ADD CONSTRAINT `schedules_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `projects` ADD CONSTRAINT `projects_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `projects` ADD CONSTRAINT `projects_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `projects` ADD CONSTRAINT `projects_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `quotation_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `projects` ADD CONSTRAINT `projects_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `projects` ADD CONSTRAINT `projects_responsableId_fkey` FOREIGN KEY (`responsableId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
-- ===== END 20261023010000_projects =====

-- ===== BEGIN 20261023020000_cash_ledger =====
-- FIN-01: one money ledger (cash_movements) validated into cash boxes; it replaces schedule_payments as the source of truth.
CREATE TABLE `cash_boxes` (
    `id` VARCHAR(64) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `tipo` VARCHAR(32) NOT NULL,
    `sucursalId` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cash_movements` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(16) NOT NULL,
    `concepto` VARCHAR(40) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metodo` VARCHAR(40) NOT NULL DEFAULT '',
    `nota` VARCHAR(500) NOT NULL DEFAULT '',
    `estado` VARCHAR(16) NOT NULL DEFAULT 'por_validar',
    `motivo` TEXT NULL,
    `projectId` VARCHAR(191) NULL,
    `scheduleId` VARCHAR(191) NULL,
    `clienteId` VARCHAR(191) NULL,
    `cajaId` VARCHAR(64) NULL,
    `cajaDestinoId` VARCHAR(64) NULL,
    `pagadoPor` VARCHAR(16) NULL,
    `reembolsadoAt` DATETIME(3) NULL,
    `comprobanteUrl` VARCHAR(500) NULL,
    `reversaDeId` VARCHAR(191) NULL,
    `sucursalId` VARCHAR(191) NOT NULL,
    `registradoPorId` VARCHAR(191) NOT NULL,
    `validadoPorId` VARCHAR(191) NULL,
    `validadoAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cash_movements_reversaDeId_key`(`reversaDeId`),
    INDEX `cash_movements_estado_idx`(`estado`),
    INDEX `cash_movements_projectId_idx`(`projectId`),
    INDEX `cash_movements_scheduleId_idx`(`scheduleId`),
    INDEX `cash_movements_clienteId_idx`(`clienteId`),
    INDEX `cash_movements_cajaId_idx`(`cajaId`),
    INDEX `cash_movements_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Owner decision: one central box in Cochabamba and a petty cash per branch.
INSERT INTO `cash_boxes` (`id`, `nombre`, `tipo`, `sucursalId`, `active`, `createdAt`, `updatedAt`)
SELECT IF(s.`id` = 'suc_central', 'caja_central', CONCAT('caja_chica_', REPLACE(s.`id`, 'suc_', ''))),
       IF(s.`id` = 'suc_central', 'Caja central Cochabamba', CONCAT('Caja chica ', s.`nombre`)),
       IF(s.`id` = 'suc_central', 'caja', 'caja_chica'),
       s.`id`, true, NOW(3), NOW(3)
FROM `sucursales` s;

-- Every job payment becomes a validated income in its branch's box (all current data is test data). Forgiven debt
-- (descuento) is not money: a cancelled job or project simply owes nothing now.
INSERT INTO `cash_movements` (`id`, `tipo`, `concepto`, `monto`, `fecha`, `metodo`, `nota`, `estado`, `projectId`, `scheduleId`,
                              `clienteId`, `cajaId`, `sucursalId`, `registradoPorId`, `validadoPorId`, `validadoAt`, `createdAt`, `updatedAt`)
SELECT p.`id`, 'ingreso', IF(p.`tipo` = 'extra_asistencia', 'adicional', p.`tipo`), p.`monto`, p.`at`, p.`metodo`, p.`nota`, 'validado',
       s.`projectId`, s.`id`, s.`clienteId`,
       IF(s.`sucursalId` = 'suc_central', 'caja_central', CONCAT('caja_chica_', REPLACE(s.`sucursalId`, 'suc_', ''))),
       s.`sucursalId`,
       COALESCE(p.`cobradoPorId`, s.`vendedorId`, (SELECT u.`id` FROM `users` u WHERE u.`role` = 'ADMINISTRADOR' ORDER BY u.`createdAt` LIMIT 1)),
       COALESCE(p.`cobradoPorId`, s.`vendedorId`, (SELECT u.`id` FROM `users` u WHERE u.`role` = 'ADMINISTRADOR' ORDER BY u.`createdAt` LIMIT 1)),
       p.`at`, p.`at`, NOW(3)
FROM `schedule_payments` p
JOIN `schedules` s ON s.`id` = p.`scheduleId`
WHERE p.`tipo` IN ('adelanto', 'cobro', 'extra_asistencia');

-- The money of a project lives in the project: its jobs keep no amount of their own.
UPDATE `schedules` SET `monto` = 0, `adelanto` = 0, `saldo` = 0 WHERE `projectId` IS NOT NULL;
ALTER TABLE `cash_boxes` ADD CONSTRAINT `cash_boxes_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_cajaId_fkey` FOREIGN KEY (`cajaId`) REFERENCES `cash_boxes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_cajaDestinoId_fkey` FOREIGN KEY (`cajaDestinoId`) REFERENCES `cash_boxes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_reversaDeId_fkey` FOREIGN KEY (`reversaDeId`) REFERENCES `cash_movements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_registradoPorId_fkey` FOREIGN KEY (`registradoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_validadoPorId_fkey` FOREIGN KEY (`validadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
-- ===== END 20261023020000_cash_ledger =====

-- ===== BEGIN 20261023030000_inventory =====
-- INV-01: product catalog and stock movements (stock per branch is computed, never stored); order items may point to a product.
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(40) NOT NULL,
    `nombre` VARCHAR(200) NOT NULL,
    `marca` VARCHAR(100) NOT NULL DEFAULT '',
    `categoriaId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(16) NOT NULL,
    `unidad` VARCHAR(20) NOT NULL DEFAULT 'unidad',
    `costo` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `precio` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `stockMinimo` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_codigo_key`(`codigo`),
    INDEX `products_categoriaId_idx`(`categoriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `stock_movements` (
    `id` VARCHAR(191) NOT NULL,
    `productoId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `cantidad` DECIMAL(12, 2) NOT NULL,
    `costoUnitario` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sucursalOrigenId` VARCHAR(191) NULL,
    `sucursalDestinoId` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `pedidoInternoId` VARCHAR(191) NULL,
    `motivo` TEXT NULL,
    `nota` VARCHAR(500) NOT NULL DEFAULT '',
    `registradoPorId` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_productoId_idx`(`productoId`),
    INDEX `stock_movements_projectId_idx`(`projectId`),
    INDEX `stock_movements_pedidoInternoId_idx`(`pedidoInternoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pedido_interno_items` ADD COLUMN `productoId` VARCHAR(191) NULL;
CREATE INDEX `pedido_interno_items_productoId_idx` ON `pedido_interno_items`(`productoId`);
ALTER TABLE `pedido_interno_items` ADD CONSTRAINT `pedido_interno_items_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `products` ADD CONSTRAINT `products_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `quotation_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_sucursalOrigenId_fkey` FOREIGN KEY (`sucursalOrigenId`) REFERENCES `sucursales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_sucursalDestinoId_fkey` FOREIGN KEY (`sucursalDestinoId`) REFERENCES `sucursales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_pedidoInternoId_fkey` FOREIGN KEY (`pedidoInternoId`) REFERENCES `pedidos_internos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_registradoPorId_fkey` FOREIGN KEY (`registradoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- ===== END 20261023030000_inventory =====

-- ===== BEGIN 20261025000000_movement_custody =====
-- FIN-03: who holds the money of an income until it is validated (rendición). Existing incomes: whoever registered them.
ALTER TABLE `cash_movements` ADD COLUMN `recibidoPorId` VARCHAR(191) NULL;

UPDATE `cash_movements` SET `recibidoPorId` = `registradoPorId` WHERE `tipo` = 'ingreso';

CREATE INDEX `cash_movements_recibidoPorId_idx` ON `cash_movements`(`recibidoPorId`);

ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_recibidoPorId_fkey` FOREIGN KEY (`recibidoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
-- ===== END 20261025000000_movement_custody =====

-- ===== BEGIN 20261025010000_order_requester =====
-- INV-02: who asked for an internal order, apart from who receives it (`responsableId`). Existing orders: the same person.
ALTER TABLE `pedidos_internos` ADD COLUMN `solicitanteId` VARCHAR(191) NULL;

UPDATE `pedidos_internos` SET `solicitanteId` = `responsableId`;

ALTER TABLE `pedidos_internos` MODIFY `solicitanteId` VARCHAR(191) NOT NULL;

CREATE INDEX `pedidos_internos_solicitanteId_idx` ON `pedidos_internos`(`solicitanteId`);

ALTER TABLE `pedidos_internos` ADD CONSTRAINT `pedidos_internos_solicitanteId_fkey` FOREIGN KEY (`solicitanteId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- ===== END 20261025010000_order_requester =====

