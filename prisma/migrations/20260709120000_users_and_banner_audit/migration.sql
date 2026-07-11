ALTER TABLE `users`
  ADD COLUMN `dni` VARCHAR(191) NULL,
  ADD COLUMN `nombres` VARCHAR(191) NULL,
  ADD COLUMN `apellidos` VARCHAR(191) NULL,
  ADD COLUMN `fecha_nacimiento` DATETIME(3) NULL,
  ADD COLUMN `address` VARCHAR(191) NULL,
  ADD COLUMN `phone` VARCHAR(191) NULL,
  ADD COLUMN `must_change_password` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `deactivated_at` DATETIME(3) NULL;

CREATE UNIQUE INDEX `users_dni_key` ON `users`(`dni`);

ALTER TABLE `promotion_banners`
  ADD COLUMN `created_by_id` INTEGER NULL,
  ADD COLUMN `deleted_by_id` INTEGER NULL,
  ADD COLUMN `deleted_at` DATETIME(3) NULL;

CREATE INDEX `promotion_banners_created_by_id_idx` ON `promotion_banners`(`created_by_id`);
CREATE INDEX `promotion_banners_deleted_by_id_idx` ON `promotion_banners`(`deleted_by_id`);

ALTER TABLE `promotion_banners`
  ADD CONSTRAINT `promotion_banners_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `promotion_banners_deleted_by_id_fkey` FOREIGN KEY (`deleted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
