import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { all, get, insert, update } from "../db/store.js";
import { config } from "../config.js";
import { id, now } from "../utils/ids.js";
import { allowRoles, authenticate } from "../utils/auth.js";
import { asyncRoute, HttpError, pathParam } from "../utils/http.js";
import { requireCourse, requireEnrollment, type CourseRecord } from "./course-utils.js";

type Payment = { id: string; studentId: string; courseId: string; instructorId: string; amountMinor: number; currency: string; provider: string; providerRef?: string; paymentIntentId?: string; status: "PENDING" | "PAID" | "FAILED" | "REFUNDED"; createdAt: string; paidAt?: string };
type Enrollment = { id: string; studentId: string; courseId: string; paymentId?: string; status: string; createdAt: string };
type Ledger = { id: string; paymentId: string; courseId: string; instructorId: string; studentId: string; kind: string; amountMinor: number; currency: string; createdAt: string };
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : undefined;

async function settle(payment: Payment, paymentIntentId?: string) {
  const current = await get<Payment>("payments", payment.id);
  if (!current) throw new HttpError(404, "PAYMENT_NOT_FOUND", "We couldn't find that payment.");
  if (current.status === "PAID") return current;
  if (current.status !== "PENDING") throw new HttpError(409, "PAYMENT_NOT_PENDING", "This payment can no longer be confirmed.");
  const paidAt = now();
  const paid = await update<Payment>("payments", current.id, { status: "PAID", paidAt, paymentIntentId });
  const enrollment = (await all<Enrollment>("enrollments")).find((item) => item.courseId === current.courseId && item.studentId === current.studentId && item.status === "ACTIVE");
  if (!enrollment) await insert<Enrollment>("enrollments", { id: id(), studentId: current.studentId, courseId: current.courseId, paymentId: current.id, status: "ACTIVE", createdAt: paidAt });
  const priorLedger = (await all<Ledger>("ledger_entries")).filter((entry) => entry.paymentId === current.id);
  if (!priorLedger.length) {
    const feeMinor = Math.round(current.amountMinor * 20 / 100);
    const common = { paymentId: current.id, courseId: current.courseId, instructorId: current.instructorId, studentId: current.studentId, currency: current.currency, createdAt: paidAt };
    await insert<Ledger>("ledger_entries", { id: id(), ...common, kind: "GROSS_SALE", amountMinor: current.amountMinor });
    await insert<Ledger>("ledger_entries", { id: id(), ...common, kind: "PLATFORM_COMMISSION", amountMinor: feeMinor });
    await insert<Ledger>("ledger_entries", { id: id(), ...common, kind: "INSTRUCTOR_NET", amountMinor: current.amountMinor - feeMinor });
  }
  return paid;
}

export const paymentsRouter = Router();
paymentsRouter.post("/courses/:courseId/checkout", authenticate, allowRoles("STUDENT"), asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  if (course.status !== "PUBLISHED") throw new HttpError(404, "COURSE_NOT_FOUND", "We couldn't find that course.");
  if (course.priceMinor <= 0) throw new HttpError(400, "FREE_COURSE", "Use free enrollment for this course.");
  const enrollment = (await all<Enrollment>("enrollments")).find((item) => item.courseId === course.id && item.studentId === req.user!.id && item.status === "ACTIVE");
  if (enrollment) { res.json({ enrolled: true, enrollment }); return; }
  let payment = (await all<Payment>("payments")).find((item) => item.courseId === course.id && item.studentId === req.user!.id && item.status === "PENDING");
  if (!payment) {
    payment = { id: id(), studentId: req.user!.id, courseId: course.id, instructorId: course.instructorId, amountMinor: course.priceMinor, currency: course.currency, provider: stripe ? "stripe" : "mock", status: "PENDING", createdAt: now() };
    await insert("payments", payment);
  }
  if (stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment", client_reference_id: payment.id,
      line_items: [{ quantity: 1, price_data: { currency: course.currency.toLowerCase(), unit_amount: course.priceMinor, product_data: { name: course.title, description: course.subtitle } } }],
      metadata: { paymentId: payment.id, courseId: course.id, studentId: req.user!.id },
      success_url: `${config.webOrigin}/checkout/return?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.webOrigin}/course/${course.id}?payment=cancelled`,
    });
    await update<Payment>("payments", payment.id, { provider: "stripe", providerRef: session.id });
    res.status(201).json({ payment: { ...payment, provider: "stripe", providerRef: session.id }, checkoutUrl: session.url });
    return;
  }
  if (!config.demoMode) throw new HttpError(503, "PAYMENT_UNAVAILABLE", "Payment credentials are not configured.");
  res.status(201).json({ payment, mock: true, message: "Demo checkout is ready. Complete it from the local checkout screen." });
}));

paymentsRouter.post("/payments/:paymentId/mock-confirm", authenticate, allowRoles("STUDENT"), asyncRoute(async (req, res) => {
  if (!config.demoMode || stripe) throw new HttpError(404, "NOT_FOUND", "This payment action is not available.");
  const payment = await get<Payment>("payments", pathParam(req, "paymentId"));
  if (!payment || payment.studentId !== req.user!.id) throw new HttpError(404, "PAYMENT_NOT_FOUND", "We couldn't find that payment.");
  res.json({ payment: await settle(payment) });
}));

paymentsRouter.get("/me/payments", authenticate, asyncRoute(async (req, res) => {
  const payments = (await all<Payment>("payments")).filter((payment) => payment.studentId === req.user!.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const courses = await all<CourseRecord>("courses");
  res.json({ payments: payments.map((payment) => ({ ...payment, providerRef: undefined, paymentIntentId: undefined, courseTitle: courses.find((course) => course.id === payment.courseId)?.title })) });
}));

paymentsRouter.get("/instructor/earnings", authenticate, allowRoles("INSTRUCTOR"), asyncRoute(async (req, res) => {
  const entries = (await all<Ledger>("ledger_entries")).filter((entry) => entry.instructorId === req.user!.id);
  const payments = await all<Payment>("payments");
  const courses = await all<CourseRecord>("courses");
  const grossMinor = entries.filter((entry) => entry.kind === "GROSS_SALE").reduce((sum, entry) => sum + entry.amountMinor, 0);
  const platformFeeMinor = entries.filter((entry) => entry.kind === "PLATFORM_COMMISSION").reduce((sum, entry) => sum + entry.amountMinor, 0);
  const instructorNetMinor = entries.filter((entry) => entry.kind === "INSTRUCTOR_NET").reduce((sum, entry) => sum + entry.amountMinor, 0);
  res.json({ grossMinor, platformFeeMinor, instructorNetMinor, settledMinor: 0, pendingPayoutMinor: instructorNetMinor, payoutsConfigured: false, transactions: payments.filter((payment) => payment.instructorId === req.user!.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((payment) => ({ paymentId: payment.id, courseTitle: courses.find((course) => course.id === payment.courseId)?.title, amountMinor: payment.amountMinor, currency: payment.currency, status: payment.status, date: payment.paidAt ?? payment.createdAt, instructorNetMinor: entries.find((entry) => entry.paymentId === payment.id && entry.kind === "INSTRUCTOR_NET")?.amountMinor ?? 0 })) });
}));

paymentsRouter.get("/instructor/analytics", authenticate, allowRoles("INSTRUCTOR"), asyncRoute(async (req, res) => {
  const courses = (await all<CourseRecord>("courses")).filter((course) => course.instructorId === req.user!.id);
  const courseIds = new Set(courses.map((course) => course.id));
  const [enrollments, progress, attempts, attendance] = await Promise.all([all<{ courseId: string; studentId: string; status: string }>("enrollments"), all<{ courseId: string; studentId: string; completedAt?: string }>("lesson_progress"), all<{ courseId: string; passed: boolean; scorePercent: number }>("quiz_attempts"), all<{ sessionId: string; userId: string }>("live_attendance")]);
  const activeEnrollments = enrollments.filter((item) => courseIds.has(item.courseId) && item.status === "ACTIVE");
  const studentIds = new Set(activeEnrollments.map((item) => item.studentId));
  const courseAnalytics = courses.map((course) => {
    const enrolled = activeEnrollments.filter((item) => item.courseId === course.id);
    const learnerProgress = progress.filter((item) => item.courseId === course.id && item.completedAt);
    const lessonCount = course.sections.reduce((sum, section) => sum + section.lessons.length, 0);
    const attemptsForCourse = attempts.filter((attempt) => attempt.courseId === course.id);
    return { courseId: course.id, title: course.title, status: course.status, enrollments: enrolled.length, completionRatePercent: enrolled.length && lessonCount ? Math.round(learnerProgress.length / (enrolled.length * lessonCount) * 100) : 0, quizAttempts: attemptsForCourse.length, quizPassRatePercent: attemptsForCourse.length ? Math.round(attemptsForCourse.filter((attempt) => attempt.passed).length / attemptsForCourse.length * 100) : 0 };
  });
  const sessions = (await all<{ id: string; courseId: string }>("live_classes")).filter((session) => courseIds.has(session.courseId));
  const sessionIds = new Set(sessions.map((session) => session.id));
  res.json({ totalCourses: courses.length, publishedCourses: courses.filter((course) => course.status === "PUBLISHED").length, totalEnrollments: activeEnrollments.length, activeLearners: studentIds.size, completedLessons: progress.filter((item) => courseIds.has(item.courseId) && item.completedAt).length, liveClassParticipants: attendance.filter((item) => sessionIds.has(item.sessionId)).length, courses: courseAnalytics });
}));

paymentsRouter.post("/instructor/courses/:courseId/live-classes", authenticate, allowRoles("INSTRUCTOR"), asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  if (course.instructorId !== req.user!.id) throw new HttpError(403, "FORBIDDEN", "You can only schedule a class for your own course.");
  const input = z.object({ title: z.string().trim().min(4).max(120), startsAt: z.iso.datetime(), durationMinutes: z.number().int().min(15).max(240), description: z.string().trim().max(500).optional() }).parse(req.body);
  if (new Date(input.startsAt).getTime() < Date.now() - 60_000) throw new HttpError(400, "INVALID_START", "Choose a start time in the future.");
  const session = { id: id(), courseId: course.id, instructorId: req.user!.id, title: input.title, description: input.description, startsAt: input.startsAt, endsAt: new Date(new Date(input.startsAt).getTime() + input.durationMinutes * 60000).toISOString(), durationMinutes: input.durationMinutes, roomName: `fs03-${id().replaceAll("-", "")}`, status: "SCHEDULED", createdAt: now() };
  await insert("live_classes", session);
  res.status(201).json({ session, providerConfigured: Boolean(config.livekitUrl && config.livekitApiKey && config.livekitApiSecret) });
}));

paymentsRouter.get("/courses/:courseId/live-classes", authenticate, asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  if (req.user!.role === "STUDENT") await requireEnrollment(course.id, req.user!.id);
  else if (req.user!.role === "INSTRUCTOR" && req.user!.id !== course.instructorId) throw new HttpError(403, "FORBIDDEN", "You cannot view this class schedule.");
  const sessions = (await all<{ courseId: string; startsAt: string } & Record<string, unknown>>("live_classes")).filter((session) => session.courseId === course.id).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  res.json({ sessions, providerConfigured: Boolean(config.livekitUrl && config.livekitApiKey && config.livekitApiSecret) });
}));

paymentsRouter.post("/live-classes/:sessionId/join", authenticate, asyncRoute(async (req, res) => {
  const session = await get<{ id: string; courseId: string; instructorId: string; roomName: string; title: string; startsAt: string; endsAt: string; status: string }>("live_classes", pathParam(req, "sessionId"));
  if (!session) throw new HttpError(404, "SESSION_NOT_FOUND", "We couldn't find that class.");
  const course = await requireCourse(session.courseId);
  if (req.user!.id !== session.instructorId && req.user!.role !== "ADMIN") await requireEnrollment(course.id, req.user!.id);
  const nowMs = Date.now();
  if (nowMs < new Date(session.startsAt).getTime() - 15 * 60_000 || nowMs > new Date(session.endsAt).getTime() + 15 * 60_000 || session.status === "CANCELLED") throw new HttpError(409, "SESSION_UNAVAILABLE", "This class is not open for joining right now.");
  if (!config.livekitUrl || !config.livekitApiKey || !config.livekitApiSecret) throw new HttpError(503, "LIVE_PROVIDER_UNAVAILABLE", "LiveKit is not configured yet. The session schedule is saved and ready for provider setup.");
  const { AccessToken } = await import("livekit-server-sdk");
  const token = new AccessToken(config.livekitApiKey, config.livekitApiSecret, { identity: req.user!.id, name: req.user!.name, ttl: "45m" });
  token.addGrant({ roomJoin: true, room: session.roomName, canPublish: true, canSubscribe: true, canPublishData: true });
  const jwt = await token.toJwt();
  const attendance = (await all<{ id: string; sessionId: string; userId: string; joinedAt: string }>("live_attendance")).find((item) => item.sessionId === session.id && item.userId === req.user!.id);
  if (attendance) await update<{ id: string; joinedAt: string }>("live_attendance", attendance.id, { joinedAt: now() });
  else await insert("live_attendance", { id: id(), sessionId: session.id, userId: req.user!.id, joinedAt: now() });
  res.json({ url: config.livekitUrl, token: jwt, session: { id: session.id, title: session.title } });
}));

paymentsRouter.post("/live-classes/:sessionId/end", authenticate, allowRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const session = await get<{ id: string; instructorId: string; status: string }>("live_classes", pathParam(req, "sessionId"));
  if (!session) throw new HttpError(404, "SESSION_NOT_FOUND", "We couldn't find that class.");
  if (session.instructorId !== req.user!.id && req.user!.role !== "ADMIN") throw new HttpError(403, "FORBIDDEN", "Only the class instructor can end it.");
  const updated = await update<{ id: string; status: string; endedAt?: string }>("live_classes", session.id, { status: "ENDED", endedAt: now() });
  res.json({ session: updated });
}));

export async function stripeWebhookHandler(req: Request, res: Response) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) { res.status(503).json({ error: "Stripe webhook is not configured." }); return; }
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"] ?? "", process.env.STRIPE_WEBHOOK_SECRET); }
  catch { res.status(400).json({ error: "Invalid webhook signature." }); return; }
  if ((await all<{ id: string; eventId: string }>("stripe_events")).some((item) => item.eventId === event.id)) { res.json({ received: true, duplicate: true }); return; }
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const payment = await get<Payment>("payments", String(session.metadata?.paymentId ?? ""));
      if (payment && session.payment_status === "paid" && session.amount_total === payment.amountMinor && session.currency?.toUpperCase() === payment.currency.toUpperCase()) await settle(payment, typeof session.payment_intent === "string" ? session.payment_intent : undefined);
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const payment = await get<Payment>("payments", String(session.metadata?.paymentId ?? ""));
      if (payment?.status === "PENDING") await update<Payment>("payments", payment.id, { status: "FAILED" });
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const payment = (await all<Payment>("payments")).find((item) => item.paymentIntentId === charge.payment_intent);
      if (payment?.status === "PAID") {
        await update<Payment>("payments", payment.id, { status: "REFUNDED" });
        const existing = (await all<Ledger>("ledger_entries")).filter((entry) => entry.paymentId === payment.id);
        for (const entry of existing) await insert<Ledger>("ledger_entries", { ...entry, id: id(), kind: `REFUND_${entry.kind}`, amountMinor: -entry.amountMinor, createdAt: now() });
        const enrollment = (await all<Enrollment>("enrollments")).find((item) => item.courseId === payment.courseId && item.studentId === payment.studentId);
        if (enrollment) await update<Enrollment>("enrollments", enrollment.id, { status: "REFUNDED" });
      }
    }
    await insert("stripe_events", { id: id(), eventId: event.id, type: event.type, receivedAt: now() });
    res.json({ received: true });
  } catch (error) { console.error("Stripe webhook handling failed.", error); res.status(500).json({ error: "Webhook processing failed and can be retried." }); }
}
