-- FIN-03: who holds the money of an income until it is validated (rendición). Existing incomes: whoever registered them.
ALTER TABLE `cash_movements` ADD COLUMN `recibidoPorId` VARCHAR(191) NULL;

UPDATE `cash_movements` SET `recibidoPorId` = `registradoPorId` WHERE `tipo` = 'ingreso';

CREATE INDEX `cash_movements_recibidoPorId_idx` ON `cash_movements`(`recibidoPorId`);

ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_recibidoPorId_fkey` FOREIGN KEY (`recibidoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
