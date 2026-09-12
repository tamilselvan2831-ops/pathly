import RunwayML from "@runwayml/sdk";
import ffmpegPath from "ffmpeg-static";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";
import * as db from "./db";

export type ExplainerScene = {
  title: string;
  narration: string;
  visualPrompt: string;
  duration: number;
};

export type ExplainerLesson = {
  title: string;
  script: string;
  scenes: ExplainerScene[];
  narration: string;
};

const LESSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    script: { type: "string" },
    narration: { type: "string" },
    scenes: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          narration: { type: "string" },
          visualPrompt: { type: "string" },
          duration: { type: "integer", minimum: 4, maximum: 6 },
        },
        required: ["title", "narration", "visualPrompt", "duration"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "script", "narration", "scenes"],
  additionalProperties: false,
} as const;

function messageContent(response: { choices?: Array<{ message?: { content?: unknown } }> }) {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("The lesson generator returned no content.");
  return content;
}

export function validateExplainerLesson(lesson: ExplainerLesson) {
  return Boolean(lesson.title && lesson.script && lesson.narration && Array.isArray(lesson.scenes) && lesson.scenes.length >= 2 && lesson.scenes.length <= 3 && lesson.scenes.every(scene => scene.title && scene.narration && scene.visualPrompt && scene.duration >= 4 && scene.duration <= 6));
}

async function createLesson(topic: string): Promise<ExplainerLesson> {
  const response = await invokeLLM({
    model: ENV.nvidiaModel,
    messages: [
      {
        role: "system",
        content:
          "Create a scientifically responsible educational lesson for a short video. Return only JSON matching the supplied schema. Use 2 or 3 scenes, each 4 to 6 seconds. Keep each scene narration concise enough for its duration. Visual prompts must describe safe, diagram-friendly educational imagery and must not request text rendered inside the video.",
      },
      { role: "user", content: `Topic: ${topic.trim()}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "educational_lesson", strict: true, schema: LESSON_SCHEMA },
    },
  });
  const lesson = JSON.parse(messageContent(response)) as ExplainerLesson;
  if (!validateExplainerLesson(lesson)) {
    throw new Error("The lesson generator returned an incomplete lesson.");
  }
  return { ...lesson, scenes: lesson.scenes.slice(0, 3) };
}

import { getRunwayClient } from "./videoProviders";

function runwayClient() {
  return getRunwayClient();
}

async function downloadToFile(url: string, path: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Media download failed with HTTP ${response.status}.`);
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
}

async function generateScene(client: RunwayML, scene: ExplainerScene, path: string) {
  const task = await client.imageToVideo.create({
    model: "gen4.5",
    promptText: scene.visualPrompt,
    ratio: "1280:720",
    duration: Math.max(4, Math.min(6, scene.duration)),
    outputFormat: "mp4",
  } as never).waitForTaskOutput({ timeout: 12 * 60 * 1000 });
  const taskId = task.id;
  const url = task.output?.[0];
  if (!url) throw new Error("Runway returned no scene video URL.");
  await downloadToFile(url, path);
  return { taskId, url };
}

async function generateNarration(client: RunwayML, narration: string, path: string) {
  const chunks = narration.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(item => item.trim()).filter(Boolean) ?? [narration];
  const text = chunks.join(" ").slice(0, 1000);
  const task = await client.textToSpeech.create({
    model: "eleven_multilingual_v2",
    promptText: text,
    voice: { type: "runway-preset", presetId: "Serene" },
  }).waitForTaskOutput({ timeout: 8 * 60 * 1000 });
  const url = task.output?.[0];
  if (!url) throw new Error("Runway returned no narration audio URL.");
  await downloadToFile(url, path);
}

function runFfmpeg(args: string[], cwd: string) {
  if (!ffmpegPath) throw new Error("The media compositor is unavailable in this deployment.");
  return new Promise<void>((resolve, reject) => {
    const child: any = spawn(ffmpegPath as string, args, { cwd, stdio: ["ignore", "ignore", "pipe"] });
    let error = "";
    child.stderr.on("data", (chunk: Uint8Array) => { error += String(chunk); });
    child.on("error", reject);
    child.on("close", (code: number | null) => code === 0 ? resolve() : reject(new Error(`Media assembly failed (${code}): ${error.slice(-600)}`)));
  });
}

async function assemble(scenePaths: string[], narrationPath: string, outputPath: string, cwd: string) {
  const concatPath = join(cwd, "scenes.txt");
  await writeFile(concatPath, scenePaths.map(path => `file '${path.replaceAll("'", "'\\''")}'`).join("\n"));
  const silentVideo = join(cwd, "silent.mp4");
  await runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", concatPath, "-c", "copy", silentVideo], cwd);
  await runFfmpeg(["-y", "-i", silentVideo, "-i", narrationPath, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-shortest", "-movflags", "+faststart", outputPath], cwd);
}

export async function generateExplainerVideo(userId: number, topic: string, existingJobId?: number) {
  if (topic.trim().length < 2 || topic.trim().length > 160) throw new Error("Enter a topic between 2 and 160 characters.");
  const jobId = existingJobId ?? await db.createVideoJob(userId, topic.trim());
  let directory: string | null = null;
  try {
    await db.updateVideoJob(jobId, { status: "generating", stage: "script" });
    const lesson = await createLesson(topic);
    await db.updateVideoJob(jobId, { title: lesson.title, script: lesson.script, narration: lesson.narration, stage: "scenes" });
    await db.replaceVideoScenes(jobId, lesson.scenes.map((scene, sceneIndex) => ({ ...scene, sceneIndex, status: "queued" })));
    const savedJob = await db.getVideoJob(userId, jobId);
    const client = runwayClient();
    directory = await mkdtemp(join(tmpdir(), "pathly-video-"));
    const scenePaths: string[] = [];
    for (let index = 0; index < lesson.scenes.length; index += 1) {
      const scenePath = join(directory, `scene-${index}.mp4`);
      const sceneRow = savedJob?.scenes[index];
      if (await db.isVideoJobCancelled(userId, jobId)) return { jobId, status: "cancelled" as const };
      await db.updateVideoJob(jobId, { stage: `scene-${index + 1}` });
      if (sceneRow) await db.updateVideoScene(sceneRow.id, { status: "generating" });
      try {
        const generated = await generateScene(client, lesson.scenes[index]!, scenePath);
        const sceneStored = await storagePut(`users/${userId}/explainer/${jobId}/scene-${index}.mp4`, await readFile(scenePath), "video/mp4");
        if (sceneRow) await db.updateVideoScene(sceneRow.id, { status: "completed", providerTaskId: generated.taskId, videoKey: sceneStored.key, videoUrl: sceneStored.url });
        scenePaths.push(scenePath);
      } catch (error) {
        if (sceneRow) await db.updateVideoScene(sceneRow.id, { status: "failed", error: error instanceof Error ? error.message.slice(0, 1000) : "Scene generation failed." });
        throw error;
      }
    }
    if (await db.isVideoJobCancelled(userId, jobId)) return { jobId, status: "cancelled" as const };
    await db.updateVideoJob(jobId, { status: "assembling", stage: "narration" });
    const narrationPath = join(directory, "narration.mp3");
    await generateNarration(client, lesson.narration, narrationPath);
    const finalPath = join(directory, "lesson.mp4");
    await assemble(scenePaths, narrationPath, finalPath, directory);
    const finalBuffer = await readFile(finalPath);
    const stored = await storagePut(`users/${userId}/explainer/${Date.now()}.mp4`, finalBuffer, "video/mp4");
    await db.updateVideoJob(jobId, { status: "completed", stage: "completed", finalVideoUrl: stored.url, finalVideoKey: stored.key });
    return { ...lesson, jobId, videoUrl: stored.url, videoKey: stored.key };
  } catch (error) {
    await db.updateVideoJob(jobId, { status: "failed", stage: "failed", error: error instanceof Error ? error.message.slice(0, 1000) : "Video generation failed." });
    throw error;
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true });
  }
}

export async function startExplainerVideo(userId: number, topic: string) {
  if (topic.trim().length < 2 || topic.trim().length > 160) throw new Error("Enter a topic between 2 and 160 characters.");
  const jobId = await db.createVideoJob(userId, topic.trim());
  void generateExplainerVideo(userId, topic.trim(), jobId).catch(() => undefined);
  return { jobId };
}
