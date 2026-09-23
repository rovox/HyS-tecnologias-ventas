CREATE TABLE `pedidos_internos` (
  `id` VARCHAR(191) NOT NULL,
  `responsableId` VARCHAR(191) NOT NULL,
  `sucursalOrigenId` VARCHAR(191) NULL,
  `sucursalDestinoId` VARCHAR(191) NULL,
  `cronogramaId` VARCHAR(191) NULL,
  `prioridad` VARCHAR(16) NOT NULL DEFAULT 'Normal',
  `estado` VARCHAR(32) NOT NULL DEFAULT 'solicitado',
  `fechaEntregaEstimada` DATETIME(3) NULL,
  `fechaEntregaReal` DATETIME(3) NULL,
  `entregadoPorId` VARCHAR(191) NULL,
  `observaciones` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `pedidos_internos_responsableId_idx`(`responsableId`),
  INDEX `pedidos_internos_estado_idx`(`estado`),
  INDEX `pedidos_internos_sucursalOrigenId_idx`(`sucursalOrigenId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pedido_interno_items` (
  `id` VARCHAR(191) NOT NULL,
  `pedidoId` VARCHAR(191) NOT NULL,
  `materialNombre` VARCHAR(200) NOT NULL,
  `cantidad` DOUBLE NOT NULL DEFAULT 1,
  `unidad` VARCHAR(32) NOT NULL DEFAULT 'unidades',
  `costoUnitario` DOUBLE NULL,
  `observaciones` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `pedido_interno_items_pedidoId_idx`(`pedidoId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `pedido_interno_items_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos_internos` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pedido_interno_comentarios` (
  `id` VARCHAR(191) NOT NULL,
  `pedidoId` VARCHAR(191) NOT NULL,
  `autorId` VARCHAR(191) NOT NULL,
  `contenido` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `pedido_interno_comentarios_pedidoId_idx`(`pedidoId`),
  INDEX `pedido_interno_comentarios_autorId_idx`(`autorId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `pedido_interno_comentarios_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos_internos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pedido_interno_comentarios_autorId_fkey` FOREIGN KEY (`autorId`) REFERENCES `users` (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pedidos_internos` ADD CONSTRAINT `pedidos_internos_responsableId_fkey` FOREIGN KEY (`responsableId`) REFERENCES `users` (`id`);
ALTER TABLE `pedidos_internos` ADD CONSTRAINT `pedidos_internos_sucursalOrigenId_fkey` FOREIGN KEY (`sucursalOrigenId`) REFERENCES `sucursales` (`id`) ON DELETE SET NULL;
