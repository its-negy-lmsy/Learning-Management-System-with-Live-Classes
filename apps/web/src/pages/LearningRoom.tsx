import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Bell,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileCode,
  FileText,
  Link as LinkIcon,
  MessageSquare,
  Paperclip,
  Play,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import {
  useIssueCertificateMutation,
  useJoinLiveClassMutation,
  useLearningQuery,
  useLiveClassesQuery,
  useProgressMutation,
  useCompleteLessonMutation,
  useLessonNotesQuery,
  useAddNoteMutation,
  useDeleteNoteMutation,
  useAnnouncementsQuery,
} from "../api";
import { useAppDispatch, useAppSelector } from "../store";
import { openLiveRoom } from "../slices/uiSlice";
import { setCurrentLesson } from "../slices/playerSlice";
import { formatCourseDate } from "../format";
import { AuthPrompt, ErrorPanel, PageLoading, friendlyError } from "../components/common/UIComponents";
import { HlsVideo } from "../components/video/HlsVideo";
import { QuizBlock } from "../components/quiz/QuizBlock";

function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LearningRoom() {
  const { courseId = "" } = useParams();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const { data, isLoading, error } = useLearningQuery(courseId, { skip: !user });
  const [selectedLesson, setSelectedLesson] = useState("");
  const [progress] = useProgressMutation();
  const [completeLesson] = useCompleteLessonMutation();
  const [issue, issueState] = useIssueCertificateMutation();
  const [certificate, setCertificate] = useState<{ id: string; number: string }>();
  const [certificateError, setCertificateError] = useState("");
  const [joinLiveClass, joinState] = useJoinLiveClassMutation();
  const { data: schedule } = useLiveClassesQuery(courseId, { skip: !user });

  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "resources" | "announcements">("overview");
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined);
  const [noteText, setNoteText] = useState("");
  const [noteTimestamp, setNoteTimestamp] = useState<number>(0);

  const lessons = useMemo(
    () => data?.course.sections.flatMap((section) => section.lessons) ?? [],
    [data?.course.sections]
  );
  const current = lessons.find((lesson) => lesson.id === selectedLesson) ?? lessons[0];

  const { data: notesData } = useLessonNotesQuery(
    { courseId, lessonId: current?.id ?? "" },
    { skip: !user || !current?.id }
  );
  const { data: announcementData } = useAnnouncementsQuery(courseId, { skip: !user });
  const [addNote, addNoteState] = useAddNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();

  useEffect(() => {
    if (!selectedLesson && lessons.length) {
      setSelectedLesson(lessons[0]!.id);
      dispatch(setCurrentLesson(lessons[0]!.id));
    }
  }, [selectedLesson, lessons, dispatch]);

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLesson(lessonId);
    dispatch(setCurrentLesson(lessonId));
  };

  const onProgress = useCallback(
    async (positionSeconds: number, playing: boolean) => {
      if (!current || user?.role !== "STUDENT") return;
      try {
        await progress({
          courseId,
          lessonId: current.id,
          positionSeconds,
          playing,
        }).unwrap();
      } catch {
        /* Heartbeat retries automatically */
      }
    },
    [current, user?.role, progress, courseId]
  );

  if (!user) return <AuthPrompt />;
  if (isLoading) return <PageLoading />;
  if (!data) {
    return (
      <section className="wrap page-pad">
        <ErrorPanel message={friendlyError(error)} />
        <Link className="text-link" to="/dashboard">
          Back to your learning
        </Link>
      </section>
    );
  }

  const handleCertificate = async () => {
    try {
      const result = await issue(courseId).unwrap();
      setCertificate({
        id: result.certificate.id,
        number: result.certificate.certificateNumber,
      });
      setCertificateError("");
    } catch (err) {
      setCertificateError(friendlyError(err));
    }
  };

  return (
    <section className="learning-page">
      <div className="learning-topbar">
        <Link to="/dashboard" className="back-link">
          <ChevronLeft size={16} /> My learning
        </Link>
        <div className="learning-course-title">
          <span>{data.course.category}</span>
          <strong>{data.course.title}</strong>
        </div>
        <div className="learning-overall">
          <span>
            {data.completion.completedLessons}/{data.completion.totalLessons} lessons
          </span>
          <div>
            <span
              style={{
                width: `${
                  data.completion.totalLessons
                    ? (data.completion.completedLessons / data.completion.totalLessons) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="learning-layout">
        <div className="learning-content">
          <div className="video-stage">
            {current?.mediaAssetId && current.mediaStatus === "READY" ? (
              <HlsVideo
                mediaId={current.mediaAssetId}
                initialPosition={current.progress?.positionSeconds ?? 0}
                seekTo={seekTo}
                onProgress={onProgress}
                onSeekComplete={() => setSeekTo(undefined)}
                onTimeUpdate={(t) => {
                  setCurrentTime(t);
                  if (!noteTimestamp) setNoteTimestamp(Math.round(t));
                }}
              />
            ) : (
              <div className="video-empty">
                <div className="video-empty-art">
                  <span>✳</span>
                  <i />
                  <i />
                  <i />
                </div>
                <div className="video-empty-copy">
                  <span>
                    {current?.mediaStatus === "PROCESSING"
                      ? "MAKING THE VIDEO READY"
                      : "A QUIET PLACE TO BEGIN"}
                  </span>
                  <h2>
                    {current?.mediaStatus === "PROCESSING"
                      ? "Your lesson is on its way."
                      : current?.title}
                  </h2>
                  <p>
                    {current?.mediaStatus === "PROCESSING"
                      ? "The instructor’s video is still being prepared. Check back in a moment."
                      : "This lesson is ready for its video. Your instructor will add it to the course soon."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="learning-description">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> NOW LEARNING
              </div>
              <h1>{current?.title}</h1>
              <p>
                {current?.summary ||
                  "Take your time. Try the idea, and keep the parts that work for you."}
              </p>
            </div>
            <div className="lesson-actions-right">
              <span className="lesson-duration">
                <Clock3 size={15} /> {Math.ceil((current?.durationSeconds ?? 0) / 60)} min
              </span>
              {user?.role === "STUDENT" && (
                <button
                  className={`button ${current?.progress?.completedAt ? "button-cream" : "button-dark"} mark-complete-btn`}
                  onClick={async () => {
                    if (current) {
                      await completeLesson({
                        courseId,
                        lessonId: current.id,
                        completed: !current?.progress?.completedAt,
                      }).unwrap();
                    }
                  }}
                >
                  {current?.progress?.completedAt ? (
                    <>
                      <Check size={14} /> Completed
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Mark complete
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="learning-tool-row">
            <button
              onClick={() =>
                handleSelectLesson(
                  lessons[
                    Math.max(
                      0,
                      lessons.findIndex((lesson) => lesson.id === current?.id) - 1
                    )
                  ]?.id ?? current?.id
                )
              }
              className="button button-cream"
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <button
              onClick={() =>
                handleSelectLesson(
                  lessons[
                    Math.min(
                      lessons.length - 1,
                      lessons.findIndex((lesson) => lesson.id === current?.id) + 1
                    )
                  ]?.id ?? current?.id
                )
              }
              className="button button-dark"
            >
              Next lesson <ChevronRight size={15} />
            </button>
          </div>

          {/* Interactive Lesson Workspace: Notes, Downloadable Resources, Announcements */}
          <div className="lesson-workspace-tabs">
            <div className="workspace-tab-bar">
              <button
                className={`workspace-tab-btn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button
                className={`workspace-tab-btn ${activeTab === "notes" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("notes");
                  setNoteTimestamp(Math.round(currentTime));
                }}
              >
                <MessageSquare size={14} />
                Video Notes {notesData?.notes.length ? `(${notesData.notes.length})` : ""}
              </button>
              <button
                className={`workspace-tab-btn ${activeTab === "resources" ? "active" : ""}`}
                onClick={() => setActiveTab("resources")}
              >
                <Paperclip size={14} />
                Resources {current?.resources?.length ? `(${current.resources.length})` : ""}
              </button>
              <button
                className={`workspace-tab-btn ${activeTab === "announcements" ? "active" : ""}`}
                onClick={() => setActiveTab("announcements")}
              >
                <Bell size={14} />
                Announcements {announcementData?.announcements?.length ? `(${announcementData.announcements.length})` : ""}
              </button>
            </div>

            <div className="workspace-tab-panel">
              {activeTab === "overview" && (
                <div className="tab-pane overview-pane">
                  <h3>Lesson takeaways</h3>
                  <p>{current?.summary || "Apply what you've learned to build momentum."}</p>
                  <div className="overview-meta-chips">
                    <span>Lesson {lessons.findIndex((l) => l.id === current?.id) + 1} of {lessons.length}</span>
                    <span>Status: {current?.progress?.completedAt ? "✓ Completed" : "In progress"}</span>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="tab-pane notes-pane">
                  <div className="notes-header-row">
                    <div>
                      <h3>Interactive Video Notes</h3>
                      <p>Capture thoughts synced to the exact second in the lesson video.</p>
                    </div>
                    {notesData?.notes && notesData.notes.length > 0 && (
                      <button
                        className="button button-cream btn-small"
                        onClick={() => {
                          const content = `# Notes for ${current?.title} (${data.course.title})\n\n` +
                            notesData.notes
                              .map((n) => `[${formatTimestamp(n.timestampSeconds)}] ${n.text}`)
                              .join("\n\n");
                          const blob = new Blob([content], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${current?.title ?? "lesson"}-notes.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download size={13} /> Export notes
                      </button>
                    )}
                  </div>

                  {user?.role === "STUDENT" && (
                    <form
                      className="note-create-form"
                      onSubmit={async (e: FormEvent) => {
                        e.preventDefault();
                        if (!noteText.trim() || !current) return;
                        try {
                          await addNote({
                            courseId,
                            lessonId: current.id,
                            timestampSeconds: noteTimestamp,
                            text: noteText.trim(),
                          }).unwrap();
                          setNoteText("");
                        } catch (err) {
                          window.alert(friendlyError(err));
                        }
                      }}
                    >
                      <div className="note-input-row">
                        <button
                          type="button"
                          className="timestamp-sync-btn"
                          title="Click to sync with current playback time"
                          onClick={() => setNoteTimestamp(Math.round(currentTime))}
                        >
                          <Clock3 size={13} /> {formatTimestamp(noteTimestamp)}
                        </button>
                        <input
                          type="text"
                          className="note-text-input"
                          placeholder="Type a key takeaway or question at this timestamp…"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="button button-dark"
                          disabled={addNoteState.isLoading || !noteText.trim()}
                        >
                          <Plus size={14} /> Add note
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="notes-list">
                    {notesData?.notes && notesData.notes.length > 0 ? (
                      notesData.notes.map((note) => (
                        <div key={note.id} className="note-card">
                          <button
                            type="button"
                            className="note-time-chip"
                            title="Jump to this video timestamp"
                            onClick={() => setSeekTo(note.timestampSeconds)}
                          >
                            <Play size={11} fill="currentColor" />
                            {formatTimestamp(note.timestampSeconds)}
                          </button>
                          <div className="note-card-text">{note.text}</div>
                          {user?.id === note.studentId && (
                            <button
                              type="button"
                              className="note-delete-btn"
                              title="Delete note"
                              onClick={() => deleteNote(note.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="empty-tab-state">
                        <p>No notes yet for this lesson. Pause the video and write your first observation!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "resources" && (
                <div className="tab-pane resources-pane">
                  <h3>Downloadable Lesson Resources</h3>
                  <p>Supplementary materials, slides, and code attachments provided by your instructor.</p>
                  <div className="resources-list">
                    {current?.resources && current.resources.length > 0 ? (
                      current.resources.map((res) => (
                        <div key={res.id} className="resource-card">
                          <div className="resource-icon">
                            {res.type === "pdf" ? <FileText size={18} /> : res.type === "code" ? <FileCode size={18} /> : <LinkIcon size={18} />}
                          </div>
                          <div className="resource-info">
                            <strong>{res.title}</strong>
                            <small>{res.type.toUpperCase()} {res.sizeLabel ? `· ${res.sizeLabel}` : ""}</small>
                          </div>
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button button-cream btn-small"
                          >
                            <Download size={13} /> Open / Download
                          </a>
                        </div>
                      ))
                    ) : (
                      <div className="empty-tab-state">
                        <p>No downloadable resources attached to this lesson yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "announcements" && (
                <div className="tab-pane announcements-pane">
                  <h3>Course Announcements</h3>
                  <div className="announcements-list">
                    {announcementData?.announcements && announcementData.announcements.length > 0 ? (
                      announcementData.announcements.map((ann) => (
                        <div key={ann.id} className="announcement-card">
                          <div className="announcement-header">
                            <strong>{ann.title}</strong>
                            <small>{new Date(ann.createdAt).toLocaleDateString()}</small>
                          </div>
                          <p>{ann.content}</p>
                          <small className="announcement-byline">Posted by {ann.instructorName}</small>
                        </div>
                      ))
                    ) : (
                      <div className="empty-tab-state">
                        <p>No announcements posted yet for this course.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <QuizBlock courseId={courseId} />

          {data.completion.completed && (
            <div className="completion-card">
              <span>
                <Award size={23} />
              </span>
              <div>
                <h3>You made it all the way through.</h3>
                <p>
                  Your lessons and knowledge check are complete. Your certificate is ready
                  to issue.
                </p>
              </div>
              <button
                className="button button-dark"
                onClick={handleCertificate}
                disabled={issueState.isLoading}
              >
                Get certificate <ArrowRight size={15} />
              </button>
              {certificate && (
                <a href={`/api/v1/me/certificates/${certificate.id}.pdf`}>Download PDF</a>
              )}
              {certificateError && <small>{certificateError}</small>}
            </div>
          )}

          {certificate && (
            <div className="certificate-issued">
              <CheckCircle2 size={16} /> Certificate {certificate.number} issued{" "}
              <a href={`/api/v1/me/certificates/${certificate.id}.pdf`}>
                <Download size={14} /> Download PDF
              </a>
            </div>
          )}
        </div>

        <aside className="curriculum-sidebar">
          <div className="curriculum-side-heading">
            <span className="eyebrow">
              <span className="eyebrow-line" /> YOUR COURSE
            </span>
            <h2>
              One step
              <br />
              <em>at a time.</em>
            </h2>
            <div className="side-progress">
              <div>
                <span
                  style={{
                    width: `${
                      data.completion.totalLessons
                        ? (data.completion.completedLessons / data.completion.totalLessons) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <small>
                {data.completion.completedLessons} of {data.completion.totalLessons} lessons
                complete
              </small>
            </div>
          </div>

          {data.course.sections.map((section) => (
            <div className="learning-section" key={section.id}>
              <h3>{section.title}</h3>
              {section.lessons.map((lesson, index) => (
                <button
                  className={`learning-lesson ${current?.id === lesson.id ? "active" : ""}`}
                  onClick={() => handleSelectLesson(lesson.id)}
                  key={lesson.id}
                >
                  <span className="learning-check">
                    {lesson.progress?.completedAt ? (
                      <Check size={13} />
                    ) : current?.id === lesson.id ? (
                      <Play size={11} fill="currentColor" />
                    ) : (
                      String(index + 1).padStart(2, "0")
                    )}
                  </span>
                  <span>
                    {lesson.title}
                    <small>
                      {Math.ceil(lesson.durationSeconds / 60)} min{" "}
                      {lesson.mediaStatus === "PROCESSING" ? "· preparing video" : ""}
                    </small>
                  </span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          ))}

          <div className="live-class-sidebar">
            <div className="live-class-heading">
              <Video size={16} />
              <strong>Learn together</strong>
            </div>
            {schedule?.sessions?.length ? (
              schedule.sessions.map((session) => (
                <div className="live-session-row" key={session.id}>
                  <strong>{session.title}</strong>
                  <small>{formatCourseDate(session.startsAt)}</small>
                  <button
                    onClick={async () => {
                      try {
                        const result = await joinLiveClass(session.id).unwrap();
                        dispatch(
                          openLiveRoom({
                            sessionId: session.id,
                            url: result.url,
                            token: result.token,
                            title: result.session.title,
                            provider: (result as { provider?: "livekit" | "local-webrtc" }).provider,
                          })
                        );
                      } catch (err) {
                        window.alert(friendlyError(err));
                      }
                    }}
                    disabled={joinState.isLoading}
                  >
                    Join live class
                  </button>
                </div>
              ))
            ) : (
              <p>Your instructor’s upcoming live classes will show up here.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
