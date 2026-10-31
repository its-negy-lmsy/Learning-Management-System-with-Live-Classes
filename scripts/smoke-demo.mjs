const origin = process.env.SMOKE_API_URL ?? "http://localhost:4100";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function assert(condition, message) { if (!condition) throw new Error(message); }

async function request(path, { method = "GET", body, cookies = "" } = {}) {
  const headers = {};
  if (cookies) headers.Cookie = cookies;
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  const response = await fetch(`${origin}/api/v1${path}`, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : undefined; } catch { data = text; }
  return { response, data };
}

async function signIn(email, password) {
  const { response, data } = await request("/auth/login", { method: "POST", body: { email, password } });
  assert(response.ok, `Sign-in failed: ${JSON.stringify(data)}`);
  const cookies = response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");
  assert(cookies.includes("fs03_access="), "Access cookie was not set.");
  assert(cookies.includes("fs03_refresh="), "Refresh cookie was not set.");
  return cookies;
}

async function main() {
  const health = await fetch(`${origin}/health`);
  assert(health.ok, "API health endpoint is unavailable.");
  const catalog = await request("/courses");
  assert(catalog.response.ok && catalog.data.total >= 3, "Seeded course catalog is not available.");
  const instructor = await signIn("teacher@fs03.demo", "TeachFS03!Local");
  const learner = await signIn("learner@fs03.demo", "LearnFS03!Local");
  const suffix = Date.now().toString().slice(-6);
  const created = await request("/instructor/courses", { method: "POST", cookies: instructor, body: { title: `A real workflow ${suffix}`, subtitle: "A small end to end learning demo", description: "A short course created by the instructor to exercise lesson upload, real video conversion, learner progress, quizzes, and certificates.", category: "Development", level: "Beginner", language: "English", priceMinor: 0, currency: "USD", thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80", outcomes: ["Follow a working learning workflow"], prerequisites: [] } });
  assert(created.response.status === 201, `Course draft creation failed: ${JSON.stringify(created.data)}`);
  const course = created.data.course;
  const lessonResult = await request(`/instructor/courses/${course.id}/lessons`, { method: "POST", cookies: instructor, body: { title: "A real sample lesson", durationSeconds: 30, preview: false, newSectionTitle: "Start here" } });
  assert(lessonResult.response.status === 201, `Lesson creation failed: ${JSON.stringify(lessonResult.data)}`);
  const lesson = lessonResult.data.sections[0].lessons[0];
  const quizResult = await request(`/instructor/courses/${course.id}/quiz`, { method: "POST", cookies: instructor, body: { title: "One useful check", passPercent: 70, required: true, questions: [{ prompt: "Where should quiz grading happen?", options: ["In the API", "Only in the browser"], correctOptionIndex: 0 }] } });
  assert(quizResult.response.status === 201, `Quiz creation failed: ${JSON.stringify(quizResult.data)}`);
  const sampleResponse = await fetch(`${origin}/api/v1/dev/sample-video`);
  assert(sampleResponse.ok, "Run npm run media:sample before the smoke workflow.");
  const sample = new Blob([await sampleResponse.arrayBuffer()], { type: "video/mp4" });
  const form = new FormData(); form.set("video", sample, "fs03-sample.mp4");
  const upload = await request(`/instructor/lessons/${lesson.id}/media`, { method: "POST", body: form, cookies: instructor });
  assert(upload.response.status === 202, `Video upload failed: ${JSON.stringify(upload.data)}`);
  const mediaId = upload.data.media.id;
  let media;
  for (let attempt = 0; attempt < 100; attempt++) {
    await sleep(350);
    const status = await request(`/media/${mediaId}`, { cookies: instructor });
    media = status.data.media;
    if (media.status === "READY" || media.status === "FAILED") break;
  }
  assert(media?.status === "READY", `FFmpeg processing did not finish successfully: ${JSON.stringify(media)}`);
  assert(media.metadata?.durationSeconds >= 11 && media.metadata?.durationSeconds <= 13, "FFprobe duration metadata is unexpected.");
  const published = await request(`/instructor/courses/${course.id}/publish`, { method: "POST", cookies: instructor, body: { publishImmediately: true } });
  assert(published.response.ok && published.data.course.status === "PUBLISHED", "Instructor course publication failed.");

  const unauthenticated = await request(`/media/${mediaId}/playlist`);
  assert(unauthenticated.response.status === 401, "A private lesson playlist was accessible before enrollment.");
  const enrollment = await request(`/courses/${course.id}/enroll`, { method: "POST", cookies: learner });
  assert(enrollment.response.status === 201, `Learner enrollment failed: ${JSON.stringify(enrollment.data)}`);
  const playlist = await request(`/media/${mediaId}/playlist`, { cookies: learner });
  assert(playlist.response.ok && playlist.response.headers.get("content-type")?.includes("mpegurl"), "Authorized HLS playlist was unavailable.");
  const segmentUrl = playlist.data.split(/\r?\n/).find((line) => line.endsWith(".ts"));
  assert(segmentUrl, "The HLS playlist did not contain a media segment.");
  const segment = await fetch(segmentUrl, { headers: { Cookie: learner } });
  assert(segment.ok && Number(segment.headers.get("content-length") ?? "0") > 0, "The generated HLS segment could not be read.");
  const forbiddenDraft = await request("/instructor/courses", { method: "POST", cookies: learner, body: {} });
  assert(forbiddenDraft.response.status === 403, "A student was able to access an instructor route.");

  await request(`/lessons/${lesson.id}/progress`, { method: "POST", cookies: learner, body: { courseId: course.id, positionSeconds: 0, playing: true } });
  await sleep(6000);
  await request(`/lessons/${lesson.id}/progress`, { method: "POST", cookies: learner, body: { courseId: course.id, positionSeconds: 6, playing: true } });
  await sleep(5000);
  const progress = await request(`/lessons/${lesson.id}/progress`, { method: "POST", cookies: learner, body: { courseId: course.id, positionSeconds: 11, playing: true } });
  assert(progress.data.progress.completedAt, "Playback time did not persist as a completed lesson.");
  // Use the question ID returned by the instructor quiz view, not client-supplied grading data.
  const quizView = await request(`/courses/${course.id}/quiz`, { cookies: learner });
  const questionId = quizView.data.quiz.questions[0].id;
  const wrongAttempt = await request(`/courses/${course.id}/quiz/attempts`, { method: "POST", cookies: learner, body: { answers: { [questionId]: 1 } } });
  assert(wrongAttempt.response.status === 201 && !wrongAttempt.data.attempt.passed, "Incorrect answers were not graded as failed.");
  const attempt = await request(`/courses/${course.id}/quiz/attempts`, { method: "POST", cookies: learner, body: { answers: { [questionId]: 0 } } });
  assert(attempt.response.status === 201 && attempt.data.attempt.passed, `Quiz was not graded as expected: ${JSON.stringify(attempt.data)}`);
  const learning = await request(`/courses/${course.id}/learning`, { cookies: learner });
  assert(learning.data.completion.completed, "Backend completion calculation did not accept the finished lesson and passed quiz.");
  const certificate = await request(`/courses/${course.id}/certificate`, { method: "POST", cookies: learner });
  assert(certificate.response.status === 201, `Certificate issuance failed: ${JSON.stringify(certificate.data)}`);
  const pdf = await fetch(`${origin}/api/v1/me/certificates/${certificate.data.certificate.id}.pdf`, { headers: { Cookie: learner } });
  assert(pdf.ok && pdf.headers.get("content-type")?.includes("application/pdf"), "Certificate PDF did not download.");
  const verified = await request(`/certificates/${certificate.data.certificate.certificateNumber}/verify`);
  assert(verified.response.ok && verified.data.valid, "Public certificate verification failed.");
  
  // Use a fresh buyer account for checkout verification to guarantee idempotency across repeated test runs
  const buyerEmail = `buyer_${Date.now()}@fs03.demo`;
  const buyerRegister = await request("/auth/register", { method: "POST", body: { name: "Test Buyer", email: buyerEmail, password: "LearnFS03!Local" } });
  const buyerCookies = buyerRegister.response.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  const paidCourse = catalog.data.courses.find((item) => item.priceMinor > 0);
  const checkout = await request(`/courses/${paidCourse.id}/checkout`, { method: "POST", cookies: buyerCookies });
  assert(checkout.response.status === 201 && checkout.data.mock, `Demo test checkout was not created: ${JSON.stringify(checkout.data)}`);
  const confirmation = await request(`/payments/${checkout.data.payment.id}/mock-confirm`, { method: "POST", cookies: buyerCookies });
  assert(confirmation.response.ok && confirmation.data.payment.status === "PAID", "Demo payment confirmation failed.");

  // Test Downloadable Lesson Resources
  const addResource = await request(`/instructor/courses/${course.id}/lessons/${lesson.id}/resources`, {
    method: "POST",
    cookies: instructor,
    body: { title: "Course Cheatsheet", url: "https://example.com/cheatsheet.pdf", type: "pdf", sizeLabel: "1.2 MB" }
  });
  assert(addResource.response.status === 201 && addResource.data.resources?.length > 0, "Lesson resource addition failed.");

  // Test Course Announcements
  const postAnnouncement = await request(`/instructor/courses/${course.id}/announcements`, {
    method: "POST",
    cookies: instructor,
    body: { title: "Welcome learners!", content: "Office hours and live practice sessions are now open." }
  });
  assert(postAnnouncement.response.status === 201, "Instructor announcement posting failed.");
  const announcements = await request(`/courses/${course.id}/announcements`);
  assert(announcements.response.ok && announcements.data.announcements?.length > 0, "Public announcements retrieval failed.");

  // Test Interactive Video Notes
  const createNote = await request(`/courses/${course.id}/lessons/${lesson.id}/notes`, {
    method: "POST",
    cookies: learner,
    body: { timestampSeconds: 5, text: "Key note: Always validate inputs at the system edge." }
  });
  assert(createNote.response.status === 201 && createNote.data.note?.text.includes("validate"), "Interactive note creation failed.");
  const notes = await request(`/courses/${course.id}/lessons/${lesson.id}/notes`, { cookies: learner });
  assert(notes.response.ok && notes.data.notes?.length > 0, "Lesson notes retrieval failed.");

  // Test Course Review & Rating Submission
  const submitReview = await request(`/courses/${course.id}/reviews`, {
    method: "POST",
    cookies: learner,
    body: { rating: 5, comment: "Outstanding structured curriculum and practical exercises!" }
  });
  assert(submitReview.response.status === 201 && submitReview.data.review.rating === 5, "Course review submission failed.");
  const reviews = await request(`/courses/${course.id}/reviews`);
  assert(reviews.response.ok && reviews.data.stats.totalReviews >= 1, "Course reviews retrieval and statistics calculation failed.");

  // Test Instructor Learner Completion Analytics
  const learnerAnalytics = await request(`/instructor/courses/${course.id}/learners`, { cookies: instructor });
  assert(learnerAnalytics.response.ok && learnerAnalytics.data.learners?.length > 0, "Instructor learner analytics failed.");

  const pdfBytes = await pdf.arrayBuffer();
  console.log(JSON.stringify({
    status: "passed",
    api: origin,
    seededCatalogCourses: catalog.data.total,
    course: course.title,
    ffprobeDurationSeconds: media.metadata.durationSeconds,
    hlsSegmentBytes: Number(segment.headers.get("content-length")),
    privatePlaylistBeforeEnrollment: unauthenticated.response.status,
    learnerEnrollment: enrollment.response.status,
    wrongQuizAnswerPassed: wrongAttempt.data.attempt.passed,
    quizScorePercent: attempt.data.attempt.scorePercent,
    completion: learning.data.completion.completed,
    certificatePdfBytes: pdfBytes.byteLength,
    certificateVerification: verified.data.valid,
    mockPayment: confirmation.data.payment.status,
    lessonResourcesCount: addResource.data.resources.length,
    announcementsCount: announcements.data.announcements.length,
    interactiveNotesCount: notes.data.notes.length,
    verifiedReviewAverage: reviews.data.stats.averageRating,
    enrolledLearnerAnalytics: learnerAnalytics.data.learners.length,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
