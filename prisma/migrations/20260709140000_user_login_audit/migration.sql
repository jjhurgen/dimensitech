ALTER TABLE `users` ADD COLUMN `last_login_at` DATETIME(3) NULL,
    ADD COLUMN `last_login_ip` VARCHAR(45) NULL,
    ADD COLUMN `last_login_user_agent` TEXT NULL;

CREATE TABLE `user_login_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_login_events_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_login_events` ADD CONSTRAINT `user_login_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
