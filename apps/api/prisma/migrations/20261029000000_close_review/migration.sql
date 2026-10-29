-- LAUNCH P1-3: a close is reviewed with Aprobar or Observar (with a reason), not just "revisado".
ALTER TABLE `cierres_caja` ADD COLUMN `revisionEstado` VARCHAR(16) NULL,
    ADD COLUMN `revisionMotivo` TEXT NULL;

-- Closes already reviewed count as approved.
UPDATE `cierres_caja` SET `revisionEstado` = 'aprobado' WHERE `revisadoAt` IS NOT NULL;
