-- Production users for Hostinger MySQL (phpMyAdmin).
-- Do NOT run prisma db seed on the host.
-- Import once after schema + bootstrap sucursales.
-- ON DUPLICATE KEY UPDATE does NOT overwrite passwordHash.
--
-- Roles map to existing app strings (not lowercase labels from the brief).
-- users.sucursalId is a create-default only; Ventas are not scoped by it in the API.
--
-- Passwords (bcrypt cost 10) — rotate after first login if needed:
--   vanessa@hscontrol.com / vanessa1490
--   marcelo@hscontrol.com / marcelo6970
--   wilson@hscontrol.com  / wilson8639
--   ronald@hscontrol.com  / ronald7980
--   rodrigo@hscontrol.com / rodrigo7460
--   stephany@hscontrol.com / stephany2570
--   julio@hscontrol.com   / julio2026
--   mavel@hscontrol.com   / mavel2023

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
VALUES
  ('usr_vanessa', 'vanessa@hscontrol.com', '$2b$10$CI2rM86Rza3r9vX7WKZ.xumdPDEEFM7M0x2sCKy3JwzVaUZNFmyAe', 'Vanessa', 'VENTAS / ADMINISTRACIÓN', '', true, 0, 'suc_punata', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('usr_marcelo', 'marcelo@hscontrol.com', '$2b$10$sE3a/ZWO5WRoUlSLFev./uTTBbS0fmRXoOTbyLBEG7/8kTHz8IPm6', 'Marcelo', 'SIN ACCESO', '', true, 0, 'suc_central', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('usr_wilson', 'wilson@hscontrol.com', '$2b$10$hwzYRwHpVBTXyoTosbHOZeL7s71wPsNUGa0po2mKAjSEG7abM1Dzm', 'Wilson', 'VENTAS / ADMINISTRACIÓN', '', true, 0, 'suc_quillacollo', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('usr_ronald', 'ronald@hscontrol.com', '$2b$10$zsl7RiCSkcbllB7c87EZQei8DhCsKW2t2sEmvzUZ3jzCFc8HbLwoy', 'Ronald', 'SIN ACCESO', '', true, 0, 'suc_central', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('usr_rodrigo', 'rodrigo@hscontrol.com', '$2b$10$f/ifcKNbBmPSSgpeLG/Ppuw9BmnlrnT.kpIC.CE6HeT9CfbHEGAhm', 'Rodrigo', 'SIN ACCESO', '', true, 0, 'suc_central', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('usr_stephany', 'stephany@hscontrol.com', '$2b$10$AWnk8ps9rxk/zNUaKQrzFu/Kn0BOnkZgEOkdOlNXG1Y14/espLC.u', 'Stephany', 'Contadora', '', true, 0, 'suc_central', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('usr_julio', 'julio@hscontrol.com', '$2b$10$m75acNANk5XwyuyND2xF0eUSIPLFOx2xpLjpU1V1eQyo2x4BRmesW', 'Julio', 'ADMINISTRADOR', '', true, 0, 'suc_central', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('usr_mavel', 'mavel@hscontrol.com', '$2b$10$cmxNPfWEZoXc5wcyRHXlj.1riwyM.a0OHN9RrQ.zEB/mnwq6d0MMu', 'Mavel', 'ADMINISTRADOR', '', true, 0, 'suc_central', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `role` = VALUES(`role`),
  `active` = true,
  `sucursalId` = VALUES(`sucursalId`),
  `updatedAt` = CURRENT_TIMESTAMP(3);

-- Disable legacy bootstrap admin (keep row for audit; do not delete).
UPDATE `users`
SET `active` = false, `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `email` = 'admin@hstecnologias.com';
