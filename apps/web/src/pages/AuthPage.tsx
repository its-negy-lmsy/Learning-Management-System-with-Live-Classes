import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLoginMutation, useRegisterMutation } from "../api";
import { useAppDispatch } from "../store";
import { setUser } from "../slices/authSlice";
import { ErrorPanel, friendlyError, rolePath } from "../components/common/UIComponents";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const dispatch = useAppDispatch();
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
      const result =
        mode === "login"
          ? await login({ email, password }).unwrap()
          : await register({ name, email, password }).unwrap();

      dispatch(setUser(result.user));
      const target = params.get("returnTo") || rolePath(result.user.role);
      navigate(target);
    } catch {
      /* Inline error handled by state.error */
    }
  };

  return (
    <section className="auth-page wrap">
      <div className="auth-aside">
        <span className="auth-stamp">
          <Sparkles size={23} />
        </span>
        <div className="eyebrow">
          <span className="eyebrow-line" /> Good to see you here
        </div>
        <h1>
          {mode === "login" ? (
            <>
              Pick up
              <br />
              <em>where you left off.</em>
            </>
          ) : (
            <>
              Start with
              <br />
              <em>one good idea.</em>
            </>
          )}
        </h1>
        <p>Thoughtful courses, generous people, and room to find your own pace.</p>
        <div className="auth-quote">
          <span>“</span>
          <p>
            The best time to learn something
            <br />
            new is right about now.
          </p>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-form-heading">
          <span className="eyebrow">
            <span className="eyebrow-line" />{" "}
            {mode === "login" ? "Welcome back" : "Make yourself at home"}
          </span>
          <h2>{mode === "login" ? "Sign in" : "Create your account"}</h2>
          <p>
            {mode === "login"
              ? "Pick up your learning right where you left it."
              : "Your next chapter starts with a few details."}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <label>
              Your name
              <input
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                placeholder="Jordan Lee"
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={mode === "login" ? 1 : 12}
              placeholder={mode === "login" ? "Your password" : "At least 12 characters"}
            />
          </label>
          {state.error && <ErrorPanel message={friendlyError(state.error)} compact />}
          <button className="button button-dark auth-submit" disabled={state.isLoading}>
            {state.isLoading
              ? "One moment…"
              : mode === "login"
              ? "Sign in to Fieldnotes"
              : "Create your account"}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login" ? (
            <>
              New to Fieldnotes? <Link to="/register">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/login">Sign in</Link>
            </>
          )}
        </div>

        <div className="demo-login">
          <span className="demo-dot" /> Local demo accounts
          <button
            type="button"
            onClick={() => {
              setEmail("learner@fs03.demo");
              setPassword("LearnFS03!Local");
            }}
          >
            Fill learner
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail("teacher@fs03.demo");
              setPassword("TeachFS03!Local");
            }}
          >
            Fill instructor
          </button>
        </div>
      </div>
    </section>
  );
}
