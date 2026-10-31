import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowRight, LogOut, Menu } from "lucide-react";
import { useLogoutMutation, useMeQuery } from "../../api";
import { useAppDispatch, useAppSelector } from "../../store";
import { setUser, clearUser } from "../../slices/authSlice";
import { toggleMobileNav, setMobileNavOpen } from "../../slices/uiSlice";

export function Header() {
  const dispatch = useAppDispatch();
  const { data } = useMeQuery();
  const [logout] = useLogoutMutation();
  const mobileNavOpen = useAppSelector((state) => state.ui.mobileNavOpen);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (data?.user) {
      dispatch(setUser(data.user));
    }
  }, [data, dispatch]);

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
  };

  const closeNav = () => dispatch(setMobileNavOpen(false));

  return (
    <header className="site-header">
      <Link to="/" className="wordmark" onClick={closeNav}>
        <span className="brand-mark">
          <span />
        </span>
        <span>
          fieldnotes<span className="wordmark-dot">.</span>
          <small>LEARNING STUDIO</small>
        </span>
      </Link>
      <button
        className="menu-toggle"
        onClick={() => dispatch(toggleMobileNav())}
        aria-label="Toggle navigation"
      >
        <Menu size={20} />
      </button>
      <nav className={mobileNavOpen ? "header-nav open" : "header-nav"}>
        <NavLink to="/explore" onClick={closeNav}>
          Explore
        </NavLink>
        {user && user.role === "STUDENT" && (
          <NavLink to="/dashboard" onClick={closeNav}>
            My learning
          </NavLink>
        )}
        {user && user.role === "STUDENT" && (
          <NavLink to="/teach" onClick={closeNav}>
            Teach here
          </NavLink>
        )}
        {user && user.role === "INSTRUCTOR" && (
          <NavLink to="/instructor" onClick={closeNav}>
            Teaching studio
          </NavLink>
        )}
        {user && user.role === "ADMIN" && (
          <NavLink to="/admin" onClick={closeNav}>
            Admin
          </NavLink>
        )}
        {user ? (
          <div className="account-chip">
            <span className="avatar">{user.name.slice(0, 1)}</span>
            <span className="account-name">{user.name.split(" ")[0]}</span>
            <button
              className="icon-button"
              title="Sign out"
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <>
            <Link className="header-signin" to="/login" onClick={closeNav}>
              Sign in
            </Link>
            <Link
              className="button button-dark header-cta"
              to="/register"
              onClick={closeNav}
            >
              Start learning <ArrowRight size={15} />
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
