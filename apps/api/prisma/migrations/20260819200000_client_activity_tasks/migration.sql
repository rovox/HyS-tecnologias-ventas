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
