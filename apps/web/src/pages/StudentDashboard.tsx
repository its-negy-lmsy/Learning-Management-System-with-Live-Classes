import { Link } from "react-router-dom";
import { ArrowRight, Award, BookOpen, CheckCircle2, Download, Flame, Play, Trophy } from "lucide-react";
import { useEnrollmentsQuery, useCertificatesQuery } from "../api";
import { useAppSelector } from "../store";
import { AuthPrompt, NavigateTo, PageLoading, Stat, rolePath } from "../components/common/UIComponents";

export function StudentDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading: coursesLoading } = useEnrollmentsQuery(undefined, {
    skip: !user || user.role !== "STUDENT",
  });
  const { data: certificates } = useCertificatesQuery(undefined, { skip: !user });

  if (!user) return <AuthPrompt />;
  if (user.role !== "STUDENT") return <NavigateTo to={rolePath(user.role)} />;

  const enrollments = data?.enrollments ?? [];
  const mostRecentCourse = enrollments[0];
  const totalCompletedLessons = enrollments.reduce((sum, item) => sum + item.progress.completed, 0);

  return (
    <section className="dashboard wrap">
      <div className="dash-greeting">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> STUDENT PORTAL & LEARNING DESK
          </div>
          <h1>
            Welcome back,
            <br />
            <em>{user.name.split(" ")[0]}.</em>
          </h1>
          <p>You’re building real skills. Keep your momentum going today.</p>
        </div>
        <Link to="/explore" className="button button-dark">
          Explore Course Library <ArrowRight size={15} />
        </Link>
      </div>

      {/* Streak and Stats Row */}
      <div className="stat-row">
        <Stat
          icon={<BookOpen size={18} />}
          label="Courses Enrolled"
          value={String(enrollments.length).padStart(2, "0")}
          note="Full lifetime access"
        />
        <Stat
          icon={<CheckCircle2 size={18} />}
          label="Lessons Completed"
          value={String(totalCompletedLessons).padStart(2, "0")}
          note="Step-by-step progress"
        />
        <Stat
          icon={<Award size={18} />}
          label="Certificates Earned"
          value={String(certificates?.certificates.length ?? 0).padStart(2, "0")}
          note="With QR verification"
        />
      </div>

      {/* Jump Back In Hero Banner */}
      {mostRecentCourse && (
        <div className="resume-banner">
          <div className="resume-banner-left">
            <span className="resume-tag">
              <Flame size={13} color="#f59e0b" /> CONTINUE WHERE YOU LEFT OFF
            </span>
            <h2>{mostRecentCourse.course.title}</h2>
            <div className="resume-progress-bar">
              <div
                style={{
                  width: `${
                    mostRecentCourse.progress.total
                      ? Math.round((mostRecentCourse.progress.completed / mostRecentCourse.progress.total) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
            <small>
              {mostRecentCourse.progress.completed} of {mostRecentCourse.progress.total} lessons completed (
              {mostRecentCourse.progress.total
                ? Math.round((mostRecentCourse.progress.completed / mostRecentCourse.progress.total) * 100)
                : 0}
              %)
            </small>
          </div>
          <Link to={`/learn/${mostRecentCourse.course.id}`} className="button button-dark resume-btn">
            Resume Course <Play size={14} fill="currentColor" />
          </Link>
        </div>
      )}

      <div className="dashboard-columns">
        <div className="dashboard-main">
          <div className="list-heading">
            <div>
              <span className="eyebrow">
                <span className="eyebrow-line" /> YOUR ACTIVE STUDY PLAN
              </span>
              <h2>Enrolled Masterclasses</h2>
            </div>
            <Link to="/explore" className="text-link">
              Browse library <ArrowRight size={14} />
            </Link>
          </div>

          {coursesLoading ? (
            <PageLoading />
          ) : enrollments.length ? (
            <div className="learning-list">
              {enrollments.map((item) => (
                <Link
                  to={`/learn/${item.course.id}`}
                  className="learning-row"
                  key={item.course.id}
                >
                  <img src={item.course.thumbnail} alt="" />
                  <div className="learning-row-copy">
                    <span>
                      {item.course.category} <i>·</i> {item.course.level}
                    </span>
                    <h3>{item.course.title}</h3>
                    <div className="progress-line">
                      <span
                        style={{
                          width: `${
                            item.progress.total
                              ? Math.round(
                                  (item.progress.completed / item.progress.total) * 100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <small>
                      {item.progress.completed} of {item.progress.total} lessons complete
                    </small>
                  </div>
                  <span className="learning-continue">
                    <Play size={14} fill="currentColor" /> Continue
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <BookOpen size={22} />
              <h3>Your desk is clear.</h3>
              <p>Join a course that makes you curious. We have 6 authentic masterclasses ready.</p>
              <Link className="text-link" to="/explore">
                Browse the library <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>

        <aside className="dashboard-side">
          <div className="side-card certificate-card">
            <div className="certificate-icon">
              <Award size={20} />
            </div>
            <span className="side-card-label">OFFICIAL CREDENTIALS</span>
            <h3>Verified Certificates</h3>
            {certificates?.certificates.length ? (
              certificates.certificates.map((certificate) => (
                <a
                  className="certificate-mini"
                  href={`/api/v1/me/certificates/${certificate.id}.pdf`}
                  key={certificate.id}
                >
                  <span>
                    {certificate.courseTitle}
                    <small>{certificate.certificateNumber}</small>
                  </span>
                  <Download size={15} />
                </a>
              ))
            ) : (
              <p>Finish a course and pass its knowledge check to earn your verified certificate with tamper-proof QR code.</p>
            )}
          </div>

          <div className="side-card achievements-card">
            <div className="certificate-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
              <Trophy size={20} />
            </div>
            <span className="side-card-label">LEARNING MILESTONES</span>
            <h3>Your Achievements</h3>
            <div className="achievement-item">
              <span className={`achievement-badge ${enrollments.length > 0 ? "unlocked" : ""}`}>
                {enrollments.length > 0 ? "✓" : "○"}
              </span>
              <div>
                <strong>First Step</strong>
                <small>{enrollments.length > 0 ? "Enrolled in your first course" : "Enroll in any course"}</small>
              </div>
            </div>
            <div className="achievement-item">
              <span className={`achievement-badge ${totalCompletedLessons >= 3 ? "unlocked" : ""}`}>
                {totalCompletedLessons >= 3 ? "✓" : "○"}
              </span>
              <div>
                <strong>Active Learner</strong>
                <small>{totalCompletedLessons >= 3 ? "Finished 3+ lessons" : "Complete 3 lessons"}</small>
              </div>
            </div>
            <div className="achievement-item">
              <span className={`achievement-badge ${(certificates?.certificates.length ?? 0) > 0 ? "unlocked" : ""}`}>
                {(certificates?.certificates.length ?? 0) > 0 ? "✓" : "○"}
              </span>
              <div>
                <strong>Certified Scholar</strong>
                <small>{(certificates?.certificates.length ?? 0) > 0 ? "Earned course certificate" : "Pass a final quiz"}</small>
              </div>
            </div>
          </div>

          <div className="side-note">
            <span>✳</span>
            <strong>Small steps count.</strong>
            <p>15 minutes of hands-on practice every day compounds into mastery faster than marathon sessions.</p>
          </div>

          <div className="side-card teach-card">
            <span className="side-card-label">BECOME AN INSTRUCTOR</span>
            <h3>Share your expertise.</h3>
            <p style={{ marginBottom: "12px", fontSize: "12px", color: "#64748b" }}>
              Earn revenue, host live classes, and mentor the next generation of engineers and designers.
            </p>
            <Link className="text-link" to="/teach">
              Apply to teach <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

