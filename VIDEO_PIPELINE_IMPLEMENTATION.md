# Pathly Topic Explainer Video Pipeline

The existing Topic Explainer now calls a real authenticated server-side video pipeline. The current UI remains in place; only its request, status, result, and error behavior were extended.

## Implemented flow

1. The user submits a topic through the existing Topic Explainer input.
2. NVIDIA text AI generates validated JSON containing the lesson title, script, narration, and two or three scene records.
3. Each scene is submitted to Runway Dev Gen-4.5 text-to-video as an asynchronous provider task and polled with the official SDK until complete.
4. Runway Dev text-to-speech generates an MP3 narration using the `eleven_multilingual_v2` model and a Runway preset voice.
5. The server uses the bundled `ffmpeg-static` binary to concatenate the returned scene MP4s and mux the narration into a final MP4.
6. The final MP4 is uploaded through the existing Manus storage helper and returned as a browser-playable `/manus-storage/...` URL.
7. The job, scene metadata, provider-facing task state, final storage key/URL, and failure state are persisted in the additive `videoJobs` and `videoScenes` tables.
8. An owner-scoped `ai.explainerStatus` query is available for retrieving persisted job status and final asset metadata.

The pipeline uses a bounded synchronous tRPC request around provider-side asynchronous tasks. This avoids losing in-flight work immediately after a response in autoscaled hosting while still persisting the provider task stages and allowing status retrieval after completion/failure.

## Secret

`RUNWAYML_API_SECRET` is configured through managed server-side secrets. It is never sent to the browser, logged, or committed to source.

## Validation

The project passes `pnpm run check`, the complete test suite with 30 tests across 13 test files when the existing NVIDIA mock tests are run with a non-secret placeholder, and `pnpm run build`. The Runway credential was validated against its lightweight organization endpoint. The real generation path itself is wired to the live provider SDK but was not invoked automatically during validation because each invocation consumes paid Runway credits; it can be exercised from the authenticated Topic Explainer UI.

## Operational notes

Real generation requires a valid Runway account with available credits. A single lesson requests two or three short video clips plus one narration task, so generation can take several minutes and incur provider charges. Provider failures, missing output URLs, media-download failures, and ffmpeg failures surface as an error state and are persisted to the owner’s job record; no fake video is returned.
