-- Make cotizacionId and sucursalId optional in relevamientos
ALTER TABLE `relevamientos` MODIFY COLUMN `cotizacionId` VARCHAR(191) NULL;
ALTER TABLE `relevamientos` MODIFY COLUMN `sucursalId` VARCHAR(191) NULL;
