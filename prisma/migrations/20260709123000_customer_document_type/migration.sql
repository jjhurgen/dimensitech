ALTER TABLE `customers`
  ADD COLUMN `document_type` ENUM('DNI', 'CE', 'RUC') NOT NULL DEFAULT 'DNI';
