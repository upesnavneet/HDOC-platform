import { Link } from 'react-router-dom';

export default function ResetForm({ resetEmail, setResetEmail, isSubmitting, onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h2 className="form-title">Reset Password</h2>
      <p className="form-description">
        Enter your registered email address to receive password reset instructions.
      </p>
      <div className="form-group">
        <label htmlFor="reset-email">Email Address</label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="e.g. you@student.upes.ac.in…"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="auth-action-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send Reset Link'}
      </button>
      <Link to="/auth/login" className="auth-toggle-link">
        Back to Login
      </Link>
    </form>
  );
}
