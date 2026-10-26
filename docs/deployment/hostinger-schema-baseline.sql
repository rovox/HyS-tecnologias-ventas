-- Hostinger ops baseline: ordered concat of apps/api/prisma/migrations/*/migration.sql
-- For EMPTY MySQL only (phpMyAdmin single import). Does NOT replace Prisma migration folders.
-- After this file, import docs/deployment/hostinger-bootstrap.sql for admin + sucursales.
-- Regenerated from migration folders; do not edit by hand -- re-run concat when adding migrations.
-- Regenerated 2026-10-26 (25 folders, init..order_requester).

-- ===== BEGIN 20260818120000_init =====
-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `monthlyGoalBs` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` VARCHAR(512) NULL,

    INDEX `sessions_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activities_sessionId_idx`(`sessionId`),
    INDEX `activities_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `contacto` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `telefono` VARCHAR(191) NOT NULL DEFAULT '',
    `direccion` VARCHAR(191) NOT NULL DEFAULT '',
    `sucursalId` VARCHAR(191) NOT NULL DEFAULT '',
    `observaciones` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotations` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `categoriaId` VARCHAR(191) NOT NULL,
    `subcategoria` VARCHAR(191) NOT NULL DEFAULT '',
    `sucursalId` VARCHAR(191) NOT NULL DEFAULT '',
    `sucursalNombre` VARCHAR(191) NOT NULL DEFAULT '',
    `clienteId` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'enviada',
    `monto` DECIMAL(12, 2) NOT NULL,
    `observacion` TEXT NOT NULL,
    `archivo` VARCHAR(191) NOT NULL DEFAULT '',
    `vendedorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `quotations_numero_key`(`numero`),
    INDEX `quotations_vendedorId_idx`(`vendedorId`),
    INDEX `quotations_clienteId_idx`(`clienteId`),
    INDEX `quotations_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_sellers` (
    `quotationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL DEFAULT '',
    `commissionPct` DECIMAL(5, 2) NOT NULL,

    PRIMARY KEY (`quotationId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales` (
    `id` VARCHAR(191) NOT NULL,
    `quotationId` VARCHAR(191) NOT NULL,
    `total` DECIMAL(12, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'abierta',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sales_quotationId_key`(`quotationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sale_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `saleId` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'programado',
    `monto` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `asignadoId` VARCHAR(191) NULL,

    INDEX `sale_jobs_saleId_idx`(`saleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sale_payments` (
    `id` VARCHAR(191) NOT NULL,
    `saleId` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `metodo` VARCHAR(191) NOT NULL DEFAULT '',
    `nota` VARCHAR(191) NOT NULL DEFAULT '',
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sale_payments_saleId_idx`(`saleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_vendedorId_fkey` FOREIGN KEY (`vendedorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_sellers` ADD CONSTRAINT `quotation_sellers_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_jobs` ADD CONSTRAINT `sale_jobs_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_payments` ADD CONSTRAINT `sale_payments_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- ===== END 20260818120000_init =====

-- ===== BEGIN 20260819120000_sales_registration =====
-- CreateTable
CREATE TABLE `sucursales` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `sucursales` (`id`, `nombre`, `createdAt`, `updatedAt`) VALUES
('suc_central', 'Central', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('suc_punata', 'Punata', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('suc_quillacollo', 'Quillacollo', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

ALTER TABLE `users` ADD COLUMN `sucursalId` VARCHAR(191) NULL;

UPDATE `users` SET `sucursalId` = 'suc_central' WHERE `id` IN ('usr_admin', 'usr_ventas', 'usr_tec', 'usr_conta');
UPDATE `users` SET `sucursalId` = 'suc_punata' WHERE `id` = 'usr_wilson';
UPDATE `users` SET `sucursalId` = 'suc_quillacollo' WHERE `id` = 'usr_vanesa';
UPDATE `users` SET `sucursalId` = 'suc_central' WHERE `sucursalId` IS NULL;

UPDATE `clients` SET `sucursalId` = 'suc_punata' WHERE `sucursalId` IN ('suc_sur', '');
UPDATE `clients` SET `sucursalId` = 'suc_quillacollo' WHERE `sucursalId` = 'suc_norte';
UPDATE `clients` SET `sucursalId` = 'suc_central' WHERE `sucursalId` IS NULL OR `sucursalId` = '' OR `sucursalId` NOT IN ('suc_central', 'suc_punata', 'suc_quillacollo');

UPDATE `quotations` SET `sucursalId` = 'suc_punata' WHERE `sucursalId` IN ('suc_sur', '');
UPDATE `quotations` SET `sucursalId` = 'suc_quillacollo' WHERE `sucursalId` = 'suc_norte';
UPDATE `quotations` SET `sucursalId` = 'suc_central' WHERE `sucursalId` IS NULL OR `sucursalId` = '' OR `sucursalId` NOT IN ('suc_central', 'suc_punata', 'suc_quillacollo');

ALTER TABLE `quotations` ADD COLUMN `archivoPdfUrl` VARCHAR(191) NOT NULL DEFAULT '';
ALTER TABLE `quotations` ADD COLUMN `motivoRechazo` TEXT NULL;

UPDATE `quotations` SET `estado` = 'aceptado' WHERE `estado` IN ('aceptada', 'convertida');
UPDATE `quotations` SET `estado` = 'enviado' WHERE `estado` = 'enviada';
UPDATE `quotations` SET `estado` = 'rechazado' WHERE `estado` = 'rechazada';
UPDATE `quotations` SET `estado` = 'borrador' WHERE `estado` NOT IN ('borrador', 'enviado', 'aceptado', 'rechazado');

CREATE TABLE `relevamientos` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `sucursalId` VARCHAR(191) NOT NULL,
    `fecha` DATE NOT NULL,
    `lugar` VARCHAR(200) NOT NULL,
    `notas` TEXT NULL,
    `fotosUrl` JSON NULL,
    `cotizacionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `relevamientos_cotizacionId_idx`(`cotizacionId`),
    INDEX `relevamientos_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `seller_goals` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `mes` DATE NOT NULL,
    `metaMonto` DECIMAL(12, 2) NOT NULL,
    `metaCotiz` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `seller_goals_usuarioId_mes_key`(`usuarioId`, `mes`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `users_sucursalId_idx` ON `users`(`sucursalId`);
CREATE INDEX `clients_sucursalId_idx` ON `clients`(`sucursalId`);
CREATE INDEX `quotations_estado_sucursalId_idx` ON `quotations`(`estado`, `sucursalId`);

ALTER TABLE `users` ADD CONSTRAINT `users_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `clients` ADD CONSTRAINT `clients_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `relevamientos` ADD CONSTRAINT `relevamientos_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `relevamientos` ADD CONSTRAINT `relevamientos_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `relevamientos` ADD CONSTRAINT `relevamientos_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `relevamientos` ADD CONSTRAINT `relevamientos_cotizacionId_fkey` FOREIGN KEY (`cotizacionId`) REFERENCES `quotations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `seller_goals` ADD CONSTRAINT `seller_goals_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- ===== END 20260819120000_sales_registration =====

-- ===== BEGIN 20260819200000_client_activity_tasks =====
-- AlterTable
ALTER TABLE `clients` ADD COLUMN `lastActivityAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `clients_nombre_idx` ON `clients`(`nombre`);
CREATE INDEX `clients_telefono_idx` ON `clients`(`telefono`);
CREATE INDEX `clients_email_idx` ON `clients`(`email`);
CREATE INDEX `clients_lastActivityAt_idx` ON `clients`(`lastActivityAt`);

-- CreateTable
CREATE TABLE `tasks` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(200) NOT NULL,
    `descripcion` TEXT NULL,
    `sucursalId` VARCHAR(191) NOT NULL,
    `creadorId` VARCHAR(191) NOT NULL,
    `asignadoId` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'pendiente',
    `prioridad` VARCHAR(191) NOT NULL DEFAULT 'media',
    `plazo` DATETIME(3) NULL,
    `archivosUrl` JSON NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tasks_sucursalId_estado_idx`(`sucursalId`, `estado`),
    INDEX `tasks_asignadoId_idx`(`asignadoId`),
    INDEX `tasks_creadorId_idx`(`creadorId`),
    INDEX `tasks_completedAt_idx`(`completedAt`),
    INDEX `tasks_plazo_idx`(`plazo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `tasks` ADD CONSTRAINT `tasks_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_creadorId_fkey` FOREIGN KEY (`creadorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_asignadoId_fkey` FOREIGN KEY (`asignadoId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
-- ===== END 20260819200000_client_activity_tasks =====

-- ===== BEGIN 20260820233000_task_links_horario =====
-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `cotizacionId` VARCHAR(191) NULL;
ALTER TABLE `tasks` ADD COLUMN `scheduleId` VARCHAR(191) NULL;
ALTER TABLE `tasks` ADD COLUMN `horario` VARCHAR(16) NULL;

-- CreateIndex
CREATE INDEX `tasks_cotizacionId_idx` ON `tasks`(`cotizacionId`);
CREATE INDEX `tasks_scheduleId_idx` ON `tasks`(`scheduleId`);
-- ===== END 20260820233000_task_links_horario =====

-- ===== BEGIN 20260821180000_schedules =====
-- Cleanup orphan task links before FK
UPDATE `tasks` SET `scheduleId` = NULL WHERE `scheduleId` IS NOT NULL;

-- CreateTable (if partial apply left empty table, drop first)
DROP TABLE IF EXISTS `schedules`;

CREATE TABLE `schedules` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(32) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `lugar` VARCHAR(300) NOT NULL DEFAULT '',
    `descripcionTrabajo` TEXT NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `adelanto` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `saldo` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `fechaProgramada` DATETIME(3) NOT NULL,
    `horario` VARCHAR(32) NULL,
    `fechaFinalizacion` DATETIME(3) NULL,
    `estado` VARCHAR(32) NOT NULL DEFAULT 'programado',
    `sucursalId` VARCHAR(191) NOT NULL,
    `vendedorId` VARCHAR(191) NULL,
    `tecnicoId` VARCHAR(191) NULL,
    `quotationId` VARCHAR(191) NULL,
    `observaciones` TEXT NOT NULL,
    `mapsLink` VARCHAR(500) NOT NULL DEFAULT '',
    `fotosUrl` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `schedules_fechaProgramada_idx`(`fechaProgramada`),
    INDEX `schedules_sucursalId_estado_idx`(`sucursalId`, `estado`),
    INDEX `schedules_tecnicoId_idx`(`tecnicoId`),
    INDEX `schedules_vendedorId_idx`(`vendedorId`),
    INDEX `schedules_clienteId_idx`(`clienteId`),
    INDEX `schedules_quotationId_idx`(`quotationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `schedules` ADD CONSTRAINT `schedules_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_vendedorId_fkey` FOREIGN KEY (`vendedorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_tecnicoId_fkey` FOREIGN KEY (`tecnicoId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `tasks` ADD CONSTRAINT `tasks_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `activities_at_idx` ON `activities`(`at`);
CREATE INDEX `quotations_estado_createdAt_idx` ON `quotations`(`estado`, `createdAt`);
CREATE INDEX `relevamientos_sucursalId_fecha_idx` ON `relevamientos`(`sucursalId`, `fecha`);
CREATE INDEX `seller_goals_mes_idx` ON `seller_goals`(`mes`);
-- ===== END 20260821180000_schedules =====

-- ===== BEGIN 20260821210000_quotation_categories =====
-- CreateTable
CREATE TABLE `quotation_categories` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `quotation_categories_label_key`(`label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ===== END 20260821210000_quotation_categories =====

-- ===== BEGIN 20260824180000_quotation_licitacion =====
-- AlterTable
ALTER TABLE `quotations` ADD COLUMN `esLicitacion` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `quotations` ADD COLUMN `licitacionNumero` VARCHAR(120) NULL;
ALTER TABLE `quotations` ADD COLUMN `licitacionEntidad` VARCHAR(200) NULL;
ALTER TABLE `quotations` ADD COLUMN `plazoFinal` DATETIME(3) NULL;
ALTER TABLE `quotations` ADD COLUMN `licitacionArchivos` JSON NULL;
-- ===== END 20260824180000_quotation_licitacion =====

-- ===== BEGIN 20260825120000_quotation_fecha_envio =====
-- AlterTable
ALTER TABLE `quotations` ADD COLUMN `fechaEnvio` DATETIME(3) NULL;
-- ===== END 20260825120000_quotation_fecha_envio =====

-- ===== BEGIN 20260825130000_relevamiento_visita_fields =====
-- AlterTable
ALTER TABLE `relevamientos` ADD COLUMN `fechaFin` DATE NULL;
ALTER TABLE `relevamientos` ADD COLUMN `tipoVisita` VARCHAR(32) NOT NULL DEFAULT 'relevamiento';
ALTER TABLE `relevamientos` ADD COLUMN `vendedorId` VARCHAR(191) NULL;
ALTER TABLE `relevamientos` ADD COLUMN `tecnicoId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `relevamientos_vendedorId_idx` ON `relevamientos`(`vendedorId`);
CREATE INDEX `relevamientos_tecnicoId_idx` ON `relevamientos`(`tecnicoId`);
-- ===== END 20260825130000_relevamiento_visita_fields =====

-- ===== BEGIN 20260825140000_tiene_licitacion =====
-- RenameColumn
ALTER TABLE `quotations` CHANGE `esLicitacion` `tieneLicitacion` BOOLEAN NOT NULL DEFAULT false;
-- ===== END 20260825140000_tiene_licitacion =====

-- ===== BEGIN 20260825160000_quotation_task_pool =====
-- Catálogo fijo de sucursales (no es seed de demos)
INSERT INTO `sucursales` (`id`, `nombre`, `createdAt`, `updatedAt`)
VALUES
  ('suc_central', 'Central', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('suc_punata', 'Punata', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('suc_quillacollo', 'Quillacollo', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Cotización puede publicarse sin cliente (tarea rápida)
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_clienteId_fkey`;
ALTER TABLE `quotations` MODIFY `clienteId` VARCHAR(191) NULL;
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Pool de tareas de cotización
ALTER TABLE `tasks` ADD COLUMN `tipo` VARCHAR(32) NOT NULL DEFAULT 'operativa';
ALTER TABLE `tasks` ADD COLUMN `prioridadMotivo` TEXT NULL;
ALTER TABLE `tasks` ADD COLUMN `asignadoAt` DATETIME(3) NULL;
ALTER TABLE `tasks` ADD COLUMN `asignadoPorId` VARCHAR(191) NULL;

UPDATE `tasks` SET `cotizacionId` = NULL
WHERE `cotizacionId` IS NOT NULL
  AND `cotizacionId` NOT IN (SELECT `id` FROM `quotations`);

ALTER TABLE `tasks` ADD CONSTRAINT `tasks_asignadoPorId_fkey` FOREIGN KEY (`asignadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_cotizacionId_fkey` FOREIGN KEY (`cotizacionId`) REFERENCES `quotations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `tasks_tipo_asignadoId_idx` ON `tasks`(`tipo`, `asignadoId`);
CREATE INDEX `tasks_tipo_estado_idx` ON `tasks`(`tipo`, `estado`);
-- ===== END 20260825160000_quotation_task_pool =====

-- ===== BEGIN 20260911200000_relevamiento_estado_schedule_payments =====
-- AlterTable Relevamiento: estado + prioridad
ALTER TABLE `relevamientos` ADD COLUMN `estado` VARCHAR(32) NOT NULL DEFAULT 'programado';
ALTER TABLE `relevamientos` ADD COLUMN `prioridad` VARCHAR(16) NOT NULL DEFAULT 'media';
CREATE INDEX `relevamientos_sucursalId_estado_idx` ON `relevamientos`(`sucursalId`, `estado`);

-- CreateTable schedule_payments
CREATE TABLE `schedule_payments` (
    `id` VARCHAR(191) NOT NULL,
    `scheduleId` VARCHAR(191) NULL,
    `relevamientoId` VARCHAR(191) NULL,
    `quotationId` VARCHAR(191) NULL,
    `tipo` VARCHAR(32) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `metodo` VARCHAR(64) NOT NULL DEFAULT '',
    `nota` TEXT NOT NULL,
    `cobradoPorId` VARCHAR(191) NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `schedule_payments_scheduleId_idx` ON `schedule_payments`(`scheduleId`);
CREATE INDEX `schedule_payments_relevamientoId_idx` ON `schedule_payments`(`relevamientoId`);
CREATE INDEX `schedule_payments_quotationId_idx` ON `schedule_payments`(`quotationId`);
CREATE INDEX `schedule_payments_tipo_idx` ON `schedule_payments`(`tipo`);

ALTER TABLE `schedule_payments` ADD CONSTRAINT `schedule_payments_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `schedule_payments` ADD CONSTRAINT `schedule_payments_relevamientoId_fkey` FOREIGN KEY (`relevamientoId`) REFERENCES `relevamientos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `schedule_payments` ADD CONSTRAINT `schedule_payments_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `schedule_payments` ADD CONSTRAINT `schedule_payments_cobradoPorId_fkey` FOREIGN KEY (`cobradoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
-- ===== END 20260911200000_relevamiento_estado_schedule_payments =====

-- ===== BEGIN 20260922000000_remove_contadora_role =====
-- Migrate all users with legacy 'Contadora' role to 'ADMINISTRADOR'
UPDATE `users` SET `role` = 'ADMINISTRADOR' WHERE `role` = 'Contadora';
-- ===== END 20260922000000_remove_contadora_role =====

-- ===== BEGIN 20260923000000_relevamiento_cotizacion_optional =====
-- Make cotizacionId and sucursalId optional in relevamientos
ALTER TABLE `relevamientos` MODIFY COLUMN `cotizacionId` VARCHAR(191) NULL;
ALTER TABLE `relevamientos` MODIFY COLUMN `sucursalId` VARCHAR(191) NULL;
-- ===== END 20260923000000_relevamiento_cotizacion_optional =====

-- ===== BEGIN 20260923010000_pedidos_internos =====
CREATE TABLE `pedidos_internos` (
  `id` VARCHAR(191) NOT NULL,
  `responsableId` VARCHAR(191) NOT NULL,
  `sucursalOrigenId` VARCHAR(191) NULL,
  `sucursalDestinoId` VARCHAR(191) NULL,
  `cronogramaId` VARCHAR(191) NULL,
  `prioridad` VARCHAR(16) NOT NULL DEFAULT 'Normal',
  `estado` VARCHAR(32) NOT NULL DEFAULT 'solicitado',
  `fechaEntregaEstimada` DATETIME(3) NULL,
  `fechaEntregaReal` DATETIME(3) NULL,
  `entregadoPorId` VARCHAR(191) NULL,
  `observaciones` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `pedidos_internos_responsableId_idx`(`responsableId`),
  INDEX `pedidos_internos_estado_idx`(`estado`),
  INDEX `pedidos_internos_sucursalOrigenId_idx`(`sucursalOrigenId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pedido_interno_items` (
  `id` VARCHAR(191) NOT NULL,
  `pedidoId` VARCHAR(191) NOT NULL,
  `materialNombre` VARCHAR(200) NOT NULL,
  `cantidad` DOUBLE NOT NULL DEFAULT 1,
  `unidad` VARCHAR(32) NOT NULL DEFAULT 'unidades',
  `costoUnitario` DOUBLE NULL,
  `observaciones` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `pedido_interno_items_pedidoId_idx`(`pedidoId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `pedido_interno_items_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos_internos` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pedido_interno_comentarios` (
  `id` VARCHAR(191) NOT NULL,
  `pedidoId` VARCHAR(191) NOT NULL,
  `autorId` VARCHAR(191) NOT NULL,
  `contenido` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `pedido_interno_comentarios_pedidoId_idx`(`pedidoId`),
  INDEX `pedido_interno_comentarios_autorId_idx`(`autorId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `pedido_interno_comentarios_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos_internos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pedido_interno_comentarios_autorId_fkey` FOREIGN KEY (`autorId`) REFERENCES `users` (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pedidos_internos` ADD CONSTRAINT `pedidos_internos_responsableId_fkey` FOREIGN KEY (`responsableId`) REFERENCES `users` (`id`);
ALTER TABLE `pedidos_internos` ADD CONSTRAINT `pedidos_internos_sucursalOrigenId_fkey` FOREIGN KEY (`sucursalOrigenId`) REFERENCES `sucursales` (`id`) ON DELETE SET NULL;
-- ===== END 20260923010000_pedidos_internos =====

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

