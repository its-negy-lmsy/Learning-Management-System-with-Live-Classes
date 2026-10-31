import { useState } from "react";
import { CheckCircle2, ShieldCheck, X } from "lucide-react";
import {
  useAdminOverviewQuery,
  useAdminReviewQueueQuery,
  useInstructorApplicationsQuery,
  useReviewCourseMutation,
  useReviewInstructorApplicationMutation,
} from "../api";
import { useAppSelector } from "../store";
import { formatMoney } from "../format";
import { AuthPrompt, NavigateTo, friendlyError, rolePath } from "../components/common/UIComponents";

export function AdminDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const { data } = useAdminOverviewQuery(undefined, {
    skip: !user || user.role !== "ADMIN",
  });
  const { data: queue } = useAdminReviewQueueQuery(undefined, {
    skip: !user || user.role !== "ADMIN",
  });
  const { data: applications } = useInstructorApplicationsQuery(undefined, {
    skip: !user || user.role !== "ADMIN",
  });

  const [reviewCourse] = useReviewCourseMutation();
  const [reviewApplication] = useReviewInstructorApplicationMutation();
  const [feedback, setFeedback] = useState("");

  if (!user) return <AuthPrompt />;
  if (user.role !== "ADMIN") return <NavigateTo to={rolePath(user.role)} />;

  const metrics = [
    "users",
    "instructors",
    "publishedCourses",
    "pendingReview",
    "enrollments",
    "certificatesIssued",
    "payments",
    "platformRevenueMinor",
  ];

  return (
    <section className="dashboard wrap">
      <div className="dash-greeting">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> PLATFORM OPERATIONS
          </div>
          <h1>
            Everything in
            <br />
            <em>good order.</em>
          </h1>
          <p>Real platform counts from the learning studio records.</p>
        </div>
        <span className="admin-badge">
          <ShieldCheck size={17} /> Administrator
        </span>
      </div>

      <div className="admin-metrics">
        {metrics.map((metric) => (
          <div key={metric} className="admin-metric">
            <small>
              {metric
                .replace(/([A-Z])/g, " $1")
                .replace("Minor", "")
                .toUpperCase()}
            </small>
            <strong>
              {metric === "platformRevenueMinor"
                ? formatMoney(Number(data?.[metric] ?? 0))
                : Number(data?.[metric] ?? 0).toLocaleString()}
            </strong>
          </div>
        ))}
      </div>

      {feedback && (
        <div className="notice-bar">
          <CheckCircle2 size={16} />
          {feedback}
          <button onClick={() => setFeedback("")}>
            <X size={15} />
          </button>
        </div>
      )}

      <div className="admin-review-grid">
        <div className="side-card">
          <span className="side-card-label">COURSE MODERATION</span>
          <h3>Review the work.</h3>
          {queue?.courses.length ? (
            queue.courses.map((course) => (
              <div className="review-row" key={course.id}>
                <div>
                  <strong>{course.title}</strong>
                  <small>
                    {course.category} · by {course.instructorName}
                  </small>
                  <p>{course.subtitle}</p>
                </div>
                <div>
                  <button
                    className="review-approve"
                    onClick={async () => {
                      try {
                        await reviewCourse({
                          courseId: course.id,
                          decision: "approve",
                        }).unwrap();
                        setFeedback(`${course.title} is published.`);
                      } catch (error) {
                        setFeedback(friendlyError(error));
                      }
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="review-reject"
                    onClick={async () => {
                      try {
                        await reviewCourse({
                          courseId: course.id,
                          decision: "reject",
                          note: "Please revise the course details and resubmit.",
                        }).unwrap();
                        setFeedback(`${course.title} was returned for revision.`);
                      } catch (error) {
                        setFeedback(friendlyError(error));
                      }
                    }}
                  >
                    Return
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No courses are waiting for review.</p>
          )}
        </div>

        <div className="side-card">
          <span className="side-card-label">INSTRUCTOR ONBOARDING</span>
          <h3>Welcome good teachers.</h3>
          {applications?.applications.length ? (
            applications.applications.map((application) => (
              <div className="review-row" key={application.id}>
                <div>
                  <strong>{application.applicant?.name ?? "Applicant"}</strong>
                  <small>{application.applicant?.email}</small>
                  <p>{application.bio}</p>
                  <small>Topics: {application.specialties.join(", ")}</small>
                </div>
                <div>
                  <button
                    className="review-approve"
                    onClick={async () => {
                      try {
                        await reviewApplication({
                          applicationId: application.id,
                          decision: "approve",
                        }).unwrap();
                        setFeedback(
                          `${application.applicant?.name ?? "Applicant"} can now teach.`
                        );
                      } catch (error) {
                        setFeedback(friendlyError(error));
                      }
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="review-reject"
                    onClick={async () => {
                      try {
                        await reviewApplication({
                          applicationId: application.id,
                          decision: "reject",
                        }).unwrap();
                        setFeedback("Instructor application declined.");
                      } catch (error) {
                        setFeedback(friendlyError(error));
                      }
                    }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No instructor applications are waiting for review.</p>
          )}
        </div>
      </div>

      <div className="admin-bottom">
        <div className="side-card">
          <span className="side-card-label">MEDIA OPERATIONS</span>
          <h3>Video pipeline health</h3>
          <div className="revenue-line">
            <span>Processing</span>
            <strong>
              {(data?.mediaJobs as { processing: number } | undefined)?.processing ?? 0}
            </strong>
          </div>
          <div className="revenue-line">
            <span>Failed</span>
            <strong>
              {(data?.mediaJobs as { failed: number } | undefined)?.failed ?? 0}
            </strong>
          </div>
          <p>Job states are sourced from persisted media records.</p>
        </div>

        <div className="side-card">
          <span className="side-card-label">CERTIFICATES</span>
          <h3>Public verification</h3>
          <p>
            Certificate records and revocation are stored and administrator actions are
            audit logged.
          </p>
        </div>
      </div>
    </section>
  );
}
