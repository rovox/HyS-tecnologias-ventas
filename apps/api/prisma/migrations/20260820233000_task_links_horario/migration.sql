-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `cotizacionId` VARCHAR(191) NULL;
ALTER TABLE `tasks` ADD COLUMN `scheduleId` VARCHAR(191) NULL;
ALTER TABLE `tasks` ADD COLUMN `horario` VARCHAR(16) NULL;

-- CreateIndex
CREATE INDEX `tasks_cotizacionId_idx` ON `tasks`(`cotizacionId`);
CREATE INDEX `tasks_scheduleId_idx` ON `tasks`(`scheduleId`);
