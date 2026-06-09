import React, { useState, useRef, useEffect, useMemo } from 'react';

function buildNavLinks(currentUser) {
  if (!currentUser) {
    return [{ view: 'leaderboards', label: 'Leaderboards' }];
  }

  const links = [];

  if (currentUser.role === 'participant') {
    links.push(
      { view: 'dashboard', label: 'Dashboard' },
      { view: 'questions', label: 'Daily Challenges' },
      { view: 'debugging', label: 'Sunday Debug' },
      { view: 'profile', label: 'My Profile' }
    );
  }

  if (currentUser.role === 'admin') {
    links.push({
      view: 'coordinator',
      label: 'Coordinator Dashboard',
      admin: true,
    });
  }

  links.push({ view: 'leaderboards', label: 'Leaderboards' });
  return links;
}

function isNavActive(activeView, view) {
  if (view === 'coordinator') {
    return activeView === 'coordinator' || activeView === 'admin';
  }
  return activeView === view;
}

export default function Navbar({
  activeView,
  setActiveView,
  currentUser,
  logout,
}) {
  const navbarRef = useRef(null);
  const [navbarStyle, setNavbarStyle] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = useMemo(() => buildNavLinks(currentUser), [currentUser]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentUser, activeView]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNavbarMouseMove = (e) => {
    const navbar = navbarRef.current;
    if (!navbar || window.innerWidth <= 900) return;
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
          ellipse 55% 40% at ${(nx * 100).toFixed(1)}% ${(ny * 100).toFixed(1)}%,
          rgba(13, 11, 15, 0.92) 0%,
          rgba(30, 24, 40, 0.75) 55%,
          transparent     100%
        ),
        var(--bg-panel)
      `,
      boxShadow: [
        `inset ${sx}px ${sy}px ${depth}px rgba(13, 11, 15, 0.85)`,
      ].join(', '),
    });
  };

  const handleNavbarMouseLeave = () => {
    setNavbarStyle({});
  };

  const handleNavClick = (view) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  const defaultView = currentUser
    ? currentUser.role === 'admin'
      ? 'coordinator'
      : 'dashboard'
    : 'auth';

  const renderNavButton = (link, className = 'nav-item') => (
    <button
      key={link.view}
      type="button"
      className={`${className} ${link.admin ? 'admin-tab' : ''} ${
        isNavActive(activeView, link.view) ? 'active' : ''
      }`}
      onClick={() => handleNavClick(link.view)}
    >
      {link.label}
    </button>
  );

  return (
    <>
      <header
        ref={navbarRef}
        className="navbar-container"
        onMouseMove={handleNavbarMouseMove}
        onMouseLeave={handleNavbarMouseLeave}
        style={navbarStyle}
      >
        <div
          className="navbar-brand-block"
          onClick={() => handleNavClick(defaultView)}
        >
          <div className="navbar-logo">
            <img src="/logo.png" alt="UPES ACM" className="navbar-logo-img" />
            <img src="/favicon2.png" alt="UPES ACM-W" className="navbar-logo-img secondary" />
          </div>
          <div className="navbar-tagline">
            <span className="navbar-event-name">#100DaysOfCode</span>
            <span className="navbar-motto">Advancing Computing as a Science &amp; Profession</span>
          </div>
        </div>

        <nav className="navbar-links navbar-links-desktop" aria-label="Main navigation">
          {navLinks.map((link) => renderNavButton(link))}
        </nav>

        <div className="navbar-actions">
          {currentUser && (
            <div className="user-profile-badge navbar-profile-desktop">
              <div
                className="user-avatar-text"
                onClick={() =>
                  currentUser.role === 'participant' && handleNavClick('profile')
                }
              >
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div className="user-details">
                <span
                  className="user-name-text"
                  onClick={() =>
                    currentUser.role === 'participant' && handleNavClick('profile')
                  }
                  style={{
                    cursor: currentUser.role === 'participant' ? 'pointer' : 'default',
                  }}
                >
                  {currentUser.name}
                </span>
                <span className={`user-role-tag ${currentUser.role}`}>
                  {currentUser.role === 'admin'
                    ? 'Coordinator'
                    : `Rank #${currentUser.overallRank}`}
                </span>
              </div>

              <button className="logout-btn" onClick={logout} title="Sign Out" type="button">
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
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          )}

          <button
            type="button"
            className={`navbar-hamburger ${mobileMenuOpen ? 'is-open' : ''}`}
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
        </div>
      </header>

      <div
        className={`navbar-mobile-backdrop ${mobileMenuOpen ? 'is-open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <nav
        className={`navbar-mobile-drawer ${mobileMenuOpen ? 'is-open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
      >
        {currentUser && (
          <div className="navbar-mobile-user">
            <div className="user-avatar-text">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="navbar-mobile-user-info">
              <span className="user-name-text">{currentUser.name}</span>
              <span className={`user-role-tag ${currentUser.role}`}>
                {currentUser.role === 'admin'
                  ? 'Coordinator'
                  : `Rank #${currentUser.overallRank}`}
              </span>
            </div>
          </div>
        )}

        <div className="navbar-mobile-links">
          {navLinks.map((link) => renderNavButton(link, 'nav-item nav-item-mobile'))}
        </div>

        {currentUser && (
          <button type="button" className="navbar-mobile-logout" onClick={logout}>
            Sign Out
          </button>
        )}
      </nav>
    </>
  );
}
