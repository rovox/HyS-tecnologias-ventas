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
