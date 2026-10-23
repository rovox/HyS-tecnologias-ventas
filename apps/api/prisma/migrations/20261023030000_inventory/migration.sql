-- INV-01: product catalog and stock movements (stock per branch is computed, never stored); order items may point to a product.
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(40) NOT NULL,
    `nombre` VARCHAR(200) NOT NULL,
    `marca` VARCHAR(100) NOT NULL DEFAULT '',
    `categoriaId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(16) NOT NULL,
    `unidad` VARCHAR(20) NOT NULL DEFAULT 'unidad',
    `costo` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `precio` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `stockMinimo` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_codigo_key`(`codigo`),
    INDEX `products_categoriaId_idx`(`categoriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `stock_movements` (
    `id` VARCHAR(191) NOT NULL,
    `productoId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `cantidad` DECIMAL(12, 2) NOT NULL,
    `costoUnitario` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sucursalOrigenId` VARCHAR(191) NULL,
    `sucursalDestinoId` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `pedidoInternoId` VARCHAR(191) NULL,
    `motivo` TEXT NULL,
    `nota` VARCHAR(500) NOT NULL DEFAULT '',
    `registradoPorId` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_productoId_idx`(`productoId`),
    INDEX `stock_movements_projectId_idx`(`projectId`),
    INDEX `stock_movements_pedidoInternoId_idx`(`pedidoInternoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pedido_interno_items` ADD COLUMN `productoId` VARCHAR(191) NULL;
CREATE INDEX `pedido_interno_items_productoId_idx` ON `pedido_interno_items`(`productoId`);
ALTER TABLE `pedido_interno_items` ADD CONSTRAINT `pedido_interno_items_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `products` ADD CONSTRAINT `products_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `quotation_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_sucursalOrigenId_fkey` FOREIGN KEY (`sucursalOrigenId`) REFERENCES `sucursales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_sucursalDestinoId_fkey` FOREIGN KEY (`sucursalDestinoId`) REFERENCES `sucursales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_pedidoInternoId_fkey` FOREIGN KEY (`pedidoInternoId`) REFERENCES `pedidos_internos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_registradoPorId_fkey` FOREIGN KEY (`registradoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
