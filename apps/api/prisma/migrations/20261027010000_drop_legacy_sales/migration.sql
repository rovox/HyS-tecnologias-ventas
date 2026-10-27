-- CLEAN-01 (owner approved 2026-10-27): the frozen sales model and the old job payments are gone. Money lives in
-- cash_movements (ledger); a job's paid and owed amounts are computed from it, so schedules.adelanto/saldo go too.
-- Direct sales (VD-01) get their own tables.
DROP TABLE `sale_payments`;
DROP TABLE `sale_jobs`;
DROP TABLE `sales`;
DROP TABLE `schedule_payments`;
ALTER TABLE `schedules` DROP COLUMN `adelanto`, DROP COLUMN `saldo`;
