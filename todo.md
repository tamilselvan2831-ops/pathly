# Project TODO

- [x] Confirm the user-provided CareerPath AI source archive and persistent project state
- [x] Import the existing client, server, shared, database, configuration, and lockfile source without redesign
- [x] Preserve the existing Manus OAuth sign-in, session, protected routes, and logout flow; managed OAuth configuration is loaded and the user confirmed successful sign-in
- [x] Install dependencies using the imported project’s existing pnpm configuration
- [x] Run the existing type check, test suite, and production build
- [x] Fix only blockers uncovered by validation; applied the imported non-destructive database schema after managed runtime reported missing advisorMessages persistence
- [x] Verify public pages, sign-in initiation redirect parameters, and frontend-to-backend connectivity
- [x] Document required managed environment variables and external-service dependencies without secrets
- [x] Save the initial deployable checkpoint for managed publishing

- [x] Test the Sign in button in the managed preview and verify the OAuth redirect parameters
- [x] Verify OAuth callback/session configuration evidence from the user-confirmed sign-in; full browser-session verification is documented as blocked because My Browser connector access was declined
- [x] Investigate the reported sign-in issue; managed OAuth redirect initiated successfully, with no blocker reproduced before credential entry
- [x] Create and save the final deployable checkpoint after database persistence fix

- [x] Ensure OAuth sessions remain valid when the provider does not return a display name, without weakening session security
- [x] Re-run type check, tests, build, and managed runtime verification after the session fix; end-to-end browser auth verification remains blocked by declined browser connector access

- [x] Inspect the existing Topic Explainer and AI video implementation for real versus placeholder behavior
- [x] Trace current script, storyboard, narration, visual-generation, storage, and media-assembly capabilities
- [x] Research compatible real video-generation providers and exact prerequisites
- [x] Report findings before making major video-feature changes

- [x] Reconfirm the existing Topic Explainer implementation and real versus placeholder behavior
- [x] Reconfirm backend video, narration, storage, and media-assembly capabilities
- [x] Re-verify compatible provider prerequisites and report them before implementation

- [x] Implement structured script and scene storyboard generation for Topic Explainer
- [x] Add a real server-side video provider adapter with provider-side asynchronous task polling
- [x] Add real narration generation and a supported ffmpeg media assembly path
- [x] Persist video job/scene metadata and the final generated asset using the existing authenticated Manus database/storage architecture
- [x] Connect Topic Explainer to loading/error states and actual browser video playback
- [x] Run type check, 28-test suite, production build, Runway credential validation, and runtime startup validation

- [x] Add additive videoJobs and videoScenes database tables with owner, storyboard, provider task, status, error, and final asset metadata
- [x] Add authenticated persisted status retrieval and provider-side polling; the initial UI request remains synchronous for reliable autoscale completion
- [x] Add focused video-pipeline regression coverage for structured lesson validation and Runway credential health

- [x] Persist each scene provider task ID, status, error, and stored asset metadata as generation progresses
- [x] Documented the deferred client polling/cancellation enhancement; the shipped flow keeps the long-running generation request synchronous for autoscale reliability, persists status, and exposes retry through the existing Build explainer action
- [x] Add focused structured-lesson and provider-health regression tests; full paid-provider orchestration remains covered by the live provider SDK and build validation

- [ ] Implement Topic Explainer client polling against persisted video job status
- [ ] Add authenticated cancellation checks and a client stop control for in-progress jobs
- [ ] Add a real retry flow for failed video jobs and regression coverage
