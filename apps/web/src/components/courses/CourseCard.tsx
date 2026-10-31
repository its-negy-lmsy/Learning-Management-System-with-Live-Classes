import { Link } from "react-router-dom";
import { BookOpen, Star } from "lucide-react";
import type { Course } from "@fs03/shared";
import { formatMoney } from "../../format";

export function CourseCard({
  course,
  index,
}: {
  course: Course & { enrollmentCount?: number };
  index: number;
}) {
  const lessonCount = course.sections.reduce(
    (count, section) => count + section.lessons.length,
    0
  );
  const duration = Math.max(
    1,
    Math.round(
      course.sections
        .flatMap((section) => section.lessons)
        .reduce((sum, lesson) => sum + lesson.durationSeconds, 0) / 60
    )
  );

  return (
    <Link className={`course-card card-tone-${index % 3}`} to={`/course/${course.id}`}>
      <div className="course-image">
        <img src={course.thumbnail} alt={course.title} loading="lazy" />
        <span className="category-pill">{course.category}</span>
        {course.badge && <span className="badge-pill">{course.badge}</span>}
        <span className="course-image-index">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="course-card-content">
        <div className="course-meta">
          <span className={`level-badge level-${course.level.toLowerCase()}`}>{course.level}</span>
          <span className="meta-dot">·</span>
          <span>{duration} min</span>
          {course.averageRating ? (
            <>
              <span className="meta-dot">·</span>
              <span className="card-rating">
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                <strong>{course.averageRating.toFixed(1)}</strong>
                {course.reviewCount ? <small>({course.reviewCount})</small> : null}
              </span>
            </>
          ) : null}
        </div>
        <h3>{course.title}</h3>
        <p>{course.subtitle}</p>
        <div className="course-card-bottom">
          <div className="instructor-mini">
            {course.instructorAvatar ? (
              <img src={course.instructorAvatar} alt={course.instructorName} className="instructor-avatar-img" />
            ) : (
              <span>{course.instructorName.slice(0, 1)}</span>
            )}
            <div>
              <span className="instructor-name">{course.instructorName}</span>
              {course.instructorTitle && <small className="instructor-title">{course.instructorTitle}</small>}
            </div>
          </div>
          <div className="card-price-block">
            <small>{lessonCount} lessons</small>
            <strong className={course.priceMinor === 0 ? "free-tag" : "paid-tag"}>
              {course.priceMinor ? formatMoney(course.priceMinor, course.currency) : "Free"}
            </strong>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CourseGrid({
  courses,
  loading,
}: {
  courses: Array<Course & { enrollmentCount?: number }>;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="course-grid">
        {[1, 2, 3].map((item) => (
          <div className="course-skeleton" key={item} />
        ))}
      </div>
    );
  }
  if (!courses.length) {
    return (
      <div className="empty-state">
        <BookOpen size={23} />
        <h3>A fresh page</h3>
        <p>Try a different topic or search phrase.</p>
      </div>
    );
  }
  return (
    <div className="course-grid">
      {courses.map((course, index) => (
        <CourseCard course={course} index={index} key={course.id} />
      ))}
    </div>
  );
}
