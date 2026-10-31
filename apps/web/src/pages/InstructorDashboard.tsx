import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CloudUpload,
  DollarSign,
  FileCode,
  FileText,
  Layers3,
  Link as LinkIcon,
  Paperclip,
  Play,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  useAddLessonMutation,
  useCreateCourseMutation,
  useCreateLiveClassMutation,
  useEarningsQuery,
  useInstructorAnalyticsQuery,
  useInstructorCoursesQuery,
  useMediaQuery,
  usePublishCourseMutation,
  useUploadVideoMutation,
  useAnnouncementsQuery,
  useAddAnnouncementMutation,
  useAddLessonResourceMutation,
  useDeleteLessonResourceMutation,
  useInstructorLearnersQuery,
  useLiveClassesQuery,
  useJoinLiveClassMutation,
  useEndLiveClassMutation,
} from "../api";
import { useAppDispatch, useAppSelector } from "../store";
import { openLiveRoom } from "../slices/uiSlice";
import { formatCourseDate, formatMoney } from "../format";
import { InstructorQuizBuilder } from "../components/quiz/InstructorQuizBuilder";
import { AuthPrompt, ErrorPanel, NavigateTo, Stat, friendlyError, rolePath } from "../components/common/UIComponents";
import type { Course } from "@fs03/shared";

function MediaStatus({ mediaId }: { mediaId: string }) {
  const { data, isLoading } = useMediaQuery(mediaId, { pollingInterval: 2500 });
  const media = data?.media;
  return (
    <span
      className={`media-status ${
        media?.status === "READY"
          ? "ready"
          : media?.status === "FAILED"
          ? "failed"
          : "processing"
      }`}
    >
      {isLoading ? (
        "Checking…"
      ) : media?.status === "PROCESSING" ? (
        `Processing ${media.progress}%`
      ) : media?.status === "QUEUED" ? (
        "In queue"
      ) : media?.status === "READY" ? (
        <>
          <Check size={13} /> Ready
        </>
      ) : media?.status === "FAILED" ? (
        "Needs attention"
      ) : (
        "Uploaded"
      )}
    </span>
  );
}

async function useSample(
  lessonId: string,
  onUpload: (lessonId: string, file?: File) => void,
  setError: (message: string) => void
) {
  try {
    const response = await fetch("/api/v1/dev/sample-video");
    if (!response.ok) {
      const body = await response.json().catch(() => undefined);
      throw new Error(body?.error?.message ?? "Could not load the sample video.");
    }
    const blob = await response.blob();
    onUpload(lessonId, new File([blob], "fs03-sample.mp4", { type: "video/mp4" }));
  } catch (error) {
    setError(friendlyError(error));
  }
}

function LessonUploadRow({
  lesson,
  index,
  uploading,
  onUpload,
  onUseSample,
}: {
  lesson: Course["sections"][number]["lessons"][number];
  index: number;
  uploading: boolean;
  onUpload: (file?: File) => void;
  onUseSample: () => void;
}) {
  return (
    <div className="upload-lesson-row">
      <span className="lesson-index">{String(index + 1).padStart(2, "0")}</span>
      <div className="upload-lesson-copy">
        <strong>{lesson.title}</strong>
        <small>
          {Math.ceil(lesson.durationSeconds / 60)} min ·{" "}
          {lesson.mediaAssetId ? "Video attached" : "No video yet"}
        </small>
      </div>
      {lesson.mediaAssetId ? (
        <MediaStatus mediaId={lesson.mediaAssetId} />
      ) : (
        <div className="upload-actions">
          <button
            className="sample-video-button"
            type="button"
            onClick={onUseSample}
            disabled={uploading}
          >
            <Play size={12} /> Sample MP4
          </button>
          <label className="upload-trigger">
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/mpeg"
              onChange={(event) => onUpload(event.target.files?.[0])}
              disabled={uploading}
            />
            <CloudUpload size={15} /> {uploading ? "Uploading…" : "Upload video"}
          </label>
        </div>
      )}
    </div>
  );
}

export function InstructorDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const { data } = useInstructorCoursesQuery(undefined, {
    skip: !user || user.role !== "INSTRUCTOR",
  });
  const { data: earnings } = useEarningsQuery(undefined, {
    skip: !user || user.role !== "INSTRUCTOR",
  });
  const { data: analytics } = useInstructorAnalyticsQuery(undefined, {
    skip: !user || user.role !== "INSTRUCTOR",
  });

  const [createCourse, createState] = useCreateCourseMutation();
  const [addLesson] = useAddLessonMutation();
  const [publish, publishState] = usePublishCourseMutation();
  const [uploadVideo, uploadState] = useUploadVideoMutation();
  const [createClass, classState] = useCreateLiveClassMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [activeCourse, setActiveCourse] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Design");
  const [price, setPrice] = useState("0");

  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState("60");

  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionTime, setSessionTime] = useState("");

  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [resLessonId, setResLessonId] = useState("");
  const [resTitle, setResTitle] = useState("");
  const [resUrl, setResUrl] = useState("");
  const [resType, setResType] = useState<"pdf" | "link" | "code" | "document" | "archive">("pdf");
  const [resSize, setResSize] = useState("");

  if (!user) return <AuthPrompt instructor />;
  if (user.role !== "INSTRUCTOR") return <NavigateTo to={rolePath(user.role)} />;

  const courses = data?.courses ?? [];
  const active = courses.find((course) => course.id === activeCourse) ?? courses[0];
  const lessons = active?.sections.flatMap((section) => section.lessons) ?? [];

  const { data: announcementData } = useAnnouncementsQuery(active?.id ?? "", { skip: !active });
  const { data: learnersData } = useInstructorLearnersQuery(active?.id ?? "", { skip: !active });
  const { data: liveData } = useLiveClassesQuery(active?.id ?? "", { skip: !active });
  const dispatch = useAppDispatch();
  const [joinClass, joinState] = useJoinLiveClassMutation();
  const [endClass, endState] = useEndLiveClassMutation();
  const [addAnnouncement, addAnnState] = useAddAnnouncementMutation();
  const [addResource, addResState] = useAddLessonResourceMutation();
  const [deleteResource] = useDeleteLessonResourceMutation();

  const handleAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    if (!active || !annTitle.trim() || !annContent.trim()) return;
    try {
      await addAnnouncement({
        courseId: active.id,
        title: annTitle.trim(),
        content: annContent.trim(),
      }).unwrap();
      setAnnTitle("");
      setAnnContent("");
      setNotice("Course announcement broadcasted to enrolled students.");
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const handleAddResource = async (e: FormEvent) => {
    e.preventDefault();
    if (!active || !resLessonId || !resTitle.trim() || !resUrl.trim()) return;
    try {
      await addResource({
        courseId: active.id,
        lessonId: resLessonId,
        title: resTitle.trim(),
        url: resUrl.trim(),
        type: resType,
        sizeLabel: resSize.trim() || undefined,
      }).unwrap();
      setResTitle("");
      setResUrl("");
      setResSize("");
      setNotice("Downloadable lesson resource attached successfully.");
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const result = await createCourse({
        title,
        subtitle,
        description,
        category,
        level: "Beginner",
        language: "English",
        priceMinor: Math.round(Number(price || 0) * 100),
        currency: "USD",
        thumbnail:
          "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=85",
        outcomes: ["Apply a practical new skill"],
        prerequisites: [],
      }).unwrap();
      setActiveCourse(result.course.id);
      setTitle("");
      setSubtitle("");
      setDescription("");
      setShowCreate(false);
      setNotice("Your draft is ready. Add a lesson, then upload a video.");
    } catch (reason) {
      setError(friendlyError(reason));
    }
  };

  const handleLesson = async (event: FormEvent) => {
    event.preventDefault();
    if (!active) return;
    setError("");
    try {
      await addLesson({
        courseId: active.id,
        title: lessonTitle,
        durationSeconds: Number(lessonDuration),
        preview: true,
        newSectionTitle: "Start here",
      }).unwrap();
      setLessonTitle("");
      setNotice("Lesson added. Upload an MP4 or WebM video to begin processing.");
    } catch (reason) {
      setError(friendlyError(reason));
    }
  };

  const handleUpload = async (lessonId: string, file?: File) => {
    if (!file) return;
    setError("");
    try {
      const result = await uploadVideo({ lessonId, file }).unwrap();
      setNotice(
        `Video queued on the ${
          result.queue === "bullmq" ? "BullMQ" : "local development"
        } worker.`
      );
    } catch (reason) {
      setError(friendlyError(reason));
    }
  };

  const handlePublish = async () => {
    if (!active) return;
    setError("");
    try {
      const result = await publish({ courseId: active.id, publishImmediately: true }).unwrap();
      setNotice(result.message);
    } catch (reason) {
      setError(friendlyError(reason));
    }
  };

  const handleClass = async (event: FormEvent) => {
    event.preventDefault();
    if (!active || !sessionTime) return;
    try {
      const result = await createClass({
        courseId: active.id,
        body: {
          title: sessionTitle,
          startsAt: new Date(sessionTime).toISOString(),
          durationMinutes: 45,
        },
      }).unwrap();
      setNotice(
        result.providerConfigured
          ? "Live class scheduled with WebRTC live room ready."
          : "Live class scheduled. Connect LiveKit to enable audio, video, and chat."
      );
      setSessionTitle("");
      setSessionTime("");
    } catch (reason) {
      setError(friendlyError(reason));
    }
  };

  return (
    <section className="dashboard instructor-dash wrap">
      <div className="dash-greeting">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> TEACHING STUDIO
          </div>
          <h1>
            Good ideas need
            <br />
            <em>good teachers.</em>
          </h1>
          <p>Make something useful. Share what you know. See where it goes.</p>
        </div>
        <button className="button button-dark" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={16} /> Create a course
        </button>
      </div>

      {notice && (
        <div className="notice-bar">
          <CheckCircle2 size={17} />
          {notice}
          <button onClick={() => setNotice("")}>
            <X size={15} />
          </button>
        </div>
      )}
      {error && <ErrorPanel message={error} />}

      <div className="stat-row">
        <Stat
          icon={<DollarSign size={18} />}
          label="Instructor net"
          value={formatMoney(earnings?.instructorNetMinor ?? 0)}
          note="Recorded on the ledger"
        />
        <Stat
          icon={<Users size={18} />}
          label="Active learners"
          value={String(analytics?.activeLearners ?? 0).padStart(2, "0")}
          note="With an active enrollment"
        />
        <Stat
          icon={<BarChart3 size={18} />}
          label="Lessons completed"
          value={String(analytics?.completedLessons ?? 0).padStart(2, "0")}
          note="Across your courses"
        />
      </div>

      {showCreate && (
        <div className="editor-card create-course-form">
          <div className="editor-heading">
            <div>
              <span className="eyebrow">
                <span className="eyebrow-line" /> A blank canvas
              </span>
              <h2>Start with the idea.</h2>
            </div>
            <button className="icon-button" onClick={() => setShowCreate(false)}>
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="form-grid">
            <label>
              Course title
              <input
                required
                minLength={4}
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What will you teach?"
              />
            </label>
            <label>
              Short introduction
              <input
                required
                minLength={8}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="What makes this worth learning?"
              />
            </label>
            <label>
              Topic
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Design</option>
                <option>Development</option>
                <option>Business</option>
                <option>Data</option>
                <option>Marketing</option>
                <option>Photography</option>
              </select>
            </label>
            <label>
              Price in USD
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <label className="form-span">
              Course description
              <textarea
                required
                minLength={30}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the skills, the work, and who this is for."
              />
            </label>
            <div className="form-span">
              <button className="button button-dark" disabled={createState.isLoading}>
                Save draft <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="instructor-columns">
        <div className="instructor-main">
          <div className="list-heading">
            <div>
              <span className="eyebrow">
                <span className="eyebrow-line" /> YOUR COURSES
              </span>
              <h2>Studio shelf</h2>
            </div>
            <span className="status-caption">
              {courses.length} {courses.length === 1 ? "course" : "courses"}
            </span>
          </div>

          {courses.length ? (
            <div className="instructor-course-list">
              {courses.map((course) => (
                <button
                  className={`instructor-course-row ${
                    active?.id === course.id ? "selected" : ""
                  }`}
                  key={course.id}
                  onClick={() => setActiveCourse(course.id)}
                >
                  <span className="course-row-number">
                    {String(courses.indexOf(course) + 1).padStart(2, "0")}
                  </span>
                  <span className="course-row-copy">
                    <strong>{course.title}</strong>
                    <small>
                      {course.category} ·{" "}
                      {course.sections.flatMap((section) => section.lessons).length}{" "}
                      lessons
                    </small>
                  </span>
                  <span className={`status-pill status-${course.status.toLowerCase()}`}>
                    {course.status.replace("_", " ")}
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Layers3 size={22} />
              <h3>Your studio is ready.</h3>
              <p>Make your first course and share something useful.</p>
            </div>
          )}

          {active && (
            <div className="editor-card curriculum-editor">
              <div className="editor-heading">
                <div>
                  <span className="eyebrow">
                    <span className="eyebrow-line" /> BUILD THE CURRICULUM
                  </span>
                  <h2>{active.title}</h2>
                </div>
                <button
                  className="button button-cream"
                  onClick={handlePublish}
                  disabled={publishState.isLoading || !lessons.length}
                >
                  <ArrowUpRight size={15} /> Publish course
                </button>
              </div>

              {lessons.length ? (
                <div className="instructor-lesson-list">
                  {lessons.map((lesson, index) => (
                    <LessonUploadRow
                      key={lesson.id}
                      lesson={lesson}
                      index={index}
                      uploading={uploadState.isLoading}
                      onUpload={(file) => handleUpload(lesson.id, file)}
                      onUseSample={() =>
                        void useSample(lesson.id, handleUpload, setError)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-inline">
                  No lessons yet. Give learners one useful place to start.
                </div>
              )}

              <form className="add-lesson-form" onSubmit={handleLesson}>
                <div className="add-lesson-icon">
                  <Plus size={18} />
                </div>
                <input
                  required
                  value={lessonTitle}
                  onChange={(event) => setLessonTitle(event.target.value)}
                  placeholder="Add a lesson to your course"
                />
                <input
                  aria-label="Lesson duration in seconds"
                  type="number"
                  min="1"
                  max="21600"
                  value={lessonDuration}
                  onChange={(event) => setLessonDuration(event.target.value)}
                />
                <button className="button button-dark" disabled={!lessonTitle.trim()}>
                  Add lesson
                </button>
              </form>

              <InstructorQuizBuilder
                courseId={active.id}
                locked={active.status === "PUBLISHED"}
              />

              {/* Downloadable Lesson Resources */}
              <div className="instructor-resource-manager">
                <div className="manager-title-row">
                  <div>
                    <span className="eyebrow">
                      <span className="eyebrow-line" /> LESSON ATTACHMENTS
                    </span>
                    <h3>Downloadable resources</h3>
                    <p>Attach exercise files, cheat sheets, code repositories, or PDFs for your learners.</p>
                  </div>
                  <Paperclip size={20} />
                </div>

                {lessons.length > 0 && (
                  <form className="add-resource-form" onSubmit={handleAddResource}>
                    <select
                      value={resLessonId}
                      onChange={(e) => setResLessonId(e.target.value)}
                      required
                    >
                      <option value="">Select target lesson…</option>
                      {lessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Resource title (e.g. Design Tokens Cheat Sheet)"
                      value={resTitle}
                      onChange={(e) => setResTitle(e.target.value)}
                      required
                    />
                    <input
                      placeholder="File or asset URL (e.g. https://...)"
                      type="url"
                      value={resUrl}
                      onChange={(e) => setResUrl(e.target.value)}
                      required
                    />
                    <select
                      value={resType}
                      onChange={(e) => setResType(e.target.value as any)}
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="code">Source Code / Repo</option>
                      <option value="document">Document / Slide</option>
                      <option value="link">Reference Link</option>
                      <option value="archive">ZIP Archive</option>
                    </select>
                    <input
                      placeholder="Size label (e.g. 2.4 MB)"
                      value={resSize}
                      onChange={(e) => setResSize(e.target.value)}
                      style={{ maxWidth: "140px" }}
                    />
                    <button
                      type="submit"
                      className="button button-dark"
                      disabled={addResState.isLoading || !resLessonId || !resTitle.trim() || !resUrl.trim()}
                    >
                      <Plus size={14} /> Attach resource
                    </button>
                  </form>
                )}

                <div className="attached-resources-list">
                  {lessons.some((l) => l.resources?.length) ? (
                    lessons.flatMap((l) =>
                      (l.resources ?? []).map((r) => (
                        <div key={r.id} className="attached-resource-row">
                          <div className="res-row-left">
                            {r.type === "pdf" ? <FileText size={16} /> : r.type === "code" ? <FileCode size={16} /> : <LinkIcon size={16} />}
                            <div>
                              <strong>{r.title}</strong>
                              <small>Lesson: {l.title} · {r.type.toUpperCase()} {r.sizeLabel ? `· ${r.sizeLabel}` : ""}</small>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-delete-res"
                            title="Remove resource"
                            onClick={() => deleteResource({ courseId: active.id, lessonId: l.id, resourceId: r.id })}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )
                  ) : (
                    <div className="empty-inline">No downloadable resources attached yet.</div>
                  )}
                </div>
              </div>

              {/* Course Announcements Broadcaster */}
              <div className="instructor-announcements-manager">
                <div className="manager-title-row">
                  <div>
                    <span className="eyebrow">
                      <span className="eyebrow-line" /> BROADCAST UPDATES
                    </span>
                    <h3>Course announcements</h3>
                    <p>Send updates, project milestones, or reminders to all enrolled learners.</p>
                  </div>
                  <Bell size={20} />
                </div>

                <form className="announcement-form" onSubmit={handleAnnouncement}>
                  <input
                    placeholder="Announcement headline (e.g. Welcome to Week 1 & Office Hours)"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    required
                  />
                  <textarea
                    rows={3}
                    placeholder="Write your announcement message…"
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="button button-dark"
                    disabled={addAnnState.isLoading || !annTitle.trim() || !annContent.trim()}
                  >
                    Broadcast announcement <Send size={14} />
                  </button>
                </form>

                <div className="instructor-announcements-list">
                  {announcementData?.announcements && announcementData.announcements.length > 0 ? (
                    announcementData.announcements.map((a) => (
                      <div key={a.id} className="announcement-row-card">
                        <div className="ann-row-head">
                          <strong>{a.title}</strong>
                          <small>{new Date(a.createdAt).toLocaleDateString()}</small>
                        </div>
                        <p>{a.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="empty-inline">No announcements broadcasted yet for this course.</div>
                  )}
                </div>
              </div>

              {/* Enrolled Learner Progress & Completion Table */}
              <div className="instructor-learners-roster">
                <div className="manager-title-row">
                  <div>
                    <span className="eyebrow">
                      <span className="eyebrow-line" /> STUDENT SUCCESS
                    </span>
                    <h3>Learner completion analytics</h3>
                    <p>Track student lesson completion, quiz performance, and earned certificates.</p>
                  </div>
                  <Users size={20} />
                </div>

                {learnersData?.learners && learnersData.learners.length > 0 ? (
                  <div className="learners-table-wrap">
                    <table className="learners-table">
                      <thead>
                        <tr>
                          <th>Learner</th>
                          <th>Progress</th>
                          <th>Quiz</th>
                          <th>Certificate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {learnersData.learners.map((learner, idx) => (
                          <tr key={idx}>
                            <td>
                              <strong>{learner.student?.name ?? "Student"}</strong>
                              <small>{learner.student?.email ?? ""}</small>
                            </td>
                            <td>
                              <div className="table-progress-bar">
                                <div style={{ width: `${learner.progressPercent}%` }} />
                              </div>
                              <small>{learner.completedLessons} / {learner.totalLessons} lessons ({learner.progressPercent}%)</small>
                            </td>
                            <td>
                              {learner.quizPassed ? (
                                <span className="status-pill status-ready">Passed {learner.quizScore}%</span>
                              ) : typeof learner.quizScore === "number" ? (
                                <span className="status-pill status-failed">Attempted ({learner.quizScore}%)</span>
                              ) : (
                                <span className="status-pill status-draft">Not taken</span>
                              )}
                            </td>
                            <td>
                              {learner.certificateNumber ? (
                                <span className="status-pill status-published">#{learner.certificateNumber}</span>
                              ) : (
                                <span className="status-pill status-draft">In progress</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-inline">No learners enrolled in this course yet.</div>
                )}
              </div>

              <p className="editor-footnote">
                <ShieldCheck size={14} /> Your video is private until the course is
                published. FFmpeg processes uploads in the background.
              </p>
            </div>
          )}
        </div>

        <aside className="instructor-side">
          <div className="side-card earnings-card">
            <span className="side-card-label">THE NUMBERS, CLEARLY</span>
            <h3>Every sale, accounted for.</h3>
            <div className="revenue-line">
              <span>Gross sales</span>
              <strong>{formatMoney(earnings?.grossMinor ?? 0)}</strong>
            </div>
            <div className="revenue-line">
              <span>Platform fee</span>
              <strong>−{formatMoney(earnings?.platformFeeMinor ?? 0)}</strong>
            </div>
            <div className="revenue-line revenue-total">
              <span>Your net earnings</span>
              <strong>{formatMoney(earnings?.instructorNetMinor ?? 0)}</strong>
            </div>
            <p>
              <DollarSign size={14} /> Payouts are recorded here; bank transfers are not
              connected in this demo.
            </p>
          </div>

          <div className="editor-card live-scheduler">
            <span className="eyebrow">
              <span className="eyebrow-line" /> COME TOGETHER
            </span>
            <h3>Plan a live class</h3>
            <p>
              Give your learners a time to ask, practice, and make a little progress
              together.
            </p>
            {active ? (
              <>
                <form onSubmit={handleClass}>
                  <label>
                    Class title
                    <input
                      required
                      value={sessionTitle}
                      onChange={(event) => setSessionTitle(event.target.value)}
                      placeholder="Studio Q&A"
                    />
                  </label>
                  <label>
                    Starts at
                    <input
                      required
                      type="datetime-local"
                      value={sessionTime}
                      onChange={(event) => setSessionTime(event.target.value)}
                    />
                  </label>
                  <button className="button button-dark" disabled={classState.isLoading}>
                    Schedule class <ArrowRight size={15} />
                  </button>
                </form>

                {liveData?.sessions && liveData.sessions.length > 0 && (
                  <div className="instructor-live-sessions" style={{ marginTop: "16px", borderTop: "1px solid var(--border, #e5e7eb)", paddingTop: "12px" }}>
                    <span className="side-card-label" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted, #6b7280)", textTransform: "uppercase" }}>Scheduled Sessions</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                      {liveData.sessions.map((sess) => (
                        <div
                          key={sess.id}
                          style={{
                            padding: "10px",
                            background: "rgba(0,0,0,0.02)",
                            border: "1px solid var(--border, #e5e7eb)",
                            borderRadius: "6px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: "13px" }}>{sess.title}</strong>
                            <span className={`status-pill status-${sess.status.toLowerCase()}`}>
                              {sess.status}
                            </span>
                          </div>
                          <small style={{ color: "#6b7280" }}>{formatCourseDate(sess.startsAt)}</small>
                          {sess.status !== "ENDED" && sess.status !== "CANCELLED" && (
                            <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                              <button
                                type="button"
                                className="button button-cream"
                                style={{ padding: "4px 8px", fontSize: "11px" }}
                                disabled={joinState.isLoading}
                                onClick={async () => {
                                  try {
                                    const result = await joinClass(sess.id).unwrap();
                                    dispatch(
                                      openLiveRoom({
                                        sessionId: sess.id,
                                        url: result.url,
                                        token: result.token,
                                        title: result.session.title,
                                        provider: result.provider,
                                      })
                                    );
                                  } catch (err) {
                                    setError(friendlyError(err));
                                  }
                                }}
                              >
                                <Video size={12} /> Launch Studio
                              </button>
                              <button
                                type="button"
                                className="button"
                                style={{ padding: "4px 8px", fontSize: "11px", background: "transparent", border: "1px solid #d1d5db" }}
                                disabled={endState.isLoading}
                                onClick={async () => {
                                  try {
                                    await endClass(sess.id).unwrap();
                                    setNotice("Live class concluded.");
                                  } catch (err) {
                                    setError(friendlyError(err));
                                  }
                                }}
                              >
                                End
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="quiet-note">Create a course first to schedule a class.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
