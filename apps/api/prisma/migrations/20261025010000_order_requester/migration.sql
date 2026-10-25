-- INV-02: who asked for an internal order, apart from who receives it (`responsableId`). Existing orders: the same person.
ALTER TABLE `pedidos_internos` ADD COLUMN `solicitanteId` VARCHAR(191) NULL;

UPDATE `pedidos_internos` SET `solicitanteId` = `responsableId`;

ALTER TABLE `pedidos_internos` MODIFY `solicitanteId` VARCHAR(191) NOT NULL;

CREATE INDEX `pedidos_internos_solicitanteId_idx` ON `pedidos_internos`(`solicitanteId`);

ALTER TABLE `pedidos_internos` ADD CONSTRAINT `pedidos_internos_solicitanteId_fkey` FOREIGN KEY (`solicitanteId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
