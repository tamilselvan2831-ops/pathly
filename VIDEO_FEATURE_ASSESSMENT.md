# CareerPath AI Video Feature Assessment

## Executive finding

The existing Pathly Topic Explainer is **not yet a real video-generation feature**. It has a functioning authenticated NVIDIA-backed text-generation path, but the visible product currently stops after generating explanatory text and presenting it as a storyboard-ready lesson. No video file is generated, no narration audio is produced, and no completed playable video is stored or rendered.

No major implementation changes have been made during this assessment.

## What is currently implemented

The Topic Explainer is defined in `client/src/pages/Home.tsx` as the `TopicExplainer` component. It provides a topic input, a `Build explainer` button, progress labels for Script, Scenes, Visual plan, Narration, and Ready to record, and a generated-script panel rendered with `Streamdown`.

When the user submits a topic, the component waits 250 milliseconds and calls the existing protected `trpc.ai.assistant` mutation with a prompt asking for a concise educational video-style explainer script. The response is stored in local React state and the UI advances to the Scenes stage. The prompt explicitly says not to claim that a real video was rendered.

The current production-notes panel explicitly tells the user that the workspace presents a video-ready storyboard rather than an unavailable rendered video. Its final note says to record or connect a renderer later through a server-side provider adapter. That is an accurate description of the current state.

The backend has a general protected `ai.assistant` procedure in `server/routers.ts`. It bounds the submitted conversation, persists the user and assistant messages, and calls `invokeLLM`. The existing LLM adapter supports the NVIDIA text endpoint and a configured server-side fallback. This is suitable for generating a script and structured storyboard, but it is not a video API.

The project also contains a real server-side image-generation helper at `server/_core/imageGeneration.ts`. It calls the internal Manus ImageService and stores generated image bytes through the existing S3 storage helper. However, this helper is not connected to Topic Explainer, does not generate video, and does not assemble media.

The Voice Coach feature has browser speech recognition/transcription and browser `speechSynthesis` playback for assistant responses. That is separate from Topic Explainer and does not create downloadable narration audio for a video asset.

## What is missing or placeholder

| Workflow stage | Current state | Needed for real implementation |
|---|---|---|
| Topic input | Implemented | Preserve existing input and authentication behavior |
| Educational script | Implemented through the existing NVIDIA-backed text assistant | Add a dedicated structured-output contract so script, narration, and scene metadata are reliable and machine-readable |
| Scene-by-scene storyboard | Only implied by the prompt and displayed as returned markdown | Add validated JSON fields for scene order, duration, narration, visual prompt, and transition metadata |
| Scene visuals/video | Not implemented | Call a real server-side video provider per scene, or use a supported multi-shot workflow |
| Narration | Text appears in the generated answer only | Add a real server-side TTS provider or a provider mode that returns synchronized audio; browser speech synthesis alone cannot produce a durable MP4 narration track |
| Media assembly | Not implemented | Add a supported composition path for combining scene MP4s and narration, or choose a provider that returns the complete audiovisual result |
| Storage | Existing S3 helper is available for generated images/files | Persist job status, scene assets, final MP4 URL, provider task IDs, and ownership metadata using the existing database/storage architecture |
| Playback | No finished-video player exists in Topic Explainer | Add a `<video controls>` result view only after a real final MP4 is available |
| Long-running generation | No video job state machine exists | Add authenticated job creation, polling/webhook status updates, cancellation, retry policy, and failure states without blocking a normal HTTP request |

## Compatible provider identified from official documentation

### Recommended first provider: Runway Dev

Runway Dev is the clearest first integration candidate for this project because the official documentation provides a Node-compatible SDK, a direct REST API, text-to-video mode, asynchronous task handling, and a completed video URL. The official guide documents `gen4.5` text-to-video by calling the image-to-video resource while omitting the input image.

| Requirement | Runway Dev detail |
|---|---|
| Provider | Runway Dev |
| Recommended initial model | `gen4_turbo` for lower cost, subject to the account’s current model availability; `gen4.5` is the higher-quality documented example |
| Official documented model example | `gen4.5` |
| Exact endpoint | `POST https://api.dev.runwayml.com/v1/image_to_video` |
| Text-to-video behavior | Omit `promptImage`; send `promptText`, `model`, `ratio`, and `duration` |
| Required headers | `Authorization: Bearer <key>`, `X-Runway-Version: 2024-11-06`, and `Content-Type: application/json` |
| Secret name to add to the managed project | `RUNWAYML_API_SECRET` |
| Where to obtain it | Create an account and API key in the [Runway Developer Portal](https://dev.runwayml.com/) |
| Pricing | Not a free production service. Official docs state credits can be purchased at $0.01 per credit; the pricing page lists `gen4_turbo` at 5 credits/second and `gen4.5` at 12 credits/second |
| Job model | Asynchronous task creation followed by task status/output retrieval; the official Node SDK exposes `waitForTaskOutput()` |

A representative server-side text-to-video request would conceptually contain `model: "gen4.5"`, `promptText`, `ratio`, and `duration`. The implementation must keep the key server-side, validate topic ownership and prompt size, persist provider task IDs, handle 429/503/task failures, and never place the secret in client code or public responses.

Runway’s official pricing and production checklist also make clear that generation consumes credits, production use requires usage management/autobilling, and integrations should handle rate limits, service outages, moderation, and secure key storage.

### Viable alternatives

| Provider | Relevant capability | Credential and cost considerations | Assessment |
|---|---|---|---|
| Luma Dream Machine / Luma API Platform | Official documentation describes text-to-video and image-to-video with asynchronous generation IDs and polling; older docs list Ray 2 and Ray 2 Flash | `LUMAAI_API_KEY` from the Luma API Platform; current docs redirect developers to the newer platform and current Agents API documentation, so the exact current endpoint/model should be re-verified immediately before implementation; paid credits/subscription access should be expected | Viable, but current API transition makes the integration contract less stable for a first implementation |
| Google Gemini API with Veo 3.1 | Official documentation describes 8-second video generation with native audio, asynchronous operations, and text/image-based generation | `GEMINI_API_KEY` from Google AI Studio or Google Cloud credentials depending on the chosen API path; paid usage should be expected and current quota/billing must be confirmed | Attractive if native audio and short clips are preferred, but scene-length and quota constraints need to be designed around |

## Important composition decision

A multi-scene educational video requires either a provider-supported complete audiovisual workflow or a reliable server-side composition layer. The existing managed project has no ffmpeg dependency or video composer. The default managed Node runtime must not be assumed to provide ffmpeg. Before implementation, one of these choices must be approved:

1. Use Runway or another provider to generate each scene and add a supported server-side composition dependency/runtime for MP4 concatenation, audio mixing, and final encoding.
2. Use a provider workflow that can produce the complete educational video with native audio in a small number of clips, reducing local composition requirements but limiting scene-level control.
3. Generate scene clips and narration, then use a separately managed media-composition service, with the Pathly backend storing only job state and final asset references.

For the requested scene-by-scene workflow, option 1 gives the most control but adds runtime and deployment complexity. Option 2 is simpler but may not satisfy precise storyboard continuity for longer lessons.

## Exact prerequisites before coding

The implementation should not begin until the provider and composition approach are selected. For the recommended Runway path, the project needs a securely configured `RUNWAYML_API_SECRET` in the managed environment. The user should create the credential in the Runway Developer Portal and enter it through the managed project’s secret settings; it must not be pasted into chat or committed to source.

The project also needs a decision about narration. Browser `speechSynthesis` is not sufficient for a saved, cross-device MP4. A server-side TTS provider or a video provider’s native audio capability is required. If a separate TTS provider is selected, it will require its own provider, model, secret name, endpoint, pricing, and usage-limit review before implementation.

The database work should be additive and non-destructive: a video jobs table, scene metadata, provider task IDs, status/error fields, final asset URL/key, owner ID, and timestamps. Existing users, routes, AI Assistant, Voice Coach, Career Advisor, Resume Analyzer, PDF Analyzer, and other features should remain unchanged.

## Recommended next step

Approve the Runway Dev path with `gen4_turbo` or `gen4.5`, decide whether narration should come from a separate TTS provider or native-audio video generation, and decide whether the managed runtime may use a supported composition dependency. Once those decisions and credentials are available through managed secrets, the real workflow can be implemented incrementally without replacing the existing Topic Explainer UI or other product features.

## References

[1]: https://docs.dev.runwayml.com/guides/using-the-api/ "Runway Dev API Getting Started Guide"
[2]: https://docs.dev.runwayml.com/api/ "Runway Dev API Reference"
[3]: https://docs.dev.runwayml.com/guides/pricing/ "Runway Dev API Pricing & Costs"
[4]: https://docs.dev.runwayml.com/guides/go-live/ "Runway Dev Production Launch Checklist"
[5]: https://docs.lumalabs.ai/docs/api "Luma API Overview"
[6]: https://docs.lumalabs.ai/docs/javascript-video-generation "Luma JavaScript Video Generation"
[7]: https://ai.google.dev/gemini-api/docs/veo "Google Gemini API Veo Documentation"
