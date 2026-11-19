# Fieldnotes Learning Studio — Learning Management System with Live Classes (FS-03)

> **Zitus Internship Capstone Project FS-03**  
> **Lead Software Engineer:** Yuvraj Negy (Full-Stack Engineering Intern)  
> **Submission Date:** November 20, 2026  
> **Tech Stack:** React 19, TypeScript, Vite, Redux Toolkit, Node.js, Express 5, BullMQ, Redis, FFmpeg HLS VOD, WebRTC (LiveKit), PDFKit, Stripe Connect

[![Tests](https://img.shields.io/badge/tests-30%20passed-brightgreen.svg)](docs/acceptance.md)
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue.svg)](tsconfig.json)
[![Media Engine](https://img.shields.io/badge/FFmpeg-HLS%20Transcoding-orange.svg)](apps/worker)

---

## 1. Executive Summary & Vision

**Fieldnotes Learning Studio** is a full-stack learning platform designed for craftspeople, technical builders, and mindful students. The platform combines on-demand video learning with asynchronous FFmpeg HLS transcoding, interactive WebRTC live classrooms, tamper-proof auto-graded quizzes, scannable cryptographic PDF certificates, and split financial ledgers for instructors.

The platform embraces modern SaaS design languages:
- **Notion Aesthetic**: Course discovery, curriculum outline, and learning tracks.
- **Loom Aesthetic**: Distraction-free 16:9 video player stage with timestamped notes.
- **Linear Aesthetic**: High-density operational dashboards for students, instructors, and admins.

---

## 2. Deliverables Checklist & Directory Structure

All capstone deliverables required for evaluation are located in the `deliverables/` folder:

- **10-Minute Presentation Slide Deck**: [`deliverables/FS-03-LMS-10-Minute-Presentation-v3.pptx`](deliverables/FS-03-LMS-10-Minute-Presentation-v3.pptx)  
  *(Professional 10-slide PowerPoint covering LMS Problem, Architecture, Video Transcoding Pipeline, WebRTC Mesh, Quizzes, Certificates, and Next Steps)*
- **Presentation Companion Deck**: [`deliverables/PRESENTATION_DECK.md`](deliverables/PRESENTATION_DECK.md)
- **Individual Reflection Report**: [`deliverables/INDIVIDUAL_REFLECTION.md`](deliverables/INDIVIDUAL_REFLECTION.md)  
  *(Personal engineering reflection by Yuvraj Negy on background queues, media pipelines, WebRTC, and architectural tradeoffs)*
- **Architecture & API Specification**: [`deliverables/ARCHITECTURE_AND_API_SPEC.md`](deliverables/ARCHITECTURE_AND_API_SPEC.md)
- **High-Resolution Screenshots**: [`deliverables/screenshots/`](deliverables/screenshots/)
  - `01_notion_landing_page.png`: Notion-style course discovery and landing page
  - `02_course_catalog_explore.png`: Filterable course catalog with category pills
  - `03_course_details_syllabus.png`: Comprehensive course syllabus and enrollment CTA
  - `04_linear_student_dashboard.png`: Dark command-center student learning dashboard
  - `05_loom_learning_room_player.png`: Loom-style 16:9 video player with timestamped notes
  - `06_instructor_teaching_studio.png`: Instructor course management and video uploader
  - `07_admin_operations_center.png`: Admin platform operations, revenue, and metrics

---

## 3. What runs in the local demo

- React 19 + TypeScript + Vite, React Router, Redux Toolkit, and RTK Query.
- Express 5 + TypeScript REST API with MongoDB/Mongoose production persistence, session-cookie JWT auth, role checks, Zod validation, and OpenAPI/Swagger UI.
- BullMQ + Redis video work when `REDIS_URL` is configured. The no-infrastructure demo uses a durable file-backed job queue and the same separate FFmpeg worker processor.
- FFprobe media validation and FFmpeg HLS VOD playlists/segments. Local mode persists protected outputs under `storage/processed/`; configured S3 media stays private and CloudFront assets receive signed URLs.
- Server-side quiz grading, lesson progress, certificate eligibility, PDF generation, a verified Stripe webhook path, and a demo-only mock checkout.
- Live class scheduling and scoped LiveKit room token issuance when credentials are present. Scheduling remains usable without credentials; the app reports that audio/video/chat are not connected.

The local JSON store, local queue, and mock payment completion are explicit development adapters. They do not claim to be production MongoDB/Redis, real bank transfers, an AWS deployment, or a live WebRTC call.

## Requirements

- Node.js 22.12 or newer and npm 10 or newer.
- FFmpeg and FFprobe available on `PATH` for video processing.
- Optional: MongoDB 7/8 and Redis 7, AWS S3/CloudFront credentials, Stripe test keys, and a LiveKit project.

## Quick start without Docker or cloud credentials

1. Copy `.env.example` to `.env`. Keep `DEMO_MODE=true`, `REDIS_URL=` blank, and `SEED_DEMO=true` for the local demo.
2. Install packages and build the shared contract package:

   ```powershell
   npm install
   npm run build --workspace @fs03/shared
   ```

3. Start the API, web app, and separate media worker:

   ```powershell
   npm run dev
   ```

4. Open [http://localhost:5174](http://localhost:5174). Swagger UI is at [http://localhost:4100/api/docs](http://localhost:4100/api/docs).

Demo accounts (development only):

- Learner: `learner@fs03.demo` / `LearnFS03!Local`
- Instructor: `teacher@fs03.demo` / `TeachFS03!Local`

Seed data is created on first API start. The administrator is never seeded with a default password. Set `ADMIN_BOOTSTRAP_EMAIL` and a unique `ADMIN_BOOTSTRAP_PASSWORD` of at least 14 characters, then run `npm run create-admin`; remove the bootstrap password afterward.

To exercise the real local video pipeline, run `npm run media:sample`, sign in as the instructor, create a draft course and lesson, then upload `storage/samples/fs03-sample.mp4`. The worker probes and transcodes this 12-second MP4 into an HLS playlist and segment. Publish the course, enroll as a learner, and open the lesson. Playback is served through authorization-checked API routes.

## MongoDB and BullMQ mode

Start MongoDB and Redis with `docker compose up -d mongo redis` where Docker is available. Set `DEMO_MODE=false`, set `MONGODB_URI=mongodb://127.0.0.1:27017/fs03`, and set `REDIS_URL=redis://127.0.0.1:6379`. Restart API and worker. The API creates declared collections and indexes. Demo seed data is not inserted in production mode; seed demo records manually only in a non-production environment.

The worker runs as a separately deployable persistent process:

```powershell
npm run build
npm --workspace @fs03/worker run start
```

Do not run FFmpeg in request handlers or serverless functions. Set worker concurrency to one by default; increase it only after allocating CPU, memory, and temporary disk for concurrent transcodes.

## Key commands

| Command | Purpose |
|---|---|
| `npm run dev` | API + Vite + independent worker |
| `npm run build` | Shared types, API, worker entrypoint, and production web bundle |
| `npm run typecheck` | TypeScript checks for all workspaces |
| `npm test` | Domain-rule tests and web test suite |
| `npm run seed` | Idempotently seed a non-production local/Mongo environment |
| `npm run create-admin` | Create a privileged admin from explicitly supplied bootstrap credentials |
| `npm run media:sample` | Generate a local 12-second MP4 using FFmpeg |

## Demo workflow

1. Explore the seeded published catalog and open a course page.
2. Sign in as the teacher, create a course, add a lesson, and upload the generated MP4.
3. Watch its media status move from queued to processing to ready. The playlist and segments are written only after FFmpeg succeeds.
4. Publish the draft, sign in as a learner, enroll in the free course, and watch its lesson. Progress is persisted via playback heartbeats; an API payload alone cannot directly mark a lesson complete.
5. Submit the course quiz. The backend returns a score and pass result.
6. When all lesson and required quiz rules are satisfied, issue and download a generated PDF certificate. Its verification URL exposes only intended certificate fields.
7. For paid seeded courses, use the explicitly demo-only confirm action; the API writes gross, platform commission, and instructor net ledger entries.
8. Schedule a live class. To join audio/video/chat, configure LiveKit; without it, the schedule remains saved and join explains the missing setup.

## Configuration

See [.env.example](.env.example). Important variables:

- `DEMO_MODE`, `MONGODB_URI`, and `REDIS_URL` select the local demo or configured persistence/queue adapters.
- `UPLOAD_MAX_MB` caps instructor video uploads; the worker also rejects missing video streams, unprobeable inputs, durations under one second, or videos longer than six hours.
- `AWS_S3_BUCKET` and AWS credentials enable private source/output storage. `CLOUDFRONT_DOMAIN`, key-pair ID, and private key enable signed CDN asset URLs. Use least-privilege IAM and a private S3 origin.
- `STRIPE_SECRET_KEY` plus `STRIPE_WEBHOOK_SECRET` enables Checkout and signature-verified `checkout.session.completed`, expired, and refund events. Use Stripe test-mode credentials until ready to configure production.
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` enable short-lived room-scoped tokens.
- `ADMIN_BOOTSTRAP_*` are used once for admin setup; never commit them.

## Architecture and API documents

- [Architecture, API inventory, and video job sequence](docs/architecture.md)
- [Data model and indexes](docs/data-model.md)
- [OpenAPI 3.1 YAML](apps/api/openapi.yaml)
- [Implementation and verification plan](docs/implementation-plan.md)
- [Local/deployment limitations](docs/troubleshooting.md)
- [10-minute presentation outline](docs/presentation-outline.md)
- [10-minute editable presentation deck](deliverables/FS-03-LMS-10-Minute-Presentation-v3.pptx)
- [Individual reflection template](docs/reflection-template.md)
- [Acceptance checklist and test record](docs/acceptance.md)

## Security notes

- Registration can create student accounts only. Instructor and admin privileges are granted through server-side onboarding/administration workflows.
- Access JWTs are short-lived HttpOnly cookies. Refresh tokens are random, hashed at rest, single-use, rotated, and revocable.
- Video assets are private by default; local playback checks lesson preview, instructor ownership, or active enrollment for the playlist and each segment.
- The browser never receives payment confirmation authority. Stripe webhooks are signature verified and idempotent; mock confirmation is unavailable unless demo mode is active.
- Quiz answer keys stay server-side before submission. Certificates derive from enrollment, all required lesson progress, and required passing attempts.
- This is a capstone starter, not a third-party security audit. Configure TLS, real secret management, email verification/reset, backups, logging retention, and rate limits before public launch.
