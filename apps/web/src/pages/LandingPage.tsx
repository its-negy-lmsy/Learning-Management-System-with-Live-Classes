import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Award, BookOpen, Play, Sparkles, Users } from "lucide-react";
import { useCoursesQuery } from "../api";
import { CourseGrid } from "../components/courses/CourseCard";

const heroTags = ["Product design", "Creative coding", "Data & insight", "Career growth"];

export function LandingPage() {
  const { data, isLoading } = useCoursesQuery({ page: 1, limit: 3 });

  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-line" /> A little more room to grow
          </div>
          <h1>
            Learn something
            <br />
            <em>that moves you.</em>
          </h1>
          <p>
            Thoughtful courses, generous teachers, and a clear next step for wherever you want to go.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" to="/explore">
              Find your next course <ArrowRight size={16} />
            </Link>
            <div className="avatar-stack">
              <span>J</span>
              <span>M</span>
              <span>A</span>
              <small>Made for curious people</small>
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
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1100&q=88"
              alt="A student sketching ideas at a desk"
            />
            <div className="photo-grain" />
            <div className="photo-note">
              <span className="note-spark">✳</span>
              <span>
                Make space
                <br />
                for the next idea.
              </span>
            </div>
          </div>
          <div className="floating-card">
            <span className="float-icon">
              <Play size={14} fill="currentColor" />
            </span>
            <div>
              <strong>Learn at your pace</strong>
              <small>Short lessons, real momentum</small>
            </div>
            <ArrowUpRight size={15} />
          </div>
          <span className="hero-orbit orbit-one" />
          <span className="hero-orbit orbit-two" />
        </div>
      </section>

      <section className="partner-strip wrap">
        <span>GOOD IDEAS COME FROM</span>
        <div>
          <b>curiosity</b>
          <i>·</i>
          <b>practice</b>
          <i>·</i>
          <b>good company</b>
          <i>·</i>
          <b>showing up</b>
        </div>
        <span>
          STAY A WHILE <ArrowDownRight size={13} />
        </span>
      </section>

      <section className="section wrap">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> A few good places to begin
            </div>
            <h2>
              Courses for your
              <br />
              <em>next chapter.</em>
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
            Learning should feel less like keeping up,
            <br />
            and more like <em>finding your way.</em>
          </p>
          <Link to="/explore" className="button button-light">
            Find your people <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="section wrap path-section">
        <div className="eyebrow">
          <span className="eyebrow-line" /> The good stuff
        </div>
        <h2>
          A studio built around
          <br />
          <em>how people really learn.</em>
        </h2>
        <div className="path-grid">
          <div>
            <span className="path-number">01</span>
            <BookOpen size={21} />
            <h3>Make it practical</h3>
            <p>Small, well-shaped lessons give you something to try today, not someday.</p>
          </div>
          <div>
            <span className="path-number">02</span>
            <Users size={21} />
            <h3>Learn together</h3>
            <p>Meet your instructor live, ask a real question, and leave with a clearer next move.</p>
          </div>
          <div>
            <span className="path-number">03</span>
            <Award size={21} />
            <h3>Keep the proof</h3>
            <p>Build a steady record of the work you finish and the skills you earn.</p>
          </div>
        </div>
      </section>
    </>
  );
}
