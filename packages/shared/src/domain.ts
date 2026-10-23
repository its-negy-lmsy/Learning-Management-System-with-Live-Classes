export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type CourseStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
export type MediaStatus = "UPLOADED" | "QUEUED" | "PROCESSING" | "READY" | "FAILED";

export interface Lesson {
  id: string;
  title: string;
  summary?: string;
  durationSeconds: number;
  preview: boolean;
  mediaAssetId?: string;
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
  createdAt: string;
  updatedAt: string;
}

export const categories = ["Design", "Development", "Business", "Data", "Marketing", "Photography"] as const;
