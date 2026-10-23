import { Router } from "express";
import { z } from "zod";
import { all, get, insert, update } from "../db/store.js";
import { id, now } from "../utils/ids.js";
import { allowRoles, authenticate } from "../utils/auth.js";
import { asyncRoute, HttpError, pathParam } from "../utils/http.js";

type Application = { id: string; userId: string; bio: string; specialties: string[]; status: "PENDING" | "APPROVED" | "REJECTED"; createdAt: string; reviewedAt?: string; reviewNote?: string };
type UserRecord = { id: string; name: string; email: string; role: string; createdAt: string };

export const staffRouter = Router();

staffRouter.post("/instructor/applications", authenticate, allowRoles("STUDENT"), asyncRoute(async (req, res) => {
  const input = z.object({ bio: z.string().trim().min(30).max(2500), specialties: z.array(z.string().trim().min(2).max(80)).min(1).max(8) }).parse(req.body);
  const existing = (await all<Application>("instructor_applications")).find((application) => application.userId === req.user!.id && application.status === "PENDING");
  if (existing) { res.json({ application: existing }); return; }
  const application: Application = { id: id(), userId: req.user!.id, ...input, status: "PENDING", createdAt: now() };
  await insert("instructor_applications", application);
  res.status(201).json({ application });
}));

staffRouter.get("/instructor/applications/me", authenticate, allowRoles("STUDENT"), asyncRoute(async (req, res) => {
  const application = (await all<Application>("instructor_applications")).filter((item) => item.userId === req.user!.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  res.json({ application });
}));

staffRouter.get("/admin/instructor-applications", authenticate, allowRoles("ADMIN"), asyncRoute(async (_req, res) => {
  const applications = (await all<Application>("instructor_applications")).filter((application) => application.status === "PENDING");
  const users = await all<UserRecord>("users");
  res.json({ applications: applications.map((application) => ({ ...application, applicant: users.find((user) => user.id === application.userId) })) });
}));

staffRouter.post("/admin/instructor-applications/:applicationId/review", authenticate, allowRoles("ADMIN"), asyncRoute(async (req, res) => {
  const input = z.object({ decision: z.enum(["approve", "reject"]), note: z.string().trim().max(500).optional() }).parse(req.body);
  const application = await get<Application>("instructor_applications", pathParam(req, "applicationId"));
  if (!application || application.status !== "PENDING") throw new HttpError(404, "APPLICATION_NOT_FOUND", "We couldn't find a pending instructor application.");
  const user = await get<UserRecord & { email: string }>("users", application.userId);
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "The applicant's account no longer exists.");
  const status = input.decision === "approve" ? "APPROVED" : "REJECTED";
  const updated = await update<Application>("instructor_applications", application.id, { status, reviewNote: input.note, reviewedAt: now() });
  if (status === "APPROVED") {
    await update<UserRecord>("users", user.id, { role: "INSTRUCTOR" });
    const profile = (await all<{ id: string; userId: string }>("instructor_profiles")).find((item) => item.userId === user.id);
    if (!profile) await insert("instructor_profiles", { id: id(), userId: user.id, bio: application.bio, specialties: application.specialties, createdAt: now() });
  }
  await insert("audit_logs", { id: id(), actorId: req.user!.id, action: `instructor.application.${input.decision}`, targetType: "instructor_application", targetId: application.id, metadata: { note: input.note }, createdAt: now() });
  res.json({ application: updated, userRole: status === "APPROVED" ? "INSTRUCTOR" : user.role });
}));
