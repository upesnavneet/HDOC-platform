import { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './ModernNav.css';

const ROUTE_MAP = {
  dashboard: '/dashboard',
  questions: '/questions',
  debugging: '/debugging',
  profile: '/profile',
  coordinator: '/coordinator',
  leaderboards: '/leaderboards',
};

export default function Navbar() {
  const { currentUser, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Morph the pill after scrolling down a bit
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const defaultPath = useMemo(() => {
    return currentUser
      ? currentUser.isAdmin === true
        ? ROUTE_MAP.coordinator
        : ROUTE_MAP.dashboard
      : '/';
  }, [currentUser]);

  const navItems = useMemo(() => {
    const items = [];

    // Logged IN users see the main app features
    if (currentUser) {
      if (currentUser.isAdmin === true) {
        items.push({ href: ROUTE_MAP.coordinator, label: 'Admin Dashboard' });
      } else {
        // Participants or default logged-in users
        items.push({ href: ROUTE_MAP.dashboard, label: 'Dashboard' });
        items.push({ href: ROUTE_MAP.questions, label: 'Challenges' });
        items.push({ href: ROUTE_MAP.debugging, label: 'Debug' });
        items.push({ href: ROUTE_MAP.profile, label: 'Profile' });
      }
    }

    // EVERYONE sees the leaderboard
    items.push({ href: ROUTE_MAP.leaderboards, label: 'Leaderboard' });

    if (currentUser) {
      items.push({ href: '/logout', label: 'Logout', action: 'logout' });
    }

    return items;
  }, [currentUser]);

  const handleNavClick = (e, item) => {
    if (item.action === 'logout' && logout) {
      e.preventDefault();
      logout();
      navigate('/auth/login', { replace: true });
    }
    setIsMobileMenuOpen(false);
  };

  const activeHref = (() => {
    const path = location.pathname;
    if (path === '/dashboard') return ROUTE_MAP.dashboard;
    if (path === '/questions') return ROUTE_MAP.questions;
    if (path === '/debugging') return ROUTE_MAP.debugging;
    if (path === '/profile') return ROUTE_MAP.profile;
    if (path === '/coordinator' || path === '/admin') return ROUTE_MAP.coordinator;
    if (path === '/leaderboards') return ROUTE_MAP.leaderboards;
    return undefined;
  })();

  const isRouterLink = (href) =>
    href &&
    !href.startsWith('http') &&
    !href.startsWith('//') &&
    !href.startsWith('mailto:') &&
    !href.startsWith('#');

  return (
    <>
      <div className={`floating-navbar-container ${isScrolled ? 'scrolled' : ''}`}>
        <div className={`nav-pill ${isMobileMenuOpen ? 'is-hidden' : ''}`}>
          {/* Logo */}
          <Link to={defaultPath} aria-label="Home" className="navbar-logo-link">
            {/* When modal is open, we can optionally change logo color. 
                For now we keep the same logo but use z-index if needed. */}
            <img src="/acm-acmw-white.png" alt="ACM Logo" className="navbar-logo-img" />
            <img
              src="/logo-1.png"
              alt="HDOC Logo"
              className="navbar-logo-img"
              style={{ marginLeft: '0.5rem' }}
            />
          </Link>

          {/* Desktop Inline Links (Hides on Scroll) */}
          <ul className="modern-nav-list" role="menubar">
            {navItems.map((item, i) => (
              <li key={item.href || `item-${i}`} role="none">
                {isRouterLink(item.href) ? (
                  <Link
                    role="menuitem"
                    to={item.href}
                    className={`modern-nav-link ${activeHref === item.href ? 'is-active' : ''}`}
                    onClick={(e) => handleNavClick(e, item)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    role="menuitem"
                    href={item.href}
                    className={`modern-nav-link ${activeHref === item.href ? 'is-active' : ''}`}
                    onClick={(e) => handleNavClick(e, item)}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>

          {/* Morphing Hamburger (Shows on Scroll or Mobile) */}
          <button
            className={`morph-hamburger ${isMobileMenuOpen ? 'modal-open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="morph-hamburger-line" />
            <span className="morph-hamburger-line" />
          </button>
        </div>
      </div>

      {/* Fullscreen Modal Menu (Now a floating card) */}
      <div className={`fullscreen-modal ${isMobileMenuOpen ? 'is-open' : ''}`}>
        <div className="modal-header">
          <img
            src="/acm-acmw-blue.png"
            alt="ACM Logo"
            className="modal-header-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span
            className="modal-header-logo-text"
            style={{ display: 'none', fontWeight: 700, color: '#303841' }}
          >
            100-DOC
          </span>

          <button
            className="modal-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <span className="modal-menu-label">Menu</span>

        <ul className="modal-nav-list">
          {navItems.map((item, i) => (
            <li className="modal-nav-item" key={`modal-${i}`}>
              {isRouterLink(item.href) ? (
                <Link
                  to={item.href}
                  className={`modal-nav-link ${activeHref === item.href ? 'is-active' : ''}`}
                  onClick={(e) => handleNavClick(e, item)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  href={item.href}
                  className={`modal-nav-link ${activeHref === item.href ? 'is-active' : ''}`}
                  onClick={(e) => handleNavClick(e, item)}
                >
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        <div className="modal-footer">
          <div className="footer-block">
            <span className="footer-label">Connect With Us</span>
            <div
              className="social-links"
              style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}
            >
              <a
                href="https://instagram.com/upesacm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="social-link"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#303841"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="social-icon"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/upesacm/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="social-link"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#303841"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="social-icon"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>
          <div
            className="footer-block"
            style={{ alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: '0.2rem' }}
          >
            <a
              href="https://upesacm.org"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link visit-us-link"
            >
              Visit Us
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
