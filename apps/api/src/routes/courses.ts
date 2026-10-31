import { Router } from "express";
import { z } from "zod";
import { categories, type CourseSection, type CourseReview, type CourseAnnouncement, type LessonResource } from "@fs03/shared";
import { all, get, insert, update } from "../db/store.js";
import { id, now, slugify } from "../utils/ids.js";
import { allowRoles, authenticate, optionalAuthenticate } from "../utils/auth.js";
import { asyncRoute, HttpError, pathParam } from "../utils/http.js";
import { findLesson, requireCourse, requireCourseOwner, requireEnrollment, type CourseRecord } from "./course-utils.js";

export function calculateReviewStats(reviews: CourseReview[]) {
  const totalReviews = reviews.length;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (!totalReviews) {
    return { averageRating: 0, totalReviews: 0, distribution };
  }
  let sum = 0;
  for (const r of reviews) {
    const val = Math.min(5, Math.max(1, Math.round(r.rating)));
    distribution[val] = (distribution[val] || 0) + 1;
    sum += r.rating;
  }
  const averageRating = Math.round((sum / totalReviews) * 10) / 10;
  return { averageRating, totalReviews, distribution };
}

const courseInput = z.object({
  title: z.string().trim().min(4).max(100), subtitle: z.string().trim().min(8).max(180), description: z.string().trim().min(30).max(5000),
  category: z.enum(categories), level: z.enum(["Beginner", "Intermediate", "Advanced"]), language: z.string().default("English"),
  priceMinor: z.number().int().min(0).max(200000), currency: z.string().length(3).default("USD"), thumbnail: z.string().url(),
  outcomes: z.array(z.string().trim().min(3).max(160)).min(1).max(8), prerequisites: z.array(z.string().trim().min(2).max(160)).max(8),
});
const lessonInput = z.object({ title: z.string().trim().min(3).max(120), summary: z.string().trim().max(400).optional(), durationSeconds: z.number().int().min(1).max(21600).default(300), preview: z.boolean().default(false), sectionId: z.string().optional(), newSectionTitle: z.string().trim().min(3).max(100).optional() });

export const coursesRouter = Router();

coursesRouter.get("/courses", asyncRoute(async (req, res) => {
  const query = String(req.query.q ?? "").trim().toLowerCase();
  const category = req.query.category ? String(req.query.category) : undefined;
  const level = req.query.level ? String(req.query.level) : undefined;
  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const limit = Math.min(24, Math.max(1, Number(req.query.limit ?? 9) || 9));
  const allCourses = await all<CourseRecord>("courses");
  const allReviews = await all<CourseReview>("course_reviews");
  let rows = allCourses.filter((course) => course.status === "PUBLISHED");
  if (query) rows = rows.filter((course) => `${course.title} ${course.subtitle} ${course.description} ${course.category} ${course.instructorName}`.toLowerCase().includes(query));
  if (category && category !== "All topics") rows = rows.filter((course) => course.category === category);
  if (level) rows = rows.filter((course) => course.level === level);
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const enrollments = await all<{ courseId: string; status: string }>("enrollments");
  res.json({
    courses: rows.slice((page - 1) * limit, page * limit).map((course) => {
      const courseReviews = allReviews.filter((r) => r.courseId === course.id);
      const { averageRating, totalReviews } = calculateReviewStats(courseReviews);
      return {
        ...course,
        enrollmentCount: enrollments.filter((item) => item.courseId === course.id && item.status === "ACTIVE").length,
        averageRating,
        reviewCount: totalReviews,
      };
    }),
    total: rows.length,
    page,
    pages: Math.ceil(rows.length / limit),
  });
}));

coursesRouter.get("/courses/:courseId", optionalAuthenticate, asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  if (course.status !== "PUBLISHED" && req.user?.id !== course.instructorId && req.user?.role !== "ADMIN") throw new HttpError(404, "COURSE_NOT_FOUND", "We couldn't find that course.");
  const quiz = (await all<{ id: string; courseId: string; title: string; passPercent: number; required: boolean }>("quizzes")).find((item) => item.courseId === course.id);
  const count = (await all<{ courseId: string; status: string }>("enrollments")).filter((item) => item.courseId === course.id && item.status === "ACTIVE").length;
  const reviews = (await all<CourseReview>("course_reviews")).filter((r) => r.courseId === course.id);
  const { averageRating, totalReviews } = calculateReviewStats(reviews);
  res.json({
    course: { ...course, averageRating, reviewCount: totalReviews },
    quiz: quiz ? { title: quiz.title, passPercent: quiz.passPercent, required: quiz.required } : undefined,
    enrollmentCount: count,
  });
}));

coursesRouter.get("/instructor/courses", authenticate, allowRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const owned = (await all<CourseRecord>("courses")).filter((course) => course.instructorId === req.user!.id);
  res.json({ courses: owned });
}));

coursesRouter.post("/instructor/courses", authenticate, allowRoles("INSTRUCTOR"), asyncRoute(async (req, res) => {
  const input = courseInput.parse(req.body);
  const timestamp = now();
  const course: CourseRecord = { id: id(), instructorId: req.user!.id, instructorName: req.user!.name, ...input, slug: `${slugify(input.title)}-${id().slice(0, 6)}`, status: "DRAFT", sections: [], createdAt: timestamp, updatedAt: timestamp };
  await insert("courses", course);
  res.status(201).json({ course });
}));

coursesRouter.patch("/instructor/courses/:courseId", authenticate, allowRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const course = await requireCourseOwner(pathParam(req, "courseId"), req.user!);
  if (course.status === "PUBLISHED") throw new HttpError(409, "PUBLISHED_COURSE_LOCKED", "Unpublish the course before editing its core details.");
  const input = courseInput.partial().parse(req.body);
  const updated = await update<CourseRecord>("courses", course.id, { ...input, updatedAt: now() } as Partial<CourseRecord>);
  res.json({ course: updated });
}));

coursesRouter.post("/instructor/courses/:courseId/lessons", authenticate, allowRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const course = await requireCourseOwner(pathParam(req, "courseId"), req.user!);
  if (course.status === "PUBLISHED") throw new HttpError(409, "PUBLISHED_COURSE_LOCKED", "Unpublish the course before changing its curriculum.");
  const input = lessonInput.parse(req.body);
  let sections: CourseSection[] = [...course.sections];
  let section = input.sectionId ? sections.find((item) => item.id === input.sectionId) : undefined;
  if (input.sectionId && !section) throw new HttpError(404, "SECTION_NOT_FOUND", "That course section no longer exists.");
  if (!section) {
    section = { id: id(), title: input.newSectionTitle ?? "Course content", lessons: [] };
    sections.push(section);
  }
  section.lessons.push({ id: id(), title: input.title, summary: input.summary, durationSeconds: input.durationSeconds, preview: input.preview });
  await update<CourseRecord>("courses", course.id, { sections, updatedAt: now() } as Partial<CourseRecord>);
  res.status(201).json({ sections });
}));

coursesRouter.patch("/instructor/courses/:courseId/lessons/:lessonId", authenticate, allowRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const course = await requireCourseOwner(pathParam(req, "courseId"), req.user!);
  const input = lessonInput.partial().parse(req.body);
  const { section, lesson } = findLesson(course, pathParam(req, "lessonId"));
  Object.assign(lesson, input);
  await update<CourseRecord>("courses", course.id, { sections: course.sections, updatedAt: now() } as Partial<CourseRecord>);
  res.json({ section, lesson });
}));

coursesRouter.post("/instructor/courses/:courseId/publish", authenticate, allowRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const course = await requireCourseOwner(pathParam(req, "courseId"), req.user!);
  const lessonCount = course.sections.reduce((sum, section) => sum + section.lessons.length, 0);
  if (lessonCount === 0) throw new HttpError(400, "CURRICULUM_REQUIRED", "Add at least one lesson before publishing.");
  const status = req.user!.role === "ADMIN" ? "PUBLISHED" : (req.body?.publishImmediately === true ? "PUBLISHED" : "PENDING_REVIEW");
  const updated = await update<CourseRecord>("courses", course.id, { status, reviewNote: undefined, updatedAt: now() } as Partial<CourseRecord>);
  await insert("audit_logs", { id: id(), actorId: req.user!.id, action: "course.publish.request", targetType: "course", targetId: course.id, createdAt: now() });
  res.json({ course: updated, message: status === "PUBLISHED" ? "Your course is live." : "Your course is in the review queue." });
}));

coursesRouter.post("/instructor/courses/:courseId/lessons/:lessonId/resources", authenticate, allowRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const course = await requireCourseOwner(pathParam(req, "courseId"), req.user!);
  const input = z.object({
    title: z.string().trim().min(2).max(120),
    url: z.string().url(),
    type: z.enum(["pdf", "link", "code", "document", "archive"]),
    sizeLabel: z.string().trim().max(30).optional(),
  }).parse(req.body);
  const { lesson } = findLesson(course, pathParam(req, "lessonId"));
  lesson.resources = lesson.resources ?? [];
  const resource: LessonResource = { id: id(), ...input };
  lesson.resources.push(resource);
  await update<CourseRecord>("courses", course.id, { sections: course.sections, updatedAt: now() } as Partial<CourseRecord>);
  res.status(201).json({ resource, resources: lesson.resources });
}));

coursesRouter.delete("/instructor/courses/:courseId/lessons/:lessonId/resources/:resourceId", authenticate, allowRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const course = await requireCourseOwner(pathParam(req, "courseId"), req.user!);
  const { lesson } = findLesson(course, pathParam(req, "lessonId"));
  const resourceId = pathParam(req, "resourceId");
  lesson.resources = (lesson.resources ?? []).filter((r) => r.id !== resourceId);
  await update<CourseRecord>("courses", course.id, { sections: course.sections, updatedAt: now() } as Partial<CourseRecord>);
  res.json({ success: true, resources: lesson.resources });
}));

coursesRouter.get("/courses/:courseId/reviews", asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  const allReviews = await all<CourseReview>("course_reviews");
  const reviews = allReviews.filter((r) => r.courseId === course.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const stats = calculateReviewStats(reviews);
  res.json({ reviews, stats });
}));

coursesRouter.post("/courses/:courseId/reviews", authenticate, allowRoles("STUDENT"), asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  await requireEnrollment(course.id, req.user!.id);
  const input = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(5).max(1000),
  }).parse(req.body);

  const allReviews = await all<CourseReview>("course_reviews");
  const existing = allReviews.find((r) => r.courseId === course.id && r.studentId === req.user!.id);
  const timestamp = now();

  if (existing) {
    const updated = await update<CourseReview>("course_reviews", existing.id, {
      rating: input.rating,
      comment: input.comment,
      updatedAt: timestamp,
    });
    res.json({ review: updated });
    return;
  }

  const review: CourseReview = {
    id: id(),
    courseId: course.id,
    studentId: req.user!.id,
    studentName: req.user!.name,
    rating: input.rating,
    comment: input.comment,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await insert("course_reviews", review);
  res.status(201).json({ review });
}));

coursesRouter.get("/courses/:courseId/announcements", asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  const announcements = (await all<CourseAnnouncement>("course_announcements"))
    .filter((a) => a.courseId === course.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ announcements });
}));

coursesRouter.post("/instructor/courses/:courseId/announcements", authenticate, allowRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const course = await requireCourseOwner(pathParam(req, "courseId"), req.user!);
  const input = z.object({
    title: z.string().trim().min(3).max(120),
    content: z.string().trim().min(5).max(3000),
  }).parse(req.body);

  const announcement: CourseAnnouncement = {
    id: id(),
    courseId: course.id,
    instructorId: req.user!.id,
    instructorName: req.user!.name,
    title: input.title,
    content: input.content,
    createdAt: now(),
  };
  await insert("course_announcements", announcement);
  await insert("audit_logs", {
    id: id(),
    actorId: req.user!.id,
    action: "course.announcement.create",
    targetType: "course",
    targetId: course.id,
    metadata: { title: input.title },
    createdAt: now(),
  });
  res.status(201).json({ announcement });
}));

coursesRouter.get("/admin/overview", authenticate, allowRoles("ADMIN"), asyncRoute(async (_req, res) => {
  const [users, courses, enrollments, payments, certificates, media] = await Promise.all([all<{ id: string; role?: string }>("users"), all<CourseRecord>("courses"), all<{ id: string }>("enrollments"), all<{ id: string }>("payments"), all<{ id: string; revokedAt?: string }>("certificates"), all<{ id: string; status: string }>("media_assets")]);
  const entries = await all<{ kind: string; amountMinor: number }>("ledger_entries");
  res.json({ users: users.length, instructors: users.filter((user) => user.role === "INSTRUCTOR").length, publishedCourses: courses.filter((course) => course.status === "PUBLISHED").length, pendingReview: courses.filter((course) => course.status === "PENDING_REVIEW").length, enrollments: enrollments.length, certificatesIssued: certificates.filter((cert) => !cert.revokedAt).length, mediaJobs: { processing: media.filter((item) => item.status === "PROCESSING").length, failed: media.filter((item) => item.status === "FAILED").length }, payments: payments.length, platformRevenueMinor: entries.filter((entry) => entry.kind === "PLATFORM_COMMISSION").reduce((sum, entry) => sum + entry.amountMinor, 0) });
}));

coursesRouter.get("/admin/courses/review-queue", authenticate, allowRoles("ADMIN"), asyncRoute(async (_req, res) => {
  const courses = (await all<CourseRecord>("courses")).filter((course) => course.status === "PENDING_REVIEW").sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  res.json({ courses });
}));

coursesRouter.post("/admin/courses/:courseId/review", authenticate, allowRoles("ADMIN"), asyncRoute(async (req, res) => {
  const input = z.object({ decision: z.enum(["approve", "reject"]), note: z.string().trim().max(500).optional() }).parse(req.body);
  const course = await requireCourse(pathParam(req, "courseId"));
  const updated = await update<CourseRecord>("courses", course.id, { status: input.decision === "approve" ? "PUBLISHED" : "REJECTED", reviewNote: input.note, updatedAt: now() } as Partial<CourseRecord>);
  await insert("audit_logs", { id: id(), actorId: req.user!.id, action: `course.review.${input.decision}`, targetType: "course", targetId: course.id, metadata: { note: input.note }, createdAt: now() });
  res.json({ course: updated });
}));
