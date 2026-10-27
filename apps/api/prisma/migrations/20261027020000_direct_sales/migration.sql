-- VD-01: direct sales per branch. A sale takes stock out of one branch and its payments are validated at once into
-- the box of their method (cash → the branch's box, QR → caja QR, transfer → banco). Its note has a global number.

-- Branch address (printed on the sale note; one NIT for the whole company).
ALTER TABLE `sucursales` ADD COLUMN `direccion` VARCHAR(255) NOT NULL DEFAULT '';
UPDATE `sucursales` SET `direccion` = 'C. México N° 290 esq. España, Cochabamba' WHERE `id` = 'suc_central';
UPDATE `sucursales` SET `direccion` = 'Calle Ingavi N° 10 entre Avaroa y Tumusla N° 104, Punata' WHERE `id` = 'suc_punata';
UPDATE `sucursales` SET `direccion` = 'Av. General Pando esq. Antofagasta N° 230, Quillacollo' WHERE `id` = 'suc_quillacollo';

-- Boxes for the payments that are not cash.
INSERT IGNORE INTO `cash_boxes` (`id`, `nombre`, `tipo`, `sucursalId`, `active`, `createdAt`, `updatedAt`) VALUES
  ('caja_banco', 'Banco (transferencias)', 'banco', 'suc_central', true, NOW(3), NOW(3)),
  ('caja_qr', 'QR', 'qr', 'suc_central', true, NOW(3), NOW(3));

CREATE TABLE `doc_counters` (
  `id` VARCHAR(32) NOT NULL,
  `valor` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `direct_sales` (
  `id` VARCHAR(191) NOT NULL,
  `numero` INTEGER NOT NULL,
  `sucursalId` VARCHAR(191) NOT NULL,
  `vendedorId` VARCHAR(191) NOT NULL,
  `clienteId` VARCHAR(191) NULL,
  `clienteNombre` VARCHAR(200) NOT NULL,
  `clienteCelular` VARCHAR(40) NOT NULL DEFAULT '',
  `clienteNit` VARCHAR(120) NOT NULL DEFAULT '',
  `subtotal` DECIMAL(12, 2) NOT NULL,
  `descuento` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `total` DECIMAL(12, 2) NOT NULL,
  `estado` VARCHAR(16) NOT NULL DEFAULT 'registrada',
  `motivoAnulacion` TEXT NULL,
  `anuladaPorId` VARCHAR(191) NULL,
  `anuladaAt` DATETIME(3) NULL,
  `reemplazaAId` VARCHAR(191) NULL,
  `notaPdfPath` VARCHAR(500) NOT NULL DEFAULT '',
  `notaAnuladaPdfPath` VARCHAR(500) NOT NULL DEFAULT '',
  `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `direct_sales_numero_key`(`numero`),
  UNIQUE INDEX `direct_sales_reemplazaAId_key`(`reemplazaAId`),
  INDEX `direct_sales_sucursalId_fecha_idx`(`sucursalId`, `fecha`),
  INDEX `direct_sales_vendedorId_idx`(`vendedorId`),
  INDEX `direct_sales_clienteId_idx`(`clienteId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `direct_sale_items` (
  `id` VARCHAR(191) NOT NULL,
  `ventaId` VARCHAR(191) NOT NULL,
  `productoId` VARCHAR(191) NOT NULL,
  `codigo` VARCHAR(40) NOT NULL,
  `descripcion` VARCHAR(300) NOT NULL,
  `unidad` VARCHAR(20) NOT NULL,
  `cantidad` DECIMAL(12, 2) NOT NULL,
  `precioUnitario` DECIMAL(12, 2) NOT NULL,
  `descuento` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  INDEX `direct_sale_items_ventaId_idx`(`ventaId`),
  INDEX `direct_sale_items_productoId_idx`(`productoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `direct_sales` ADD CONSTRAINT `direct_sales_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `direct_sales` ADD CONSTRAINT `direct_sales_vendedorId_fkey` FOREIGN KEY (`vendedorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `direct_sales` ADD CONSTRAINT `direct_sales_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `direct_sales` ADD CONSTRAINT `direct_sales_anuladaPorId_fkey` FOREIGN KEY (`anuladaPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `direct_sales` ADD CONSTRAINT `direct_sales_reemplazaAId_fkey` FOREIGN KEY (`reemplazaAId`) REFERENCES `direct_sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `direct_sale_items` ADD CONSTRAINT `direct_sale_items_ventaId_fkey` FOREIGN KEY (`ventaId`) REFERENCES `direct_sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `direct_sale_items` ADD CONSTRAINT `direct_sale_items_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Stock out and payments of a sale point back to it.
ALTER TABLE `stock_movements` ADD COLUMN `ventaDirectaId` VARCHAR(191) NULL;
CREATE INDEX `stock_movements_ventaDirectaId_idx` ON `stock_movements`(`ventaDirectaId`);
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_ventaDirectaId_fkey` FOREIGN KEY (`ventaDirectaId`) REFERENCES `direct_sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cash_movements` ADD COLUMN `ventaDirectaId` VARCHAR(191) NULL, ADD COLUMN `medioPago` VARCHAR(16) NULL;
CREATE INDEX `cash_movements_ventaDirectaId_idx` ON `cash_movements`(`ventaDirectaId`);
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_ventaDirectaId_fkey` FOREIGN KEY (`ventaDirectaId`) REFERENCES `direct_sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
