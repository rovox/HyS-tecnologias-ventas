-- CreateTable
CREATE TABLE `sucursales` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `sucursales` (`id`, `nombre`, `createdAt`, `updatedAt`) VALUES
('suc_central', 'Central', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('suc_punata', 'Punata', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('suc_quillacollo', 'Quillacollo', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

ALTER TABLE `users` ADD COLUMN `sucursalId` VARCHAR(191) NULL;

UPDATE `users` SET `sucursalId` = 'suc_central' WHERE `id` IN ('usr_admin', 'usr_ventas', 'usr_tec', 'usr_conta');
UPDATE `users` SET `sucursalId` = 'suc_punata' WHERE `id` = 'usr_wilson';
UPDATE `users` SET `sucursalId` = 'suc_quillacollo' WHERE `id` = 'usr_vanesa';
UPDATE `users` SET `sucursalId` = 'suc_central' WHERE `sucursalId` IS NULL;

UPDATE `clients` SET `sucursalId` = 'suc_punata' WHERE `sucursalId` IN ('suc_sur', '');
UPDATE `clients` SET `sucursalId` = 'suc_quillacollo' WHERE `sucursalId` = 'suc_norte';
UPDATE `clients` SET `sucursalId` = 'suc_central' WHERE `sucursalId` IS NULL OR `sucursalId` = '' OR `sucursalId` NOT IN ('suc_central', 'suc_punata', 'suc_quillacollo');

UPDATE `quotations` SET `sucursalId` = 'suc_punata' WHERE `sucursalId` IN ('suc_sur', '');
UPDATE `quotations` SET `sucursalId` = 'suc_quillacollo' WHERE `sucursalId` = 'suc_norte';
UPDATE `quotations` SET `sucursalId` = 'suc_central' WHERE `sucursalId` IS NULL OR `sucursalId` = '' OR `sucursalId` NOT IN ('suc_central', 'suc_punata', 'suc_quillacollo');

ALTER TABLE `quotations` ADD COLUMN `archivoPdfUrl` VARCHAR(191) NOT NULL DEFAULT '';
ALTER TABLE `quotations` ADD COLUMN `motivoRechazo` TEXT NULL;

UPDATE `quotations` SET `estado` = 'aceptado' WHERE `estado` IN ('aceptada', 'convertida');
UPDATE `quotations` SET `estado` = 'enviado' WHERE `estado` = 'enviada';
UPDATE `quotations` SET `estado` = 'rechazado' WHERE `estado` = 'rechazada';
UPDATE `quotations` SET `estado` = 'borrador' WHERE `estado` NOT IN ('borrador', 'enviado', 'aceptado', 'rechazado');

CREATE TABLE `relevamientos` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `sucursalId` VARCHAR(191) NOT NULL,
    `fecha` DATE NOT NULL,
    `lugar` VARCHAR(200) NOT NULL,
    `notas` TEXT NULL,
    `fotosUrl` JSON NULL,
    `cotizacionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `relevamientos_cotizacionId_idx`(`cotizacionId`),
    INDEX `relevamientos_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `seller_goals` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `mes` DATE NOT NULL,
    `metaMonto` DECIMAL(12, 2) NOT NULL,
    `metaCotiz` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `seller_goals_usuarioId_mes_key`(`usuarioId`, `mes`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `users_sucursalId_idx` ON `users`(`sucursalId`);
CREATE INDEX `clients_sucursalId_idx` ON `clients`(`sucursalId`);
CREATE INDEX `quotations_estado_sucursalId_idx` ON `quotations`(`estado`, `sucursalId`);

ALTER TABLE `users` ADD CONSTRAINT `users_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `clients` ADD CONSTRAINT `clients_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `relevamientos` ADD CONSTRAINT `relevamientos_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `relevamientos` ADD CONSTRAINT `relevamientos_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `relevamientos` ADD CONSTRAINT `relevamientos_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `relevamientos` ADD CONSTRAINT `relevamientos_cotizacionId_fkey` FOREIGN KEY (`cotizacionId`) REFERENCES `quotations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `seller_goals` ADD CONSTRAINT `seller_goals_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
