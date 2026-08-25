-- AlterTable
ALTER TABLE `quotations` ADD COLUMN `esLicitacion` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `quotations` ADD COLUMN `licitacionNumero` VARCHAR(120) NULL;
ALTER TABLE `quotations` ADD COLUMN `licitacionEntidad` VARCHAR(200) NULL;
ALTER TABLE `quotations` ADD COLUMN `plazoFinal` DATETIME(3) NULL;
ALTER TABLE `quotations` ADD COLUMN `licitacionArchivos` JSON NULL;
