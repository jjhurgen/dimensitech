ALTER TABLE `users` ADD COLUMN `last_login_country_code` VARCHAR(2) NULL,
    ADD COLUMN `last_login_country` VARCHAR(80) NULL;

ALTER TABLE `user_login_events` ADD COLUMN `country_code` VARCHAR(2) NULL,
    ADD COLUMN `country` VARCHAR(80) NULL;
