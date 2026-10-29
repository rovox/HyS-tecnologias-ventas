-- LAUNCH P0-1: the partner's QR account is its own box (P1-1 sends a QR cobro to QR Empresa, QR Socia or the
-- collector's personal QR). The existing QR box is the company's.
UPDATE `cash_boxes` SET `nombre` = 'QR Empresa' WHERE `id` = 'caja_qr';
INSERT IGNORE INTO `cash_boxes` (`id`, `nombre`, `tipo`, `sucursalId`, `active`, `createdAt`, `updatedAt`) VALUES
  ('caja_qr_socia', 'QR Socia', 'qr', 'suc_central', true, NOW(3), NOW(3));
