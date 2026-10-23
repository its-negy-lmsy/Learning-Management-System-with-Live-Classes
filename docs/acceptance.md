# Acceptance Checklist and Verification Record

## Feature status

- [x] Student, instructor, and administrator roles are modeled and role checks exist in the API.
- [x] Student registration/login, short-lived access JWTs, hashed refresh-token rotation, logout revocation, and cookie clearing.
- [x] Published course catalog, search/category filtering, course detail, instructor course draft/lesson builder, and publication/moderation states.
- [x] Video multipart upload, durable local queue fallback, BullMQ/Redis queue, FFprobe metadata probing, FFmpeg HLS transcode, output validation, and processing states.
- [x] Enrollment-gated playback, HLS player, progress persistence, server-side quiz grading, and certificate eligibility checks.
- [x] PDF certificate with verification URL/QR code, unique identifier, idempotent issuance, verification endpoint, and admin revocation endpoint.
- [x] Stripe test-mode Checkout/webhook adapter and demo-only payment confirmation; integer minor units and instructor/platform ledger records.
- [x] Instructor earnings and admin overview derive from stored application records.
- [x] Live class scheduling, enrolled join authorization, scoped LiveKit tokens when configured, and UI for audio/video/chat.
- [x] Mongo/Mongoose schema declarations, local development JSON adapter, OpenAPI, architecture diagram, seed data, Docker Compose, and setup docs.
- [x] Instructor onboarding application and approval UI.
- [x] Instructor quiz-authoring UI/API for newly created courses (seeded courses include server-graded quizzes).
- [x] Admin moderation interface for reviewing each pending course and instructor application.
- [x] Local demo with generated HLS media and PDF certificate verification.
- [x] Ten-slide presentation deck with speaker notes paced for a ten-minute walkthrough.
- [ ] Automated end-to-end Playwright student/instructor workflows and screenshot artifacts.
- [ ] Real MongoDB/Redis, AWS S3/CloudFront, Stripe, and LiveKit services have not been configured or verified in this workspace.
- [ ] Individual intern reflections still need to be written by each intern using the provided template.
- [x] Local Git repository initialized on `main` with an initial project commit.
- [x] Repository is intentionally local-only, per the user's choice; no GitHub remote is configured.

## Actual verification results

- `npm run typecheck` — passed for shared package, API, worker, and web.
- `npm test` — passed: 4 API test files / 10 tests and 1 web test file / 2 tests (12 total).
- `npm run build` — passed. The initial web bundle is 414.40 KB (130.40 KB gzip); HLS and LiveKit clients load on demand as 592.56 KB and 577.21 KB chunks. Vite still warns that those optional chunks exceed 500 KB.
- `npm audit` — passed with 0 vulnerabilities after upgrading Vitest to 5.0.5.
- `npm run demo:smoke` — passed the full local API/media path: FFprobe read a 12-second MP4, an HLS segment was 184,804 bytes, unauthorized playlist access returned 401 before enrollment, quiz grading rejected the wrong answer, completion issued a 4,123-byte certificate PDF that verified, and demo checkout confirmed payment.
- Browser check — learner dashboard and course player rendered after fixing a conditional-hook-order issue. The HLS sample reached `readyState 4` at 12.09 seconds and playback time advanced; local media segment requests include the session cookie. No new browser console errors were recorded after the fixes.
- Presentation deck — 10 slides, timed to ten minutes, with speaker notes; package integrity and slide layout validation passed.

## Boundaries

The local JSON store, durable local queue, and demo-only mock payment do not validate real MongoDB, Redis, AWS, Stripe, or LiveKit behavior. Playwright browser journeys, deployed hosting, and individual reflection content remain outstanding. The user chose to keep the repository local-only.

