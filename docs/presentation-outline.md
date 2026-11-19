# 10-Minute Capstone Presentation Deck: FS-03 Learning Management System

**Presenter:** Yuvraj Negi  
**Project:** FS-03 · Fieldnotes Learning Studio (LMS with Live Classes)  
**Evaluation:** Final Internship Capstone Review  
**Allocated Duration:** 10 Minutes  
**Companion Slide Deck:** `deliverables/FS-03-LMS-10-Minute-Presentation-v3.pptx`  

---

## Slide Breakdown & Speaker Timings

### Slide 1: Title & Vision (0:00 - 1:00)
- **Title**: Fieldnotes Learning Studio — Modern Full-Stack LMS with Real-Time Live Classes
- **Presenter**: Yuvraj Negi (Full-Stack Engineering Intern)
- **The Core Problem**: Traditional LMS platforms (Moodle, Blackboard) are clunky, text-heavy, and lack real-time interactive engagement. Modern learners need video lessons, live collaborative studios, auto-grading, and tamper-proof credentials in one cohesive experience.
- **The Solution**: An enterprise-grade online school combining MERN, WebRTC live rooms, FFmpeg BullMQ transcoding, CloudFront streaming, and PDFKit QR certificates.

### Slide 2: Triad Modern Design System Walkthrough (1:00 - 2:30)
- **Design Philosophy**: Rather than a generic UI, the platform integrates three world-class SaaS design languages tailored to each context:
  1. *Notion Design System*: Marketing hero, pastel learning tracks (peach, mint, lavender, sky), course discovery catalog, and syllabus accordions.
  2. *Loom Design System*: Distraction-free 16:9 cinematic video theatre, asymmetric sidebar, timestamped video notes (`01:24`), and WebRTC live studios.
  3. *Linear Design System*: Dark operations command center for student progress streaks, instructor teaching studio, and admin review queues.

### Slide 3: End-to-End System Architecture (2:30 - 4:00)
- **Monorepo Structure**:
  - `@fs03/shared`: Shared TypeScript types, Zod schemas, domain models.
  - `@fs03/api`: Express 5 REST API, JWT session cookies, RBAC middleware, WebSocket signaling.
  - `@fs03/worker`: Decoupled FFmpeg background transcode process with BullMQ and durable local fallback.
  - `@fs03/web`: React 19, Vite, Redux Toolkit, RTK Query.
  - Storage & CDN: Local protected storage with private AWS S3 and CloudFront signed URL adapters.

### Slide 4: Asynchronous Video Transcoding Pipeline (4:00 - 5:30)
- **Deep Dive**: Why video transcoding must never run on HTTP request threads.
- **The Pipeline**:
  1. Instructor uploads MP4/MOV video.
  2. API inspects payload, enforces size caps, stages file, and pushes job to BullMQ queue.
  3. Worker polls job, executes FFprobe diagnostics (codec, duration, audio streams).
  4. FFmpeg generates HLS master playlist (`.m3u8`) and multi-rate transport segments (`.ts`).
  5. Media state transitions: `QUEUED` → `PROCESSING` → `READY`.
  6. Enrolled students stream securely via authorization-gated signed routes.

### Slide 5: Real-Time WebRTC Live Classes & Collaboration (5:30 - 7:00)
- **Interactive Live Rooms**:
  - Multi-peer WebRTC mesh for interactive student-instructor workshops.
  - Scoped LiveKit SFU token generation for large auditorium classrooms.
  - Built-in audio/video track toggles, screen sharing, and persistent classroom chat.
  - Session protection: expired or ended classes immediately block unauthorized join attempts.

### Slide 6: Auto-Graded Quizzes & Tamper-Proof Certificates (7:00 - 8:00)
- **Assessment Integrity**:
  - Server-side grading prevents answer leaking in client network bundles.
  - Passing thresholds (e.g. 80%) enforced before course completion is unlocked.
- **Automated PDF Certificate Issuance**:
  - Dynamically generated using PDFKit.
  - Embeds student name, course title, completion timestamp, unique serial ID, and an encrypted QR verification code.
  - Public verification route (`/verify/:id`) allows employers to instantly validate authenticity.

### Slide 7: Instructor Revenue Dashboard & Financial Ledger (8:00 - 9:00)
- **Earning Analytics**:
  - Multi-split financial accounting tracking gross sales, platform commissions, and instructor net payouts.
  - Stripe webhook reconciliation for checkout sessions and refund events.
  - Learner roster analytics tracking completion percentages and student engagement.

### Slide 8: Verification Results, Future Roadmap & Reflection (9:00 - 10:00)
- **Verified Metrics**:
  - 100% TypeScript typecheck pass across all 4 workspaces.
  - 30 passed unit and domain test cases.
  - Complete integration smoke demo validated (HLS streaming, WebRTC join, quiz grading, PDF generation, payments).
- **Future Improvements**:
  - Multi-bitrate adaptive bitrate (ABR) ladder.
  - Automated Whisper speech-to-text video captioning.
  - Interactive browser coding sandboxes.
