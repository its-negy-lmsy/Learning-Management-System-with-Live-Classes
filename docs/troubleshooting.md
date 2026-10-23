# Setup and Troubleshooting

## FFmpeg and FFprobe

Run `ffmpeg -version` and `ffprobe -version`. Both executables must be on the API/worker `PATH`. Generate a 12-second fixture with `npm run media:sample`. Upload formats accepted by the API are MP4, WebM, MOV, MKV, and MPEG; the worker still verifies the actual video stream using FFprobe.

If FFmpeg reports an error, inspect the media record failure state and worker console. A failed job remains failed until retry; its source is kept for investigation/retry. Check temporary disk space under `storage/work` and the process memory available to the worker.

## Local mode

With `DEMO_MODE=true` and a blank `REDIS_URL`, the API stores JSON records in `data/dev-store.json`, queues work in `data/jobs/`, and processes files using the separate local worker loop. This mode is single-machine development only. Do not share the local store across API/worker replicas.

## MongoDB and Redis

In configured mode, verify `MONGODB_URI` and `REDIS_URL`, then check `/ready`. The API creates Mongoose collections/indexes at startup. BullMQ uses queue name `media-processing`, job name `process-video`, a stable `mediaId` job ID, three attempts, exponential backoff, and a worker concurrency of one.

## S3 and CloudFront

- Grant only bucket-level `GetObject`, `PutObject`, and required multipart permissions to the relevant API/worker roles; keep the bucket private.
- Confirm AWS region, bucket name, CloudFront origin access, and HLS MIME behavior. Manifest content type is `application/vnd.apple.mpegurl`, segments use `video/mp2t`.
- CloudFront signed URLs require a matching key pair and private key. The worker uploads immutable video segments; the API authorizes access before issuing each signed manifest's segment URLs.
- AWS integration is not verified until real credentials and a distribution have been configured and tested.

## Stripe test mode

Configure a test secret key and webhook signing secret. Forward Stripe events to `/api/v1/payments/webhook`; a browser success URL does not create an enrollment. Check payment status, enrollment, and instructor ledger after the verified webhook arrives. Refund reversals are appended to the ledger; no instructor payout is initiated by this MVP.

## LiveKit

Set the server URL, API key, and secret. The API grants access only to a scheduled room and issues a short-lived token scoped to the authenticated participant and room. The browser needs camera/microphone permission and network access to the LiveKit deployment. Without all three values, scheduling works but room join is intentionally unavailable.

## Common issues

- `401` after a long session: the web app attempts one refresh-token rotation; if the refresh token has expired/revoked, sign in again.
- `403 ENROLLMENT_REQUIRED`: student playback or quiz requires an active enrollment. Public preview lessons are separately accessible.
- `409 MEDIA_NOT_READY`: poll instructor media status until FFmpeg reports `READY`; failed jobs include a safe processing reason.
- `COURSE_INCOMPLETE`: finish every course lesson and pass the configured required quiz before requesting a certificate.
- Port 4100/5174 already in use: change `PORT` or `vite.config.ts` and keep the Vite `/api` proxy pointed at the API port.
