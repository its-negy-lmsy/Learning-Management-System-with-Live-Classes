import mongoose, { Schema } from "mongoose";

const loose = (collection: string, fields: Record<string, unknown>, indexes: Array<[Record<string, 1 | -1>, Record<string, unknown>?]> = []) => {
  const schema = new Schema({ ...fields, _id: { type: String }, id: { type: String, required: true } }, { strict: false, timestamps: false, collection });
  for (const [keys, options] of indexes) schema.index(keys, options ?? {});
  return mongoose.models[collection] ?? mongoose.model(collection, schema);
};

export const models = {
  users: loose("users", { email: { type: String, lowercase: true, required: true }, role: { type: String, enum: ["STUDENT", "INSTRUCTOR", "ADMIN"] } }, [[{ email: 1 }, { unique: true }]]),
  sessions: loose("sessions", { userId: { type: String, required: true }, tokenHash: { type: String, required: true }, expiresAt: { type: Date } }, [[{ tokenHash: 1 }, { unique: true }], [{ expiresAt: 1 }, { expireAfterSeconds: 0 }]]),
  courses: loose("courses", { instructorId: { type: String, required: true }, slug: { type: String, required: true }, status: { type: String, required: true } }, [[{ slug: 1 }, { unique: true }], [{ status: 1, category: 1, createdAt: -1 }], [{ instructorId: 1, updatedAt: -1 }]]),
  enrollments: loose("enrollments", { courseId: { type: String, required: true }, studentId: { type: String, required: true }, status: { type: String, required: true } }, [[{ courseId: 1, studentId: 1 }, { unique: true }], [{ studentId: 1, createdAt: -1 }]]),
  media_assets: loose("media_assets", { lessonId: { type: String, required: true }, courseId: { type: String, required: true }, status: { type: String, required: true } }, [[{ lessonId: 1, status: 1 }], [{ ownerId: 1, createdAt: -1 }]]),
  lesson_progress: loose("lesson_progress", { studentId: { type: String, required: true }, lessonId: { type: String, required: true } }, [[{ studentId: 1, lessonId: 1 }, { unique: true }]]),
  quizzes: loose("quizzes", { courseId: { type: String, required: true } }, [[{ courseId: 1 }, { unique: true }]]),
  quiz_attempts: loose("quiz_attempts", { studentId: { type: String, required: true }, courseId: { type: String, required: true } }, [[{ courseId: 1, studentId: 1, createdAt: -1 }]]),
  live_classes: loose("live_classes", { courseId: { type: String, required: true }, startsAt: { type: Date, required: true } }, [[{ courseId: 1, startsAt: 1 }]]),
  payments: loose("payments", { providerRef: { type: String } }, [[{ providerRef: 1 }, { unique: true, sparse: true }], [{ studentId: 1, createdAt: -1 }]]),
  ledger_entries: loose("ledger_entries", { instructorId: { type: String, required: true }, paymentId: { type: String, required: true } }, [[{ instructorId: 1, createdAt: -1 }]]),
  certificates: loose("certificates", { certificateNumber: { type: String, required: true }, studentId: { type: String, required: true }, courseId: { type: String, required: true } }, [[{ certificateNumber: 1 }, { unique: true }], [{ studentId: 1, courseId: 1 }, { unique: true }]]),
  audit_logs: loose("audit_logs", { actorId: { type: String, required: true }, action: { type: String, required: true } }, [[{ actorId: 1, createdAt: -1 }]]),
  stripe_events: loose("stripe_events", { eventId: { type: String, required: true } }, [[{ eventId: 1 }, { unique: true }]]),
  instructor_profiles: loose("instructor_profiles", { userId: { type: String, required: true }, bio: { type: String } }, [[{ userId: 1 }, { unique: true }]]),
  instructor_applications: loose("instructor_applications", { userId: { type: String, required: true }, status: { type: String, required: true } }, [[{ userId: 1, status: 1 }]]),
};
