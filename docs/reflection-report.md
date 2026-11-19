# Capstone Individual Reflection Report

**Intern Name:** Yuvraj Negi  
**Email:** zitusyuvraj@gmail.com  
**Track:** Full-Stack Engineering Internship  
**Project:** FS-03 · Learning Management System with Live Classes (Fieldnotes Learning Studio)  
**Submission Date:** November 20, 2026  

---

## 1. What I Owned & Delivered

As the lead full-stack engineer on the Learning Management System with Live Classes capstone, I owned the end-to-end architecture, backend services, streaming media pipeline, and frontend interface:

- **End-to-End System Architecture**: Designed the modular monorepo structure across `@fs03/shared` (Zod schemas, domain types, contracts), `@fs03/api` (Express 5 REST API), `@fs03/worker` (FFmpeg background transcode process), and `@fs03/web` (React 19, TypeScript, Redux Toolkit).
- **Asynchronous Media Processing Pipeline**: Built the background video ingestion queue using BullMQ and Redis (with a durable file queue adapter for zero-infrastructure local development). Integrated FFprobe for structural video validation and FFmpeg for multi-rate HLS transcoding (master `.m3u8` playlists and `.ts` transport stream segments).
- **Secure Content Delivery & Access Control**: Designed authorization-gated video streaming endpoints, ensuring private S3 media assets and CloudFront CDN signed URLs are only accessible by enrolled students.
- **Interactive WebRTC Live Classes**: Implemented real-time interactive virtual classrooms featuring multi-peer audio/video mesh, screen sharing, instructor broadcasting controls, and persistent WebSocket/REST classroom chat.
- **Auto-Graded Quizzes & Progress Engine**: Built the server-side grading engine with tamper-proof submission evaluation, course completion rules, and lesson progress tracking.
- **Cryptographic PDF Certificates**: Developed automated PDF certificate generation using PDFKit, complete with unique certificate serial numbers, student names, completion dates, and scannable QR verification codes mapped to public verification endpoints.
- **Instructor Revenue & Analytics Dashboard**: Built financial ledger calculations tracking gross revenue, platform commission splits, and instructor net payouts with Stripe webhook reconciliation.
- **Modern UI/UX Triad Design Suite**: Implemented a cohesive design system borrowing from world-class SaaS products:
  - *Notion Design System*: For marketing discovery, courses catalog, pastel learning tracks, and course syllabus.
  - *Loom Design System*: For distraction-free 16:9 cinematic video player stages, asymmetric navigation, timestamped video notes, and WebRTC studios.
  - *Linear Design System*: For dark command-center student, instructor, and admin operational dashboards.

---

## 2. Technical Skills Learned & Deepened

- **Asynchronous Job Orchestration with BullMQ & FFmpeg**: Deepened knowledge of distributed background task processing, job lifecycles (waiting, active, completed, failed), backoff retries, and handling CPU-intensive video encoding outside request handlers.
- **HLS Video Streaming Protocol**: Gained thorough proficiency in HTTP Live Streaming (RFC 8216), master playlist composition, video bitrate ladders, keyframe interval alignment (`-g`), and segment delivery over CDNs.
- **WebRTC Peer-to-Peer Communication**: Mastered WebRTC RTCPeerConnection APIs, ICE candidate negotiation, SDP offer/answer exchanges, local/remote media stream handling, and graceful fallback architectures.
- **Full-Stack Type Safety with Zod & TypeScript**: Maintained strict type safety between backend API contracts and frontend RTK Query state management, eliminating runtime deserialization bugs.
- **Clean Architecture & Domain-Driven Design**: Separated domain logic (grading, progress, media states, financial ledgers) from transport layers (Express routes) to ensure high testability and maintainability.

---

## 3. Key Challenges & Technical Decisions

### Challenge 1: CPU-Bound Video Transcoding in High-Throughput Web Services
- **Problem**: Running FFmpeg directly within Express request handlers blocks the Node.js event loop, severely degrading API response latency and risking server crashes when handling large uploads.
- **Options Considered**:
  1. Synchronous child process execution in request handlers.
  2. Cloud-native serverless transcode (AWS MediaConvert).
  3. Standalone decoupled worker service orchestrated via BullMQ and Redis.
- **Decision & Implementation**: Selected the decoupled worker service architecture. Video uploads are written to temporary staging storage and a transcode job is enqueued immediately. The API returns an HTTP 202 Accepted response with the media asset ID. A dedicated worker process executes FFprobe diagnostics and FFmpeg HLS segmentation with concurrency control (`concurrency: 1`), polling media state cleanly back to the client.

### Challenge 2: Client-Side Progress Manipulation & Certificate Fraud
- **Problem**: In naive LMS architectures, clients can send arbitrary API payloads marking lessons complete or generating certificates without watching lectures or passing assessments.
- **Decision & Implementation**: Enforced server-side progress verification. Lesson completion requires verified heartbeat telemetry confirming sufficient watch time. Certificate issuance triggers a strict multi-point rule check: all mandatory lessons must be complete and the course quiz score must meet or exceed the passing threshold (e.g. 80%). The generated PDF certificate embeds a cryptographic hash and a QR code linking directly to an immutable public verification endpoint.

### Challenge 3: Real-Time Multi-User Video Collaboration
- **Problem**: Full mesh WebRTC scales as $O(N^2)$ connections, which can saturate client bandwidth in large groups.
- **Decision & Implementation**: Designed an architecture supporting both direct WebRTC mesh for interactive small-group studio workshops and LiveKit SFU (Selective Forwarding Unit) token issuance for larger classrooms.

---

## 4. Verification & Testing Evidence

All functionality was verified across automated unit tests, domain rule checks, integration smoke suites, and live browser testing:

```powershell
# 1. TypeScript compilation check across all packages:
npm run typecheck
# Result: 0 errors across @fs03/shared, @fs03/api, @fs03/worker, @fs03/web

# 2. Automated domain & component test suites:
npm test
# Result: 30 passed (8 test files, 28 API domain tests + 2 web tests)

# 3. Full end-to-end integration smoke demo:
npm run demo:smoke
# Result: Passed 100%
# - FFprobe duration: 12 seconds
# - HLS segment bytes: 184,804 bytes
# - Private playback before enrollment: HTTP 401 Unauthorized
# - Learner enrollment: HTTP 201 Created
# - Quiz grading: 100% score (wrong answer correctly rejected)
# - Certificate generation: 4,108 byte PDF with valid QR code
# - Public verification: Passed
# - Mock payment ledger: PAID (gross, commission, net recorded)
# - Interactive video notes with timecode synchronization: Verified
# - WebRTC studio session creation & join authorization: Verified
```

---

## 5. What I Would Improve With Another Iteration

1. **Adaptive Bitrate Transcoding (ABR Ladder)**: Extend the worker pipeline to generate multi-variant resolution streams (1080p, 720p, 480p, 360p) with adaptive bandwidth switching based on client network conditions.
2. **Interactive Code Sandboxes**: Embed real-time browser-based code execution environments (e.g. WebContainers or isolated Docker sandboxes) for programming lessons.
3. **Automated AI Video Captioning**: Integrate Whisper speech-to-text models into the transcode worker to automatically generate `.vtt` closed captions and searchable transcripts.
4. **Mobile Responsive PWA**: Implement progressive web app service workers for offline lecture reading and background video caching.
