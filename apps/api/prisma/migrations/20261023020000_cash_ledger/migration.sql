-- FIN-01: one money ledger (cash_movements) validated into cash boxes; it replaces schedule_payments as the source of truth.
CREATE TABLE `cash_boxes` (
    `id` VARCHAR(64) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `tipo` VARCHAR(32) NOT NULL,
    `sucursalId` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cash_movements` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(16) NOT NULL,
    `concepto` VARCHAR(40) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metodo` VARCHAR(40) NOT NULL DEFAULT '',
    `nota` VARCHAR(500) NOT NULL DEFAULT '',
    `estado` VARCHAR(16) NOT NULL DEFAULT 'por_validar',
    `motivo` TEXT NULL,
    `projectId` VARCHAR(191) NULL,
    `scheduleId` VARCHAR(191) NULL,
    `clienteId` VARCHAR(191) NULL,
    `cajaId` VARCHAR(64) NULL,
    `cajaDestinoId` VARCHAR(64) NULL,
    `pagadoPor` VARCHAR(16) NULL,
    `reembolsadoAt` DATETIME(3) NULL,
    `comprobanteUrl` VARCHAR(500) NULL,
    `reversaDeId` VARCHAR(191) NULL,
    `sucursalId` VARCHAR(191) NOT NULL,
    `registradoPorId` VARCHAR(191) NOT NULL,
    `validadoPorId` VARCHAR(191) NULL,
    `validadoAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cash_movements_reversaDeId_key`(`reversaDeId`),
    INDEX `cash_movements_estado_idx`(`estado`),
    INDEX `cash_movements_projectId_idx`(`projectId`),
    INDEX `cash_movements_scheduleId_idx`(`scheduleId`),
    INDEX `cash_movements_clienteId_idx`(`clienteId`),
    INDEX `cash_movements_cajaId_idx`(`cajaId`),
    INDEX `cash_movements_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Owner decision: one central box in Cochabamba and a petty cash per branch.
INSERT INTO `cash_boxes` (`id`, `nombre`, `tipo`, `sucursalId`, `active`, `createdAt`, `updatedAt`)
SELECT IF(s.`id` = 'suc_central', 'caja_central', CONCAT('caja_chica_', REPLACE(s.`id`, 'suc_', ''))),
       IF(s.`id` = 'suc_central', 'Caja central Cochabamba', CONCAT('Caja chica ', s.`nombre`)),
       IF(s.`id` = 'suc_central', 'caja', 'caja_chica'),
       s.`id`, true, NOW(3), NOW(3)
FROM `sucursales` s;

-- Every job payment becomes a validated income in its branch's box (all current data is test data). Forgiven debt
-- (descuento) is not money: a cancelled job or project simply owes nothing now.
INSERT INTO `cash_movements` (`id`, `tipo`, `concepto`, `monto`, `fecha`, `metodo`, `nota`, `estado`, `projectId`, `scheduleId`,
                              `clienteId`, `cajaId`, `sucursalId`, `registradoPorId`, `validadoPorId`, `validadoAt`, `createdAt`, `updatedAt`)
SELECT p.`id`, 'ingreso', IF(p.`tipo` = 'extra_asistencia', 'adicional', p.`tipo`), p.`monto`, p.`at`, p.`metodo`, p.`nota`, 'validado',
       s.`projectId`, s.`id`, s.`clienteId`,
       IF(s.`sucursalId` = 'suc_central', 'caja_central', CONCAT('caja_chica_', REPLACE(s.`sucursalId`, 'suc_', ''))),
       s.`sucursalId`,
       COALESCE(p.`cobradoPorId`, s.`vendedorId`, (SELECT u.`id` FROM `users` u WHERE u.`role` = 'ADMINISTRADOR' ORDER BY u.`createdAt` LIMIT 1)),
       COALESCE(p.`cobradoPorId`, s.`vendedorId`, (SELECT u.`id` FROM `users` u WHERE u.`role` = 'ADMINISTRADOR' ORDER BY u.`createdAt` LIMIT 1)),
       p.`at`, p.`at`, NOW(3)
FROM `schedule_payments` p
JOIN `schedules` s ON s.`id` = p.`scheduleId`
WHERE p.`tipo` IN ('adelanto', 'cobro', 'extra_asistencia');

-- The money of a project lives in the project: its jobs keep no amount of their own.
UPDATE `schedules` SET `monto` = 0, `adelanto` = 0, `saldo` = 0 WHERE `projectId` IS NOT NULL;
ALTER TABLE `cash_boxes` ADD CONSTRAINT `cash_boxes_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_cajaId_fkey` FOREIGN KEY (`cajaId`) REFERENCES `cash_boxes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_cajaDestinoId_fkey` FOREIGN KEY (`cajaDestinoId`) REFERENCES `cash_boxes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_reversaDeId_fkey` FOREIGN KEY (`reversaDeId`) REFERENCES `cash_movements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_registradoPorId_fkey` FOREIGN KEY (`registradoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_validadoPorId_fkey` FOREIGN KEY (`validadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
