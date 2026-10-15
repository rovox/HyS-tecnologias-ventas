-- WEB-01: contact-form requests from hstecnologias.com, separate from clients.
CREATE TABLE `solicitudes_web` (
  `id` VARCHAR(191) NOT NULL,
  `nombre` VARCHAR(200) NOT NULL,
  `empresa` VARCHAR(200) NOT NULL DEFAULT '',
  `email` VARCHAR(200) NOT NULL DEFAULT '',
  `telefono` VARCHAR(50) NOT NULL DEFAULT '',
  `departamento` VARCHAR(50) NOT NULL DEFAULT '',
  `servicio` VARCHAR(100) NOT NULL DEFAULT '',
  `detalle` TEXT NOT NULL,
  `origen` VARCHAR(32) NOT NULL DEFAULT 'web',
  `pagina` VARCHAR(500) NOT NULL DEFAULT '',
  `estado` VARCHAR(32) NOT NULL DEFAULT 'nueva',
  `notas` TEXT NOT NULL,
  `clienteId` VARCHAR(191) NULL,
  `convertidaAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `solicitudes_web_estado_idx`(`estado`),
  INDEX `solicitudes_web_email_idx`(`email`),
  INDEX `solicitudes_web_telefono_idx`(`telefono`),
  INDEX `solicitudes_web_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
