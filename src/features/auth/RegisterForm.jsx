import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RegisterForm({
  regName,
  setRegName,
  regEmail,
  setRegEmail,
  regPass,
  setRegPass,
  regStudentId,
  setRegStudentId,
  regGithubId,
  setRegGithubId,
  regLeetcodeId,
  setRegLeetcodeId,
  isSubmitting,
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h2 className="form-title">Join the Challenge</h2>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="reg-name">Full Name</label>
          <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Jane Doe…"
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="reg-student">Student SAP ID</label>
          <input
                id="reg-student"
                name="student-id"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. 500092301…"
            value={regStudentId}
            onChange={(e) => setRegStudentId(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="reg-email">Email Address</label>
          <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="e.g. you@student.upes.ac.in…"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="reg-pass">Password</label>
          <div className="password-input-wrapper">
            <input
                id="reg-pass"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="e.g. ••••••••…"
            value={regPass}
            onChange={(e) => setRegPass(e.target.value)}
            required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="reg-github">GitHub Username</label>
          <input
                id="reg-github"
                name="github"
                type="text"
                autoComplete="username"
                spellCheck={false}
                placeholder="e.g. github-username…"
            value={regGithubId}
            onChange={(e) => setRegGithubId(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="reg-leetcode">LeetCode Username</label>
          <input
                id="reg-leetcode"
                name="leetcode"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. leetcode-username…"
            value={regLeetcodeId}
            onChange={(e) => setRegLeetcodeId(e.target.value)}
            required
          />
        </div>
      </div>
      <button type="submit" className="auth-action-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Registering…' : 'Register'}
      </button>
      <p className="form-footer">
        Already registered?{' '}
        <Link to="/auth/login" className="auth-toggle-link">
          Sign In
        </Link>
      </p>
    </form>
  );
}
