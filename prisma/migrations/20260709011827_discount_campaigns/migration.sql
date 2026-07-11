-- AlterTable
ALTER TABLE `reservation_items` ADD COLUMN `discount_campaign_name` VARCHAR(191) NULL,
    ADD COLUMN `discount_label` VARCHAR(191) NULL,
    ADD COLUMN `discount_unit_amount` DECIMAL(12, 2) NULL,
    ADD COLUMN `original_unit_price` DECIMAL(12, 2) NULL;

-- CreateTable
CREATE TABLE `discount_campaigns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `badge_label` VARCHAR(191) NOT NULL,
    `discount_type` ENUM('FIXED_AMOUNT', 'PERCENTAGE', 'FINAL_PRICE') NOT NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `discount_campaigns_is_active_starts_at_ends_at_idx`(`is_active`, `starts_at`, `ends_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discount_campaign_products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `product_sku_id` INTEGER NOT NULL,
    `value` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `discount_campaign_products_product_sku_id_idx`(`product_sku_id`),
    UNIQUE INDEX `discount_campaign_products_campaign_id_product_sku_id_key`(`campaign_id`, `product_sku_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `discount_campaign_products` ADD CONSTRAINT `discount_campaign_products_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `discount_campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discount_campaign_products` ADD CONSTRAINT `discount_campaign_products_product_sku_id_fkey` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
