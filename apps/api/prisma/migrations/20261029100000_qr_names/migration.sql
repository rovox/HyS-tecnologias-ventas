-- Owner 2026-10-29: the company's QR is the primary one and the partner's the secondary one.
UPDATE `cash_boxes` SET `nombre` = 'QR primario (empresa)' WHERE `id` = 'caja_qr';
UPDATE `cash_boxes` SET `nombre` = 'QR secundario (socia)' WHERE `id` = 'caja_qr_socia';
