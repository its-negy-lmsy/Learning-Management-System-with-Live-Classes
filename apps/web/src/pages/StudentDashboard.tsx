import { Link } from "react-router-dom";
import { ArrowRight, Award, BookOpen, CheckCircle2, Download, Play } from "lucide-react";
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

  return (
    <section className="dashboard wrap">
      <div className="dash-greeting">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> YOUR LEARNING DESK
          </div>
          <h1>
            Good to have you,
            <br />
            <em>{user.name.split(" ")[0]}.</em>
          </h1>
          <p>A little progress adds up. Here’s where you are today.</p>
        </div>
        <Link to="/explore" className="button button-dark">
          Find a new course <ArrowRight size={15} />
        </Link>
      </div>

      <div className="stat-row">
        <Stat
          icon={<BookOpen size={18} />}
          label="Courses in progress"
          value={String(enrollments.length).padStart(2, "0")}
          note="Yours to explore"
        />
        <Stat
          icon={<CheckCircle2 size={18} />}
          label="Lessons finished"
          value={String(
            enrollments.reduce((sum, item) => sum + item.progress.completed, 0)
          ).padStart(2, "0")}
          note="One step at a time"
        />
        <Stat
          icon={<Award size={18} />}
          label="Certificates"
          value={String(certificates?.certificates.length ?? 0).padStart(2, "0")}
          note="Earned by you"
        />
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-main">
          <div className="list-heading">
            <div>
              <span className="eyebrow">
                <span className="eyebrow-line" /> Pick up where you left off
              </span>
              <h2>Your learning path</h2>
            </div>
            <Link to="/explore" className="text-link">
              Browse more <ArrowRight size={14} />
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
              <p>Join a course that makes you curious.</p>
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
            <span className="side-card-label">YOUR CERTIFICATES</span>
            <h3>Proof of the work you put in.</h3>
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
              <p>Finish a course and pass its knowledge check to earn your first one.</p>
            )}
          </div>

          <div className="side-note">
            <span>✳</span>
            <strong>Small steps count.</strong>
            <p>Ten focused minutes today can make tomorrow feel a little clearer.</p>
          </div>

          <div className="side-card teach-card">
            <span className="side-card-label">HAVE SOMETHING TO SHARE?</span>
            <h3>Make room for someone else to learn.</h3>
            <Link className="text-link" to="/teach">
              Apply to teach <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
