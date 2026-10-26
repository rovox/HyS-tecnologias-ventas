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
