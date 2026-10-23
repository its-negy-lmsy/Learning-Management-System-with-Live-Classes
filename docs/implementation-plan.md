# Implementation Plan and Acceptance Checklist

## Architecture decisions made before implementation

- Monorepo with `apps/web`, `apps/api`, `apps/worker`, and shared contracts under `packages/shared`.
- MongoDB/Mongoose, Express/TypeScript, React/Vite, RTK Query, BullMQ/Redis, FFmpeg/HLS, and LiveKit are the intended production stack.
- A persistent JSON store and atomic local job queue make the development demo runnable without MongoDB, Redis, AWS, a payment account, or a LiveKit account. The development adapters are labeled and are not production substitutes.
- Video storage is private by default. Local storage serves protected HLS files through the API. S3/CloudFront adapters are conditional on configured credentials and a distribution.
- Money is stored in integer minor units; mock payment completion exists only with `DEMO_MODE=true`.

## Milestones

- [x] A: Inspect workspace, define component architecture, API inventory, data relationships, and media job design.
- [ ] A: Scaffold app workspaces and local infrastructure configuration.
- [ ] B: Authentication, roles, seeded catalog, course authoring, and publication.
- [ ] C: Multipart upload, BullMQ/local queue, real FFmpeg HLS processing, and protected playback.
- [ ] D: Enrollment, progress, quiz grading, and completion rules.
- [ ] E: Live class schedule, authorization, and optional LiveKit room token.
- [ ] F: PDF certificates, payment adapter, ledger, and analytics.
- [ ] G: Tests, docs, build verification, screenshots, presentation outline, and final acceptance report.

## Verification ledger

Tests and builds will be recorded after execution. A missing local infrastructure service or external credential will be recorded as unavailable rather than reported as passing.

