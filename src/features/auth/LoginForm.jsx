import { Link } from 'react-router-dom';

export default function LoginForm({
  loginEmail,
  setLoginEmail,
  loginPass,
  setLoginPass,
  isSubmitting,
  onSubmit,
}) {
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
        <input
          id="login-pass"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="e.g. ••••••••…"
          value={loginPass}
          onChange={(e) => setLoginPass(e.target.value)}
          required
        />
      </div>
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
