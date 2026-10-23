import "../config.js";
import bcrypt from "bcryptjs";
import { connectDatabase, all, insert } from "../db/store.js";
import { id, now, slugify } from "../utils/ids.js";

export async function seedDemoData() {
  await connectDatabase();
  const existing = await all("courses");
  if (existing.length) { console.info("Demo seed already exists; no records changed."); return; }
  const instructorId = id();
  const studentId = id();
  const timestamp = now();
  const instructorPassword = process.env.DEMO_INSTRUCTOR_PASSWORD ?? "TeachFS03!Local";
  const studentPassword = process.env.DEMO_STUDENT_PASSWORD ?? "LearnFS03!Local";
  const users = [
    { id: instructorId, name: "Avery Morgan", email: (process.env.DEMO_INSTRUCTOR_EMAIL ?? "teacher@fs03.demo").toLowerCase(), passwordHash: await bcrypt.hash(instructorPassword, 12), role: "INSTRUCTOR", createdAt: timestamp },
    { id: studentId, name: "Jordan Lee", email: (process.env.DEMO_STUDENT_EMAIL ?? "learner@fs03.demo").toLowerCase(), passwordHash: await bcrypt.hash(studentPassword, 12), role: "STUDENT", createdAt: timestamp },
  ];
  for (const user of users) await insert("users", user);
  const courseSeed = [
    { title: "Design systems that scale", subtitle: "Build calm, consistent interfaces your team can grow with.", description: "A practical studio for creating a design system from the first useful token to reusable components, documentation, and team adoption.", category: "Design", level: "Intermediate", priceMinor: 0, thumbnail: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=85", outcomes: ["Model a useful token system", "Build accessible interface components", "Document patterns teams can trust"], prerequisites: ["A basic understanding of interface design"], lessons: [{ title: "Start with the system, not the library", durationSeconds: 48, preview: true }, { title: "Tokens with a job to do", durationSeconds: 58, preview: false }, { title: "Components people can trust", durationSeconds: 64, preview: false }], quiz: [{ prompt: "What should a design token represent?", options: ["A reusable design decision with meaning", "A random color value", "A one-off page override"], correctOptionIndex: 0 }, { prompt: "Why document component behavior?", options: ["To make decisions discoverable and repeatable", "To add more pages", "To avoid accessibility checks"], correctOptionIndex: 0 }] },
    { title: "Build better APIs with TypeScript", subtitle: "Design predictable endpoints and resilient services.", description: "Learn how to shape request and response contracts, validate input, protect resources, and evolve a TypeScript API without breaking the people who depend on it.", category: "Development", level: "Beginner", priceMinor: 2900, thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85", outcomes: ["Create typed REST contracts", "Validate requests at the boundary", "Add authorization and error handling"], prerequisites: ["Comfort with JavaScript basics"], lessons: [{ title: "A small endpoint with a clear contract", durationSeconds: 55, preview: true }, { title: "Validation belongs at the edge", durationSeconds: 72, preview: false }, { title: "Auth, ownership, and safe errors", durationSeconds: 80, preview: false }], quiz: [{ prompt: "Where should untrusted input be validated?", options: ["At the API boundary", "Only in the browser", "After a database write"], correctOptionIndex: 0 }] },
    { title: "Make sense of product analytics", subtitle: "Turn behavioral data into better product decisions.", description: "A grounded introduction to event design, funnels, retention, and communicating what product metrics can—and cannot—tell your team.", category: "Data", level: "Beginner", priceMinor: 1900, thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85", outcomes: ["Choose events that answer real questions", "Read funnels and retention with care", "Share an actionable product insight"], prerequisites: ["No analytics background required"], lessons: [{ title: "Ask a better question first", durationSeconds: 48, preview: true }, { title: "Events, properties, and context", durationSeconds: 62, preview: false }, { title: "From chart to decision", durationSeconds: 76, preview: false }], quiz: [{ prompt: "What is a useful first step in analytics?", options: ["State the decision or question", "Track every possible event", "Optimize the dashboard colors"], correctOptionIndex: 0 }] },
  ];

  for (const seed of courseSeed) {
    const courseId = id();
    const sectionId = id();
    const lessons = seed.lessons.map((lesson) => ({ id: id(), title: lesson.title, summary: "A short, focused lesson with a practical takeaway.", durationSeconds: lesson.durationSeconds, preview: lesson.preview }));
    const course = {
      id: courseId, instructorId, instructorName: users[0]!.name, title: seed.title, slug: `${slugify(seed.title)}-${courseId.slice(0, 6)}`,
      subtitle: seed.subtitle, description: seed.description, category: seed.category, level: seed.level, language: "English", priceMinor: seed.priceMinor,
      currency: "USD", thumbnail: seed.thumbnail, outcomes: seed.outcomes, prerequisites: seed.prerequisites, status: "PUBLISHED",
      sections: [{ id: sectionId, title: "A useful foundation", lessons }], createdAt: timestamp, updatedAt: timestamp,
    };
    await insert("courses", course);
    await insert("quizzes", { id: id(), courseId, title: "Quick knowledge check", passPercent: 70, required: true, questions: seed.quiz.map((question) => ({ id: id(), ...question })) });
  }
  console.info(`Seeded ${courseSeed.length} published courses and demo learner/instructor accounts.`);
  if (process.env.SEED_DEMO !== "false") {
    console.info(`Local instructor login: ${users[0]!.email} / ${instructorPassword}`);
    console.info(`Local learner login: ${users[1]!.email} / ${studentPassword}`);
  }
}

