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
          <input
                id="reg-pass"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="e.g. ••••••••…"
            value={regPass}
            onChange={(e) => setRegPass(e.target.value)}
            required
          />
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
