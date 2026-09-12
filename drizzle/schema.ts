import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const learnerProfiles = mysqlTable("learnerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  careerGoal: varchar("careerGoal", { length: 160 }).notNull(),
  education: varchar("education", { length: 180 }).notNull(),
  interests: text("interests").notNull(),
  skills: text("skills").notNull(),
  learningPace: varchar("learningPace", { length: 48 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("learnerProfiles_userId_unique").on(table.userId)]);

export const learningPlans = mysqlTable("learningPlans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  careerSlug: varchar("careerSlug", { length: 80 }).notNull(),
  roadmap: text("roadmap").notNull(),
  progress: int("progress").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const advisorMessages = mysqlTable("advisorMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const analysisArtifacts = mysqlTable("analysisArtifacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  kind: varchar("kind", { length: 48 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  score: int("score"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export const videoJobs = mysqlTable("videoJobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  topic: varchar("topic", { length: 160 }).notNull(),
  title: varchar("title", { length: 200 }),
  script: text("script"),
  narration: text("narration"),
  status: mysqlEnum("status", ["queued", "generating", "assembling", "completed", "failed", "cancelled"]).default("queued").notNull(),
  stage: varchar("stage", { length: 48 }).default("queued").notNull(),
  finalVideoKey: varchar("finalVideoKey", { length: 512 }),
  finalVideoUrl: varchar("finalVideoUrl", { length: 1024 }),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const videoScenes = mysqlTable("videoScenes", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  sceneIndex: int("sceneIndex").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  narration: text("narration").notNull(),
  visualPrompt: text("visualPrompt").notNull(),
  duration: int("duration").notNull(),
  providerTaskId: varchar("providerTaskId", { length: 128 }),
  videoKey: varchar("videoKey", { length: 512 }),
  videoUrl: varchar("videoUrl", { length: 1024 }),
  status: mysqlEnum("status", ["queued", "generating", "completed", "failed", "cancelled"]).default("queued").notNull(),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalysisArtifact = typeof analysisArtifacts.$inferSelect;
export type VideoJob = typeof videoJobs.$inferSelect;
export type VideoScene = typeof videoScenes.$inferSelect;
