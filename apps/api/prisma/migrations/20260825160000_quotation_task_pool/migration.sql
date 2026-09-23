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
