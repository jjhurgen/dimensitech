-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'SELLER', 'WAREHOUSE') NOT NULL DEFAULT 'SELLER',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `providers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `dni_ruc` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `whatsapp` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `observation` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `providers_name_idx`(`name`),
    INDEX `providers_dni_ruc_idx`(`dni_ruc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dni` VARCHAR(191) NULL,
    `nombres` VARCHAR(191) NOT NULL,
    `apellidos` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `observation` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customers_dni_key`(`dni`),
    INDEX `customers_nombres_apellidos_idx`(`nombres`, `apellidos`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `requiere_imei` BOOLEAN NOT NULL DEFAULT false,
    `stock_minimo_default` INTEGER NOT NULL DEFAULT 3,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `product_types_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_image_library` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_type_id` INTEGER NULL,
    `brand` VARCHAR(191) NULL,
    `product_name` VARCHAR(191) NOT NULL,
    `commercial_model` VARCHAR(191) NULL,
    `platform` ENUM('ANDROID', 'IPHONE') NULL,
    `color` VARCHAR(191) NULL,
    `accessory_variant` VARCHAR(191) NULL,
    `compatibility` VARCHAR(191) NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `image_hash` VARCHAR(191) NULL,
    `alt_text` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_image_library_brand_commercial_model_color_idx`(`brand`, `commercial_model`, `color`),
    INDEX `product_image_library_product_type_id_product_name_compatibi_idx`(`product_type_id`, `product_name`, `compatibility`, `color`),
    INDEX `product_image_library_image_hash_idx`(`image_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_skus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `internal_code` VARCHAR(191) NOT NULL,
    `product_type_id` INTEGER NOT NULL,
    `image_id` INTEGER NULL,
    `marca` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `commercial_model` VARCHAR(191) NULL,
    `plataforma` ENUM('ANDROID', 'IPHONE') NULL,
    `color` VARCHAR(191) NULL,
    `almacenamiento` VARCHAR(191) NULL,
    `ram` VARCHAR(191) NULL,
    `model_number` VARCHAR(191) NULL,
    `descripcion_corta` TEXT NULL,
    `precio_venta_sugerido` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `visible_en_tienda` BOOLEAN NOT NULL DEFAULT false,
    `stock_minimo` INTEGER NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `product_skus_internal_code_key`(`internal_code`),
    INDEX `product_skus_nombre_marca_commercial_model_idx`(`nombre`, `marca`, `commercial_model`),
    INDEX `product_skus_visible_en_tienda_status_idx`(`visible_en_tienda`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_sku_id` INTEGER NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `orden` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchase_code` VARCHAR(191) NOT NULL,
    `purchase_date` DATETIME(3) NOT NULL,
    `provider_id` INTEGER NOT NULL,
    `freight_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `status` ENUM('REGISTERED', 'CANCELLED') NOT NULL DEFAULT 'REGISTERED',
    `user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `purchases_purchase_code_key`(`purchase_code`),
    INDEX `purchases_purchase_date_idx`(`purchase_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchase_id` INTEGER NOT NULL,
    `product_sku_id` INTEGER NOT NULL,
    `product_type` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_purchase_price` DECIMAL(12, 2) NOT NULL,
    `total_price` DECIMAL(12, 2) NOT NULL,
    `allocated_freight` DECIMAL(12, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `purchase_items_product_sku_id_idx`(`product_sku_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phone_units` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_sku_id` INTEGER NOT NULL,
    `purchase_id` INTEGER NOT NULL,
    `purchase_item_id` INTEGER NOT NULL,
    `imei1` VARCHAR(191) NOT NULL,
    `imei2` VARCHAR(191) NULL,
    `serial_number` VARCHAR(191) NULL,
    `model_number` VARCHAR(191) NULL,
    `plataforma` ENUM('ANDROID', 'IPHONE') NOT NULL,
    `color` VARCHAR(191) NULL,
    `almacenamiento` VARCHAR(191) NULL,
    `ram` VARCHAR(191) NULL,
    `unit_purchase_price` DECIMAL(12, 2) NOT NULL,
    `allocated_freight` DECIMAL(12, 2) NULL,
    `white_list_registered` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('AVAILABLE', 'RESERVED', 'SOLD', 'RETURNED', 'CANCELLED') NOT NULL DEFAULT 'AVAILABLE',
    `current_reservation_id` INTEGER NULL,
    `sale_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `phone_units_imei1_key`(`imei1`),
    UNIQUE INDEX `phone_units_imei2_key`(`imei2`),
    INDEX `phone_units_status_idx`(`status`),
    INDEX `phone_units_product_sku_id_status_idx`(`product_sku_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_movements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_sku_id` INTEGER NOT NULL,
    `phone_unit_id` INTEGER NULL,
    `movement_type` ENUM('PURCHASE_IN', 'SALE_OUT', 'GIFT_OUT', 'RESERVATION_HOLD', 'RESERVATION_RELEASE', 'RETURN_IN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'CANCELLED') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_cost` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `reference_type` ENUM('PURCHASE', 'SALE', 'RESERVATION', 'MANUAL') NOT NULL,
    `reference_id` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `user_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inventory_movements_product_sku_id_created_at_idx`(`product_sku_id`, `created_at`),
    INDEX `inventory_movements_reference_type_reference_id_idx`(`reference_type`, `reference_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sale_code` VARCHAR(191) NOT NULL,
    `sale_date` DATETIME(3) NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `sale_channel` ENUM('STORE', 'WEB', 'WHATSAPP', 'DELIVERY') NOT NULL DEFAULT 'STORE',
    `payment_method` ENUM('CASH', 'YAPE', 'PLIN', 'TRANSFER', 'CARD', 'MIXED') NOT NULL DEFAULT 'CASH',
    `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discount_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `gift_cost_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `freight_cost_applied` DECIMAL(12, 2) NULL,
    `total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `gross_profit` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `net_profit_estimated` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'PARTIAL') NOT NULL DEFAULT 'CONFIRMED',
    `notes` TEXT NULL,
    `user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sales_sale_code_key`(`sale_code`),
    INDEX `sales_sale_date_idx`(`sale_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sale_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sale_id` INTEGER NOT NULL,
    `product_sku_id` INTEGER NOT NULL,
    `phone_unit_id` INTEGER NULL,
    `item_type` ENUM('PHONE', 'ACCESSORY') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_sale_price` DECIMAL(12, 2) NOT NULL,
    `unit_cost` DECIMAL(12, 2) NOT NULL,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_sale_price` DECIMAL(12, 2) NOT NULL,
    `total_cost` DECIMAL(12, 2) NOT NULL,
    `is_gift` BOOLEAN NOT NULL DEFAULT false,
    `profit` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sale_items_product_sku_id_idx`(`product_sku_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservation_code` VARCHAR(191) NOT NULL,
    `customer_name` VARCHAR(191) NOT NULL,
    `customer_phone` VARCHAR(191) NOT NULL,
    `customer_dni` VARCHAR(191) NULL,
    `shipping_type` ENUM('LIMA', 'PROVINCE', 'STORE_PICKUP') NOT NULL,
    `destination_department` VARCHAR(191) NULL,
    `destination_province` VARCHAR(191) NULL,
    `destination_city` VARCHAR(191) NULL,
    `address_reference` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'PARTIAL_CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `expires_at` DATETIME(3) NOT NULL,
    `whatsapp_message` TEXT NULL,
    `total_estimated` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reservations_reservation_code_key`(`reservation_code`),
    INDEX `reservations_status_expires_at_idx`(`status`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservation_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservation_id` INTEGER NOT NULL,
    `product_sku_id` INTEGER NOT NULL,
    `phone_unit_id` INTEGER NULL,
    `quantity_requested` INTEGER NOT NULL,
    `quantity_confirmed` INTEGER NOT NULL DEFAULT 0,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'PARTIAL_CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reservation_items_product_sku_id_status_idx`(`product_sku_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `expense_date` DATETIME(3) NOT NULL,
    `concept` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `expenses_expense_date_idx`(`expense_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('NEW_RESERVATION', 'RESERVATION_EXPIRING', 'RESERVATION_EXPIRED', 'LOW_PHONE_STOCK', 'LOW_ACCESSORY_STOCK', 'OUT_OF_STOCK', 'SALE_CONFIRMED', 'PURCHASE_REGISTERED') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `user_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_is_read_created_at_idx`(`is_read`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_image_library` ADD CONSTRAINT `product_image_library_product_type_id_fkey` FOREIGN KEY (`product_type_id`) REFERENCES `product_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_skus` ADD CONSTRAINT `product_skus_product_type_id_fkey` FOREIGN KEY (`product_type_id`) REFERENCES `product_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_skus` ADD CONSTRAINT `product_skus_image_id_fkey` FOREIGN KEY (`image_id`) REFERENCES `product_image_library`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_sku_id_fkey` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_purchase_id_fkey` FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_product_sku_id_fkey` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phone_units` ADD CONSTRAINT `phone_units_product_sku_id_fkey` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phone_units` ADD CONSTRAINT `phone_units_purchase_id_fkey` FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phone_units` ADD CONSTRAINT `phone_units_purchase_item_id_fkey` FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phone_units` ADD CONSTRAINT `phone_units_current_reservation_id_fkey` FOREIGN KEY (`current_reservation_id`) REFERENCES `reservations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phone_units` ADD CONSTRAINT `phone_units_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_product_sku_id_fkey` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_phone_unit_id_fkey` FOREIGN KEY (`phone_unit_id`) REFERENCES `phone_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_product_sku_id_fkey` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_phone_unit_id_fkey` FOREIGN KEY (`phone_unit_id`) REFERENCES `phone_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_items` ADD CONSTRAINT `reservation_items_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_items` ADD CONSTRAINT `reservation_items_product_sku_id_fkey` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_items` ADD CONSTRAINT `reservation_items_phone_unit_id_fkey` FOREIGN KEY (`phone_unit_id`) REFERENCES `phone_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

