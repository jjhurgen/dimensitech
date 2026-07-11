-- CreateTable
CREATE TABLE `promotion_banners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `product_sku_id` INTEGER NOT NULL,
    `campaign_id` INTEGER NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `promotion_banners_is_active_starts_at_ends_at_sort_order_idx`(`is_active`, `starts_at`, `ends_at`, `sort_order`),
    INDEX `promotion_banners_product_sku_id_idx`(`product_sku_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `promotion_banners` ADD CONSTRAINT `promotion_banners_product_sku_id_fkey` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promotion_banners` ADD CONSTRAINT `promotion_banners_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `discount_campaigns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
