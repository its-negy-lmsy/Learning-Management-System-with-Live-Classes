import "../config.js";
import bcrypt from "bcryptjs";
import { connectDatabase, all, insert, remove } from "../db/store.js";
import { id, now, slugify } from "../utils/ids.js";

const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
];

export async function seedDemoData(force = false) {
  await connectDatabase();
  const existing = await all("courses");
  if (existing.length && !force) {
    console.info("Demo seed already exists; skipping (pass force=true to re-seed).");
    return;
  }

  // If force re-seeding, clean existing records
  if (force) {
    const collections = [
      "courses", "users", "quizzes", "course_reviews", "course_announcements", 
      "lesson_discussions", "lesson_resources", "enrollments", "lesson_progress"
    ];
    for (const coll of collections) {
      const records = await all<{ id: string }>(coll);
      for (const rec of records) {
        await remove(coll, rec.id).catch(() => {});
      }
    }
  }

  const timestamp = now();
  const instructorPassword = process.env.DEMO_INSTRUCTOR_PASSWORD ?? "TeachFS03!Local";
  const studentPassword = process.env.DEMO_STUDENT_PASSWORD ?? "LearnFS03!Local";

  // Instructors
  const instructors = [
    {
      id: id(),
      name: "Sarah Jenkins",
      email: (process.env.DEMO_INSTRUCTOR_EMAIL ?? "teacher@fs03.demo").toLowerCase(),
      passwordHash: await bcrypt.hash(instructorPassword, 12),
      role: "INSTRUCTOR",
      title: "Staff Frontend Architect at Vercel",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
      bio: "12+ years building reactive frontend architectures, React core contributor, and author of Modern React Patterns.",
      createdAt: timestamp,
    },
    {
      id: id(),
      name: "Dr. Marcus Rivera",
      email: "marcus.ai@fs03.demo",
      passwordHash: await bcrypt.hash(instructorPassword, 12),
      role: "INSTRUCTOR",
      title: "Principal AI Scientist & Ex-DeepMind",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      bio: "PhD in Machine Learning from Stanford. Passionate about demystifying data science and practical LLM agents.",
      createdAt: timestamp,
    },
    {
      id: id(),
      name: "Elena Rostova",
      email: "elena.design@fs03.demo",
      passwordHash: await bcrypt.hash(instructorPassword, 12),
      role: "INSTRUCTOR",
      title: "Head of Product Design at Linear",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
      bio: "Design systems obsessive. Led redesigns for Fortune 500 apps and built iconic token frameworks.",
      createdAt: timestamp,
    },
    {
      id: id(),
      name: "David Kalu",
      email: "david.cloud@fs03.demo",
      passwordHash: await bcrypt.hash(instructorPassword, 12),
      role: "INSTRUCTOR",
      title: "Staff Cloud Architect & AWS Community Hero",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      bio: "Architected distributed cloud systems handling 100M+ monthly requests. Expert in Docker, AWS, and BullMQ.",
      createdAt: timestamp,
    },
  ];

  for (const instructor of instructors) {
    await insert("users", instructor);
  }

  // Learner
  const student = {
    id: id(),
    name: "Jordan Lee",
    email: (process.env.DEMO_STUDENT_EMAIL ?? "learner@fs03.demo").toLowerCase(),
    passwordHash: await bcrypt.hash(studentPassword, 12),
    role: "STUDENT",
    createdAt: timestamp,
  };
  await insert("users", student);

  const courseDefinitions = [
    {
      instructor: instructors[0]!,
      title: "Full-Stack Web Development with React 19 & Node.js",
      subtitle: "Build modern, responsive web applications from database schemas to production deployment.",
      description: "A comprehensive, beginner-friendly bootcamp teaching you the full modern web stack. You will master React 19 component design, Redux Toolkit state management, REST APIs with Express & TypeScript, MongoDB persistence, and background media processing with BullMQ.",
      category: "Development",
      level: "Beginner",
      badge: "Bestseller",
      priceMinor: 0,
      currency: "USD",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80",
      outcomes: [
        "Architect clean, reusable React 19 components with TypeScript",
        "Implement predictable state management with Redux Toolkit and RTK Query",
        "Build secure Express REST APIs with JWT HttpOnly cookies and role authentication",
        "Integrate video streaming pipelines with FFmpeg HLS and CloudFront CDN",
      ],
      prerequisites: ["Basic HTML, CSS, and JavaScript familiarity", "A laptop with Node.js installed"],
      sections: [
        {
          title: "Module 1: React 19 Architecture & State",
          lessons: [
            {
              title: "React 19 Mental Model & Component Lifecycle",
              durationSeconds: 360,
              preview: true,
              videoUrl: SAMPLE_VIDEOS[0],
              summary: "Learn how React 19 renders components, handles reconciliation, and powers unidirectional data flow.",
              content: `### What is React 19?
React 19 introduces automated memoization, actions for form handling, and native asset preloading. In this lesson, we break down:
1. **Unidirectional Data Flow**: Props down, events up.
2. **Pure Components**: Writing components that do not cause side effects during render.
3. **The React Virtual DOM**: How diffing algorithms minimize costly browser reflows.

\`\`\`tsx
export function WelcomeCard({ name, role }: { name: string; role: string }) {
  return (
    <div className="card">
      <h3>Welcome, {name}!</h3>
      <span className="badge">{role}</span>
    </div>
  );
}
\`\`\`

**Key Takeaways**:
- Never mutate state directly; always use state updater functions.
- Keep components small, focused, and composable.`,
              resources: [
                { id: id(), title: "React 19 Architecture Cheat Sheet", url: "#", type: "pdf", sizeLabel: "1.2 MB PDF" },
                { id: id(), title: "Module Starter Code", url: "#", type: "code", sizeLabel: "GitHub Repo" },
              ],
            },
            {
              title: "State Management with Redux Toolkit & RTK Query",
              durationSeconds: 480,
              preview: false,
              videoUrl: SAMPLE_VIDEOS[1],
              summary: "Simplify global application state with slices, reducers, and automated API caching.",
              content: `### Redux Toolkit (RTK) Essentials
Traditional Redux required voluminous boilerplate. With RTK, we create cohesive slices using \`createSlice\`:

\`\`\`ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; },
    addBy: (state, action: PayloadAction<number>) => { state.value += action.payload; }
  }
});
\`\`\`

**RTK Query Benefits**:
- Automatic request deduplication
- Built-in polling and optimistic updates
- Zero manual fetch/error state boilerplate`,
              resources: [
                { id: id(), title: "Redux Slice Pattern Guide", url: "#", type: "document", sizeLabel: "Markdown Guide" },
              ],
            },
          ],
        },
        {
          title: "Module 2: Server-Side REST APIs with Express & TypeScript",
          lessons: [
            {
              title: "Designing Predictable Endpoints & Zod Validation",
              durationSeconds: 520,
              preview: false,
              videoUrl: SAMPLE_VIDEOS[2],
              summary: "Validate untrusted client requests at the HTTP boundary using Zod schemas and async route wrappers.",
              content: `### Defensive API Design
Never trust client inputs. Always validate schemas before executing business logic:

\`\`\`ts
const CourseSchema = z.object({
  title: z.string().min(5).max(100),
  priceMinor: z.number().int().nonnegative(),
  category: z.enum(['Design', 'Development', 'Data'])
});
\`\`\`

**Security Rules**:
1. Reject unvalidated payloads with HTTP 400 Bad Request.
2. Strip unexpected attributes.
3. Keep database layer decoupled from route handlers.`,
            },
            {
              title: "Session Cookies & JWT Authentication",
              durationSeconds: 440,
              preview: false,
              videoUrl: SAMPLE_VIDEOS[3],
              summary: "Protect routes with short-lived HttpOnly JWT session cookies and secure refresh token rotation.",
              content: `### Why HttpOnly Cookies?
Storing JWT tokens in localStorage leaves applications vulnerable to Cross-Site Scripting (XSS). HttpOnly cookies cannot be read by JavaScript:

- \`httpOnly: true\` prevents DOM script theft.
- \`sameSite: 'lax'\` protects against cross-site request forgery.
- Refresh tokens are hashed at rest in the database.`,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Where should untrusted client input be validated?",
          options: ["At the API boundary using a strict schema validator", "Only in the browser", "After saving to the database", "Validation is unnecessary with TypeScript"],
          correctOptionIndex: 0,
        },
        {
          prompt: "Why should authentication JWTs be stored in HttpOnly cookies rather than localStorage?",
          options: ["HttpOnly cookies cannot be accessed by client-side JavaScript, mitigating XSS theft", "LocalStorage is too slow for web requests", "Cookies increase encryption speed", "JWTs are too large for localStorage"],
          correctOptionIndex: 0,
        },
        {
          prompt: "What is the primary role of RTK Query in Redux Toolkit?",
          options: ["Handling automated API data fetching, caching, and state synchronization", "Replacing the database layer", "Styling React components", "Compiling TypeScript to JavaScript"],
          correctOptionIndex: 0,
        },
      ],
    },
    {
      instructor: instructors[1]!,
      title: "Python for Data Science, AI & Machine Learning",
      subtitle: "Master data wrangling, exploratory data analysis, and predictive models with Python and Scikit-Learn.",
      description: "A hands-on, zero-to-hero journey into data science. Learn Python data structures, vector math with NumPy, tabular data manipulation with Pandas, statistical charting with Seaborn, and train machine learning algorithms.",
      category: "Data",
      level: "Beginner",
      badge: "Beginner Favorite",
      priceMinor: 1999,
      currency: "USD",
      thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
      outcomes: [
        "Manipulate complex datasets effortlessly with Pandas and NumPy",
        "Create publication-quality visualizations and exploratory dashboards",
        "Clean missing data, normalize features, and split test sets",
        "Train and evaluate classification and regression models",
      ],
      prerequisites: ["No prior programming experience required"],
      sections: [
        {
          title: "Module 1: Python Core & NumPy Arrays",
          lessons: [
            {
              title: "Python Data Structures: Lists, Tuples, and Dictionaries",
              durationSeconds: 380,
              preview: true,
              videoUrl: SAMPLE_VIDEOS[4],
              summary: "Learn essential Python syntax, list comprehensions, and key-value mapping.",
              content: `### Python Data Structures
Python's built-in collections make data transformation concise:

\`\`\`python
# List comprehension with filtering
scores = [78, 92, 85, 64, 99, 45]
passing_scores = [s for s in scores if s >= 70]
print(f"Passing count: {len(passing_scores)}")
\`\`\`

**Key Takeaways**:
- Use tuples for immutable coordinates/tuples.
- Use dictionaries for O(1) key lookups.`,
            },
            {
              title: "Vectorized Computations with NumPy",
              durationSeconds: 420,
              preview: false,
              videoUrl: SAMPLE_VIDEOS[5],
              summary: "Speed up matrix calculations up to 50x compared to pure Python loops using NumPy vectorization.",
              content: `### Why NumPy?
Standard Python loops are interpreted. NumPy executes in optimized C:

\`\`\`python
import numpy as np

arr = np.array([1, 2, 3, 4, 5])
normalized = (arr - np.mean(arr)) / np.std(arr)
print(normalized)
\`\`\``,
            },
          ],
        },
        {
          title: "Module 2: Tabular Analysis & Visualizations",
          lessons: [
            {
              title: "Exploratory Data Analysis with Pandas",
              durationSeconds: 500,
              preview: false,
              videoUrl: SAMPLE_VIDEOS[0],
              summary: "Load real-world CSV files, inspect summary statistics, filter rows, and group metrics.",
              content: `### Pandas DataFrame Operations
\`\`\`python
import pandas as pd

df = pd.read_csv('ecommerce_sales.csv')
top_categories = df.groupby('category')['revenue'].sum().sort_values(ascending=False)
print(top_categories.head())
\`\`\``,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the primary advantage of NumPy vectorized operations over Python loops?",
          options: ["Operations run in compiled C code at much higher performance", "NumPy uses less disk storage", "NumPy converts all data to strings", "Loops are not supported in Python 3"],
          correctOptionIndex: 0,
        },
        {
          prompt: "Which Pandas method is used to compute group-wise summary statistics?",
          options: ["groupby() combined with an aggregation function", "filter()", "concat()", "drop_duplicates()"],
          correctOptionIndex: 0,
        },
      ],
    },
    {
      instructor: instructors[2]!,
      title: "Figma to Production: Design Systems & Prototyping",
      subtitle: "Create scalable UI component libraries, tokens, and frictionless developer handoff workflows.",
      description: "Stop designing one-off screens. Learn to build production design systems used by modern SaaS companies like Linear, Apple, and Figma. Covers color math, typography scales, auto-layout 5.0, variables, and component tokens.",
      category: "Design",
      level: "Beginner",
      badge: "Hot & New",
      priceMinor: 0,
      currency: "USD",
      thumbnail: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80",
      outcomes: [
        "Construct multi-brand design tokens using Figma Variables",
        "Master responsive auto-layout components with interactive states",
        "Establish accessible 4.5:1 WCAG contrast standards",
        "Streamline handoff to frontend engineers using design tokens",
      ],
      prerequisites: ["Curiosity about interface design. Free Figma account."],
      sections: [
        {
          title: "Module 1: Foundations of Design Tokens",
          lessons: [
            {
              title: "Tokens: Colors, Spacing, and Typography Scales",
              durationSeconds: 340,
              preview: true,
              videoUrl: SAMPLE_VIDEOS[1],
              summary: "Define semantic design decisions once and propagate them across themes and screens.",
              content: `### What is a Design Token?
A design token is the single source of truth for a visual decision:
- **Raw value**: \`#4f46e5\`
- **Semantic token**: \`color.brand.primary\`
- **Component token**: \`button.primary.background\`

By tying components to semantic tokens rather than raw hex codes, dark mode and branding updates happen in seconds.`,
            },
            {
              title: "Mastering Auto-Layout & Component Variants",
              durationSeconds: 460,
              preview: false,
              videoUrl: SAMPLE_VIDEOS[2],
              summary: "Build buttons and cards that flex gracefully as text content changes across screen sizes.",
              content: `### Auto-Layout Rules
1. Set card containers to **Fill Container** horizontally.
2. Group related items with intentional **Gap Spacing** (e.g. 8px, 16px, 24px).
3. Use Hug Contents for badges and chips.`,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why should UI components reference semantic tokens instead of hardcoded hex values?",
          options: ["To allow effortless theming, dark mode, and global design updates without touching individual screens", "Because hex codes are deprecated in CSS", "To make Figma files load faster", "Tokens prevent components from moving"],
          correctOptionIndex: 0,
        },
      ],
    },
    {
      instructor: instructors[3]!,
      title: "Cloud Architecture, DevOps & Docker Containers",
      subtitle: "Containerize applications, orchestrate services with Compose, and scale on AWS CloudFront.",
      description: "From local development to high-availability cloud infrastructure. Master Docker images, multi-stage builds, Redis caching, BullMQ background video transcoding, and AWS S3/CloudFront CDN delivery.",
      category: "Development",
      level: "Intermediate",
      badge: "Career Track",
      priceMinor: 3499,
      currency: "USD",
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
      outcomes: [
        "Containerize full-stack apps with multi-stage Docker builds",
        "Orchestrate databases, Redis, and workers with Docker Compose",
        "Distribute video streaming assets via AWS CloudFront CDN",
        "Implement resilient background queues with BullMQ and auto-retries",
      ],
      prerequisites: ["Comfort with command-line tools and basic web servers"],
      sections: [
        {
          title: "Module 1: Docker Containerization",
          lessons: [
            {
              title: "Docker Architecture: Images, Containers, and Dockerfile",
              durationSeconds: 410,
              preview: true,
              videoUrl: SAMPLE_VIDEOS[3],
              summary: "Package applications with dependencies into immutable, portable containers.",
              content: `### Multi-Stage Dockerfile Pattern
\`\`\`dockerfile
# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]
\`\`\``,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the primary benefit of multi-stage Docker builds?",
          options: ["Reducing final production image size by leaving build tools and compilers out of the runtime container", "Running multiple operating systems at once", "Eliminating the need for package.json", "Automatically publishing to AWS"],
          correctOptionIndex: 0,
        },
      ],
    },
    {
      instructor: instructors[1]!,
      title: "Applied Generative AI & Prompt Engineering",
      subtitle: "Build production AI applications with LLMs, RAG, function calling, and structured outputs.",
      description: "Go beyond basic chatbots. Learn to build reliable, high-value AI features. Covers temperature and top-p sampling, system prompt architecture, function calling, vector embeddings with RAG, and agentic workflows.",
      category: "Data",
      level: "Beginner",
      badge: "Trending",
      priceMinor: 2499,
      currency: "USD",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
      outcomes: [
        "Write robust system prompts that prevent hallucination and format drift",
        "Implement tool execution and function calling with JSON schemas",
        "Build Retrieval-Augmented Generation (RAG) search pipelines",
        "Evaluate model outputs with automated benchmarks",
      ],
      prerequisites: ["No AI background required. Basic API familiarity is helpful."],
      sections: [
        {
          title: "Module 1: LLM Foundations & Prompt Architecture",
          lessons: [
            {
              title: "Understanding Context Windows, Tokens, and Temperature",
              durationSeconds: 350,
              preview: true,
              videoUrl: SAMPLE_VIDEOS[4],
              summary: "How large language models generate tokens and how hyperparameters control determinism.",
              content: `### LLM Hyperparameters Demystified
- **Temperature (0.0 to 1.0)**: Lower temperature (0.0 - 0.2) makes responses deterministic and focused (ideal for code and extraction). Higher temperature (0.7 - 1.0) increases creative diversity.
- **Top-P (Nucleus Sampling)**: Dynamically selects the cumulative probability mass of candidate tokens.`,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What temperature setting is recommended for deterministic tasks like code generation or JSON extraction?",
          options: ["Low temperature (0.0 to 0.2)", "High temperature (1.0 to 1.5)", "Temperature has no effect on output", "Negative temperature (-1.0)"],
          correctOptionIndex: 0,
        },
      ],
    },
    {
      instructor: instructors[0]!,
      title: "Digital Product Strategy & Modern Growth Marketing",
      subtitle: "Turn user insights and retention funnels into sustainable business growth.",
      description: "Learn how top tech companies discover product-market fit, design acquisition loops, analyze churn cohorts, and scale customer lifetime value (LTV).",
      category: "Business",
      level: "Beginner",
      badge: "Essential",
      priceMinor: 0,
      currency: "USD",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      outcomes: [
        "Identify core problem-solution fit through customer interviews",
        "Design acquisition and referral growth flywheels",
        "Read cohort retention curves and reduce churn bottlenecks",
        "Formulate pricing tiers and freemium conversion strategies",
      ],
      prerequisites: ["Curiosity about business models and product thinking"],
      sections: [
        {
          title: "Module 1: Product-Market Fit & Metric Architecture",
          lessons: [
            {
              title: "Finding the Core Problem & The 'Must-Have' Test",
              durationSeconds: 320,
              preview: true,
              videoUrl: SAMPLE_VIDEOS[5],
              summary: "How to evaluate whether you are solving an acute pain point before writing code.",
              content: `### The Sean Ellis 40% Test
Ask existing users: *"How would you feel if you could no longer use this product?"*
- Very disappointed
- Somewhat disappointed
- Not disappointed

If 40%+ answer **Very disappointed**, you have achieved early product-market fit.`,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does a flattening cohort retention curve indicate?",
          options: ["A healthy baseline of users continue finding recurring value in the product", "All users have churned", "The marketing campaign has failed", "The database is out of space"],
          correctOptionIndex: 0,
        },
      ],
    },
  ];

  // Insert courses, lessons, quizzes, reviews, and announcements
  for (const c of courseDefinitions) {
    const courseId = id();
    const sections = c.sections.map((sec) => ({
      id: id(),
      title: sec.title,
      lessons: sec.lessons.map((les) => ({
        id: id(),
        title: les.title,
        durationSeconds: les.durationSeconds,
        preview: les.preview,
        videoUrl: les.videoUrl,
        summary: les.summary,
        content: les.content,
        resources: (les as { resources?: unknown[] }).resources || [],
      })),
    }));

    const courseRecord = {
      id: courseId,
      instructorId: c.instructor.id,
      instructorName: c.instructor.name,
      instructorTitle: c.instructor.title,
      instructorAvatar: c.instructor.avatar,
      instructorBio: c.instructor.bio,
      title: c.title,
      slug: `${slugify(c.title)}-${courseId.slice(0, 6)}`,
      subtitle: c.subtitle,
      description: c.description,
      category: c.category,
      level: c.level,
      language: "English",
      priceMinor: c.priceMinor,
      currency: c.currency,
      thumbnail: c.thumbnail,
      badge: c.badge,
      outcomes: c.outcomes,
      prerequisites: c.prerequisites,
      status: "PUBLISHED",
      sections,
      averageRating: 5.0,
      reviewCount: 3,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await insert("courses", courseRecord);

    // Quiz
    await insert("quizzes", {
      id: id(),
      courseId,
      title: `${c.title} — Knowledge Check`,
      passPercent: 70,
      required: true,
      questions: c.quiz.map((q) => ({ id: id(), ...q })),
    });

    // Reviews
    const sampleReviews = [
      { name: "Alex Chen", comment: "Outstanding content! The code examples and real-world architectures were immediately useful in my daily job.", rating: 5 },
      { name: "Maya Patel", comment: "Hands down the best explanation of these concepts I have found online. Clean, direct, and beginner friendly.", rating: 5 },
      { name: "Liam Vance", comment: "The live classes and hands-on curriculum made this well worth the time. 10/10 recommended!", rating: 5 },
    ];
    for (const r of sampleReviews) {
      await insert("course_reviews", {
        id: id(),
        courseId,
        studentId: student.id,
        studentName: r.name,
        rating: r.rating,
        comment: r.comment,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    // Announcements
    await insert("course_announcements", {
      id: id(),
      courseId,
      instructorId: c.instructor.id,
      instructorName: c.instructor.name,
      title: "Welcome to class! Access resources and live sessions here",
      content: `Welcome to ${c.title}! We are excited to learn together. Be sure to check out the lesson attachments, try the knowledge checks, and join our scheduled live studio sessions.`,
      createdAt: timestamp,
    });
  }

  // Pre-enroll demo learner into the first free course
  const firstCourse = (await all<{ id: string; priceMinor: number }>("courses")).find((c) => c.priceMinor === 0);
  if (firstCourse) {
    await insert("enrollments", {
      id: id(),
      courseId: firstCourse.id,
      studentId: student.id,
      status: "ACTIVE",
      createdAt: timestamp,
    });
  }

  console.info(`Successfully seeded ${courseDefinitions.length} authentic, richly-documented courses!`);
  console.info(`Demo Instructor: ${instructors[0]!.email} / ${instructorPassword}`);
  console.info(`Demo Learner: ${student.email} / ${studentPassword}`);
}
