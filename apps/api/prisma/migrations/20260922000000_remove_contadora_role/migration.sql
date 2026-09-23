-- Migrate all users with legacy 'Contadora' role to 'ADMINISTRADOR'
UPDATE `users` SET `role` = 'ADMINISTRADOR' WHERE `role` = 'Contadora';
