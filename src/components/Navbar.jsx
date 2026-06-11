import { useMemo, useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PillNav from './PillNav';

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
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show/hide navbar on scroll
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      // Add glass effect when scrolled
      setIsScrolled(currentScrollY > 20);

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const defaultPath = useMemo(() => {
    return currentUser
      ? currentUser.role === 'admin'
        ? ROUTE_MAP.coordinator
        : ROUTE_MAP.dashboard
      : '/';
  }, [currentUser]);

  const navItems = useMemo(() => {
    const items = [];

    if (currentUser?.role === 'participant') {
      items.push({ href: ROUTE_MAP.dashboard, label: 'Dashboard' });
      items.push({ href: ROUTE_MAP.questions, label: 'Challenges' });
      items.push({ href: ROUTE_MAP.debugging, label: 'Debug' });
      items.push({ href: ROUTE_MAP.profile, label: 'Profile' });
    }

    if (currentUser?.role === 'admin') {
      items.push({ href: ROUTE_MAP.coordinator, label: 'Dashboard' });
    }

    items.push({ href: ROUTE_MAP.leaderboards, label: 'Leaderboard' });

    // Add Logout for logged in users
    if (currentUser) {
      items.push({ href: '/logout', label: 'Logout', action: 'logout' });
    }

    return items;
  }, [currentUser]);

  const handleNavClick = (item) => {
    if (item.action === 'logout' && logout) {
      logout();
    }
  };

  // Determine active href
  const getActiveHref = () => {
    const path = location.pathname;
    if (path === '/dashboard') return ROUTE_MAP.dashboard;
    if (path === '/questions') return ROUTE_MAP.questions;
    if (path === '/debugging') return ROUTE_MAP.debugging;
    if (path === '/profile') return ROUTE_MAP.profile;
    if (path === '/coordinator' || path === '/admin') return ROUTE_MAP.coordinator;
    if (path === '/leaderboards') return ROUTE_MAP.leaderboards;
    return undefined;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
      transition: 'transform 0.3s ease-in-out, background 0.3s ease, backdrop-filter 0.3s ease',
      background: isScrolled ? 'rgba(10, 10, 10, 0.85)' : 'transparent',
      backdropFilter: isScrolled ? 'blur(12px)' : 'none',
      borderBottom: isScrolled ? '1px solid rgba(66, 165, 252, 0.15)' : 'none'
    }}>
      {/* Logo - on the left */}
      <div style={{
        position: 'absolute',
        top: '5px',
        left: '20px',
        zIndex: 100
      }}>
        <Link
          to={defaultPath}
          aria-label="Home"
        >
          <img
            src="/logo.png"
            alt="HDOC Logo"
            style={{
              width: '180px',
              height: '100px',
              objectFit: 'contain'
            }}
          />
        </Link>
      </div>

      {/* Pill Nav - on the right */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 99
      }}>
        <PillNav
          logo="/logo.png"
          logoAlt="HDOC Logo"
          items={navItems}
          activeHref={getActiveHref()}
          baseColor="#0a0a0a"
          pillColor="#42a5fc"
          hoveredPillTextColor="#0a0a0a"
          pillTextColor="#42a5fc"
          initialLoadAnimation={true}
          showLogo={false}
          onItemClick={handleNavClick}
        />
      </div>
    </div>
  );
}