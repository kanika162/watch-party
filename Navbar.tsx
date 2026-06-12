import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { username } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const onLogoClick = () => {
    if (location.pathname !== "/") navigate("/");
  };

  return (
    <header
      style={{
        borderBottom: "1px solid rgba(148,163,184,0.25)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 20
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0.8rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <button
          onClick={onLogoClick}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          className="btn-ghost"
        >
          <span
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "999px",
              background:
                "radial-gradient(circle at 30% 30%, #fbbf24, #f97316 40%, #ef4444 75%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: "0.9rem"
            }}
          >
            WP
          </span>
          <span style={{ fontWeight: 700 }}>Watch Party</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {username && (
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>
              Signed in as <strong>{username}</strong>
            </span>
          )}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <Link to="/" className="btn btn-primary" style={{ textDecoration: "none" }}>
            Home
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
