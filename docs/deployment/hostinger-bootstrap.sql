-- One-time Hostinger bootstrap for hys_sales (phpMyAdmin).
-- Run AFTER importing all apps/api/prisma/migrations/*/migration.sql in folder order.
-- Do NOT run prisma seed on the host.
--
-- First admin login (set a strong password offline before import; rotate after first login):
--   email:    admin@hstecnologias.com
--   password: (the one-time password you hashed into passwordHash below — never commit a live production password)
--
-- ADMINISTRADOR is not scoped by sucursalId in the API (sees Central, Punata, Quillacollo).
-- sucursalId on the user row is only a default for creates.
--
-- ON DUPLICATE KEY UPDATE does NOT overwrite passwordHash (avoids resetting a rotated admin).

INSERT INTO `sucursales` (`id`, `nombre`, `createdAt`, `updatedAt`)
VALUES
  ('suc_central', 'Central', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('suc_punata', 'Punata', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('suc_quillacollo', 'Quillacollo', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

INSERT INTO `users` (
  `id`,
  `email`,
  `passwordHash`,
  `name`,
  `role`,
  `phone`,
  `active`,
  `monthlyGoalBs`,
  `sucursalId`,
  `createdAt`,
  `updatedAt`
)
VALUES (
  'usr_admin_hostinger',
  'admin@hstecnologias.com',
  '$2b$10$mZexaaSexbq6vJGmbQY3YOoRiw2DGI.JhIPnOEtHjZTCJzSMQjak6',
  'Administrador',
  'ADMINISTRADOR',
  '',
  true,
  0,
  'suc_central',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `role` = VALUES(`role`),
  `active` = true,
  `sucursalId` = VALUES(`sucursalId`),
  `updatedAt` = CURRENT_TIMESTAMP(3);
