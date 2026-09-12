import { desc, eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { advisorMessages, AnalysisArtifact, analysisArtifacts, InsertUser, learnerProfiles, learningPlans, users, videoJobs, videoScenes } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "email", "loginMethod"] as const).forEach((field) => {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getLearnerProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1))[0];
}

export async function saveLearnerProfile(userId: number, profile: Omit<typeof learnerProfiles.$inferInsert, "id" | "userId" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Persistence is temporarily unavailable.");
  await db.insert(learnerProfiles).values({ userId, ...profile }).onDuplicateKeyUpdate({ set: { ...profile, updatedAt: new Date() } });
  return getLearnerProfile(userId);
}

export async function saveLearningPlan(userId: number, plan: Omit<typeof learningPlans.$inferInsert, "id" | "userId" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Persistence is temporarily unavailable.");
  await db.insert(learningPlans).values({ userId, ...plan });
  return getLearningPlans(userId);
}

export async function getLearningPlans(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(learningPlans).where(eq(learningPlans.userId, userId)).orderBy(desc(learningPlans.updatedAt)).limit(12);
}

export async function saveAdvisorMessage(userId: number, role: "user" | "assistant", content: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(advisorMessages).values({ userId, role, content });
}

export async function getRecentAdvisorMessages(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(advisorMessages).where(eq(advisorMessages.userId, userId)).orderBy(desc(advisorMessages.createdAt)).limit(16);
}

export async function saveAnalysisArtifact(userId: number, artifact: Omit<typeof analysisArtifacts.$inferInsert, "id" | "userId" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Persistence is temporarily unavailable.");
  await db.insert(analysisArtifacts).values({ userId, ...artifact });
  return artifact;
}

export async function createVideoJob(userId: number, topic: string) {
  const db = await getDb();
  if (!db) throw new Error("Persistence is temporarily unavailable.");
  const result = await db.insert(videoJobs).values({ userId, topic, status: "queued", stage: "queued" });
  return Number(result[0].insertId);
}

export async function updateVideoJob(id: number, patch: Partial<typeof videoJobs.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(videoJobs).set({ ...patch, updatedAt: new Date() }).where(eq(videoJobs.id, id));
}

export async function replaceVideoScenes(jobId: number, scenes: Array<Omit<typeof videoScenes.$inferInsert, "id" | "jobId" | "createdAt">>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(videoScenes).values(scenes.map(scene => ({ ...scene, jobId })));
}

export async function updateVideoScene(id: number, patch: Partial<typeof videoScenes.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(videoScenes).set(patch).where(eq(videoScenes.id, id));
}

export async function cancelVideoJob(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Persistence is temporarily unavailable.");
  await db.update(videoJobs).set({ status: "cancelled", stage: "cancelled", updatedAt: new Date() }).where(and(eq(videoJobs.id, id), eq(videoJobs.userId, userId)));
  return { success: true } as const;
}

export async function isVideoJobCancelled(userId: number, id: number) {
  const db = await getDb();
  if (!db) return false;
  const row = (await db.select({ status: videoJobs.status }).from(videoJobs).where(and(eq(videoJobs.id, id), eq(videoJobs.userId, userId))).limit(1))[0];
  return row?.status === "cancelled";
}

export async function getVideoJob(userId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const job = (await db.select().from(videoJobs).where(and(eq(videoJobs.id, id), eq(videoJobs.userId, userId))).limit(1))[0];
  if (!job) return undefined;
  const scenes = await db.select().from(videoScenes).where(eq(videoScenes.jobId, id)).orderBy(videoScenes.sceneIndex);
  return { ...job, scenes };
}

export async function getAnalysisArtifacts(userId: number): Promise<AnalysisArtifact[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(analysisArtifacts).where(eq(analysisArtifacts.userId, userId)).orderBy(desc(analysisArtifacts.createdAt)).limit(30);
}

export async function deleteAnalysisArtifact(userId: number, id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(analysisArtifacts).where(and(eq(analysisArtifacts.id, id), eq(analysisArtifacts.userId, userId)));
  return true;
}

