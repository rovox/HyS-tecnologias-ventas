-- TSK-01: a task may be about a client; the client is carried into the quotation when the task is converted.
ALTER TABLE `tasks` ADD COLUMN `clienteId` VARCHAR(191) NULL;
CREATE INDEX `tasks_clienteId_idx` ON `tasks`(`clienteId`);
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
-- Tasks taken from a quotation already belong to that quotation's client.
UPDATE `tasks` t JOIN `quotations` q ON q.`id` = t.`cotizacionId` SET t.`clienteId` = q.`clienteId` WHERE t.`clienteId` IS NULL;
