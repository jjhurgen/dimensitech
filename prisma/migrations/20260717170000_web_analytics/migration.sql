CREATE TABLE `web_analytics_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` VARCHAR(64) NOT NULL,
    `visitor_hash` VARCHAR(64) NOT NULL,
    `first_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `current_path` VARCHAR(500) NULL,
    `current_product_sku_id` INTEGER NULL,
    `referrer` VARCHAR(500) NULL,
    `user_agent` VARCHAR(500) NULL,

    UNIQUE INDEX `web_analytics_sessions_session_id_key`(`session_id`),
    INDEX `web_analytics_sessions_visitor_hash_idx`(`visitor_hash`),
    INDEX `web_analytics_sessions_last_seen_at_idx`(`last_seen_at`),
    INDEX `web_analytics_sessions_current_product_sku_id_idx`(`current_product_sku_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `web_analytics_events` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `event_type` VARCHAR(40) NOT NULL,
    `session_id` VARCHAR(64) NOT NULL,
    `visitor_hash` VARCHAR(64) NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `product_sku_id` INTEGER NULL,
    `referrer` VARCHAR(500) NULL,
    `user_agent` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `web_analytics_events_event_type_created_at_idx`(`event_type`, `created_at`),
    INDEX `web_analytics_events_session_id_created_at_idx`(`session_id`, `created_at`),
    INDEX `web_analytics_events_visitor_hash_created_at_idx`(`visitor_hash`, `created_at`),
    INDEX `web_analytics_events_path_created_at_idx`(`path`, `created_at`),
    INDEX `web_analytics_events_product_sku_id_event_type_created_at_idx`(`product_sku_id`, `event_type`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
