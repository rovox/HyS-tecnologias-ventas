-- Hostinger DB master: schema + bootstrap (empty DB only, phpMyAdmin single import)
-- Do NOT re-import if tables already exist.

-- ===== 20260818120000_init =====
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

-- ===== 20260819120000_sales_registration =====
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

-- ===== 20260819200000_client_activity_tasks =====
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

-- ===== 20260820233000_task_links_horario =====
-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `cotizacionId` VARCHAR(191) NULL;
ALTER TABLE `tasks` ADD COLUMN `scheduleId` VARCHAR(191) NULL;
ALTER TABLE `tasks` ADD COLUMN `horario` VARCHAR(16) NULL;

-- CreateIndex
CREATE INDEX `tasks_cotizacionId_idx` ON `tasks`(`cotizacionId`);
CREATE INDEX `tasks_scheduleId_idx` ON `tasks`(`scheduleId`);

-- ===== 20260821180000_schedules =====
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

-- ===== 20260821210000_quotation_categories =====
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

-- ===== 20260824180000_quotation_licitacion =====
-- AlterTable
ALTER TABLE `quotations` ADD COLUMN `esLicitacion` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `quotations` ADD COLUMN `licitacionNumero` VARCHAR(120) NULL;
ALTER TABLE `quotations` ADD COLUMN `licitacionEntidad` VARCHAR(200) NULL;
ALTER TABLE `quotations` ADD COLUMN `plazoFinal` DATETIME(3) NULL;
ALTER TABLE `quotations` ADD COLUMN `licitacionArchivos` JSON NULL;

-- ===== 20260825120000_quotation_fecha_envio =====
-- AlterTable
ALTER TABLE `quotations` ADD COLUMN `fechaEnvio` DATETIME(3) NULL;

-- ===== 20260825130000_relevamiento_visita_fields =====
-- AlterTable
ALTER TABLE `relevamientos` ADD COLUMN `fechaFin` DATE NULL;
ALTER TABLE `relevamientos` ADD COLUMN `tipoVisita` VARCHAR(32) NOT NULL DEFAULT 'relevamiento';
ALTER TABLE `relevamientos` ADD COLUMN `vendedorId` VARCHAR(191) NULL;
ALTER TABLE `relevamientos` ADD COLUMN `tecnicoId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `relevamientos_vendedorId_idx` ON `relevamientos`(`vendedorId`);
CREATE INDEX `relevamientos_tecnicoId_idx` ON `relevamientos`(`tecnicoId`);

-- ===== 20260825140000_tiene_licitacion =====
-- RenameColumn
ALTER TABLE `quotations` CHANGE `esLicitacion` `tieneLicitacion` BOOLEAN NOT NULL DEFAULT false;

-- ===== 20260825160000_quotation_task_pool =====
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

-- One-time Hostinger bootstrap for hys_sales (phpMyAdmin).
-- Run AFTER importing all apps/api/prisma/migrations/*/migration.sql in folder order.
-- Do NOT run prisma seed on the host.
--
-- First admin login (change password after first login):
--   email:    admin@hstecnologias.com
--   password: HsAdmin2026!
--
-- ADMINISTRADOR is not scoped by sucursalId in the API (sees Central, Punata, Quillacollo).
-- sucursalId on the user row is only a default for creates.

INSERT INTO `sucursales` (`id`, `nombre`, `createdAt`, `updatedAt`)
VALUES
  ('suc_central', 'Central', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('suc_punata', 'Punata', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('suc_quillacollo', 'Quillacollo', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

INSERT INTO `users` (
  `id`,
  `email`,
  `passwordHash`,
  `name`,
  `role`,
  `phone`,
  `active`,
  `monthlyGoalBs`,
  `sucursalId`,
  `createdAt`,
  `updatedAt`
)
VALUES (
  'usr_admin_hostinger',
  'admin@hstecnologias.com',
  '$2b$10$mZexaaSexbq6vJGmbQY3YOoRiw2DGI.JhIPnOEtHjZTCJzSMQjak6',
  'Administrador',
  'ADMINISTRADOR',
  '',
  true,
  0,
  'suc_central',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
)
ON DUPLICATE KEY UPDATE
  `passwordHash` = VALUES(`passwordHash`),
  `name` = VALUES(`name`),
  `role` = VALUES(`role`),
  `active` = true,
  `sucursalId` = VALUES(`sucursalId`),
  `updatedAt` = CURRENT_TIMESTAMP(3);
