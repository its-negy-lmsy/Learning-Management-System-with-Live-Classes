import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Search } from "lucide-react";
import type { Role } from "@fs03/shared";

export const friendlyError = (error: unknown): string => {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: { error?: { message?: string } } }).data;
    return data?.error?.message ?? "That didn't work. Please try again.";
  }
  return error instanceof Error ? error.message : "That didn't work. Please try again.";
};

export const rolePath = (role?: Role): string =>
  role === "INSTRUCTOR" ? "/instructor" : role === "ADMIN" ? "/admin" : "/dashboard";

export function Stat({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="page-loading" aria-label="Loading page content">
      <span />
      <span />
      <span />
    </div>
  );
}

export function ErrorPanel({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "error-panel compact" : "error-panel"} role="alert">
      <span>!</span>
      <p>{message}</p>
    </div>
  );
}

export function AuthPrompt({ instructor = false }: { instructor?: boolean }) {
  return (
    <section className="auth-prompt wrap">
      <span className="auth-prompt-icon">
        <GraduationCap size={25} />
      </span>
      <div className="eyebrow">
        <span className="eyebrow-line" /> ONE MORE STEP
      </div>
      <h1>{instructor ? "Come on into the studio." : "Your learning is waiting."}</h1>
      <p>Sign in to see your courses, notes, and next steps.</p>
      <Link className="button button-dark" to="/login">
        Sign in
      </Link>
    </section>
  );
}

export function NavigateTo({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace: true });
  }, [to, navigate]);
  return <PageLoading />;
}

export function NotFound() {
  return (
    <section className="auth-prompt wrap">
      <span className="auth-prompt-icon">
        <Search size={23} />
      </span>
      <div className="eyebrow">
        <span className="eyebrow-line" /> A WRONG TURN
      </div>
      <h1>This page wandered off.</h1>
      <p>Let’s get you back to a good place.</p>
      <Link className="button button-dark" to="/">
        Back home
      </Link>
    </section>
  );
}
