import { Router } from "express";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { all, get, insert, update } from "../db/store.js";
import { id, now } from "../utils/ids.js";
import { allowRoles, authenticate } from "../utils/auth.js";
import { asyncRoute, HttpError, pathParam } from "../utils/http.js";
import { courseCompletion, type Quiz } from "../domain/learning.js";
import type { CourseRecord } from "./course-utils.js";
import { requireCourse } from "./course-utils.js";
import { config } from "../config.js";

type Certificate = { id: string; certificateNumber: string; studentId: string; studentName: string; courseId: string; courseTitle: string; instructorName: string; issuedAt: string; revokedAt?: string };
type Progress = { studentId: string; courseId: string; lessonId: string; completedAt?: string };
type Attempt = { studentId: string; courseId: string; passed: boolean };
export const certificatesRouter = Router();

certificatesRouter.post("/courses/:courseId/certificate", authenticate, allowRoles("STUDENT"), asyncRoute(async (req, res) => {
  const course = await requireCourse(pathParam(req, "courseId"));
  const enrollment = (await all<{ id: string; courseId: string; studentId: string; status: string }>("enrollments")).find((item) => item.courseId === course.id && item.studentId === req.user!.id && item.status === "ACTIVE");
  if (!enrollment) throw new HttpError(403, "ENROLLMENT_REQUIRED", "Enroll in the course before requesting a certificate.");
  const quiz = (await all<Quiz>("quizzes")).find((item) => item.courseId === course.id);
  const progress = (await all<Progress>("lesson_progress")).filter((item) => item.studentId === req.user!.id && item.courseId === course.id);
  const attempts = (await all<Attempt>("quiz_attempts")).filter((item) => item.studentId === req.user!.id && item.courseId === course.id);
  const eligibility = courseCompletion(course, quiz, progress, attempts);
  if (!eligibility.completed) throw new HttpError(409, "COURSE_INCOMPLETE", "Complete every required lesson and pass the required quiz first.");
  let certificate = (await all<Certificate>("certificates")).find((item) => item.studentId === req.user!.id && item.courseId === course.id);
  if (certificate?.revokedAt) throw new HttpError(409, "CERTIFICATE_REVOKED", "This certificate was revoked. Contact the course administrator.");
  if (!certificate) {
    certificate = { id: id(), certificateNumber: `FS03-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, studentId: req.user!.id, studentName: req.user!.name, courseId: course.id, courseTitle: course.title, instructorName: course.instructorName, issuedAt: now() };
    await insert("certificates", certificate);
  }
  res.status(201).json({ certificate });
}));

certificatesRouter.get("/me/certificates", authenticate, asyncRoute(async (req, res) => {
  const certificates = (await all<Certificate>("certificates")).filter((item) => item.studentId === req.user!.id && !item.revokedAt);
  res.json({ certificates });
}));

certificatesRouter.get("/certificates/:certificateId/verify", asyncRoute(async (req, res) => {
  const certificate = (await all<Certificate>("certificates")).find((item) => item.certificateNumber === pathParam(req, "certificateId") || item.id === pathParam(req, "certificateId"));
  if (!certificate || certificate.revokedAt) { res.status(404).json({ valid: false }); return; }
  res.json({ valid: true, certificate: { certificateNumber: certificate.certificateNumber, studentName: certificate.studentName, courseTitle: certificate.courseTitle, instructorName: certificate.instructorName, issuedAt: certificate.issuedAt } });
}));

certificatesRouter.get("/me/certificates/:certificateId.pdf", authenticate, asyncRoute(async (req, res) => {
  const certificate = await get<Certificate>("certificates", pathParam(req, "certificateId"));
  if (!certificate || certificate.studentId !== req.user!.id || certificate.revokedAt) throw new HttpError(404, "CERTIFICATE_NOT_FOUND", "We couldn't find that certificate.");
  const verifyUrl = `${config.webOrigin}/verify/${encodeURIComponent(certificate.certificateNumber)}`;
  const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 180, color: { dark: "#17342f", light: "#ffffff" } });
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 48, info: { Title: `${certificate.courseTitle} certificate`, Author: "FS-03 Learning Studio" } });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  doc.on("end", () => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${certificate.certificateNumber}.pdf"`);
    res.send(Buffer.concat(chunks));
  });
  doc.rect(0, 0, 842, 595).fill("#f6f7f2");
  doc.roundedRect(28, 28, 786, 539, 18).lineWidth(2).stroke("#9fb8ab");
  doc.fillColor("#17342f").fontSize(15).font("Helvetica-Bold").text("FIELDNOTES  /  LEARNING STUDIO", 64, 68, { characterSpacing: 2 });
  doc.fillColor("#396353").fontSize(12).font("Helvetica").text("CERTIFICATE OF COMPLETION", 64, 146, { characterSpacing: 2 });
  doc.fillColor("#17342f").fontSize(40).font("Times-Bold").text("A thoughtful step forward.", 64, 180, { width: 630 });
  doc.fillColor("#577069").fontSize(16).font("Helvetica").text("This certifies that", 64, 257);
  doc.fillColor("#17342f").fontSize(30).font("Times-Roman").text(certificate.studentName, 64, 284, { width: 620 });
  doc.fillColor("#577069").fontSize(15).font("Helvetica").text("completed the course", 64, 331);
  doc.fillColor("#17342f").fontSize(23).font("Helvetica-Bold").text(certificate.courseTitle, 64, 356, { width: 630 });
  doc.fillColor("#577069").fontSize(12).font("Helvetica").text(`Presented by ${certificate.instructorName}  ·  ${new Date(certificate.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}`, 64, 430);
  doc.fillColor("#396353").fontSize(11).text(`Certificate ID  ${certificate.certificateNumber}`, 64, 472);
  doc.image(qr, 690, 412, { width: 86, height: 86 });
  doc.fillColor("#577069").fontSize(9).text("Scan to verify", 692, 501, { width: 86, align: "center" });
  doc.end();
}));

certificatesRouter.post("/admin/certificates/:certificateId/revoke", authenticate, allowRoles("ADMIN"), asyncRoute(async (req, res) => {
  const certificate = await get<Certificate>("certificates", pathParam(req, "certificateId"));
  if (!certificate) throw new HttpError(404, "CERTIFICATE_NOT_FOUND", "We couldn't find that certificate.");
  const updated = await update<Certificate>("certificates", certificate.id, { revokedAt: now() });
  await insert("audit_logs", { id: id(), actorId: req.user!.id, action: "certificate.revoke", targetType: "certificate", targetId: certificate.id, createdAt: now() });
  res.json({ certificate: updated });
}));
