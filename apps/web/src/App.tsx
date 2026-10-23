import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type Hls from "hls.js";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Award, BarChart3, BookOpen, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, CircleHelp, Clock3, CloudUpload, DollarSign, Download, GraduationCap, Layers3,
  LogOut, Menu, MessageCircle, Mic, MicOff, Play, Plus, Search, ShieldCheck, Sparkles, Users, Video, VideoOff, X,
} from "lucide-react";
import {
  useAddLessonMutation, useAdminOverviewQuery, useCertificatesQuery, useCheckoutMutation, useCourseQuery,
  useCoursesQuery, useCreateCourseMutation, useCreateLiveClassMutation, useEnrollMutation, useEnrollmentsQuery,
  useEarningsQuery, useIssueCertificateMutation, useJoinLiveClassMutation, useLearningQuery, useLoginMutation,
  useLogoutMutation, useMeQuery, useMediaQuery, useMockConfirmMutation, useProgressMutation, usePublishCourseMutation,
  useQuizQuery, useRegisterMutation, useSubmitQuizMutation, useUploadVideoMutation, useInstructorCoursesQuery,
  useAdminReviewQueueQuery, useReviewCourseMutation, useInstructorAnalyticsQuery, useInstructorQuizQuery, useSaveInstructorQuizMutation, useLiveClassesQuery,
  useInstructorApplicationQuery, useApplyAsInstructorMutation, useInstructorApplicationsQuery, useReviewInstructorApplicationMutation,
} from "./api";
import type { Course, Role } from "@fs03/shared";
import { formatCourseDate, formatMoney } from "./format";

const currency = formatMoney;
const dateLabel = formatCourseDate;
const friendlyError = (error: unknown) => {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: { error?: { message?: string } } }).data;
    return data?.error?.message ?? "That didn't work. Please try again.";
  }
  return error instanceof Error ? error.message : "That didn't work. Please try again.";
};
const rolePath = (role?: Role) => role === "INSTRUCTOR" ? "/instructor" : role === "ADMIN" ? "/admin" : "/dashboard";

function useUser() {
  const { data, isLoading } = useMeQuery();
  return { user: data?.user, isLoading };
}

function Header() {
  const { user } = useUser();
  const [logout] = useLogoutMutation();
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header">
    <Link to="/" className="wordmark"><span className="brand-mark"><span /></span><span>fieldnotes<span className="wordmark-dot">.</span><small>LEARNING STUDIO</small></span></Link>
    <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={20} /></button>
    <nav className={menuOpen ? "header-nav open" : "header-nav"}>
      <NavLink to="/explore">Explore</NavLink>
      {user && user.role === "STUDENT" && <NavLink to="/dashboard">My learning</NavLink>}
      {user && user.role === "STUDENT" && <NavLink to="/teach">Teach here</NavLink>}
      {user && user.role === "INSTRUCTOR" && <NavLink to="/instructor">Teaching studio</NavLink>}
      {user && user.role === "ADMIN" && <NavLink to="/admin">Admin</NavLink>}
      {user ? <div className="account-chip"><span className="avatar">{user.name.slice(0, 1)}</span><span className="account-name">{user.name.split(" ")[0]}</span><button className="icon-button" title="Sign out" onClick={() => logout()}><LogOut size={16} /></button></div> : <><Link className="header-signin" to="/login">Sign in</Link><Link className="button button-dark header-cta" to="/register">Start learning <ArrowRight size={15} /></Link></>}
    </nav>
  </header>;
}

function App() {
  return <><Header /><main><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/explore" element={<Explore />} />
    <Route path="/course/:courseId" element={<CourseDetails />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/dashboard" element={<StudentDashboard />} />
    <Route path="/instructor" element={<InstructorDashboard />} />
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/teach" element={<InstructorApplicationPage />} />
    <Route path="/learn/:courseId" element={<LearningRoom />} />
    <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
    <Route path="/checkout/return" element={<CheckoutReturn />} />
    <Route path="*" element={<NotFound />} />
  </Routes></main><Footer /></>;
}
export default App;

function Footer() {
  return <footer className="site-footer"><div className="footer-inner"><Link to="/" className="footer-brand">fieldnotes<span>.</span></Link><span>Room to learn, space to grow.</span><div><Link to="/explore">Explore courses</Link><a href="/api/docs" target="_blank" rel="noreferrer">API reference</a></div><small>© 2026 Fieldnotes Learning Studio</small></div></footer>;
}

const heroTags = ["Product design", "Creative coding", "Data & insight", "Career growth"];
function Landing() {
  const { data, isLoading } = useCoursesQuery({ page: 1, limit: 3 });
  return <>
    <section className="hero wrap">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> A little more room to grow</div><h1>Learn something<br /><em>that moves you.</em></h1><p>Thoughtful courses, generous teachers, and a clear next step for wherever you want to go.</p><div className="hero-actions"><Link className="button button-dark" to="/explore">Find your next course <ArrowRight size={16} /></Link><div className="avatar-stack"><span>J</span><span>M</span><span>A</span><small>Made for curious people</small></div></div><div className="hero-tags">{heroTags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
      <div className="hero-visual"><div className="hero-photo"><img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1100&q=88" alt="A student sketching ideas at a desk" /><div className="photo-grain" /><div className="photo-note"><span className="note-spark">✳</span><span>Make space<br />for the next idea.</span></div></div><div className="floating-card"><span className="float-icon"><Play size={14} fill="currentColor" /></span><div><strong>Learn at your pace</strong><small>Short lessons, real momentum</small></div><ArrowUpRight size={15} /></div><span className="hero-orbit orbit-one" /><span className="hero-orbit orbit-two" /></div>
    </section>
    <section className="partner-strip wrap"><span>GOOD IDEAS COME FROM</span><div><b>curiosity</b><i>·</i><b>practice</b><i>·</i><b>good company</b><i>·</i><b>showing up</b></div><span>STAY A WHILE <ArrowDownRight size={13} /></span></section>
    <section className="section wrap"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> A few good places to begin</div><h2>Courses for your<br /><em>next chapter.</em></h2></div><Link className="text-link" to="/explore">See all courses <ArrowRight size={15} /></Link></div><CourseGrid courses={data?.courses ?? []} loading={isLoading} /></section>
    <section className="manifesto"><div className="wrap manifesto-inner"><div className="manifesto-stamp"><Sparkles size={25} /><span>STAY<br />CURIOUS</span></div><p>Learning should feel less like keeping up,<br />and more like <em>finding your way.</em></p><Link to="/explore" className="button button-light">Find your people <ArrowRight size={15} /></Link></div></section>
    <section className="section wrap path-section"><div className="eyebrow"><span className="eyebrow-line" /> The good stuff</div><h2>A studio built around<br /><em>how people really learn.</em></h2><div className="path-grid"><div><span className="path-number">01</span><BookOpen size={21} /><h3>Make it practical</h3><p>Small, well-shaped lessons give you something to try today, not someday.</p></div><div><span className="path-number">02</span><Users size={21} /><h3>Learn together</h3><p>Meet your instructor live, ask a real question, and leave with a clearer next move.</p></div><div><span className="path-number">03</span><Award size={21} /><h3>Keep the proof</h3><p>Build a steady record of the work you finish and the skills you earn.</p></div></div></section>
  </>;
}

function Explore() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All topics");
  const { data, isLoading, isError } = useCoursesQuery({ q: query || undefined, category: category === "All topics" ? undefined : category });
  const topics = ["All topics", "Design", "Development", "Data", "Business", "Marketing", "Photography"];
  return <section className="catalog wrap"><div className="catalog-intro"><div className="eyebrow"><span className="eyebrow-line" /> A shelf full of possibilities</div><h1>Find your next<br /><em>good thing.</em></h1><p>Pick up a new skill, give an old idea a fresh start, or follow the question that keeps coming back.</p><div className="catalog-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “design systems” or “analytics”" /><span>↵</span></div></div><div className="catalog-content"><div className="topic-row">{topics.map((topic) => <button className={category === topic ? "topic active" : "topic"} key={topic} onClick={() => setCategory(topic)}>{topic}</button>)}</div>{isError ? <ErrorPanel message="Courses couldn't load. Check the API is running and try again." /> : <CourseGrid courses={data?.courses ?? []} loading={isLoading} />}</div></section>;
}

function CourseGrid({ courses, loading }: { courses: Array<Course & { enrollmentCount?: number }>; loading: boolean }) {
  if (loading) return <div className="course-grid">{[1, 2, 3].map((item) => <div className="course-skeleton" key={item} />)}</div>;
  if (!courses.length) return <div className="empty-state"><BookOpen size={23} /><h3>A fresh page</h3><p>Try a different topic or search phrase.</p></div>;
  return <div className="course-grid">{courses.map((course, index) => <CourseCard course={course} index={index} key={course.id} />)}</div>;
}

function CourseCard({ course, index }: { course: Course & { enrollmentCount?: number }; index: number }) {
  const lessonCount = course.sections.reduce((count, section) => count + section.lessons.length, 0);
  const duration = Math.max(1, Math.round(course.sections.flatMap((section) => section.lessons).reduce((sum, lesson) => sum + lesson.durationSeconds, 0) / 60));
  return <Link className={`course-card card-tone-${index % 3}`} to={`/course/${course.id}`}><div className="course-image"><img src={course.thumbnail} alt="" loading="lazy" /><span className="category-pill">{course.category}</span><span className="course-image-index">{String(index + 1).padStart(2, "0")}</span></div><div className="course-card-content"><div className="course-meta"><span>{course.level}</span><span className="meta-dot">·</span><span>{duration} min</span></div><h3>{course.title}</h3><p>{course.subtitle}</p><div className="course-card-bottom"><div className="instructor-mini"><span>{course.instructorName.slice(0, 1)}</span>{course.instructorName}</div><div><small>{lessonCount} lessons</small><strong>{course.priceMinor ? currency(course.priceMinor, course.currency) : "Free"}</strong></div></div></div></Link>;
}

function CourseDetails() {
  const { courseId = "" } = useParams();
  const { user } = useUser();
  const { data, isLoading, error } = useCourseQuery(courseId);
  const [enroll, enrollResult] = useEnrollMutation();
  const [checkout, checkoutResult] = useCheckoutMutation();
  const navigate = useNavigate();
  const [paymentId, setPaymentId] = useState("");
  const [confirm] = useMockConfirmMutation();
  const course = data?.course;
  if (isLoading) return <PageLoading />;
  if (!course) return <section className="wrap page-pad"><ErrorPanel message={friendlyError(error)} /><Link to="/explore" className="text-link">Back to courses</Link></section>;
  const startCourse = async () => {
    if (!user) { navigate("/login?returnTo=" + encodeURIComponent(`/course/${course.id}`)); return; }
    try {
      if (course.priceMinor > 0) {
        const result = await checkout(course.id).unwrap();
        if (result.checkoutUrl) { window.location.assign(result.checkoutUrl); return; }
        if (result.payment?.id) setPaymentId(result.payment.id);
      } else { await enroll(course.id).unwrap(); navigate(`/learn/${course.id}`); }
    } catch { /* mutation shows the inline message below */ }
  };
  const lessons = course.sections.flatMap((section) => section.lessons.map((lesson) => ({ ...lesson, section: section.title })));
  return <section className="course-detail-page"><div className="detail-hero"><div className="wrap detail-hero-inner"><div className="detail-copy"><Link to="/explore" className="back-link"><ChevronLeft size={16} /> Course library</Link><div className="detail-badges"><span>{course.category}</span><span>{course.level}</span><span>{course.language}</span></div><h1>{course.title}</h1><p className="detail-subtitle">{course.subtitle}</p><div className="detail-byline"><span className="avatar avatar-large">{course.instructorName.slice(0, 1)}</span><span>Made with care by <strong>{course.instructorName}</strong></span><span className="byline-divider" /> <span><Users size={15} /> {data.enrollmentCount} learners</span></div></div><div className="detail-cover"><img src={course.thumbnail} alt="" /><span className="cover-sticker"><Sparkles size={14} /> LEARN AT YOUR PACE</span></div></div></div><div className="wrap detail-body"><div className="detail-main"><div className="detail-section"><span className="eyebrow"><span className="eyebrow-line" /> The course</span><h2>A good place to<br /><em>get your hands dirty.</em></h2><p className="long-copy">{course.description}</p></div><div className="detail-section outcomes-section"><h3>By the end, you’ll be able to</h3>{course.outcomes.map((outcome) => <div className="outcome-row" key={outcome}><CheckCircle2 size={18} /><span>{outcome}</span></div>)}</div><div className="detail-section curriculum"><div className="curriculum-title"><div><h3>Inside the studio</h3><p>{lessons.length} focused lessons · about {Math.max(1, Math.round(lessons.reduce((sum, lesson) => sum + lesson.durationSeconds, 0) / 60))} min</p></div><Layers3 size={22} /></div>{course.sections.map((section) => <div key={section.id} className="curriculum-group"><h4>{section.title}</h4>{section.lessons.map((lesson, index) => <div className="curriculum-lesson" key={lesson.id}><span className="lesson-play"><Play size={12} fill="currentColor" /></span><span>{lesson.title}<small>{lesson.preview ? "Preview lesson" : `Lesson ${index + 1}`}</small></span><span>{Math.ceil(lesson.durationSeconds / 60)} min</span></div>)}</div>)}</div></div><aside className="enroll-panel"><div className="enroll-panel-image"><img src={course.thumbnail} alt="" /><span><Play size={17} fill="currentColor" /></span></div><div className="enroll-panel-content"><div className="price-line">{course.priceMinor ? currency(course.priceMinor, course.currency) : <strong>Free to join</strong>}<small>one-time access</small></div><button onClick={startCourse} className="button button-dark enroll-button">{course.priceMinor ? "Join this course" : "Start learning"}<ArrowRight size={16} /></button>{user?.role === "STUDENT" && <small className="quiet-note">Your progress saves as you go.</small>}{user && user.id === course.instructorId && <Link className="button button-cream enroll-button" to="/instructor">Open teaching studio</Link>}<div className="panel-divider" /><div className="included-title">A little of everything</div><div className="included-row"><Video size={16} /> Short, focused video lessons</div><div className="included-row"><CircleHelp size={16} /> A practical knowledge check</div><div className="included-row"><MessageCircle size={16} /> Live class access</div><div className="included-row"><Award size={16} /> A certificate when you finish</div></div></aside></div>{(enrollResult.error || checkoutResult.error) && <div className="wrap"><ErrorPanel message={friendlyError(enrollResult.error ?? checkoutResult.error)} /></div>}{paymentId && <div className="payment-demo-bar wrap"><div><strong>Your demo checkout is ready.</strong><span>Complete the local test payment to unlock the course.</span></div><button className="button button-dark" onClick={async () => { try { await confirm(paymentId).unwrap(); navigate(`/learn/${course.id}`); } catch { /* error is surfaced by the next refresh */ } }}>Complete demo payment <ArrowRight size={15} /></button></div>}</section>;
}

function AuthPage({ mode }: { mode: "login" | "register" }) {
  const [login, loginState] = useLoginMutation();
  const [register, registerState] = useRegisterMutation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const state = mode === "login" ? loginState : registerState;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = mode === "login" ? await login({ email, password }).unwrap() : await register({ name, email, password }).unwrap();
      const target = params.get("returnTo") || rolePath(result.user.role);
      navigate(target);
    } catch { /* inline error below */ }
  };
  return <section className="auth-page wrap"><div className="auth-aside"><span className="auth-stamp"><Sparkles size={23} /></span><div className="eyebrow"><span className="eyebrow-line" /> Good to see you here</div><h1>{mode === "login" ? <>Pick up<br /><em>where you left off.</em></> : <>Start with<br /><em>one good idea.</em></>}</h1><p>Thoughtful courses, generous people, and room to find your own pace.</p><div className="auth-quote"><span>“</span><p>The best time to learn something<br />new is right about now.</p></div></div><div className="auth-form-wrap"><div className="auth-form-heading"><span className="eyebrow"><span className="eyebrow-line" /> {mode === "login" ? "Welcome back" : "Make yourself at home"}</span><h2>{mode === "login" ? "Sign in" : "Create your account"}</h2><p>{mode === "login" ? "Pick up your learning right where you left it." : "Your next chapter starts with a few details."}</p></div><form className="auth-form" onSubmit={submit}>{mode === "register" && <label>Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} placeholder="Jordan Lee" /></label>}<label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></label><label>Password<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === "login" ? 1 : 12} placeholder={mode === "login" ? "Your password" : "At least 12 characters"} /></label>{state.error && <ErrorPanel message={friendlyError(state.error)} compact />}<button className="button button-dark auth-submit" disabled={state.isLoading}>{state.isLoading ? "One moment…" : mode === "login" ? "Sign in to Fieldnotes" : "Create your account"}<ArrowRight size={16} /></button></form><div className="auth-switch">{mode === "login" ? <>New to Fieldnotes? <Link to="/register">Create an account</Link></> : <>Already have an account? <Link to="/login">Sign in</Link></>}</div><div className="demo-login"><span className="demo-dot" /> Local demo accounts <button onClick={() => { setEmail("learner@fs03.demo"); setPassword("LearnFS03!Local"); }}>Fill learner</button><button onClick={() => { setEmail("teacher@fs03.demo"); setPassword("TeachFS03!Local"); }}>Fill instructor</button></div></div></section>;
}

function StudentDashboard() {
  const { user, isLoading } = useUser();
  const { data, isLoading: coursesLoading } = useEnrollmentsQuery(undefined, { skip: !user || user.role !== "STUDENT" });
  const { data: certificates } = useCertificatesQuery(undefined, { skip: !user });
  if (isLoading) return <PageLoading />;
  if (!user) return <AuthPrompt />;
  if (user.role !== "STUDENT") return <NavigateTo to={rolePath(user.role)} />;
  const enrollments = data?.enrollments ?? [];
  return <section className="dashboard wrap"><div className="dash-greeting"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR LEARNING DESK</div><h1>Good to have you,<br /><em>{user.name.split(" ")[0]}.</em></h1><p>A little progress adds up. Here’s where you are today.</p></div><Link to="/explore" className="button button-dark">Find a new course <ArrowRight size={15} /></Link></div><div className="stat-row"><Stat icon={<BookOpen size={18} />} label="Courses in progress" value={String(enrollments.length).padStart(2, "0")} note="Yours to explore" /><Stat icon={<CheckCircle2 size={18} />} label="Lessons finished" value={String(enrollments.reduce((sum, item) => sum + item.progress.completed, 0)).padStart(2, "0")} note="One step at a time" /><Stat icon={<Award size={18} />} label="Certificates" value={String(certificates?.certificates.length ?? 0).padStart(2, "0")} note="Earned by you" /></div><div className="dashboard-columns"><div className="dashboard-main"><div className="list-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> Pick up where you left off</span><h2>Your learning path</h2></div><Link to="/explore" className="text-link">Browse more <ArrowRight size={14} /></Link></div>{coursesLoading ? <PageLoading /> : enrollments.length ? <div className="learning-list">{enrollments.map((item) => <Link to={`/learn/${item.course.id}`} className="learning-row" key={item.course.id}><img src={item.course.thumbnail} alt="" /><div className="learning-row-copy"><span>{item.course.category} <i>·</i> {item.course.level}</span><h3>{item.course.title}</h3><div className="progress-line"><span style={{ width: `${item.progress.total ? Math.round(item.progress.completed / item.progress.total * 100) : 0}%` }} /></div><small>{item.progress.completed} of {item.progress.total} lessons complete</small></div><span className="learning-continue"><Play size={14} fill="currentColor" /> Continue</span></Link>)}</div> : <div className="empty-state"><BookOpen size={22} /><h3>Your desk is clear.</h3><p>Join a course that makes you curious.</p><Link className="text-link" to="/explore">Browse the library <ArrowRight size={14} /></Link></div>}</div><aside className="dashboard-side"><div className="side-card certificate-card"><div className="certificate-icon"><Award size={20} /></div><span className="side-card-label">YOUR CERTIFICATES</span><h3>Proof of the work you put in.</h3>{certificates?.certificates.length ? certificates.certificates.map((certificate) => <a className="certificate-mini" href={`/api/v1/me/certificates/${certificate.id}.pdf`} key={certificate.id}><span>{certificate.courseTitle}<small>{certificate.certificateNumber}</small></span><Download size={15} /></a>) : <p>Finish a course and pass its knowledge check to earn your first one.</p>}</div><div className="side-note"><span>✳</span><strong>Small steps count.</strong><p>Ten focused minutes today can make tomorrow feel a little clearer.</p></div><div className="side-card teach-card"><span className="side-card-label">HAVE SOMETHING TO SHARE?</span><h3>Make room for someone else to learn.</h3><Link className="text-link" to="/teach">Apply to teach <ArrowRight size={14} /></Link></div></aside></div></section>;
}

function InstructorDashboard() {
  const { user, isLoading } = useUser();
  const { data } = useInstructorCoursesQuery(undefined, { skip: !user || user.role !== "INSTRUCTOR" });
  const { data: earnings } = useEarningsQuery(undefined, { skip: !user || user.role !== "INSTRUCTOR" });
  const { data: analytics } = useInstructorAnalyticsQuery(undefined, { skip: !user || user.role !== "INSTRUCTOR" });
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
  const courses = data?.courses ?? [];
  const active = courses.find((course) => course.id === activeCourse) ?? courses[0];
  const handleCreate = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setNotice("");
    try {
      const result = await createCourse({ title, subtitle, description, category, level: "Beginner", language: "English", priceMinor: Math.round(Number(price || 0) * 100), currency: "USD", thumbnail: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=85", outcomes: ["Apply a practical new skill"], prerequisites: [] }).unwrap();
      setActiveCourse(result.course.id); setTitle(""); setSubtitle(""); setDescription(""); setShowCreate(false); setNotice("Your draft is ready. Add a lesson, then upload a video.");
    } catch (reason) { setError(friendlyError(reason)); }
  };
  const handleLesson = async (event: FormEvent) => {
    event.preventDefault(); if (!active) return; setError("");
    try { await addLesson({ courseId: active.id, title: lessonTitle, durationSeconds: Number(lessonDuration), preview: true, newSectionTitle: "Start here" }).unwrap(); setLessonTitle(""); setNotice("Lesson added. Upload an MP4 or WebM video to begin processing."); }
    catch (reason) { setError(friendlyError(reason)); }
  };
  const handleUpload = async (lessonId: string, file?: File) => {
    if (!file) return; setError("");
    try { const result = await uploadVideo({ lessonId, file }).unwrap(); setNotice(`Video queued on the ${result.queue === "bullmq" ? "BullMQ" : "local development"} worker.`); }
    catch (reason) { setError(friendlyError(reason)); }
  };
  const handlePublish = async () => {
    if (!active) return; setError("");
    try { const result = await publish({ courseId: active.id, publishImmediately: true }).unwrap(); setNotice(result.message); }
    catch (reason) { setError(friendlyError(reason)); }
  };
  const handleClass = async (event: FormEvent) => {
    event.preventDefault(); if (!active || !sessionTime) return;
    try { const result = await createClass({ courseId: active.id, body: { title: sessionTitle, startsAt: new Date(sessionTime).toISOString(), durationMinutes: 45 } }).unwrap(); setNotice(result.providerConfigured ? "Live class scheduled. LiveKit is ready." : "Live class scheduled. Connect LiveKit to enable audio, video, and chat."); setSessionTitle(""); setSessionTime(""); }
    catch (reason) { setError(friendlyError(reason)); }
  };
  if (isLoading) return <PageLoading />;
  if (!user) return <AuthPrompt instructor />;
  if (user.role !== "INSTRUCTOR") return <NavigateTo to={rolePath(user.role)} />;
  const lessons = active?.sections.flatMap((section) => section.lessons) ?? [];
  return <section className="dashboard instructor-dash wrap"><div className="dash-greeting"><div><div className="eyebrow"><span className="eyebrow-line" /> TEACHING STUDIO</div><h1>Good ideas need<br /><em>good teachers.</em></h1><p>Make something useful. Share what you know. See where it goes.</p></div><button className="button button-dark" onClick={() => setShowCreate(!showCreate)}><Plus size={16} /> Create a course</button></div>
    {notice && <div className="notice-bar"><CheckCircle2 size={17} />{notice}<button onClick={() => setNotice("")}><X size={15} /></button></div>}{error && <ErrorPanel message={error} />}
    <div className="stat-row"><Stat icon={<DollarSign size={18} />} label="Instructor net" value={currency(earnings?.instructorNetMinor ?? 0)} note="Recorded on the ledger" /><Stat icon={<Users size={18} />} label="Active learners" value={String(analytics?.activeLearners ?? 0).padStart(2, "0")} note="With an active enrollment" /><Stat icon={<BarChart3 size={18} />} label="Lessons completed" value={String(analytics?.completedLessons ?? 0).padStart(2, "0")} note="Across your courses" /></div>
    {showCreate && <div className="editor-card create-course-form"><div className="editor-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> A blank canvas</span><h2>Start with the idea.</h2></div><button className="icon-button" onClick={() => setShowCreate(false)}><X size={18} /></button></div><form onSubmit={handleCreate} className="form-grid"><label>Course title<input required minLength={4} maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What will you teach?" /></label><label>Short introduction<input required minLength={8} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="What makes this worth learning?" /></label><label>Topic<select value={category} onChange={(e) => setCategory(e.target.value)}><option>Design</option><option>Development</option><option>Business</option><option>Data</option><option>Marketing</option><option>Photography</option></select></label><label>Price in USD<input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></label><label className="form-span">Course description<textarea required minLength={30} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the skills, the work, and who this is for." /></label><div className="form-span"><button className="button button-dark" disabled={createState.isLoading}>Save draft <ArrowRight size={15} /></button></div></form></div>}
    <div className="instructor-columns"><div className="instructor-main"><div className="list-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> YOUR COURSES</span><h2>Studio shelf</h2></div><span className="status-caption">{courses.length} {courses.length === 1 ? "course" : "courses"}</span></div>{courses.length ? <div className="instructor-course-list">{courses.map((course) => <button className={`instructor-course-row ${active?.id === course.id ? "selected" : ""}`} key={course.id} onClick={() => setActiveCourse(course.id)}><span className="course-row-number">{String(courses.indexOf(course) + 1).padStart(2, "0")}</span><span className="course-row-copy"><strong>{course.title}</strong><small>{course.category} · {course.sections.flatMap((section) => section.lessons).length} lessons</small></span><span className={`status-pill status-${course.status.toLowerCase()}`}>{course.status.replace("_", " ")}</span><ChevronRight size={17} /></button>)}</div> : <div className="empty-state"><Layers3 size={22} /><h3>Your studio is ready.</h3><p>Make your first course and share something useful.</p></div>}{active && <div className="editor-card curriculum-editor"><div className="editor-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> BUILD THE CURRICULUM</span><h2>{active.title}</h2></div><button className="button button-cream" onClick={handlePublish} disabled={publishState.isLoading || !lessons.length}><ArrowUpRight size={15} /> Publish course</button></div>{lessons.length ? <div className="instructor-lesson-list">{lessons.map((lesson, index) => <LessonUploadRow key={lesson.id} lesson={lesson} index={index} uploading={uploadState.isLoading} onUpload={(file) => handleUpload(lesson.id, file)} onUseSample={() => void useSample(lesson.id, handleUpload, setError)} />)}</div> : <div className="empty-inline">No lessons yet. Give learners one useful place to start.</div>}<form className="add-lesson-form" onSubmit={handleLesson}><div className="add-lesson-icon"><Plus size={18} /></div><input required value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} placeholder="Add a lesson to your course" /><input aria-label="Lesson duration in seconds" type="number" min="1" max="21600" value={lessonDuration} onChange={(event) => setLessonDuration(event.target.value)} /><button className="button button-dark" disabled={!lessonTitle.trim()}>Add lesson</button></form><InstructorQuizBuilder courseId={active.id} locked={active.status === "PUBLISHED"} /><p className="editor-footnote"><ShieldCheck size={14} /> Your video is private until the course is published. FFmpeg processes uploads in the background.</p></div>}</div>
      <aside className="instructor-side"><div className="side-card earnings-card"><span className="side-card-label">THE NUMBERS, CLEARLY</span><h3>Every sale, accounted for.</h3><div className="revenue-line"><span>Gross sales</span><strong>{currency(earnings?.grossMinor ?? 0)}</strong></div><div className="revenue-line"><span>Platform fee</span><strong>−{currency(earnings?.platformFeeMinor ?? 0)}</strong></div><div className="revenue-line revenue-total"><span>Your net earnings</span><strong>{currency(earnings?.instructorNetMinor ?? 0)}</strong></div><p><DollarSign size={14} /> Payouts are recorded here; bank transfers are not connected in this demo.</p></div><div className="editor-card live-scheduler"><span className="eyebrow"><span className="eyebrow-line" /> COME TOGETHER</span><h3>Plan a live class</h3><p>Give your learners a time to ask, practice, and make a little progress together.</p>{active ? <form onSubmit={handleClass}><label>Class title<input required value={sessionTitle} onChange={(event) => setSessionTitle(event.target.value)} placeholder="Studio Q&A" /></label><label>Starts at<input required type="datetime-local" value={sessionTime} onChange={(event) => setSessionTime(event.target.value)} /></label><button className="button button-dark" disabled={classState.isLoading}>Schedule class <ArrowRight size={15} /></button></form> : <p className="quiet-note">Create a course first to schedule a class.</p>}</div></aside></div>
  </section>;
}

function LessonUploadRow({ lesson, index, uploading, onUpload, onUseSample }: { lesson: Course["sections"][number]["lessons"][number]; index: number; uploading: boolean; onUpload: (file?: File) => void; onUseSample: () => void }) {
  return <div className="upload-lesson-row"><span className="lesson-index">{String(index + 1).padStart(2, "0")}</span><div className="upload-lesson-copy"><strong>{lesson.title}</strong><small>{Math.ceil(lesson.durationSeconds / 60)} min · {lesson.mediaAssetId ? "Video attached" : "No video yet"}</small></div>{lesson.mediaAssetId ? <MediaStatus mediaId={lesson.mediaAssetId} /> : <div className="upload-actions"><button className="sample-video-button" type="button" onClick={onUseSample} disabled={uploading}><Play size={12} /> Sample MP4</button><label className="upload-trigger"><input type="file" accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/mpeg" onChange={(event) => onUpload(event.target.files?.[0])} disabled={uploading} /><CloudUpload size={15} /> {uploading ? "Uploading…" : "Upload video"}</label></div>}</div>;
}

async function useSample(lessonId: string, onUpload: (lessonId: string, file?: File) => void, setError: (message: string) => void) {
  try {
    const response = await fetch("/api/v1/dev/sample-video");
    if (!response.ok) { const body = await response.json().catch(() => undefined); throw new Error(body?.error?.message ?? "Could not load the sample video."); }
    const blob = await response.blob();
    onUpload(lessonId, new File([blob], "fs03-sample.mp4", { type: "video/mp4" }));
  } catch (error) { setError(friendlyError(error)); }
}

function InstructorQuizBuilder({ courseId, locked }: { courseId: string; locked: boolean }) {
  const { data } = useInstructorQuizQuery(courseId);
  const [save, state] = useSaveInstructorQuizMutation();
  const [title, setTitle] = useState("Quick knowledge check");
  const [passPercent, setPassPercent] = useState(70);
  const [questions, setQuestions] = useState<Array<{ prompt: string; optionsText: string; correctOptionIndex: number }>>([{ prompt: "", optionsText: "", correctOptionIndex: 0 }]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const quiz = data?.quiz;
    if (!quiz) return;
    setTitle(quiz.title); setPassPercent(quiz.passPercent);
    setQuestions(quiz.questions.map((question) => ({ prompt: question.prompt, optionsText: question.options.join("\n"), correctOptionIndex: question.correctOptionIndex })));
  }, [data?.quiz]);
  const handleSave = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setNotice("");
    const mapped = questions.map((question) => ({ prompt: question.prompt, options: question.optionsText.split("\n").map((option) => option.trim()).filter(Boolean), correctOptionIndex: question.correctOptionIndex }));
    try { await save({ courseId, body: { title, passPercent, required: true, questions: mapped } }).unwrap(); setNotice("Your quiz is saved. Correct answers stay private until grading."); }
    catch (reason) { setError(friendlyError(reason)); }
  };
  return <details className="quiz-builder" open={!locked}><summary><span><CircleHelp size={15} /> Course assessment</span><ChevronDown size={15} /></summary><div className="quiz-builder-body"><p>Add questions learners can use to check what stuck. This quiz is required for a certificate.</p>{error && <ErrorPanel message={error} compact />}{notice && <div className="quiz-save-notice"><Check size={13} /> {notice}</div>}<form onSubmit={handleSave}><div className="quiz-builder-top"><label>Quiz title<input required value={title} onChange={(event) => setTitle(event.target.value)} disabled={locked} /></label><label>Pass mark<select value={passPercent} onChange={(event) => setPassPercent(Number(event.target.value))} disabled={locked}><option value={60}>60%</option><option value={70}>70%</option><option value={80}>80%</option><option value={90}>90%</option></select></label></div>{questions.map((question, index) => <div className="quiz-builder-question" key={index}><div className="quiz-builder-q-head"><strong>Question {index + 1}</strong>{questions.length > 1 && !locked && <button type="button" onClick={() => setQuestions(questions.filter((_, item) => item !== index))}>Remove</button>}</div><label>Prompt<input required value={question.prompt} onChange={(event) => setQuestions(questions.map((item, i) => i === index ? { ...item, prompt: event.target.value } : item))} placeholder="Ask one clear question" disabled={locked} /></label><label>Answer options <small>One option per line. Add at least two.</small><textarea required rows={3} value={question.optionsText} onChange={(event) => setQuestions(questions.map((item, i) => i === index ? { ...item, optionsText: event.target.value } : item))} placeholder={"First answer\nSecond answer"} disabled={locked} /></label><label>Correct answer<select value={question.correctOptionIndex} onChange={(event) => setQuestions(questions.map((item, i) => i === index ? { ...item, correctOptionIndex: Number(event.target.value) } : item))} disabled={locked}>{question.optionsText.split("\n").map((option, optionIndex) => option.trim() && <option key={optionIndex} value={optionIndex}>{optionIndex + 1}. {option.trim()}</option>)}</select></label></div>)}<div className="quiz-builder-actions">{!locked && <button className="button button-cream" type="button" onClick={() => setQuestions([...questions, { prompt: "", optionsText: "", correctOptionIndex: 0 }])}><Plus size={13} /> Add question</button>}{!locked && <button className="button button-dark" disabled={state.isLoading}>{state.isLoading ? "Saving…" : "Save quiz"}</button>}</div></form>{locked && <small className="quiet-note">Unpublish this course to edit its quiz.</small>}</div></details>;
}

function MediaStatus({ mediaId }: { mediaId: string }) {
  const { data, isLoading } = useMediaQuery(mediaId, { pollingInterval: 2500 });
  const media = data?.media;
  return <span className={`media-status ${media?.status === "READY" ? "ready" : media?.status === "FAILED" ? "failed" : "processing"}`}>{isLoading ? "Checking…" : media?.status === "PROCESSING" ? `Processing ${media.progress}%` : media?.status === "QUEUED" ? "In queue" : media?.status === "READY" ? <><Check size={13} /> Ready</> : media?.status === "FAILED" ? "Needs attention" : "Uploaded"}</span>;
}

function AdminDashboard() {
  const { user, isLoading } = useUser();
  const { data } = useAdminOverviewQuery(undefined, { skip: !user || user.role !== "ADMIN" });
  const { data: queue } = useAdminReviewQueueQuery(undefined, { skip: !user || user.role !== "ADMIN" });
  const { data: applications } = useInstructorApplicationsQuery(undefined, { skip: !user || user.role !== "ADMIN" });
  const [reviewCourse] = useReviewCourseMutation();
  const [reviewApplication] = useReviewInstructorApplicationMutation();
  const [feedback, setFeedback] = useState("");
  if (isLoading) return <PageLoading />;
  if (!user) return <AuthPrompt />;
  if (user.role !== "ADMIN") return <NavigateTo to={rolePath(user.role)} />;
  const metrics = ["users", "instructors", "publishedCourses", "pendingReview", "enrollments", "certificatesIssued", "payments", "platformRevenueMinor"];
  return <section className="dashboard wrap"><div className="dash-greeting"><div><div className="eyebrow"><span className="eyebrow-line" /> PLATFORM OPERATIONS</div><h1>Everything in<br /><em>good order.</em></h1><p>Real platform counts from the learning studio records.</p></div><span className="admin-badge"><ShieldCheck size={17} /> Administrator</span></div><div className="admin-metrics">{metrics.map((metric) => <div key={metric} className="admin-metric"><small>{metric.replace(/([A-Z])/g, " $1").replace("Minor", "").toUpperCase()}</small><strong>{metric === "platformRevenueMinor" ? currency(Number(data?.[metric] ?? 0)) : Number(data?.[metric] ?? 0).toLocaleString()}</strong></div>)}</div>{feedback && <div className="notice-bar"><CheckCircle2 size={16} />{feedback}<button onClick={() => setFeedback("")}><X size={15} /></button></div>}<div className="admin-review-grid"><div className="side-card"><span className="side-card-label">COURSE MODERATION</span><h3>Review the work.</h3>{queue?.courses.length ? queue.courses.map((course) => <div className="review-row" key={course.id}><div><strong>{course.title}</strong><small>{course.category} · by {course.instructorName}</small><p>{course.subtitle}</p></div><div><button className="review-approve" onClick={async () => { try { await reviewCourse({ courseId: course.id, decision: "approve" }).unwrap(); setFeedback(`${course.title} is published.`); } catch (error) { setFeedback(friendlyError(error)); } }}>Approve</button><button className="review-reject" onClick={async () => { try { await reviewCourse({ courseId: course.id, decision: "reject", note: "Please revise the course details and resubmit." }).unwrap(); setFeedback(`${course.title} was returned for revision.`); } catch (error) { setFeedback(friendlyError(error)); } }}>Return</button></div></div>) : <p>No courses are waiting for review.</p>}</div><div className="side-card"><span className="side-card-label">INSTRUCTOR ONBOARDING</span><h3>Welcome good teachers.</h3>{applications?.applications.length ? applications.applications.map((application) => <div className="review-row" key={application.id}><div><strong>{application.applicant?.name ?? "Applicant"}</strong><small>{application.applicant?.email}</small><p>{application.bio}</p><small>Topics: {application.specialties.join(", ")}</small></div><div><button className="review-approve" onClick={async () => { try { await reviewApplication({ applicationId: application.id, decision: "approve" }).unwrap(); setFeedback(`${application.applicant?.name ?? "Applicant"} can now teach.`); } catch (error) { setFeedback(friendlyError(error)); } }}>Approve</button><button className="review-reject" onClick={async () => { try { await reviewApplication({ applicationId: application.id, decision: "reject" }).unwrap(); setFeedback("Instructor application declined."); } catch (error) { setFeedback(friendlyError(error)); } }}>Decline</button></div></div>) : <p>No instructor applications are waiting for review.</p>}</div></div><div className="admin-bottom"><div className="side-card"><span className="side-card-label">MEDIA OPERATIONS</span><h3>Video pipeline health</h3><div className="revenue-line"><span>Processing</span><strong>{(data?.mediaJobs as { processing: number } | undefined)?.processing ?? 0}</strong></div><div className="revenue-line"><span>Failed</span><strong>{(data?.mediaJobs as { failed: number } | undefined)?.failed ?? 0}</strong></div><p>Job states are sourced from persisted media records.</p></div><div className="side-card"><span className="side-card-label">CERTIFICATES</span><h3>Public verification</h3><p>Certificate records and revocation are stored and administrator actions are audit logged.</p></div></div></section>;
}

function InstructorApplicationPage() {
  const { user, isLoading } = useUser();
  const { data } = useInstructorApplicationQuery(undefined, { skip: !user || user.role !== "STUDENT" });
  const [apply, state] = useApplyAsInstructorMutation();
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (isLoading) return <PageLoading />;
  if (!user) return <AuthPrompt instructor />;
  if (user.role !== "STUDENT") return <NavigateTo to={rolePath(user.role)} />;
  const application = data?.application;
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage(""); setError("");
    try {
      const result = await apply({ bio, specialties: specialties.split(",").map((item) => item.trim()).filter(Boolean) }).unwrap();
      setMessage(`Your application is ${result.application.status.toLowerCase()}.`);
    } catch (reason) { setError(friendlyError(reason)); }
  };
  return <section className="auth-page wrap"><div className="auth-aside"><span className="auth-stamp"><Sparkles size={23} /></span><div className="eyebrow"><span className="eyebrow-line" /> A PLACE FOR PEOPLE WHO TEACH</div><h1>Share what<br /><em>you know.</em></h1><p>Help someone take their next step. Tell us what you teach and how you like to bring it to life.</p><div className="auth-quote"><span>“</span><p>Good teaching makes a hard thing<br />feel possible.</p></div></div><div className="auth-form-wrap"><div className="auth-form-heading"><span className="eyebrow"><span className="eyebrow-line" /> INSTRUCTOR ONBOARDING</span><h2>{application ? "Your application" : "Let’s get to know you."}</h2><p>An administrator reviews new instructor applications before course publishing.</p></div>{error && <ErrorPanel message={error} compact />}{message && <div className="notice-bar"><CheckCircle2 size={15} />{message}</div>}{application ? <div className="application-status"><span className={`status-pill status-${application.status.toLowerCase()}`}>{application.status}</span><h3>{application.status === "PENDING" ? "We’re taking a look." : application.status === "APPROVED" ? "Welcome to the teaching studio." : "A little more work may be needed."}</h3><p>{application.reviewNote || (application.status === "PENDING" ? "Your application is in the review queue. We’ll update your access when it has been reviewed." : "You can contact the studio team for more detail.")}</p>{application.status === "APPROVED" && <button className="button button-dark" onClick={() => window.location.assign("/instructor")}>Open teaching studio <ArrowRight size={15} /></button>}</div> : <form className="auth-form" onSubmit={submit}><label>A little about you<textarea className="application-bio" required minLength={30} maxLength={2500} value={bio} onChange={(event) => setBio(event.target.value)} rows={6} placeholder="What do you teach? What have you worked on? How do you help people learn?" /></label><label>Your areas of practice<input required value={specialties} onChange={(event) => setSpecialties(event.target.value)} placeholder="Product design, prototyping, research" /><small>Separate a few topics with commas.</small></label><button className="button button-dark auth-submit" disabled={state.isLoading}>{state.isLoading ? "Sending…" : "Send application"}<ArrowRight size={15} /></button></form>}</div></section>;
}

function LearningRoom() {
  const { courseId = "" } = useParams();
  const { user } = useUser();
  const { data, isLoading, error } = useLearningQuery(courseId, { skip: !user });
  const [selectedLesson, setSelectedLesson] = useState("");
  const [progress] = useProgressMutation();
  const [issue, issueState] = useIssueCertificateMutation();
  const [certificate, setCertificate] = useState<{ id: string; number: string }>();
  const [certificateError, setCertificateError] = useState("");
  const [activeRoom, setActiveRoom] = useState<{ url: string; token: string; title: string } | undefined>();
  const [joinLiveClass, joinState] = useJoinLiveClassMutation();
  const { data: schedule } = useLiveClassesQuery(courseId, { skip: !user });
  const lessons = useMemo(() => data?.course.sections.flatMap((section) => section.lessons) ?? [], [data?.course.sections]);
  const current = lessons.find((lesson) => lesson.id === selectedLesson) ?? lessons[0];
  useEffect(() => { if (!selectedLesson && lessons.length) setSelectedLesson(lessons[0]!.id); }, [selectedLesson, lessons]);
  const onProgress = useCallback(async (positionSeconds: number, playing: boolean) => {
    if (!current || user?.role !== "STUDENT") return;
    try { await progress({ courseId, lessonId: current.id, positionSeconds, playing }).unwrap(); } catch { /* playback can continue; progress retries on the next heartbeat */ }
  }, [current, user?.role, progress, courseId]);
  if (!user) return <AuthPrompt />;
  if (isLoading) return <PageLoading />;
  if (!data) return <section className="wrap page-pad"><ErrorPanel message={friendlyError(error)} /><Link className="text-link" to="/dashboard">Back to your learning</Link></section>;
  const handleCertificate = async () => {
    try { const result = await issue(courseId).unwrap(); setCertificate({ id: result.certificate.id, number: result.certificate.certificateNumber }); setCertificateError(""); }
    catch (error) { setCertificateError(friendlyError(error)); }
  };
  return <section className="learning-page"><div className="learning-topbar"><Link to="/dashboard" className="back-link"><ChevronLeft size={16} /> My learning</Link><div className="learning-course-title"><span>{data.course.category}</span><strong>{data.course.title}</strong></div><div className="learning-overall"><span>{data.completion.completedLessons}/{data.completion.totalLessons} lessons</span><div><span style={{ width: `${data.completion.totalLessons ? data.completion.completedLessons / data.completion.totalLessons * 100 : 0}%` }} /></div></div></div><div className="learning-layout"><div className="learning-content"><div className="video-stage">{current?.mediaAssetId && current.mediaStatus === "READY" ? <HlsVideo mediaId={current.mediaAssetId} initialPosition={current.progress?.positionSeconds ?? 0} onProgress={onProgress} /> : <div className="video-empty"><div className="video-empty-art"><span>✳</span><i /><i /><i /></div><div className="video-empty-copy"><span>{current?.mediaStatus === "PROCESSING" ? "MAKING THE VIDEO READY" : "A QUIET PLACE TO BEGIN"}</span><h2>{current?.mediaStatus === "PROCESSING" ? "Your lesson is on its way." : current?.title}</h2><p>{current?.mediaStatus === "PROCESSING" ? "The instructor’s video is still being prepared. Check back in a moment." : "This lesson is ready for its video. Your instructor will add it to the course soon."}</p></div></div>}</div><div className="learning-description"><div><span className="eyebrow"><span className="eyebrow-line" /> NOW LEARNING</span><h1>{current?.title}</h1><p>{current?.summary || "Take your time. Try the idea, and keep the parts that work for you."}</p></div><span className="lesson-duration"><Clock3 size={15} /> {Math.ceil((current?.durationSeconds ?? 0) / 60)} min</span></div><div className="learning-tool-row"><button onClick={() => setSelectedLesson(lessons[Math.max(0, lessons.findIndex((lesson) => lesson.id === current?.id) - 1)]?.id ?? current?.id)} className="button button-cream"><ChevronLeft size={15} /> Previous</button><button onClick={() => setSelectedLesson(lessons[Math.min(lessons.length - 1, lessons.findIndex((lesson) => lesson.id === current?.id) + 1)]?.id ?? current?.id)} className="button button-dark">Next lesson <ChevronRight size={15} /></button></div><QuizBlock courseId={courseId} />{data.completion.completed && <div className="completion-card"><span><Award size={23} /></span><div><h3>You made it all the way through.</h3><p>Your lessons and knowledge check are complete. Your certificate is ready to issue.</p></div><button className="button button-dark" onClick={handleCertificate} disabled={issueState.isLoading}>Get certificate <ArrowRight size={15} /></button>{certificate && <a href={`/api/v1/me/certificates/${certificate.id}.pdf`}>Download PDF</a>}{certificateError && <small>{certificateError}</small>}</div>}{certificate && <div className="certificate-issued"><CheckCircle2 size={16} /> Certificate {certificate.number} issued <a href={`/api/v1/me/certificates/${certificate.id}.pdf`}><Download size={14} /> Download PDF</a></div>}</div><aside className="curriculum-sidebar"><div className="curriculum-side-heading"><span className="eyebrow"><span className="eyebrow-line" /> YOUR COURSE</span><h2>One step<br /><em>at a time.</em></h2><div className="side-progress"><div><span style={{ width: `${data.completion.totalLessons ? data.completion.completedLessons / data.completion.totalLessons * 100 : 0}%` }} /></div><small>{data.completion.completedLessons} of {data.completion.totalLessons} lessons complete</small></div></div>{data.course.sections.map((section) => <div className="learning-section" key={section.id}><h3>{section.title}</h3>{section.lessons.map((lesson, index) => <button className={`learning-lesson ${current?.id === lesson.id ? "active" : ""}`} onClick={() => setSelectedLesson(lesson.id)} key={lesson.id}><span className="learning-check">{lesson.progress?.completedAt ? <Check size={13} /> : current?.id === lesson.id ? <Play size={11} fill="currentColor" /> : String(index + 1).padStart(2, "0")}</span><span>{lesson.title}<small>{Math.ceil(lesson.durationSeconds / 60)} min {lesson.mediaStatus === "PROCESSING" ? "· preparing video" : ""}</small></span><ChevronRight size={14} /></button>)}</div>)}<div className="live-class-sidebar"><div className="live-class-heading"><Video size={16} /><strong>Learn together</strong></div>{schedule?.sessions?.length ? schedule.sessions.map((session) => <div className="live-session-row" key={session.id}><strong>{session.title}</strong><small>{dateLabel(session.startsAt)}</small><button onClick={async () => { try { const result = await joinLiveClass(session.id).unwrap(); setActiveRoom({ url: result.url, token: result.token, title: result.session.title }); } catch (error) { window.alert(friendlyError(error)); } }} disabled={joinState.isLoading}>{schedule.providerConfigured ? "Join live class" : "Provider not configured"}</button></div>) : <p>Your instructor’s upcoming live classes will show up here.</p>}</div></aside></div>{activeRoom && <LiveRoom url={activeRoom.url} token={activeRoom.token} title={activeRoom.title} onClose={() => setActiveRoom(undefined)} />}</section>;
}

function HlsVideo({ mediaId, initialPosition, onProgress }: { mediaId: string; initialPosition: number; onProgress: (position: number, playing: boolean) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | undefined>(undefined);
  const initialPositionRef = useRef(initialPosition);
  const [playbackError, setPlaybackError] = useState("");
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const manifest = `/api/v1/media/${mediaId}/playlist`;
    let cancelled = false;
    const restorePosition = () => { if (initialPositionRef.current) video.currentTime = initialPositionRef.current; };
    setPlaybackError("");
    void import("hls.js").then(({ default: HlsLibrary }) => {
      if (cancelled) return;
      if (HlsLibrary.isSupported()) {
        const hls = new HlsLibrary({
          enableWorker: true,
          lowLatencyMode: false,
          xhrSetup: (xhr, url) => {
            if (new URL(url, window.location.href).hostname === window.location.hostname) xhr.withCredentials = true;
          },
        });
        hlsRef.current = hls;
        hls.loadSource(manifest); hls.attachMedia(video);
        hls.on(HlsLibrary.Events.MANIFEST_PARSED, restorePosition);
        hls.on(HlsLibrary.Events.ERROR, (_event, data) => {
          if (data.fatal) setPlaybackError("The HLS stream could not be loaded. Check your enrollment and media processing status.");
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = manifest;
        video.addEventListener("loadedmetadata", restorePosition, { once: true });
      } else setPlaybackError("This browser does not support HLS playback.");
    }).catch(() => setPlaybackError("The HLS player could not be loaded."));
    return () => { cancelled = true; hlsRef.current?.destroy(); hlsRef.current = undefined; video.removeEventListener("loadedmetadata", restorePosition); };
  }, [mediaId]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const timer = window.setInterval(() => { if (!video.paused && !video.ended) onProgress(video.currentTime, true); }, 5000);
    const pause = () => onProgress(video.currentTime, false);
    video.addEventListener("pause", pause);
    return () => { window.clearInterval(timer); video.removeEventListener("pause", pause); };
  }, [onProgress]);
  return <div className="video-player"><video ref={videoRef} controls playsInline poster="/fieldnotes-poster.svg" aria-label="Course lesson video" />{playbackError && <div className="video-error">{playbackError}</div>}<div className="player-caption"><span>FIELDNOTES · LESSON PLAYER</span><span>HLS STREAM</span></div></div>;
}

function QuizBlock({ courseId }: { courseId: string }) {
  const { data, isError } = useQuizQuery(courseId);
  const [submit, state] = useSubmitQuizMutation();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ scorePercent: number; passed: boolean; correctCount: number; total: number }>();
  if (isError || !data?.quiz) return null;
  const send = async () => { try { const response = await submit({ courseId, answers }).unwrap(); setResult(response.attempt); } catch { /* mutation error surfaced */ } };
  return <div className="quiz-card"><div className="quiz-heading"><div className="quiz-badge"><CircleHelp size={17} /></div><div><span className="eyebrow"><span className="eyebrow-line" /> PAUSE & REFLECT</span><h2>{data.quiz.title}</h2></div><span className="pass-mark">Pass mark {data.quiz.passPercent}%</span></div><div className="quiz-questions">{data.quiz.questions.map((question, index) => <div className="quiz-question" key={question.id}><h3><span>{String(index + 1).padStart(2, "0")}</span>{question.prompt}</h3><div className="quiz-options">{question.options.map((option, optionIndex) => <label className={answers[question.id] === optionIndex ? "quiz-option selected" : "quiz-option"} key={option}><input type="radio" name={question.id} checked={answers[question.id] === optionIndex} onChange={() => setAnswers({ ...answers, [question.id]: optionIndex })} /><span>{option}</span><i><Check size={12} /></i></label>)}</div></div>)}</div><div className="quiz-footer"><span>{result ? <span className={result.passed ? "quiz-result passed" : "quiz-result"}><CheckCircle2 size={15} /> {result.passed ? "You passed" : "Keep practicing"} · {result.scorePercent}% ({result.correctCount}/{result.total})</span> : "Try it when you’re ready."}</span><button className="button button-dark" onClick={send} disabled={Object.keys(answers).length < data.quiz.questions.length || state.isLoading}>{state.isLoading ? "Checking…" : result ? "Try again" : "Check my answers"}<ArrowRight size={14} /></button></div></div>;
}

function LiveRoom({ url, token, title, onClose }: { url: string; token: string; title: string; onClose: () => void }) {
  const roomRef = useRef<import("livekit-client").Room | undefined>(undefined);
  const videoGrid = useRef<HTMLDivElement>(null);
  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [chatText, setChatText] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    let room: import("livekit-client").Room | undefined;
    const connect = async () => {
      const { Room, RoomEvent, Track } = await import("livekit-client");
      if (cancelled) return;
      room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      const attach = (track: import("livekit-client").Track, participant: import("livekit-client").Participant) => {
        if (track.kind === Track.Kind.Audio) {
          const audio = track.attach(); audio.autoplay = true; audio.dataset.participant = participant.identity; document.body.appendChild(audio);
        } else if (track.kind === Track.Kind.Video && videoGrid.current) {
          const tile = document.createElement("div"); tile.className = "live-video-tile"; tile.dataset.identity = participant.identity;
          const video = track.attach() as HTMLVideoElement; tile.appendChild(video);
          const label = document.createElement("span"); label.textContent = participant.name || participant.identity; tile.appendChild(label); videoGrid.current.appendChild(tile);
        }
      };
      const onSubscribed = (track: import("livekit-client").Track, _publication: unknown, participant: import("livekit-client").Participant) => attach(track, participant);
      const onUnsubscribed = (track: import("livekit-client").Track) => track.detach().forEach((element) => element.remove());
      const onData = (payload: Uint8Array, participant?: import("livekit-client").Participant) => {
        try { const message = JSON.parse(new TextDecoder().decode(payload)) as { text: string }; setMessages((current) => [...current, { sender: participant?.name || "Classmate", text: message.text }]); } catch { /* ignore other room data */ }
      };
      room.on(RoomEvent.TrackSubscribed, onSubscribed); room.on(RoomEvent.TrackUnsubscribed, onUnsubscribed); room.on(RoomEvent.DataReceived, onData);
      await room.connect(url, token);
      setConnected(true);
      await room.localParticipant.setMicrophoneEnabled(true);
      await room.localParticipant.setCameraEnabled(true);
    };
    void connect().catch((reason) => setError(friendlyError(reason)));
    return () => { cancelled = true; roomRef.current = undefined; room?.removeAllListeners(); room?.disconnect(); document.querySelectorAll("audio[data-participant]").forEach((audio) => audio.remove()); videoGrid.current?.replaceChildren(); };
  }, [url, token]);
  const sendMessage = async (event: FormEvent) => { event.preventDefault(); const text = chatText.trim(); if (!text || !roomRef.current) return; try { await roomRef.current.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ text })), { reliable: true, topic: "chat" }); setMessages((current) => [...current, { sender: "You", text }]); setChatText(""); } catch { setError("Your message couldn’t be sent."); } };
  return <div className="live-overlay"><div className="live-room"><header><div><span className="live-dot" /><div><strong>{title}</strong><small>{connected ? "LIVE CLASS · CONNECTED" : "CONNECTING TO LIVE CLASS"}</small></div></div><button className="icon-button" onClick={onClose}><X size={19} /></button></header>{error && <ErrorPanel message={error} compact />}<div className="live-main"><div className="live-video-grid" ref={videoGrid}><div className="live-video-placeholder"><Video size={25} /><span>{connected ? "Waiting for a classmate" : "Connecting…"}</span></div></div><aside className="live-chat"><div><MessageCircle size={16} /><strong>Class chat</strong></div><div className="chat-messages">{messages.map((message, index) => <p key={index}><strong>{message.sender}</strong>{message.text}</p>)}{!messages.length && <span>Say hello when you arrive.</span>}</div><form onSubmit={sendMessage}><input value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Write a message…" /><button aria-label="Send message"><ArrowRight size={15} /></button></form></aside></div><div className="live-controls"><button onClick={() => { const next = !micOn; setMicOn(next); void roomRef.current?.localParticipant.setMicrophoneEnabled(next); }}>{micOn ? <Mic size={17} /> : <MicOff size={17} />}{micOn ? "Mute" : "Unmute"}</button><button onClick={() => { const next = !cameraOn; setCameraOn(next); void roomRef.current?.localParticipant.setCameraEnabled(next); }}>{cameraOn ? <Video size={17} /> : <VideoOff size={17} />}{cameraOn ? "Stop video" : "Start video"}</button><button className="leave-class" onClick={onClose}>Leave class</button></div></div></div>;
}

function VerifyCertificate() {
  const { certificateId = "" } = useParams();
  const [state, setState] = useState<{ loading: boolean; valid?: boolean; certificate?: { certificateNumber: string; studentName: string; courseTitle: string; instructorName: string; issuedAt: string } }>({ loading: true });
  useEffect(() => { fetch(`/api/v1/certificates/${encodeURIComponent(certificateId)}/verify`).then(async (res) => ({ ok: res.ok, data: await res.json() })).then(({ ok, data }) => setState({ loading: false, valid: ok && data.valid, certificate: data.certificate })).catch(() => setState({ loading: false, valid: false })); }, [certificateId]);
  return <section className="verify-page wrap">{state.loading ? <PageLoading /> : state.valid && state.certificate ? <div className="verify-card"><div className="verify-seal"><ShieldCheck size={29} /></div><span className="eyebrow"><span className="eyebrow-line" /> CERTIFICATE VERIFIED</span><h1>A real piece<br /><em>of good work.</em></h1><p>This certificate was issued by Fieldnotes Learning Studio.</p><div className="verify-details"><span>LEARNER<strong>{state.certificate.studentName}</strong></span><span>COURSE<strong>{state.certificate.courseTitle}</strong></span><span>INSTRUCTOR<strong>{state.certificate.instructorName}</strong></span><span>ISSUED<strong>{new Date(state.certificate.issuedAt).toLocaleDateString()}</strong></span><span>CERTIFICATE ID<strong>{state.certificate.certificateNumber}</strong></span></div></div> : <div className="verify-card invalid"><div className="verify-seal"><X size={26} /></div><span className="eyebrow"><span className="eyebrow-line" /> NOT VERIFIED</span><h1>We couldn’t find<br /><em>that certificate.</em></h1><p>The ID may be incorrect, or the certificate may have been revoked.</p><Link to="/explore" className="button button-dark">Explore Fieldnotes <ArrowRight size={15} /></Link></div>}</section>;
}

function CheckoutReturn() {
  const [params] = useSearchParams();
  return <section className="wrap page-pad checkout-return"><div className="verify-seal"><Clock3 size={25} /></div><div className="eyebrow"><span className="eyebrow-line" /> PAYMENT STATUS</div><h1>{params.get("payment") === "cancelled" ? "No rush." : "Your checkout is complete."}</h1><p>{params.get("payment") === "cancelled" ? "You can come back to this course whenever it feels right." : "We’re confirming the payment with the provider. Your course unlocks as soon as the verified confirmation arrives."}</p><Link to="/dashboard" className="button button-dark">Go to my learning <ArrowRight size={15} /></Link></section>;
}

function Stat({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <div className="stat-card"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
function PageLoading() { return <div className="page-loading"><span /><span /><span /></div>; }
function ErrorPanel({ message, compact = false }: { message: string; compact?: boolean }) { return <div className={compact ? "error-panel compact" : "error-panel"}><span>!</span><p>{message}</p></div>; }
function AuthPrompt({ instructor = false }: { instructor?: boolean }) { return <section className="auth-prompt wrap"><span className="auth-prompt-icon"><GraduationCap size={25} /></span><div className="eyebrow"><span className="eyebrow-line" /> ONE MORE STEP</div><h1>{instructor ? "Come on into the studio." : "Your learning is waiting."}</h1><p>Sign in to see your courses, notes, and next steps.</p><Link className="button button-dark" to="/login">Sign in <ArrowRight size={15} /></Link></section>; }
function NavigateTo({ to }: { to: string }) { const navigate = useNavigate(); useEffect(() => { navigate(to, { replace: true }); }, [to, navigate]); return <PageLoading />; }
function NotFound() { return <section className="auth-prompt wrap"><span className="auth-prompt-icon"><Search size={23} /></span><div className="eyebrow"><span className="eyebrow-line" /> A WRONG TURN</div><h1>This page wandered off.</h1><p>Let’s get you back to a good place.</p><Link className="button button-dark" to="/">Back home <ArrowRight size={15} /></Link></section>; }

