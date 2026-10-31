import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link to="/" className="footer-brand">
          fieldnotes<span>.</span>
        </Link>
        <span>Room to learn, space to grow.</span>
        <div>
          <Link to="/explore">Explore courses</Link>
          <a href="/api/docs" target="_blank" rel="noreferrer">
            API reference
          </a>
        </div>
        <small>© 2026 Fieldnotes Learning Studio</small>
      </div>
    </footer>
  );
}
