import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LoginForm({
  loginEmail,
  setLoginEmail,
  loginPass,
  setLoginPass,
  isSubmitting,
  onSubmit,
}) {
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h2 className="form-title">Sign In</h2>
      <div className="form-group">
        <label htmlFor="login-email">Email Address</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="e.g. you@student.upes.ac.in…"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <div className="label-row">
          <label htmlFor="login-pass">Password</label>
          <Link to="/auth/reset" className="forgot-btn">
            Forgot Password?
          </Link>
        </div>
        <div className="password-input-wrapper">
          <input
            id="login-pass"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="e.g. ••••••••"
            value={loginPass}
            onChange={(e) => setLoginPass(e.target.value)}
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

      <label className="keep-logged-in" htmlFor="keep-logged-in">
        <input
          id="keep-logged-in"
          type="checkbox"
          checked={keepLoggedIn}
          onChange={(e) => setKeepLoggedIn(e.target.checked)}
        />
        <span className="custom-checkbox" aria-hidden="true" />
        <span>Keep me logged in</span>
      </label>

      <button type="submit" className="auth-action-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign In'}
      </button>
      <p className="form-footer">
        New participant?{' '}
        <Link to="/auth/register" className="auth-toggle-link">
          Create Account
        </Link>
      </p>
    </form>
  );
}
