import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useApplyAsInstructorMutation, useInstructorApplicationQuery } from "../api";
import { useAppSelector } from "../store";
import { AuthPrompt, ErrorPanel, NavigateTo, PageLoading, friendlyError, rolePath } from "../components/common/UIComponents";

export function InstructorApplicationPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading } = useInstructorApplicationQuery(undefined, {
    skip: !user || user.role !== "STUDENT",
  });
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
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const result = await apply({
        bio,
        specialties: specialties
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }).unwrap();
      setMessage(`Your application is ${result.application.status.toLowerCase()}.`);
    } catch (reason) {
      setError(friendlyError(reason));
    }
  };

  return (
    <section className="auth-page wrap">
      <div className="auth-aside">
        <span className="auth-stamp">
          <Sparkles size={23} />
        </span>
        <div className="eyebrow">
          <span className="eyebrow-line" /> A PLACE FOR PEOPLE WHO TEACH
        </div>
        <h1>
          Share what
          <br />
          <em>you know.</em>
        </h1>
        <p>
          Help someone take their next step. Tell us what you teach and how you like to bring
          it to life.
        </p>
        <div className="auth-quote">
          <span>“</span>
          <p>
            Good teaching makes a hard thing
            <br />
            feel possible.
          </p>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-form-heading">
          <span className="eyebrow">
            <span className="eyebrow-line" /> INSTRUCTOR ONBOARDING
          </span>
          <h2>{application ? "Your application" : "Let’s get to know you."}</h2>
          <p>An administrator reviews new instructor applications before course publishing.</p>
        </div>

        {error && <ErrorPanel message={error} compact />}
        {message && (
          <div className="notice-bar">
            <CheckCircle2 size={15} />
            {message}
          </div>
        )}

        {application ? (
          <div className="application-status">
            <span className={`status-pill status-${application.status.toLowerCase()}`}>
              {application.status}
            </span>
            <h3>
              {application.status === "PENDING"
                ? "We’re taking a look."
                : application.status === "APPROVED"
                ? "Welcome to the teaching studio."
                : "A little more work may be needed."}
            </h3>
            <p>
              {application.reviewNote ||
                (application.status === "PENDING"
                  ? "Your application is in the review queue. We’ll update your access when it has been reviewed."
                  : "You can contact the studio team for more detail.")}
            </p>
            {application.status === "APPROVED" && (
              <button
                className="button button-dark"
                onClick={() => window.location.assign("/instructor")}
              >
                Open teaching studio <ArrowRight size={15} />
              </button>
            )}
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label>
              A little about you
              <textarea
                className="application-bio"
                required
                minLength={30}
                maxLength={2500}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={6}
                placeholder="What do you teach? What have you worked on? How do you help people learn?"
              />
            </label>
            <label>
              Your areas of practice
              <input
                required
                value={specialties}
                onChange={(event) => setSpecialties(event.target.value)}
                placeholder="Product design, prototyping, research"
              />
              <small>Separate a few topics with commas.</small>
            </label>
            <button className="button button-dark auth-submit" disabled={state.isLoading}>
              {state.isLoading ? "Sending…" : "Send application"}
              <ArrowRight size={15} />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
