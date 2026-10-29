-- DIGI-01: the public catalog of Digicorp (supplier) as an internal reference in Inventario › Tienda Digicorp.
-- Loaded once and refreshed monthly from the public listing; the detail of a product is fetched when someone opens it.

CREATE TABLE `digicorp_productos` (
  `sku` VARCHAR(80) NOT NULL,
  `nombre` VARCHAR(500) NOT NULL,
  `marca` VARCHAR(120) NOT NULL DEFAULT '',
  `imagenUrl` VARCHAR(500) NOT NULL DEFAULT '',
  `imagenGrandeUrl` VARCHAR(500) NOT NULL DEFAULT '',
  `descripcion` TEXT NULL,
  `seccion` VARCHAR(120) NOT NULL DEFAULT '',
  `categoriaCodigo` VARCHAR(20) NOT NULL DEFAULT '',
  `stockTotal` INTEGER NULL,
  `moneda` VARCHAR(8) NOT NULL DEFAULT 'Bs',
  `hash` VARCHAR(64) NOT NULL,
  `vistoAt` DATETIME(3) NOT NULL,
  `detalleAt` DATETIME(3) NULL,
  `retiradoAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `digicorp_productos_marca_idx`(`marca`),
  INDEX `digicorp_productos_retiradoAt_idx`(`retiradoAt`),
  PRIMARY KEY (`sku`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `digicorp_syncs` (
  `id` VARCHAR(191) NOT NULL,
  `iniciadoAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `terminadoAt` DATETIME(3) NULL,
  `estado` VARCHAR(16) NOT NULL DEFAULT 'en_curso',
  `paginas` INTEGER NOT NULL DEFAULT 0,
  `nuevos` INTEGER NOT NULL DEFAULT 0,
  `cambiados` INTEGER NOT NULL DEFAULT 0,
  `retirados` INTEGER NOT NULL DEFAULT 0,
  `error` TEXT NULL,
  `iniciadoPorId` VARCHAR(191) NULL,
  INDEX `digicorp_syncs_iniciadoAt_idx`(`iniciadoAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
