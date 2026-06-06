import React, { useState, useRef } from 'react';

export default function Navbar({
  activeView,
  setActiveView,
  currentUser,
  logout,
}) {
  const navbarRef = useRef(null);
  const [navbarStyle, setNavbarStyle] = useState({});

  const handleNavbarMouseMove = (e) => {
    const navbar = navbarRef.current;
    if (!navbar) return;
    const rect = navbar.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const cx = nx - 0.5;
    const cy = ny - 0.5;
    const sx = (cx * 28).toFixed(1);
    const sy = (cy * 18).toFixed(1);
    const depth = 32;

    setNavbarStyle({
      background: `
        radial-gradient(
          ellipse 55% 40% at ${(nx*100).toFixed(1)}% ${(ny*100).toFixed(1)}%,
          rgba(0,0,0,0.38) 0%,
          rgba(0,0,0,0.10) 55%,
          transparent     100%
        ),
        rgba(35, 47, 114, 0.55)
      `,
      boxShadow: [
        `0 0 0 1px rgba(54, 173, 163, 0.08)`,
        `inset ${sx}px ${sy}px ${depth}px rgba(0,0,0,0.45)`,
        `inset ${(-cx*12).toFixed(1)}px ${(-cy*8).toFixed(1)}px 12px rgba(255,255,255,0.03)`,
      ].join(', '),
    });
  };

  const handleNavbarMouseLeave = () => {
    setNavbarStyle({});
  };

  const handleNavClick = (view) => {
    setActiveView(view);
  };

  return (
    <header
      ref={navbarRef}
      className="navbar-container"
      onMouseMove={handleNavbarMouseMove}
      onMouseLeave={handleNavbarMouseLeave}
      style={navbarStyle}
    >
      {/* Logo */}
      <div
        className="navbar-logo"
        onClick={() => handleNavClick(currentUser ? 'dashboard' : 'auth')}
      >
        <img
          src="/logo.png"
          alt="UPES ACM"
          style={{
            height: "50px",
            width: "auto",
            cursor: "pointer",
          }}
        />
      </div>

      {/* If NOT logged in */}
      {!currentUser ? (
        <div className="navbar-actions" style={{ marginLeft: 'auto' }}>
          <button
            className={`nav-item ${activeView === 'leaderboards' ? 'active' : ''}`}
            onClick={() => handleNavClick('leaderboards')}
          >
            Leaderboards
          </button>
        </div>
      ) : (
        <>
          {/* Navigation */}
          <nav className="navbar-links">
            {currentUser.role === "participant" && (
              <>
                <button
                  className={`nav-item ${
                    activeView === "dashboard" ? "active" : ""
                  }`}
                  onClick={() => handleNavClick("dashboard")}
                >
                  Dashboard
                </button>

                <button
                  className={`nav-item ${
                    activeView === "questions" ? "active" : ""
                  }`}
                  onClick={() => handleNavClick("questions")}
                >
                  Daily Challenges
                </button>

                <button
                  className={`nav-item ${
                    activeView === "debugging" ? "active" : ""
                  }`}
                  onClick={() => handleNavClick("debugging")}
                >
                  Sunday Debug
                </button>

                <button
                  className={`nav-item ${
                    activeView === "profile" ? "active" : ""
                  }`}
                  onClick={() => handleNavClick("profile")}
                >
                  My Profile
                </button>
              </>
            )}

            {currentUser.role === "admin" && (
              <button
                className={`nav-item admin-tab ${
                  activeView === "admin" ? "active" : ""
                }`}
                onClick={() => handleNavClick("admin")}
              >
                Admin Panel
              </button>
            )}

            <button
              className={`nav-item ${
                activeView === "leaderboards" ? "active" : ""
              }`}
              onClick={() => handleNavClick("leaderboards")}
            >
              Leaderboards
            </button>
          </nav>

          {/* User Profile pinned top-right */}
          <div className="navbar-actions">
            <div className="user-profile-badge">
              <div
                className="user-avatar-text"
                onClick={() =>
                  currentUser.role === "participant" &&
                  handleNavClick("profile")
                }
              >
                {currentUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div className="user-details">
                <span
                  className="user-name-text"
                  onClick={() =>
                    currentUser.role === "participant" &&
                    handleNavClick("profile")
                  }
                  style={{
                    cursor:
                      currentUser.role === "participant"
                        ? "pointer"
                        : "default",
                  }}
                >
                  {currentUser.name}
                </span>

                <span className={`user-role-tag ${currentUser.role}`}>
                  {currentUser.role === "admin"
                    ? "Admin"
                    : `Rank #${currentUser.overallRank}`}
                </span>
              </div>

              <button
                className="logout-btn"
                onClick={logout}
                title="Sign Out"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}