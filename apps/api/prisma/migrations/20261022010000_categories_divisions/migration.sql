-- CAT-01: the 3 divisions are the mandatory category of quotations and jobs (owner decision 2026-10-22).
-- Before applying in production, review the rows that had no real category (they are moved to seguridad_electronica):
--   SELECT id, numero, titulo, categoriaId FROM quotations
--   WHERE categoriaId NOT IN ('seguridad_electronica', 'insumos_tecnologicos', 'proyectos');

ALTER TABLE `quotation_categories` ADD COLUMN `principal` BOOLEAN NOT NULL DEFAULT false;

INSERT INTO `quotation_categories` (`id`, `label`, `active`, `principal`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
  ('computo_comunicacion', 'Cómputo y comunicación', true, true, 1, NOW(3), NOW(3)),
  ('seguridad_electronica', 'Seguridad electrónica', true, true, 2, NOW(3), NOW(3)),
  ('cableado_estructurado', 'Cableado estructurado', true, true, 3, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `active` = true, `principal` = true, `sortOrder` = VALUES(`sortOrder`);

-- A quotation filed under a user chip keeps that chip as its subcategory.
UPDATE `quotations` q
  JOIN `quotation_categories` c ON c.`id` = q.`categoriaId`
  SET q.`subcategoria` = c.`label`
  WHERE c.`principal` = false AND c.`id` NOT IN ('insumos_tecnologicos', 'proyectos') AND q.`subcategoria` = '';

UPDATE `quotations` SET `categoriaId` = 'computo_comunicacion' WHERE `categoriaId` = 'insumos_tecnologicos';
UPDATE `quotations` SET `categoriaId` = 'cableado_estructurado' WHERE `categoriaId` = 'proyectos';
UPDATE `quotations` SET `categoriaId` = 'seguridad_electronica'
  WHERE `categoriaId` NOT IN ('computo_comunicacion', 'seguridad_electronica', 'cableado_estructurado');

-- The label column duplicated the category: the relation is the only source now.
ALTER TABLE `quotations` DROP COLUMN `categoria`;

-- Jobs: the category replaces `type` (seguridad | proyectos), taken from the quotation when there is one.
ALTER TABLE `schedules` ADD COLUMN `categoriaId` VARCHAR(191) NULL;
UPDATE `schedules` s JOIN `quotations` q ON q.`id` = s.`quotationId` SET s.`categoriaId` = q.`categoriaId`;
UPDATE `schedules` SET `categoriaId` = IF(`type` = 'proyectos', 'cableado_estructurado', 'seguridad_electronica')
  WHERE `categoriaId` IS NULL;
ALTER TABLE `schedules` MODIFY `categoriaId` VARCHAR(191) NOT NULL;
ALTER TABLE `schedules` DROP COLUMN `type`;

-- The old main categories are now divisions.
DELETE FROM `quotation_categories` WHERE `id` IN ('insumos_tecnologicos', 'proyectos');

CREATE INDEX `quotations_categoriaId_idx` ON `quotations`(`categoriaId`);
CREATE INDEX `schedules_categoriaId_idx` ON `schedules`(`categoriaId`);
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `quotation_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `quotation_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
