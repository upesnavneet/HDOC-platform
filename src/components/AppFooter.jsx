import React from 'react';
import { Link } from 'react-router-dom';
import './AppFooter.css';

export default function AppFooter() {
  return (
    <footer className="editorial-footer">
      <div className="editorial-footer-grid">
        {/* ================= LEFT COLUMN ================= */}
        <div className="footer-left">
          <div>
            <div className="footer-brand">
              <img src="/acm-acmw-white.png" alt="ACM Logo" className="footer-brand-logo" />
              <img src="/logo-1.png" alt="HDOC Logo" className="footer-brand-logo" />
            </div>
            
            <p className="footer-description">
              The 100 Days of Code platform empowers students to build consistent coding habits, 
              tackle daily challenges, and rise through the leaderboards. Designed by the 
              Association for Computing Machinery to cultivate technical excellence and 
              build a thriving developer community.
            </p>
          </div>

          <div className="footer-socials">
            <a href="https://instagram.com/upesacm" target="_blank" rel="noopener noreferrer" className="social-link-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              @upesacm
            </a>
            <a href="https://www.linkedin.com/company/upesacm/" target="_blank" rel="noopener noreferrer" className="social-link-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
              upesacm
            </a>
            <a href="https://github.com/upesacm" target="_blank" rel="noopener noreferrer" className="social-link-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              upesacm
            </a>
          </div>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="footer-right">
          <div className="footer-massive-links">
            <Link to="/dashboard" className="massive-link">Dashboard</Link>
            <Link to="/questions" className="massive-link">Challenges</Link>
            <Link to="/debugging" className="massive-link">Debug</Link>
            <Link to="/leaderboards" className="massive-link">Leaderboard</Link>
            <Link to="/profile" className="massive-link">Profile</Link>
            <a href="mailto:acmwupes@gmail.com" className="massive-link">Contact</a>
          </div>

          <div className="footer-sublinks-grid">
            <div className="sublinks-column">
              <a href="https://upesacm.org/" target="_blank" rel="noopener noreferrer" className="sublink-item">UPES ACM</a>
              <a href="https://www.upesacmw.org/" target="_blank" rel="noopener noreferrer" className="sublink-item">UPES ACM-W</a>
              <a href="https://hdoc-platform.netlify.app" target="_blank" rel="noopener noreferrer" className="sublink-item">100DOC Platform</a>
            </div>
            <div className="sublinks-column">
              <a href="mailto:acmwupes@gmail.com" className="sublink-item">Support</a>
              <a href="#" className="sublink-item">Join Discord</a>
              <a href="#" className="sublink-item">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <span>© 2026 Association for Computing Machinery (ACM) Student Chapter.</span>
        <span>Developed for the 100 Days of Code Chapter Challenge Season.</span>
      </div>
    </footer>
  );
}