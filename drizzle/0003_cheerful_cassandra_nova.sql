CREATE TABLE `videoJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topic` varchar(160) NOT NULL,
	`title` varchar(200),
	`script` text,
	`narration` text,
	`status` enum('queued','generating','assembling','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
	`stage` varchar(48) NOT NULL DEFAULT 'queued',
	`finalVideoKey` varchar(512),
	`finalVideoUrl` varchar(1024),
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoScenes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`sceneIndex` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`narration` text NOT NULL,
	`visualPrompt` text NOT NULL,
	`duration` int NOT NULL,
	`providerTaskId` varchar(128),
	`videoKey` varchar(512),
	`videoUrl` varchar(1024),
	`status` enum('queued','generating','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoScenes_id` PRIMARY KEY(`id`)
);
