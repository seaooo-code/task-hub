-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `duties_table` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`receive_id` varchar(255) NOT NULL,
	`template_id` varchar(255) NOT NULL,
	`cron_schedule` varchar(255) NOT NULL,
	`last_run_time` timestamp,
	`create_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`update_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `duties_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `duties_users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`duty_id` bigint NOT NULL,
	`user_id` bigint NOT NULL,
	`order_index` int NOT NULL,
	CONSTRAINT `duties_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `duty_user` UNIQUE(`duty_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `templates_table` (
	`id` varchar(255) NOT NULL,
	CONSTRAINT `templates_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users_table` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`avatar` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	CONSTRAINT `users_table_id` PRIMARY KEY(`id`),
	CONSTRAINT `email` UNIQUE(`email`)
);

*/