-- AlterTable
ALTER TABLE `relevamientos` ADD COLUMN `fechaFin` DATE NULL;
ALTER TABLE `relevamientos` ADD COLUMN `tipoVisita` VARCHAR(32) NOT NULL DEFAULT 'relevamiento';
ALTER TABLE `relevamientos` ADD COLUMN `vendedorId` VARCHAR(191) NULL;
ALTER TABLE `relevamientos` ADD COLUMN `tecnicoId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `relevamientos_vendedorId_idx` ON `relevamientos`(`vendedorId`);
CREATE INDEX `relevamientos_tecnicoId_idx` ON `relevamientos`(`tecnicoId`);
