CREATE TABLE `analysisArtifacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` varchar(48) NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`score` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analysisArtifacts_id` PRIMARY KEY(`id`)
);
