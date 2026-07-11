CREATE TABLE `provider_product_types` (
    `provider_id` INTEGER NOT NULL,
    `product_type_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `provider_product_types_product_type_id_idx`(`product_type_id`),
    PRIMARY KEY (`provider_id`, `product_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `provider_product_types` ADD CONSTRAINT `provider_product_types_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `provider_product_types` ADD CONSTRAINT `provider_product_types_product_type_id_fkey` FOREIGN KEY (`product_type_id`) REFERENCES `product_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
