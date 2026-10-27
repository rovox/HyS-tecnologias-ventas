-- TSK-03: tasks are transient. A completed or discarded task leaves the list (archived) and is purged 30 days later.
ALTER TABLE `tasks` ADD COLUMN `archivadaAt` DATETIME(3) NULL;
CREATE INDEX `tasks_archivadaAt_idx` ON `tasks`(`archivadaAt`);
-- Tasks already closed are archived from when they were closed.
UPDATE `tasks` SET `archivadaAt` = COALESCE(`completedAt`, `updatedAt`) WHERE `estado` <> 'pendiente';
