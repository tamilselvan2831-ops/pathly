# Pathly AI Video Feature Re-inspection

## Conclusion

The current Topic Explainer is still a **real NVIDIA text-generation experience but not a real video-generation pipeline**. No major video implementation changes were made during this re-inspection.

## Existing implementation

The existing `TopicExplainer` component in `client/src/pages/Home.tsx` accepts a topic, calls the protected `trpc.ai.assistant` mutation, stores the returned markdown in local state, and advances through labels for Script, Scenes, Visuals, Narration, and Ready. Its explanatory copy explicitly says it presents a video-ready storyboard rather than claiming that a renderer produced a finished video.

The backend `ai.assistant` procedure in `server/routers.ts` is a general authenticated assistant endpoint. It bounds conversation messages, persists assistant history, and calls the existing `invokeLLM` adapter. The NVIDIA configuration is for chat/text completion (`https://integrate.api.nvidia.com/v1/chat/completions`) with `openai/gpt-oss-120b` and a smaller stream model for ordinary assistant responses. It cannot generate video.

The repository has an internal `generateImage` helper that calls Manus ImageService and stores image output in S3. It is not connected to Topic Explainer and does not generate video. The Voice Coach has browser recognition/transcription and browser `speechSynthesis`, but it does not create a durable narration audio file for a video.

There is currently no Topic Explainer server procedure for script/storyboard JSON, no video-provider adapter, no narration-generation endpoint, no video job/task persistence, no provider polling or webhook handling, no media compositor, and no final MP4 player or stored-video result. The current Scenes, Visuals, Narration, and Ready steps are therefore UI/progress placeholders around the generated text response.

## What real implementation requires

| Workflow step | Existing status | Required addition |
|---|---|---|
| Topic input | Real and should remain unchanged | Reuse existing UI and protected route |
| Educational script | Real NVIDIA text output | Add structured response validation and separate narration text |
| Storyboard | Not machine-readable; implied by markdown | Add validated scene array with order, duration, visual prompt, narration, and transition fields |
| Scene visuals/video | Missing | Server-side calls to a real video API for each scene, with task IDs and polling/status handling |
| Narration | Missing for saved video | Add server-side TTS or choose a video model with native audio; browser speech synthesis is not enough for MP4 output |
| Assembly | Missing | Add a supported server-side composition path or a provider workflow that returns a complete audiovisual result |
| Persistence | Generic storage exists; no video job model | Add additive, owner-scoped job/scene/asset metadata and final video URL/key |
| Playback | Missing | Render the final stored MP4 in the existing Topic Explainer surface |
| Reliability | Missing for long-running video jobs | Add queued/asynchronous status, cancellation, retries for transient failures, rate-limit handling, and clear failure states |

## Recommended provider

**Runway Dev** is the clearest first provider to integrate from the backend. Its official API documents asynchronous video tasks, text-to-video through the `image_to_video` resource with no input image, and a Node SDK.[1]

| Required detail | Runway Dev |
|---|---|
| Provider | Runway Dev |
| Model | `gen4_turbo` for lower cost/latency, or `gen4.5` for higher quality, subject to account availability |
| API key source | Runway Developer Portal: https://dev.runwayml.com/ |
| Managed secret name | `RUNWAYML_API_SECRET` |
| Exact endpoint | `POST https://api.dev.runwayml.com/v1/image_to_video` |
| Required headers | `Authorization: Bearer <key>`, `X-Runway-Version: 2024-11-06`, `Content-Type: application/json` |
| Text-to-video request | Omit `promptImage`; send `promptText`, `model`, `ratio`, and `duration` |
| Pricing | Paid credits, not assumed free. Official pricing states credits cost $0.01 each; `gen4_turbo` is listed at 5 credits/second and `gen4.5` at 12 credits/second.[2] |
| Delivery | Asynchronous task creation followed by task-output polling; handle 429, 503, moderation, and task-failure states.[3] |

The key must be added through managed project secrets, never pasted into chat, exposed to the browser, or committed to source.

## Additional decisions required before implementation

A real educational video also needs narration. Runway’s documented video generation path should not be assumed to create the exact narration track required for a multi-scene lesson. We need either a separate server-side TTS provider and its own secret, or a selected video model/workflow with native audio. Browser `speechSynthesis` alone cannot create a portable, durable MP4 audio track.

The managed Node runtime also should not be assumed to include ffmpeg. If the product requires concatenating multiple scene MP4s and mixing narration, we need an approved supported composition dependency/runtime, a separate media-composition service, or a provider workflow that returns a complete audiovisual result. This decision affects deployment and request/job architecture.

The next safe implementation plan is to preserve the current Topic Explainer shell, add an authenticated asynchronous video-job API, generate validated script/storyboard data with NVIDIA, call the selected provider only server-side, persist task and asset metadata, and add the finished-video player only when a real MP4 exists. No fake/static video should be used as a fallback.

## References

[1]: https://docs.dev.runwayml.com/guides/using-the-api/ "Runway Dev API Getting Started Guide"
[2]: https://docs.dev.runwayml.com/guides/pricing/ "Runway Dev API Pricing & Costs"
[3]: https://docs.dev.runwayml.com/guides/go-live/ "Runway Dev Production Launch Checklist"
[4]: https://docs.lumalabs.ai/docs/javascript-video-generation "Luma JavaScript Video Generation"
[5]: https://ai.google.dev/gemini-api/docs/veo "Google Gemini API Veo Documentation"
