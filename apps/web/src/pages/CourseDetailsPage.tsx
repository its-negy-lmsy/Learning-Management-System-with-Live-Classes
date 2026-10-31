import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Bell,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  Layers3,
  MessageCircle,
  Play,
  Send,
  Sparkles,
  Star,
  Users,
  Video,
} from "lucide-react";
import {
  useCourseQuery,
  useEnrollMutation,
  useEnrollmentsQuery,
  useCheckoutMutation,
  useMockConfirmMutation,
  useReviewsQuery,
  useAddReviewMutation,
  useAnnouncementsQuery,
} from "../api";
import { useAppSelector } from "../store";
import { formatMoney } from "../format";
import { ErrorPanel, PageLoading, friendlyError } from "../components/common/UIComponents";

export function CourseDetailsPage() {
  const { courseId = "" } = useParams();
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading, error } = useCourseQuery(courseId);
  const { data: enrollmentsData } = useEnrollmentsQuery(undefined, {
    skip: !user || user.role !== "STUDENT",
  });
  const { data: reviewData } = useReviewsQuery(courseId);
  const { data: announcementData } = useAnnouncementsQuery(courseId);
  const [addReview, reviewMutation] = useAddReviewMutation();
  const [enroll, enrollResult] = useEnrollMutation();
  const [checkout, checkoutResult] = useCheckoutMutation();
  const [confirm] = useMockConfirmMutation();
  const navigate = useNavigate();
  const [paymentId, setPaymentId] = useState("");
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  const course = data?.course;
  const isEnrolled = Boolean(
    enrollmentsData?.enrollments?.some((item) => item.course.id === course?.id)
  );

  if (isLoading) return <PageLoading />;
  if (!course) {
    return (
      <section className="wrap page-pad">
        <ErrorPanel message={friendlyError(error)} />
        <Link to="/explore" className="text-link">
          Back to courses
        </Link>
      </section>
    );
  }

  const startCourse = async () => {
    if (!user) {
      navigate("/login?returnTo=" + encodeURIComponent(`/course/${course.id}`));
      return;
    }
    if (isEnrolled) {
      navigate(`/learn/${course.id}`);
      return;
    }
    try {
      if (course.priceMinor > 0) {
        const result = await checkout(course.id).unwrap();
        if (result.checkoutUrl) {
          window.location.assign(result.checkoutUrl);
          return;
        }
        if (result.payment?.id) setPaymentId(result.payment.id);
      } else {
        await enroll(course.id).unwrap();
        navigate(`/learn/${course.id}`);
      }
    } catch {
      /* Mutation error shown below */
    }
  };

  const lessons = course.sections.flatMap((section) =>
    section.lessons.map((lesson) => ({ ...lesson, section: section.title }))
  );

  return (
    <section className="course-detail-page">
      <div className="detail-hero">
        <div className="wrap detail-hero-inner">
          <div className="detail-copy">
            <Link to="/explore" className="back-link">
              <ChevronLeft size={16} /> Course library
            </Link>
            <div className="detail-badges">
              {course.badge && <span className="highlight-badge">★ {course.badge}</span>}
              <span>{course.category}</span>
              <span>{course.level}</span>
              <span>{course.language}</span>
            </div>
            <h1>{course.title}</h1>
            <p className="detail-subtitle">{course.subtitle}</p>
            <div className="detail-byline">
              {course.instructorAvatar ? (
                <img
                  className="avatar avatar-large"
                  src={course.instructorAvatar}
                  alt={course.instructorName}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <span className="avatar avatar-large">
                  {course.instructorName.slice(0, 1)}
                </span>
              )}
              <div>
                <span>
                  Taught by <strong>{course.instructorName}</strong>
                </span>
                {course.instructorTitle && (
                  <small style={{ display: "block", color: "#64748b", fontSize: "11px" }}>
                    {course.instructorTitle}
                  </small>
                )}
              </div>
              <span className="byline-divider" />
              <span>
                <Users size={15} /> {data.enrollmentCount} learners
              </span>
              {reviewData?.stats.totalReviews ? (
                <>
                  <span className="byline-divider" />
                  <span className="hero-rating-badge">
                    <Star size={15} fill="#d97706" color="#d97706" />
                    <strong>{reviewData.stats.averageRating.toFixed(1)}</strong>
                    <small>({reviewData.stats.totalReviews} reviews)</small>
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <div className="detail-cover">
            <img src={course.thumbnail} alt="" />
            <span className="cover-sticker">
              <Sparkles size={14} /> LEARN AT YOUR PACE
            </span>
          </div>
        </div>
      </div>

      <div className="wrap detail-body">
        <div className="detail-main">
          <div className="detail-section">
            <span className="eyebrow">
              <span className="eyebrow-line" /> The course
            </span>
            <h2>
              A good place to
              <br />
              <em>get your hands dirty.</em>
            </h2>
            <p className="long-copy">{course.description}</p>
          </div>

          <div className="detail-section outcomes-section">
            <h3>By the end, you’ll be able to</h3>
            {course.outcomes.map((outcome) => (
              <div className="outcome-row" key={outcome}>
                <CheckCircle2 size={18} />
                <span>{outcome}</span>
              </div>
            ))}
          </div>

          <div className="detail-section prerequisites-section">
            <h3>Requirements & Beginner Readiness</h3>
            {course.prerequisites && course.prerequisites.length > 0 ? (
              course.prerequisites.map((prereq) => (
                <div className="outcome-row" key={prereq}>
                  <CheckCircle2 size={18} color="#6366f1" />
                  <span>{prereq}</span>
                </div>
              ))
            ) : (
              <div className="outcome-row">
                <CheckCircle2 size={18} color="#10b981" />
                <span>No prior experience needed. Suitable for complete beginners.</span>
              </div>
            )}
          </div>

          <div className="detail-section instructor-card-section">
            <span className="eyebrow">
              <span className="eyebrow-line" /> YOUR INSTRUCTOR
            </span>
            <div className="instructor-profile-box">
              <div className="instructor-profile-head">
                {course.instructorAvatar ? (
                  <img
                    className="avatar-instructor"
                    src={course.instructorAvatar}
                    alt={course.instructorName}
                  />
                ) : (
                  <div className="avatar-instructor-placeholder">
                    {course.instructorName.slice(0, 1)}
                  </div>
                )}
                <div>
                  <h4>{course.instructorName}</h4>
                  <small className="instructor-title-text">{course.instructorTitle || "Lead Instructor & Industry Mentor"}</small>
                  <span className="verified-badge">✓ Verified Instructor</span>
                </div>
              </div>
              <p className="instructor-bio-text">
                {course.instructorBio ||
                  `${course.instructorName} is an experienced instructor passionate about making complex skills accessible through hands-on, project-based learning.`}
              </p>
            </div>
          </div>

          <div className="detail-section curriculum">
            <div className="curriculum-title">
              <div>
                <h3>Inside the studio</h3>
                <p>
                  {lessons.length} focused lessons · about{" "}
                  {Math.max(
                    1,
                    Math.round(
                      lessons.reduce((sum, lesson) => sum + lesson.durationSeconds, 0) / 60
                    )
                  )}{" "}
                  min
                </p>
              </div>
              <Layers3 size={22} />
            </div>
            {course.sections.map((section) => (
              <div key={section.id} className="curriculum-group">
                <h4>{section.title}</h4>
                {section.lessons.map((lesson, index) => (
                  <div className="curriculum-lesson" key={lesson.id}>
                    <span className="lesson-play">
                      <Play size={12} fill="currentColor" />
                    </span>
                    <span>
                      {lesson.title}
                      <small>
                        {lesson.preview ? "Preview lesson" : `Lesson ${index + 1}`}
                      </small>
                    </span>
                    <span>{Math.ceil(lesson.durationSeconds / 60)} min</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {announcementData?.announcements && announcementData.announcements.length > 0 && (
            <div className="detail-section announcements-section">
              <div className="section-title-row">
                <span className="eyebrow">
                  <span className="eyebrow-line" /> INSTRUCTOR UPDATES
                </span>
                <Bell size={18} />
              </div>
              <h3>Studio announcements</h3>
              <div className="announcements-list">
                {announcementData.announcements.map((announcement) => (
                  <div key={announcement.id} className="announcement-card">
                    <div className="announcement-header">
                      <strong>{announcement.title}</strong>
                      <small>{new Date(announcement.createdAt).toLocaleDateString()}</small>
                    </div>
                    <p>{announcement.content}</p>
                    <small className="announcement-byline">Posted by {announcement.instructorName}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section reviews-section">
            <div className="section-title-row">
              <span className="eyebrow">
                <span className="eyebrow-line" /> LEARNER VOICES
              </span>
              <Star size={18} fill="#d97706" color="#d97706" />
            </div>
            <div className="reviews-header-block">
              <div className="rating-summary-box">
                <div className="rating-score">
                  {reviewData?.stats.totalReviews ? reviewData.stats.averageRating.toFixed(1) : "5.0"}
                </div>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      fill={s <= Math.round(reviewData?.stats.averageRating ?? 5) ? "#d97706" : "none"}
                      color="#d97706"
                    />
                  ))}
                </div>
                <div className="rating-count">
                  {reviewData?.stats.totalReviews ?? 0} verified reviews
                </div>
              </div>
              <div className="reviews-intro-copy">
                <h3>What students are saying</h3>
                <p>Authentic feedback from students who have taken this course.</p>
              </div>
            </div>

            {user?.role === "STUDENT" && (
              <form
                className="review-form-card"
                onSubmit={async (e: FormEvent) => {
                  e.preventDefault();
                  if (!myComment.trim()) return;
                  try {
                    await addReview({
                      courseId: course.id,
                      rating: myRating,
                      comment: myComment.trim(),
                    }).unwrap();
                    setMyComment("");
                    setReviewMessage("Thank you! Your review has been recorded.");
                  } catch (err) {
                    setReviewMessage(friendlyError(err));
                  }
                }}
              >
                <h4>Leave your review</h4>
                <div className="star-picker">
                  <span>Rating:</span>
                  <div className="stars-input">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        type="button"
                        key={starVal}
                        className={`star-pick-btn ${starVal <= myRating ? "active" : ""}`}
                        onClick={() => setMyRating(starVal)}
                      >
                        <Star size={18} fill={starVal <= myRating ? "#d97706" : "none"} color="#d97706" />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  className="review-textarea"
                  rows={3}
                  placeholder="What did you learn? What was most helpful?"
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  required
                />
                <div className="review-form-actions">
                  <button
                    type="submit"
                    className="button button-dark"
                    disabled={reviewMutation.isLoading || !myComment.trim()}
                  >
                    Post review <Send size={14} />
                  </button>
                  {reviewMessage && <span className="review-message">{reviewMessage}</span>}
                </div>
              </form>
            )}

            <div className="reviews-cards-list">
              {reviewData?.reviews && reviewData.reviews.length > 0 ? (
                reviewData.reviews.map((rev) => (
                  <div key={rev.id} className="review-item-card">
                    <div className="review-item-header">
                      <div className="review-user-info">
                        <span className="avatar avatar-small">{rev.studentName.slice(0, 1)}</span>
                        <div>
                          <strong>{rev.studentName}</strong>
                          <small>{new Date(rev.createdAt).toLocaleDateString()}</small>
                        </div>
                      </div>
                      <div className="review-item-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            fill={s <= rev.rating ? "#d97706" : "none"}
                            color="#d97706"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="review-item-text">{rev.comment}</p>
                  </div>
                ))
              ) : (
                <div className="empty-reviews-state">
                  <p>Be the first learner to leave a review after joining!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="enroll-panel">
          <div className="enroll-panel-image">
            <img src={course.thumbnail} alt="" />
            <span>
              <Play size={17} fill="currentColor" />
            </span>
          </div>
          <div className="enroll-panel-content">
            <div className="price-line">
              {course.priceMinor ? (
                formatMoney(course.priceMinor, course.currency)
              ) : (
                <strong>Free to join</strong>
              )}
              <small>one-time access</small>
            </div>
            <button onClick={startCourse} className="button button-dark enroll-button">
              {isEnrolled
                ? "Continue learning"
                : course.priceMinor
                ? "Join this course"
                : "Start learning"}
              <ArrowRight size={16} />
            </button>
            {user?.role === "STUDENT" && (
              <small className="quiet-note">
                {isEnrolled ? "You are enrolled in this course." : "Your progress saves as you go."}
              </small>
            )}
            {user && user.id === course.instructorId && (
              <Link className="button button-cream enroll-button" to="/instructor">
                Open teaching studio
              </Link>
            )}
            <div className="panel-divider" />
            <div className="included-title">A little of everything</div>
            <div className="included-row">
              <Video size={16} /> Short, focused video lessons
            </div>
            <div className="included-row">
              <CircleHelp size={16} /> A practical knowledge check
            </div>
            <div className="included-row">
              <MessageCircle size={16} /> Live class access
            </div>
            <div className="included-row">
              <Award size={16} /> A certificate when you finish
            </div>
          </div>
        </aside>
      </div>

      {(enrollResult.error || checkoutResult.error) && (
        <div className="wrap">
          <ErrorPanel message={friendlyError(enrollResult.error ?? checkoutResult.error)} />
        </div>
      )}

      {paymentId && (
        <div className="payment-demo-bar wrap">
          <div>
            <strong>Your demo checkout is ready.</strong>
            <span>Complete the local test payment to unlock the course.</span>
          </div>
          <button
            className="button button-dark"
            onClick={async () => {
              try {
                await confirm(paymentId).unwrap();
                navigate(`/learn/${course.id}`);
              } catch {
                /* Error surfaced on refresh */
              }
            }}
          >
            Complete demo payment <ArrowRight size={15} />
          </button>
        </div>
      )}
    </section>
  );
}
