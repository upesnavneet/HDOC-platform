import React from 'react';

export default function AppFooter() {
  return (
    <footer className="footer-container">
      <div className="footer-chapter-links" style={{ gap: '1rem' }}>
        <a href="https://upesacm.org/" target="_blank" rel="noopener noreferrer" className="footer-btn">UPES ACM</a>
        <a href="https://www.upesacmw.org/" target="_blank" rel="noopener noreferrer" className="footer-btn">UPES ACM-W</a>
      </div>
      <p>© 2026 Association for Computing Machinery (ACM) Student Chapter. All Rights Reserved.</p>
      <p>Developed for the 100 Days of Code Chapter Challenge Season.</p>
    </footer>
  );
}
