-- ARCH-01: field-level audit (AuditService.record) and lookup of a record's history (chatter).
ALTER TABLE `activities` ADD COLUMN `detalle` JSON NULL;
CREATE INDEX `activities_entityType_entityId_idx` ON `activities`(`entityType`, `entityId`);
