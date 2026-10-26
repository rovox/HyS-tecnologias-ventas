-- SUR-02: what the visit form already asked for is kept (it was dropped by the API); location links on clients and
-- visits; a visit links the job it revisits (warranty) and the payment taken on it (ledger, not columns).
ALTER TABLE `relevamientos`
  ADD COLUMN `hora` VARCHAR(16) NULL,
  ADD COLUMN `mapsLink` VARCHAR(500) NOT NULL DEFAULT '',
  ADD COLUMN `motivo` VARCHAR(200) NOT NULL DEFAULT '',
  ADD COLUMN `problemaReportado` TEXT NULL,
  ADD COLUMN `equipoAfectado` VARCHAR(200) NOT NULL DEFAULT '',
  ADD COLUMN `causaProbable` TEXT NULL,
  ADD COLUMN `diagnostico` TEXT NULL,
  ADD COLUMN `solucion` TEXT NULL,
  ADD COLUMN `necesidadCliente` TEXT NULL,
  ADD COLUMN `areaRevisar` VARCHAR(200) NOT NULL DEFAULT '',
  ADD COLUMN `medidasPuntos` TEXT NULL,
  ADD COLUMN `cantidadEstimada` INTEGER NULL,
  ADD COLUMN `observacionTecnica` TEXT NULL,
  ADD COLUMN `observacionFinal` TEXT NULL,
  ADD COLUMN `requiereMaterial` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `requiereCotizacion` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `requiereVolver` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `trabajoRelacionadoId` VARCHAR(191) NULL,
  ADD COLUMN `garantiaHasta` DATE NULL,
  ADD COLUMN `motivoCancelacion` TEXT NULL;
CREATE INDEX `relevamientos_trabajoRelacionadoId_idx` ON `relevamientos`(`trabajoRelacionadoId`);
ALTER TABLE `relevamientos` ADD CONSTRAINT `relevamientos_trabajoRelacionadoId_fkey` FOREIGN KEY (`trabajoRelacionadoId`) REFERENCES `schedules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `clients` ADD COLUMN `mapsLink` VARCHAR(500) NOT NULL DEFAULT '';

ALTER TABLE `cash_movements` ADD COLUMN `relevamientoId` VARCHAR(191) NULL;
CREATE INDEX `cash_movements_relevamientoId_idx` ON `cash_movements`(`relevamientoId`);
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_relevamientoId_fkey` FOREIGN KEY (`relevamientoId`) REFERENCES `relevamientos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
