export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type CourseStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
export type MediaStatus = "UPLOADED" | "QUEUED" | "PROCESSING" | "READY" | "FAILED";

export interface LessonResource {
  id: string;
  title: string;
  url: string;
  type: "pdf" | "link" | "code" | "document" | "archive";
  sizeLabel?: string;
}

export interface Lesson {
  id: string;
  title: string;
  summary?: string;
  durationSeconds: number;
  preview: boolean;
  mediaAssetId?: string;
  resources?: LessonResource[];
}

export interface CourseReview {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseAnnouncement {
  id: string;
  courseId: string;
  instructorId: string;
  instructorName: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface InteractiveNote {
  id: string;
  studentId: string;
  courseId: string;
  lessonId: string;
  timestampSeconds: number;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSection {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  instructorId: string;
  instructorName: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  language: string;
  priceMinor: number;
  currency: string;
  thumbnail: string;
  outcomes: string[];
  prerequisites: string[];
  status: CourseStatus;
  sections: CourseSection[];
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const categories = ["Design", "Development", "Business", "Data", "Marketing", "Photography"] as const;
