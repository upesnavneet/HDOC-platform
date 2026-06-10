import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ROUTE_MAP = {
  dashboard: '/dashboard',
  questions: '/questions',
  debugging: '/debugging',
  profile: '/profile',
  coordinator: '/coordinator',
  leaderboards: '/leaderboards',
};

function buildNavLinks(currentUser) {
  if (!currentUser) {
    return [{ path: ROUTE_MAP.leaderboards, label: 'Leaderboards' }];
  }

  const links = [];

  if (currentUser.role === 'participant') {
    links.push(
      { path: ROUTE_MAP.dashboard, label: 'Dashboard' },
      { path: ROUTE_MAP.questions, label: 'Daily Challenges' },
      { path: ROUTE_MAP.debugging, label: 'Sunday Debug' },
      { path: ROUTE_MAP.profile, label: 'My Profile' }
    );
  }

  if (currentUser.role === 'admin') {
    links.push({
      path: ROUTE_MAP.coordinator,
      label: 'Coordinator Dashboard',
      admin: true,
    });
  }

  links.push({ path: ROUTE_MAP.leaderboards, label: 'Leaderboards' });
  return links;
}

function isNavActive(pathname, path) {
  if (path === ROUTE_MAP.coordinator) {
    return pathname === '/coordinator' || pathname === '/admin';
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function Navbar() {
  const { currentUser, logout } = useApp();
  const location = useLocation();
  const navbarRef = useRef(null);
  const hamburgerRef = useRef(null);
  const drawerRef = useRef(null);
  const [navbarStyle, setNavbarStyle] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = useMemo(() => buildNavLinks(currentUser), [currentUser]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const drawer = drawerRef.current;
    if (!drawer) return undefined;

    const firstLink = drawer.querySelector('a, button');
    firstLink?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen, closeMobileMenu]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const navbar = navbarRef.current;
    if (!navbar) return undefined;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 10;

      if (currentScrollY <= scrollThreshold) {
        navbar.classList.remove('navbar-hidden');
        navbar.removeAttribute('inert');
      } else if (currentScrollY > lastScrollY) {
        navbar.classList.add('navbar-hidden');
        navbar.setAttribute('inert', '');
      } else {
        navbar.classList.remove('navbar-hidden');
        navbar.removeAttribute('inert');
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      boxShadow: [`inset ${sx}px ${sy}px ${depth}px rgba(13, 11, 15, 0.85)`].join(', '),
    });
  };

  const defaultPath = currentUser
    ? currentUser.role === 'admin'
      ? ROUTE_MAP.coordinator
      : ROUTE_MAP.dashboard
    : '/auth/login';

  const renderNavLink = (link, className = 'nav-item') => (
    <NavLink
      key={link.path}
      to={link.path}
      className={({ isActive }) =>
        `${className} ${link.admin ? 'admin-tab' : ''} ${
          isActive || isNavActive(location.pathname, link.path) ? 'active' : ''
        }`
      }
      onClick={closeMobileMenu}
      end
    >
      {link.label}
    </NavLink>
  );

  const initials = currentUser
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

  return (
    <>
      <header
        ref={navbarRef}
        className="navbar-container"
        onMouseMove={handleNavbarMouseMove}
        onMouseLeave={() => setNavbarStyle({})}
        style={navbarStyle}
      >
        <Link
          to={defaultPath}
          className="navbar-brand-block"
          onClick={closeMobileMenu}
          aria-label="Go to home"
        >
          <div className="navbar-logo">
            <img src="/logo.png" alt="" className="navbar-logo-img" width="50" height="50" aria-hidden="true" />
            <img src="/favicon2.png" alt="" className="navbar-logo-img secondary" width="45" height="45" aria-hidden="true" />
          </div>
          <div className="navbar-tagline">
            <span className="navbar-event-name">#100DaysOfCode</span>
            <span className="navbar-motto">Advancing Computing as a Science &amp; Profession</span>
          </div>
        </Link>

        <nav className="navbar-links navbar-links-desktop" aria-label="Main navigation">
          {navLinks.map((link) => renderNavLink(link))}
        </nav>

        <div className="navbar-actions">
          {currentUser && (
            <div className="user-profile-badge navbar-profile-desktop">
              {currentUser.role === 'participant' ? (
                <Link to={ROUTE_MAP.profile} className="profile-link-cluster" aria-label={`Profile for ${currentUser.name}`}>
                  <span className="user-avatar-text" aria-hidden="true">
                    {initials}
                  </span>
                  <span className="user-details">
                    <span className="user-name-text">{currentUser.name}</span>
                    <span className={`user-role-tag ${currentUser.role}`}>
                      Rank #{currentUser.overallRank}
                    </span>
                  </span>
                </Link>
              ) : (
                <>
                  <span className="user-avatar-text" aria-hidden="true">
                    {initials}
                  </span>
                  <span className="user-details">
                    <span className="user-name-text">{currentUser.name}</span>
                    <span className={`user-role-tag ${currentUser.role}`}>Coordinator</span>
                  </span>
                </>
              )}

              <button
                className="logout-btn"
                onClick={logout}
                type="button"
                aria-label="Sign out"
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
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          )}

          <button
            ref={hamburgerRef}
            type="button"
            className={`navbar-hamburger ${mobileMenuOpen ? 'is-open' : ''}`}
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
        </div>
      </header>

      <button
        type="button"
        className={`navbar-mobile-backdrop ${mobileMenuOpen ? 'is-open' : ''}`}
        onClick={closeMobileMenu}
        aria-label="Close menu"
        tabIndex={mobileMenuOpen ? 0 : -1}
      />

      <nav
        ref={drawerRef}
        id="mobile-nav-drawer"
        className={`navbar-mobile-drawer ${mobileMenuOpen ? 'is-open' : ''}`}
        aria-label="Mobile navigation"
        {...(!mobileMenuOpen ? { inert: '' } : {})}
      >
        {currentUser && (
          <div className="navbar-mobile-user">
            <div className="user-avatar-text" aria-hidden="true">
              {initials}
            </div>
            <div className="navbar-mobile-user-info">
              <span className="user-name-text">{currentUser.name}</span>
              <span className={`user-role-tag ${currentUser.role}`}>
                {currentUser.role === 'admin' ? 'Coordinator' : `Rank #${currentUser.overallRank}`}
              </span>
            </div>
          </div>
        )}

        <div className="navbar-mobile-links">
          {navLinks.map((link) => renderNavLink(link, 'nav-item nav-item-mobile'))}
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
