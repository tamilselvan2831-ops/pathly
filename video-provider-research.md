# Real video-generation provider research

## Existing application finding

The current Topic Explainer in `client/src/pages/Home.tsx` sends one prompt to `trpc.ai.assistant`, displays the returned text as a script, advances a visual progress strip, and explicitly tells the user it is a video-ready storyboard rather than a rendered video. There is no server video-generation procedure, no storyboard JSON contract, no narration/TTS generation endpoint, no video asset persistence for this flow, and no media assembly/playback component. The current implementation is therefore real text generation but a placeholder for scenes, visuals, narration, rendering, and playable video.

## Runway Dev

Official docs: https://docs.dev.runwayml.com/

The official quickstart documents a server SDK call to `client.imageToVideo.create({ model: 'gen4.5', promptText, ratio: '1280:720', duration: 5 }).waitForTaskOutput()` and returns a completed video URL. The site links the API reference and pricing pages. The documentation describes a task-based asynchronous generation flow and shows Gen-4.5 as an available model. The official docs homepage also advertises Seedance 2.5 and Gen-4.5. Authentication requires a Runway developer account/API credential; the exact current key header and endpoint should be taken from the API reference/SDK configuration during implementation rather than guessed.

## Luma

Official docs: https://docs.lumalabs.ai/docs/api

The official documentation states that the Dream Machine API supports text-to-video and image-to-video. It describes an asynchronous flow: create a request, receive an ID, then poll status until ready. The page now directs developers to the Luma API Platform for the latest API and current guides/reference. The older Dream Machine documentation does not itself provide the current exact endpoint or current model name on the API overview page; those must be taken from the current platform/reference before implementation. Access requires a Luma API key and billing/credits.

## Google Veo

Official documentation search result: https://ai.google.dev/gemini-api/docs/video

Google’s official Gemini documentation identifies Veo 3.1 as a video-generation model with native audio and an asynchronous programmatic workflow. The current endpoint and authentication model depend on the Gemini API/Vertex AI path selected; exact implementation details must be verified from the current official Veo guide before coding. Access requires a Google API key or Google Cloud credentials and is not assumed to be free.

## Exact Runway integration details verified from official docs

Runway’s official getting-started guide documents the REST endpoint `POST https://api.dev.runwayml.com/v1/image_to_video`. For text-to-video with Gen-4.5, the same endpoint is used while omitting `promptImage`; the request includes `promptText`, `model: "gen4.5"`, `ratio`, and `duration`. The documented headers are `Authorization: Bearer $RUNWAYML_API_SECRET`, `X-Runway-Version: 2024-11-06`, and `Content-Type: application/json`. The response starts an asynchronous task; the SDK example waits for task output and returns the completed video URL. The official API pricing page states credits cost $0.01 each and lists `gen4_turbo` at 5 credits/second and `gen4.5` at 12 credits/second. The official go-live checklist requires a developer account, credits/autobilling for production use, secure key storage, and handling 429/503/task failure states. Sources: https://docs.dev.runwayml.com/guides/using-the-api/ ; https://docs.dev.runwayml.com/guides/pricing/ ; https://docs.dev.runwayml.com/guides/go-live/ .

## Current recommendation

Runway Dev is the clearest first provider for this project because its official docs expose a direct Node-compatible asynchronous video API, text-to-video mode, explicit task lifecycle, and production pricing. A practical first model is `gen4_turbo` for lower cost/latency, subject to current account/model availability; `gen4.5` is the higher-quality documented example. Required secret name for the proposed adapter: `RUNWAYML_API_SECRET`. Provider: Runway Dev. Obtain it from the Runway Developer Portal at https://dev.runwayml.com/ after creating an account and API key. It is not a free production service: the official pricing page states pay-as-you-go credits at $0.01 per credit, with no zero-cost production assumption. Exact endpoint: `https://api.dev.runwayml.com/v1/image_to_video`.

## Important architecture prerequisite

The requested workflow requires more than a single video API call. The application needs an AI structured-output contract for script plus scene storyboard, a visual strategy (either Runway text-to-video per scene or Runway image-to-video with generated first-frame visuals), narration generation, durable object storage for scene assets and final MP4, and a server-side composition step. The current managed Node runtime should not be assumed to include ffmpeg; if exact MP4 concatenation/mixing is required, the implementation must either use a provider/API that returns a complete video with audio, add a supported server-side media composition dependency, or use a hosting/runtime path that explicitly supports the needed media tool. This decision should be made before coding.
