-- PRO-01: an approved quotation is a Project (official amount, state, warranty); its jobs point to it.
CREATE TABLE `projects` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `quotationId` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `categoriaId` VARCHAR(191) NOT NULL,
    `sucursalId` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(300) NOT NULL,
    `montoOficial` DECIMAL(12, 2) NOT NULL,
    `estado` VARCHAR(32) NOT NULL DEFAULT 'planificado',
    `motivoAnulacion` TEXT NULL,
    `garantiaMeses` INTEGER NOT NULL DEFAULT 12,
    `entregadoAt` DATETIME(3) NULL,
    `cerradoAt` DATETIME(3) NULL,
    `responsableId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `projects_codigo_key`(`codigo`),
    UNIQUE INDEX `projects_quotationId_key`(`quotationId`),
    INDEX `projects_estado_idx`(`estado`),
    INDEX `projects_clienteId_idx`(`clienteId`),
    INDEX `projects_categoriaId_idx`(`categoriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `schedules` ADD COLUMN `projectId` VARCHAR(191) NULL;
CREATE INDEX `schedules_projectId_idx` ON `schedules`(`projectId`);

-- One project per approved quotation. Its state comes from its jobs: one in progress → en_ejecucion; all cancelled →
-- anulado; all finished or cancelled with at least one finished → entregado (warranty from the last finish); else planificado.
INSERT INTO `projects` (`id`, `codigo`, `quotationId`, `clienteId`, `categoriaId`, `sucursalId`, `titulo`, `montoOficial`,
                        `estado`, `motivoAnulacion`, `entregadoAt`, `createdAt`, `updatedAt`)
SELECT UUID(), REPLACE(q.`numero`, 'COT-', 'PRY-'), q.`id`, q.`clienteId`, q.`categoriaId`, q.`sucursalId`, LEFT(q.`titulo`, 300), q.`monto`,
  CASE
    WHEN EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id` AND s.`estado` = 'en_proceso') THEN 'en_ejecucion'
    WHEN EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id`)
     AND NOT EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id` AND s.`estado` <> 'cancelado') THEN 'anulado'
    WHEN EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id` AND s.`estado` = 'terminado')
     AND NOT EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id` AND s.`estado` IN ('programado', 'en_proceso')) THEN 'entregado'
    ELSE 'planificado'
  END,
  IF(EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id`)
     AND NOT EXISTS (SELECT 1 FROM `schedules` s WHERE s.`quotationId` = q.`id` AND s.`estado` <> 'cancelado'),
     'Migración: todos sus trabajos estaban cancelados', NULL),
  (SELECT MAX(COALESCE(s.`fechaFinalizacion`, s.`updatedAt`)) FROM `schedules` s WHERE s.`quotationId` = q.`id` AND s.`estado` = 'terminado'),
  q.`updatedAt`, NOW(3)
FROM `quotations` q
WHERE q.`estado` = 'aprobado' AND q.`clienteId` IS NOT NULL;

-- A project is delivered only if it was not left in progress or planned.
UPDATE `projects` SET `entregadoAt` = NULL WHERE `estado` <> 'entregado';

UPDATE `schedules` s JOIN `projects` p ON p.`quotationId` = s.`quotationId` SET s.`projectId` = p.`id`;

ALTER TABLE `schedules` ADD CONSTRAINT `schedules_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `projects` ADD CONSTRAINT `projects_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `projects` ADD CONSTRAINT `projects_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `projects` ADD CONSTRAINT `projects_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `quotation_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `projects` ADD CONSTRAINT `projects_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `projects` ADD CONSTRAINT `projects_responsableId_fkey` FOREIGN KEY (`responsableId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
