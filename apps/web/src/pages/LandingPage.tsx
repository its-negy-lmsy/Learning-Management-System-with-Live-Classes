import { Link } from "react-router-dom";
import { ArrowRight, Award, BookOpen, Sparkles, Star, Video } from "lucide-react";
import { useCoursesQuery } from "../api";
import { CourseGrid } from "../components/courses/CourseCard";

const learningPaths = [
  {
    title: "Full-Stack Development",
    desc: "From JavaScript fundamentals to production React, Node.js, and WebRTC streaming architecture.",
    level: "Beginner Friendly",
    coursesCount: "3 masterclasses",
    icon: "💻",
    category: "Development",
    tintClass: "card-tint-peach",
  },
  {
    title: "Cloud & DevOps Engineering",
    desc: "Master Docker containers, AWS CloudFront distribution, FFmpeg transcode pipelines, and CI/CD.",
    level: "All Levels",
    coursesCount: "2 masterclasses",
    icon: "☁️",
    category: "Cloud",
    tintClass: "card-tint-mint",
  },
  {
    title: "UI/UX & Design Systems",
    desc: "Typography, color theory, accessibility standards, and building scalable component libraries.",
    level: "Beginner Friendly",
    coursesCount: "2 masterclasses",
    icon: "🎨",
    category: "Design",
    tintClass: "card-tint-lavender",
  },
  {
    title: "AI & Modern Data Analytics",
    desc: "Python for data analysis, vector embeddings, pipeline orchestration, and LLM application design.",
    level: "Intermediate",
    coursesCount: "2 masterclasses",
    icon: "📊",
    category: "Data",
    tintClass: "card-tint-sky",
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
      {/* Notion Signature Hero Band */}
      <section className="notion-hero-band">
        <div className="wrap">
          {/* Notion Colorful Sticky-Note Dots */}
          <div className="notion-sticky-dots">
            <span className="notion-dot notion-dot-pink" />
            <span className="notion-dot notion-dot-mint" />
            <span className="notion-dot notion-dot-yellow" />
            <span className="notion-dot notion-dot-peach" />
            <span className="notion-dot notion-dot-lavender" />
          </div>

          <div className="notion-hero-layout">
            <div className="notion-hero-copy">
              <div className="notion-hero-eyebrow">
                <span className="eyebrow-line" /> THE MODERN LEARNING MANAGEMENT SYSTEM
              </div>
              <h1 className="notion-hero-title">
                Master modern skills
                <br />
                <em>with live classes.</em>
              </h1>
              <p className="notion-hero-subtitle">
                Engaging video lectures, real-time WebRTC interactive studios, auto-graded quizzes, and tamper-proof QR certificates built for your career.
              </p>
              <div className="notion-hero-actions">
                <Link className="button notion-hero-cta" to="/explore">
                  Explore 6 Masterclasses <ArrowRight size={16} />
                </Link>
                <Link className="button notion-hero-cta-secondary" to="/teach">
                  Teach on Fieldnotes
                </Link>
              </div>
            </div>

            {/* Notion Live Workspace Mockup Frame */}
            <div className="notion-hero-mockup">
              <div className="mockup-window-header">
                <span className="mockup-dot red" />
                <span className="mockup-dot yellow" />
                <span className="mockup-dot green" />
                <span className="mockup-title">fieldnotes.studio / classroom / live</span>
              </div>
              <div className="mockup-screen">
                <div className="mockup-preview-card">
                  <div className="mockup-preview-img-wrap">
                    <img
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
                      alt="Full-Stack Studio Live Classroom"
                    />
                    <div className="mockup-live-indicator">
                      <span className="mockup-live-dot" />
                      LIVE STUDIO ACTIVE
                    </div>
                  </div>
                  <div className="mockup-preview-footer">
                    <div className="mockup-preview-copy">
                      <strong>Full-Stack TypeScript & React 19</strong>
                      <small>Next Session: Production Docker & HLS Streaming</small>
                    </div>
                    <Link to="/explore" className="mockup-badge">
                      Join Classroom →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

      {/* Notion Pastel Learning Tracks */}
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
              className={`track-card ${track.tintClass}`}
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

      {/* Notion Spotlight / Manifesto Section */}
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
