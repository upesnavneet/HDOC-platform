import { Link } from 'react-router-dom';
import './AppFooter.css';

export default function AppFooter() {
  return (
    <footer className="traditional-footer">
      <div className="traditional-footer-content">
        <div className="footer-brand-small">
          <img src="/acm-acmw-white.png" alt="ACM Logo" className="footer-small-logo" />
          <img src="/logo-1.png" alt="HDOC Logo" className="footer-small-logo" />
          <span className="footer-copyright">
            © {new Date().getFullYear()} UPES ACM. All rights reserved.
          </span>
        </div>

        <div className="footer-links-small">
          <Link to="/leaderboards" className="small-link">
            Leaderboard
          </Link>
          <a
            href="https://upesacm.org"
            target="_blank"
            rel="noopener noreferrer"
            className="small-link"
          >
            Visit Us
          </a>
          <div className="footer-divider"></div>
          <a
            href="https://instagram.com/upesacm"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="small-social"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
            className="small-social"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
