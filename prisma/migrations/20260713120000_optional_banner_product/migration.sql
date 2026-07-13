ALTER TABLE `promotion_banners` DROP FOREIGN KEY `promotion_banners_product_sku_id_fkey`;

ALTER TABLE `promotion_banners`
  MODIFY `product_sku_id` INTEGER NULL;

ALTER TABLE `promotion_banners`
  ADD CONSTRAINT `promotion_banners_product_sku_id_fkey` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
