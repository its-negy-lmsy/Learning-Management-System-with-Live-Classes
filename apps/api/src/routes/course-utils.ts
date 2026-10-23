import type { Course } from "@fs03/shared";
import { all, get } from "../db/store.js";
import type { AuthUser } from "../utils/auth.js";
import { HttpError } from "../utils/http.js";

export type CourseRecord = Course & { reviewNote?: string };
export async function requireCourse(courseId: string) {
  const course = await get<CourseRecord>("courses", courseId);
  if (!course) throw new HttpError(404, "COURSE_NOT_FOUND", "We couldn't find that course.");
  return course;
}
export async function requireCourseOwner(courseId: string, user: AuthUser) {
  const course = await requireCourse(courseId);
  if (course.instructorId !== user.id && user.role !== "ADMIN") throw new HttpError(403, "FORBIDDEN", "You can only manage courses you own.");
  return course;
}
export function findLesson(course: CourseRecord, lessonId: string) {
  for (const section of course.sections) {
    const lesson = section.lessons.find((item) => item.id === lessonId);
    if (lesson) return { section, lesson };
  }
  throw new HttpError(404, "LESSON_NOT_FOUND", "We couldn't find that lesson.");
}
export async function requireEnrollment(courseId: string, studentId: string) {
  const enrollment = (await all<{ id: string; courseId: string; studentId: string; status: string }>("enrollments"))
    .find((record) => record.courseId === courseId && record.studentId === studentId && record.status === "ACTIVE");
  if (!enrollment) throw new HttpError(403, "ENROLLMENT_REQUIRED", "Enroll in this course to open the full lesson.");
  return enrollment;
}
export async function canAccessLesson(course: CourseRecord, lessonId: string, user?: AuthUser) {
  const { lesson } = findLesson(course, lessonId);
  if (course.status === "PUBLISHED" && lesson.preview) return true;
  if (user?.role === "ADMIN" || user?.id === course.instructorId) return true;
  if (user?.role === "STUDENT") { await requireEnrollment(course.id, user.id); return true; }
  return false;
}
