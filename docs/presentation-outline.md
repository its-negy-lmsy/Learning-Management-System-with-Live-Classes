# 10-minute Capstone Presentation

1. **Problem and audience — 1 min:** Explain the fragmented student journey and the need for instructor tools, verified progress, and live interaction.
2. **Product walkthrough — 2 min:** Show catalog/course details, learner dashboard, player/progress, quiz, and certificate verification.
3. **Architecture — 1.5 min:** Walk through React/RTK Query, Express API, MongoDB, BullMQ/Redis, separate FFmpeg worker, private S3/CloudFront, Stripe, and LiveKit.
4. **Vertical slice and media — 1.5 min:** Create a lesson, upload the generated sample, show queued/processing/ready states, HLS manifest and playable segments.
5. **Security and data — 1 min:** Demonstrate role checks, refresh rotation, enrollment-gated playback, server grading/completion, signed webhooks, and certificate verification.
6. **Results — 1 min:** Share only the actual test/build output and identify which integrations ran locally versus which require credentials.
7. **Challenges and tradeoffs — 1 min:** Explain asynchronous transcoding, progress integrity, payout accounting, and how local adapters support development.
8. **Next steps — 1 min:** Connect cloud/provider credentials, run Playwright workflows, add email verification/password recovery, improve analytics, and deploy API/worker/web independently.

The editable ten-slide deck at `deliverables/FS-03-LMS-10-Minute-Presentation-v3.pptx` includes speaker notes with the timings above and the measured local results. The demo is local; cloud and provider integrations are clearly marked as unverified.
