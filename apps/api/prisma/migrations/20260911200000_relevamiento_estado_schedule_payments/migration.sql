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
