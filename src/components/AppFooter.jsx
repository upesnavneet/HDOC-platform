import React from 'react';

export default function AppFooter() {
  return (
    <footer className="footer-container">
      <div className="footer-dashes" style={{
        borderTop: '2px dashed rgba(66, 165, 252, 0.3)',
        marginBottom: '0.5rem',
        paddingTop: '0.5rem'
      }} />

      <div className="footer-chapter-links" style={{ gap: '2rem', marginBottom: '0.35rem' }}>
        <a href="https://upesacm.org/" target="_blank" rel="noopener noreferrer" className="footer-btn">UPES ACM</a>
        <a href="https://www.upesacmw.org/" target="_blank" rel="noopener noreferrer" className="footer-btn">UPES ACM-W</a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.35rem' }}>
        <a
          href="https://github.com/upesacm"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #2a2a2a',
            textDecoration: 'none',
            color: 'inherit'
          }}
          title="GitHub"
        >
          <svg height="18" width="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/company/upesacm/posts/?feedView=all"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #2a2a2a',
            textDecoration: 'none',
            color: 'inherit'
          }}
          title="LinkedIn"
        >
          <svg height="18" width="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        </a>
      </div>

      <p>© 2026 Association for Computing Machinery (ACM) Student Chapter. All Rights Reserved.</p>
      <p>Developed for the 100 Days of Code Chapter Challenge Season.</p>
    </footer>
  );
}