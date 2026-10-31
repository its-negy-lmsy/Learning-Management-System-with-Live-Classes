import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Award, BookOpen, Play, Sparkles, Star, Video } from "lucide-react";
import { useCoursesQuery } from "../api";
import { CourseGrid } from "../components/courses/CourseCard";

const heroTags = ["Full-Stack Development", "AI & Data Science", "UI/UX Design Systems", "Cloud & DevOps"];

const learningPaths = [
  {
    title: "Full-Stack Development",
    desc: "From JavaScript fundamentals to production React, Node.js, and WebRTC streaming architecture.",
    level: "Beginner Friendly",
    coursesCount: "3 masterclasses",
    icon: "💻",
    category: "Development",
  },
  {
    title: "Cloud & DevOps Engineering",
    desc: "Master Docker containers, AWS CloudFront distribution, FFmpeg transcode pipelines, and CI/CD.",
    level: "All Levels",
    coursesCount: "2 masterclasses",
    icon: "☁️",
    category: "Cloud",
  },
  {
    title: "UI/UX & Design Systems",
    desc: "Typography, color theory, accessibility standards, and building scalable component libraries.",
    level: "Beginner Friendly",
    coursesCount: "2 masterclasses",
    icon: "🎨",
    category: "Design",
  },
  {
    title: "AI & Modern Data Analytics",
    desc: "Python for data analysis, vector embeddings, pipeline orchestration, and LLM application design.",
    level: "Intermediate",
    coursesCount: "2 masterclasses",
    icon: "📊",
    category: "Data",
  },
];

const testimonials = [
  {
    name: "Elena Rostova",
    role: "Junior Frontend Engineer at Vercel ecosystem",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
    text: "The step-by-step lecture guides and interactive code notes were a game changer. I went from tutorial hell to shipping real full-stack web applications in under 6 weeks.",
    course: "Full-Stack TypeScript & React 19 Masterclass",
    rating: 5,
  },
  {
    name: "Marcus Vance",
    role: "DevOps Engineer at ScaleCloud",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
    text: "The live class with screenshare was incredible. Being able to ask questions directly in the classroom studio made all the difference when troubleshooting Docker & FFmpeg pipelines.",
    course: "Cloud Architecture & Streaming Video Infrastructure",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Product Designer & Design Systems Lead",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80",
    text: "Authentic, high-resolution lessons with downloadable Figma tokens and starter repos. The certificate verification QR code looked so professional on my portfolio and LinkedIn.",
    course: "Modern UI/UX Design Systems & Figma to Code",
    rating: 5,
  },
];

export function LandingPage() {
  const { data, isLoading } = useCoursesQuery({ page: 1, limit: 6 });

  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-line" /> THE MODERN LEARNING MANAGEMENT SYSTEM
          </div>
          <h1>
            Master modern skills
            <br />
            <em>with live classes.</em>
          </h1>
          <p>
            Engaging video lessons, live WebRTC interactive classrooms, auto-graded quizzes, and verified certificates designed to launch your tech career.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" to="/explore">
              Explore 6 Masterclasses <ArrowRight size={16} />
            </Link>
            <div className="avatar-stack">
              <span>E</span>
              <span>M</span>
              <span>P</span>
              <small>14,200+ curious learners</small>
            </div>
          </div>
          <div className="hero-tags">
            {heroTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-photo">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1100&q=88"
              alt="Students collaborating and coding together"
            />
            <div className="photo-grain" />
            <div className="photo-note">
              <span className="note-spark">✳</span>
              <span>
                Learn by doing.
                <br />
                Build real software.
              </span>
            </div>
          </div>
          <div className="floating-card">
            <span className="float-icon">
              <Play size={14} fill="currentColor" />
            </span>
            <div>
              <strong>Self-paced + Live Studios</strong>
              <small>Interactive WebRTC & HLS video</small>
            </div>
            <ArrowUpRight size={15} />
          </div>
          <span className="hero-orbit orbit-one" />
          <span className="hero-orbit orbit-two" />
        </div>
      </section>

      {/* Platform Trust & Impact Metrics Bar */}
      <section className="metrics-banner wrap">
        <div className="metric-item">
          <strong>14,200+</strong>
          <span>Active Students Enrolled</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <strong>4.9 / 5.0</strong>
          <span>Average Masterclass Rating</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <strong>100%</strong>
          <span>Verified QR Certificates</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <strong>Real-Time</strong>
          <span>Live WebRTC Classrooms</span>
        </div>
      </section>

      {/* Beginner Friendly Learning Tracks */}
      <section className="section wrap paths-overview-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> STRUCTURED LEARNING TRACKS
            </div>
            <h2>
              Designed for beginners.
              <br />
              <em>Proven by builders.</em>
            </h2>
          </div>
          <Link className="text-link" to="/explore">
            View all tracks <ArrowRight size={15} />
          </Link>
        </div>
        <div className="tracks-grid">
          {learningPaths.map((track) => (
            <Link
              key={track.title}
              to={`/explore?category=${encodeURIComponent(track.category)}`}
              className="track-card"
            >
              <div className="track-icon-row">
                <span className="track-emoji">{track.icon}</span>
                <span className="track-pill">{track.level}</span>
              </div>
              <h3>{track.title}</h3>
              <p>{track.desc}</p>
              <div className="track-footer">
                <small>{track.coursesCount}</small>
                <span className="track-arrow">Explore track →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Courses Grid */}
      <section className="section wrap">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> CURATED CATALOG
            </div>
            <h2>
              Explore featured
              <br />
              <em>masterclasses.</em>
            </h2>
          </div>
          <Link className="text-link" to="/explore">
            See all courses <ArrowRight size={15} />
          </Link>
        </div>
        <CourseGrid courses={data?.courses ?? []} loading={isLoading} />
      </section>

      <section className="manifesto">
        <div className="wrap manifesto-inner">
          <div className="manifesto-stamp">
            <Sparkles size={25} />
            <span>
              STAY
              <br />
              CURIOUS
            </span>
          </div>
          <p>
            Learning shouldn’t feel like keeping up,
            <br />
            and more like <em>building what matters.</em>
          </p>
          <Link to="/explore" className="button button-light">
            Start Learning Today <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="section wrap path-section">
        <div className="eyebrow">
          <span className="eyebrow-line" /> THE LMS DIFFERENCE
        </div>
        <h2>
          A complete online school built for
          <br />
          <em>momentum and mastery.</em>
        </h2>
        <div className="path-grid">
          <div>
            <span className="path-number">01</span>
            <BookOpen size={21} />
            <h3>Multi-Modal Lessons</h3>
            <p>Watch video lectures, read structured lecture notes with code syntax highlighting, and download starter repos.</p>
          </div>
          <div>
            <span className="path-number">02</span>
            <Video size={21} />
            <h3>Live Interactive Classes</h3>
            <p>Join WebRTC studio rooms with screen sharing and instant chat to ask your instructor live questions.</p>
          </div>
          <div>
            <span className="path-number">03</span>
            <Award size={21} />
            <h3>Verified PDF Certificates</h3>
            <p>Complete auto-graded quizzes and download official PDF certificates with tamper-proof verification QR codes.</p>
          </div>
        </div>
      </section>

      {/* Student Testimonials */}
      <section className="section wrap testimonials-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> STUDENT VOICES
            </div>
            <h2>
              Loved by learners
              <br />
              <em>around the world.</em>
            </h2>
          </div>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <div key={t.name} className="testimonial-card">
              <div className="testimonial-rating">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p className="testimonial-quote">"{t.text}"</p>
              <div className="testimonial-author">
                <img src={t.avatar} alt={t.name} className="author-avatar" />
                <div>
                  <strong>{t.name}</strong>
                  <small>{t.role}</small>
                  <span className="testimonial-course">{t.course}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

