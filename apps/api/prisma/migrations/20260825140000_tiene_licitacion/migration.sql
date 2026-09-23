-- RenameColumn
ALTER TABLE `quotations` CHANGE `esLicitacion` `tieneLicitacion` BOOLEAN NOT NULL DEFAULT false;
