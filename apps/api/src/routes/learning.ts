import { Router } from "express";
import { z } from "zod";
import type { InteractiveNote } from "@fs03/shared";
import { all, get, insert, update, remove } from "../db/store.js";
import { id, now } from "../utils/ids.js";
import { allowRoles, authenticate } from "../utils/auth.js";
import { asyncRoute, HttpError, pathParam } from "../utils/http.js";
import { courseCompletion, gradeQuiz, type Quiz } from "../domain/learning.js";
import type { CourseRecord } from "./course-utils.js";
import { canAccessLesson, findLesson, requireCourse, requireCourseOwner, requireEnrollment } from "./course-utils.js";
import type { MediaRecord } from "../media/types.js";

type Enrollment = { id: string; courseId: string; studentId: string; status: string; createdAt: string; paymentId?: string };
type Progress = { id: string; studentId: string; courseId: string; lessonId: string; positionSeconds: number; watchedSeconds: number; completedAt?: string; lastHeartbeatAt: string; updatedAt: string };
type Attempt = { id: string; studentId: string; courseId: string; quizId: string; scorePercent: number; passed: boolean; correctCount: number; total: number; createdAt: string };
export const learningRouter = Router();

learningRouter.post("/courses/:courseId/enroll", authenticate, allowRoles("STUDENT"), asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  if (course.status !== "PUBLISHED") throw new HttpError(404, "COURSE_NOT_FOUND", "We couldn't find that course.");
  const prior = (await all<Enrollment>("enrollments")).find((item) => item.courseId === course.id && item.studentId === req.user!.id && item.status === "ACTIVE");
  if (prior) { res.json({ enrollment: prior, alreadyEnrolled: true }); return; }
  if (course.priceMinor > 0) throw new HttpError(402, "PAYMENT_REQUIRED", "This course requires checkout before enrollment.");
  const enrollment: Enrollment = { id: id(), courseId: course.id, studentId: req.user!.id, status: "ACTIVE", createdAt: now() };
  await insert("enrollments", enrollment);
  res.status(201).json({ enrollment });
}));

learningRouter.get("/me/enrollments", authenticate, allowRoles("STUDENT"), asyncRoute(async (req, res) => {
  const enrollments = (await all<Enrollment>("enrollments")).filter((item) => item.studentId === req.user!.id && item.status === "ACTIVE");
  const courses = await all<CourseRecord>("courses");
  const progress = await all<Progress>("lesson_progress");
  res.json({ enrollments: enrollments.map((enrollment) => {
    const course = courses.find((item) => item.id === enrollment.courseId);
    if (!course) return undefined;
    const courseProgress = progress.filter((item) => item.courseId === course.id && item.studentId === req.user!.id);
    const totalLessons = course.sections.reduce((count, section) => count + section.lessons.length, 0);
    return { ...enrollment, course, progress: { completed: courseProgress.filter((item) => item.completedAt).length, total: totalLessons } };
  }).filter(Boolean) });
}));

learningRouter.get("/courses/:courseId/learning", authenticate, allowRoles("STUDENT", "INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  if (req.user!.role === "STUDENT") await requireEnrollment(course.id, req.user!.id);
  else if (req.user!.role === "INSTRUCTOR" && course.instructorId !== req.user!.id) throw new HttpError(403, "FORBIDDEN", "You can only preview your own course.");
  const progress = await all<Progress>("lesson_progress");
  const media = await all<MediaRecord>("media_assets");
  const ownProgress = progress.filter((item) => item.studentId === req.user!.id && item.courseId === course.id);
  const sections = course.sections.map((section) => ({ ...section, lessons: section.lessons.map((lesson) => ({ ...lesson, progress: ownProgress.find((item) => item.lessonId === lesson.id), mediaStatus: media.find((item) => item.id === lesson.mediaAssetId)?.status })) }));
  const quiz = (await all<Quiz>("quizzes")).find((item) => item.courseId === course.id);
  const attempts = (await all<Attempt>("quiz_attempts")).filter((item) => item.courseId === course.id && item.studentId === req.user!.id);
  res.json({ course: { ...course, sections }, completion: courseCompletion(course, quiz, ownProgress, attempts), latestAttempt: attempts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] });
}));

learningRouter.post("/lessons/:lessonId/progress", authenticate, allowRoles("STUDENT"), asyncRoute(async (req, res) => {
  const input = z.object({ courseId: z.string().uuid(), positionSeconds: z.number().min(0).max(21600), playing: z.boolean().default(true) }).parse(req.body);
  const course = await requireCourse(input.courseId);
  await requireEnrollment(course.id, req.user!.id);
  const { lesson } = findLesson(course, pathParam(req, "lessonId"));
  if (!await canAccessLesson(course, lesson.id, req.user)) throw new HttpError(403, "FORBIDDEN", "You cannot open this lesson.");
  const timestamp = now();
  const existing = (await all<Progress>("lesson_progress")).find((item) => item.studentId === req.user!.id && item.lessonId === lesson.id);
  const elapsed = existing ? Math.min(15, Math.max(0, (Date.now() - new Date(existing.lastHeartbeatAt).getTime()) / 1000)) : 0;
  const positionDelta = existing ? input.positionSeconds - existing.positionSeconds : 0;
  const plausible = !existing || !input.playing || positionDelta <= elapsed * 1.8 + 5;
  const watchedSeconds = Math.min(lesson.durationSeconds, (existing?.watchedSeconds ?? 0) + (input.playing && plausible ? elapsed : 0));
  const playedNearEnd = input.positionSeconds >= lesson.durationSeconds * 0.9;
  const completed = Boolean(existing?.completedAt) || (playedNearEnd && watchedSeconds >= Math.min(lesson.durationSeconds * 0.55, 30));
  const next: Progress = { id: existing?.id ?? id(), studentId: req.user!.id, courseId: course.id, lessonId: lesson.id, positionSeconds: Math.min(input.positionSeconds, lesson.durationSeconds), watchedSeconds, completedAt: completed ? existing?.completedAt ?? timestamp : undefined, lastHeartbeatAt: timestamp, updatedAt: timestamp };
  if (existing) await update<Progress>("lesson_progress", existing.id, next); else await insert("lesson_progress", next);
  res.json({ progress: next });
}));

learningRouter.get("/courses/:courseId/quiz", authenticate, allowRoles("STUDENT", "INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  if (req.user!.role === "STUDENT") await requireEnrollment(course.id, req.user!.id);
  else if (req.user!.role === "INSTRUCTOR" && course.instructorId !== req.user!.id) throw new HttpError(403, "FORBIDDEN", "You can only manage your own quiz.");
  const quiz = (await all<Quiz>("quizzes")).find((item) => item.courseId === course.id);
  if (!quiz) throw new HttpError(404, "QUIZ_NOT_FOUND", "This course does not have a quiz yet.");
  const attempts = (await all<Attempt>("quiz_attempts")).filter((attempt) => attempt.studentId === req.user!.id && attempt.courseId === course.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ quiz: { id: quiz.id, title: quiz.title, passPercent: quiz.passPercent, required: quiz.required, questions: quiz.questions.map(({ id: questionId, prompt, options }) => ({ id: questionId, prompt, options })) }, attempts });
}));

learningRouter.post("/courses/:courseId/quiz/attempts", authenticate, allowRoles("STUDENT"), asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  await requireEnrollment(course.id, req.user!.id);
  const input = z.object({ answers: z.record(z.string(), z.number().int().min(0).max(30)) }).parse(req.body);
  const quiz = (await all<Quiz>("quizzes")).find((item) => item.courseId === course.id);
  if (!quiz) throw new HttpError(404, "QUIZ_NOT_FOUND", "This course does not have a quiz yet.");
  const grade = gradeQuiz(quiz.questions, input.answers, quiz.passPercent);
  const attempt: Attempt & { answerResults: typeof grade.answers } = { id: id(), studentId: req.user!.id, courseId: course.id, quizId: quiz.id, scorePercent: grade.scorePercent, passed: grade.passed, correctCount: grade.correctCount, total: grade.total, answerResults: grade.answers, createdAt: now() };
  await insert("quiz_attempts", attempt);
  res.status(201).json({ attempt });
}));

learningRouter.post("/instructor/courses/:courseId/quiz", authenticate, allowRoles("INSTRUCTOR"), asyncRoute(async (req, res) => {
  const course = await requireCourseOwner(pathParam(req, "courseId"), req.user!);
  if (course.status === "PUBLISHED") throw new HttpError(409, "PUBLISHED_COURSE_LOCKED", "Unpublish the course before editing its quiz.");
  const input = z.object({ title: z.string().trim().min(3).max(100), passPercent: z.number().int().min(50).max(100), required: z.boolean(), questions: z.array(z.object({ prompt: z.string().trim().min(5).max(300), options: z.array(z.string().trim().min(1).max(160)).min(2).max(6), correctOptionIndex: z.number().int().min(0).max(5) }).refine((question) => question.correctOptionIndex < question.options.length, "Correct option is outside the option list.")).min(1).max(30) }).parse(req.body);
  const current = (await all<Quiz>("quizzes")).find((quiz) => quiz.courseId === course.id);
  const quiz: Quiz = { id: current?.id ?? id(), courseId: course.id, ...input, questions: input.questions.map((question, index) => ({ id: current?.questions[index]?.id ?? id(), ...question })) };
  if (current) await update<Quiz>("quizzes", current.id, quiz); else await insert("quizzes", quiz);
  res.status(current ? 200 : 201).json({ quiz: { id: quiz.id, title: quiz.title, passPercent: quiz.passPercent, required: quiz.required, questionCount: quiz.questions.length } });
}));

learningRouter.get("/instructor/courses/:courseId/quiz", authenticate, allowRoles("INSTRUCTOR"), asyncRoute(async (req, res) => {
  const course = await requireCourseOwner(pathParam(req, "courseId"), req.user!);
  const quiz = (await all<Quiz>("quizzes")).find((item) => item.courseId === course.id);
  res.json({ quiz });
}));

learningRouter.post("/lessons/:lessonId/complete", authenticate, allowRoles("STUDENT"), asyncRoute(async (req, res) => {
  const input = z.object({ courseId: z.string().uuid(), completed: z.boolean().optional() }).parse(req.body);
  const course = await requireCourse(input.courseId);
  await requireEnrollment(course.id, req.user!.id);
  const { lesson } = findLesson(course, pathParam(req, "lessonId"));
  const timestamp = now();
  const existing = (await all<Progress>("lesson_progress")).find((item) => item.studentId === req.user!.id && item.lessonId === lesson.id);

  const shouldBeCompleted = input.completed !== undefined ? input.completed : !existing?.completedAt;

  const next: Progress = {
    id: existing?.id ?? id(),
    studentId: req.user!.id,
    courseId: course.id,
    lessonId: lesson.id,
    positionSeconds: existing?.positionSeconds ?? lesson.durationSeconds,
    watchedSeconds: existing?.watchedSeconds ?? (shouldBeCompleted ? lesson.durationSeconds : 0),
    completedAt: shouldBeCompleted ? (existing?.completedAt ?? timestamp) : undefined,
    lastHeartbeatAt: timestamp,
    updatedAt: timestamp,
  };
  if (existing) await update<Progress>("lesson_progress", existing.id, next); else await insert("lesson_progress", next);
  res.json({ progress: next, completed: shouldBeCompleted });
}));

learningRouter.get("/courses/:courseId/lessons/:lessonId/notes", authenticate, allowRoles("STUDENT", "INSTRUCTOR"), asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  if (req.user!.role === "STUDENT") await requireEnrollment(course.id, req.user!.id);
  const lessonId = pathParam(req, "lessonId");
  const allNotes = await all<InteractiveNote>("interactive_notes");
  const notes = allNotes
    .filter((note) => note.courseId === course.id && note.lessonId === lessonId && note.studentId === req.user!.id)
    .sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  res.json({ notes });
}));

learningRouter.post("/courses/:courseId/lessons/:lessonId/notes", authenticate, allowRoles("STUDENT"), asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  await requireEnrollment(course.id, req.user!.id);
  const lessonId = pathParam(req, "lessonId");
  findLesson(course, lessonId);
  const input = z.object({
    timestampSeconds: z.number().min(0).max(21600),
    text: z.string().trim().min(1).max(2000),
  }).parse(req.body);

  const timestamp = now();
  const note: InteractiveNote = {
    id: id(),
    studentId: req.user!.id,
    courseId: course.id,
    lessonId,
    timestampSeconds: Math.round(input.timestampSeconds),
    text: input.text,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await insert("interactive_notes", note);
  res.status(201).json({ note });
}));

learningRouter.delete("/notes/:noteId", authenticate, allowRoles("STUDENT"), asyncRoute(async (req, res) => {
  const noteId = pathParam(req, "noteId");
  const note = await get<InteractiveNote>("interactive_notes", noteId);
  if (!note || note.studentId !== req.user!.id) {
    throw new HttpError(404, "NOTE_NOT_FOUND", "Note not found or cannot be deleted.");
  }
  await remove("interactive_notes", noteId);
  res.json({ success: true });
}));

learningRouter.get("/instructor/courses/:courseId/learners", authenticate, allowRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const course = await requireCourseOwner(pathParam(req, "courseId"), req.user!);
  const enrollments = (await all<Enrollment>("enrollments")).filter((item) => item.courseId === course.id && item.status === "ACTIVE");
  const users = await all<{ id: string; name: string; email: string }>("users");
  const progress = await all<Progress>("lesson_progress");
  const totalLessons = course.sections.reduce((count, section) => count + section.lessons.length, 0);
  const attempts = await all<Attempt>("quiz_attempts");
  const certificates = await all<{ id: string; courseId: string; studentId: string; certificateNumber: string }>("certificates");

  res.json({
    learners: enrollments.map((enrollment) => {
      const student = users.find((user) => user.id === enrollment.studentId);
      const studentProgress = progress.filter((item) => item.studentId === enrollment.studentId && item.courseId === course.id);
      const completedCount = studentProgress.filter((item) => item.completedAt).length;
      const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      const latestAttempt = attempts
        .filter((item) => item.studentId === enrollment.studentId && item.courseId === course.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      const cert = certificates.find((item) => item.studentId === enrollment.studentId && item.courseId === course.id);

      return {
        enrollment,
        student,
        completedLessons: completedCount,
        totalLessons,
        progressPercent,
        quizPassed: latestAttempt?.passed ?? false,
        quizScore: latestAttempt?.scorePercent,
        certificateNumber: cert?.certificateNumber,
      };
    }),
  });
}));
