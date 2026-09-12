CREATE TABLE `advisorMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `advisorMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learnerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`careerGoal` varchar(160) NOT NULL,
	`education` varchar(180) NOT NULL,
	`interests` text NOT NULL,
	`skills` text NOT NULL,
	`learningPace` varchar(48) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learnerProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `learnerProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `learningPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`careerSlug` varchar(80) NOT NULL,
	`roadmap` text NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learningPlans_id` PRIMARY KEY(`id`)
);
