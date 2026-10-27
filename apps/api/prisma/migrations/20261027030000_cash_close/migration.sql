-- FIN-04: daily cash close per branch (no shifts, owner 2026-10-27) and funds handed out to be accounted for.

CREATE TABLE `cierres_caja` (
  `id` VARCHAR(191) NOT NULL,
  `sucursalId` VARCHAR(191) NOT NULL,
  `cajaId` VARCHAR(64) NOT NULL,
  `dia` VARCHAR(10) NOT NULL,
  `saldoInicial` DECIMAL(12, 2) NOT NULL,
  `ingresosEfectivo` DECIMAL(12, 2) NOT NULL,
  `egresosEfectivo` DECIMAL(12, 2) NOT NULL,
  `efectivoEsperado` DECIMAL(12, 2) NOT NULL,
  `conteo` JSON NOT NULL,
  `efectivoContado` DECIMAL(12, 2) NOT NULL,
  `diferencia` DECIMAL(12, 2) NOT NULL,
  `motivoDiferencia` TEXT NULL,
  `totalQr` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `totalTransferencia` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `ventasCantidad` INTEGER NOT NULL DEFAULT 0,
  `ventasTotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `observaciones` TEXT NULL,
  `cerradoPorId` VARCHAR(191) NOT NULL,
  `cerradoAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `revisadoPorId` VARCHAR(191) NULL,
  `revisadoAt` DATETIME(3) NULL,
  `diferenciaMovimientoId` VARCHAR(191) NULL,
  UNIQUE INDEX `cierres_caja_sucursalId_dia_key`(`sucursalId`, `dia`),
  UNIQUE INDEX `cierres_caja_diferenciaMovimientoId_key`(`diferenciaMovimientoId`),
  INDEX `cierres_caja_dia_idx`(`dia`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `cierres_caja` ADD CONSTRAINT `cierres_caja_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cierres_caja` ADD CONSTRAINT `cierres_caja_cajaId_fkey` FOREIGN KEY (`cajaId`) REFERENCES `cash_boxes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cierres_caja` ADD CONSTRAINT `cierres_caja_cerradoPorId_fkey` FOREIGN KEY (`cerradoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cierres_caja` ADD CONSTRAINT `cierres_caja_revisadoPorId_fkey` FOREIGN KEY (`revisadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cierres_caja` ADD CONSTRAINT `cierres_caja_diferenciaMovimientoId_fkey` FOREIGN KEY (`diferenciaMovimientoId`) REFERENCES `cash_movements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Funds handed to someone to be accounted for later (anticipo por rendir): subject, deadline and when it was settled.
ALTER TABLE `cash_movements` ADD COLUMN `asunto` VARCHAR(200) NULL, ADD COLUMN `fechaLimite` DATETIME(3) NULL, ADD COLUMN `rendidoAt` DATETIME(3) NULL;
