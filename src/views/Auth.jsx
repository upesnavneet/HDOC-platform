import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import TiltCard from '../components/TiltCard';

export default function Auth({ setActiveView }) {
  const { login, register, resetPassword } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regGithubId, setRegGithubId] = useState('');
  const [regLeetcodeId, setRegLeetcodeId] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const redirectAfterLogin = (user) => {
    setTimeout(() => {
      if (user.role === 'admin') {
        setActiveView('coordinator');
      } else {
        setActiveView('dashboard');
      }
    }, 800);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail || !loginPass) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(loginEmail, loginPass);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    setSuccessMsg('Logged in successfully!');
    redirectAfterLogin(res.user);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName || !regEmail || !regPass || !regStudentId || !regGithubId || !regLeetcodeId) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    const res = await register(regName, regEmail, regPass, regStudentId, regGithubId, regLeetcodeId);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Registration completed! Logged in.');
      setTimeout(() => setActiveView('dashboard'), 800);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!resetEmail) {
      setErrorMsg('Please enter your email.');
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword(resetEmail);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Failed to send reset email.');
      return;
    }

    setSuccessMsg(`Password reset link sent to ${resetEmail}.`);
    setTimeout(() => {
      setIsReset(false);
      setIsLogin(true);
      setResetEmail('');
      setSuccessMsg('');
    }, 2500);
  };

  return (
    <div className="auth-view-container">
      <TiltCard className="auth-card-wrapper press-card" maxTilt={12}>
        <div className="auth-header-logo">
          <h1>100 Days of Code</h1>
        </div>

        {errorMsg && <div className="feedback-alert error">{errorMsg}</div>}
        {successMsg && <div className="feedback-alert success">{successMsg}</div>}

        {isReset ? (
          <form className="auth-form" onSubmit={handleResetSubmit}>
            <h2 className="form-title">Reset Password</h2>
            <p className="form-description">
              Enter your registered email address to receive password reset instructions.
            </p>
            <div className="form-group">
              <label htmlFor="reset-email">Email Address</label>
              <input
                id="reset-email"
                type="email"
                placeholder="you@student.upes.ac.in"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-action-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              className="auth-toggle-link"
              onClick={() => { setIsReset(false); setIsLogin(true); setErrorMsg(''); }}
            >
              Back to Login
            </button>
          </form>
        ) : isLogin ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <h2 className="form-title">Sign In</h2>
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@student.upes.ac.in"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="login-pass">Password</label>
                <button
                  type="button"
                  className="forgot-btn"
                  onClick={() => { setIsReset(true); setErrorMsg(''); }}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="login-pass"
                type="password"
                placeholder="••••••••"
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
              <button
                type="button"
                className="auth-toggle-link"
                onClick={() => { setIsLogin(false); setErrorMsg(''); }}
              >
                Create Account
              </button>
            </p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <h2 className="form-title">Join the Challenge</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Your name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-student">Student SAP ID</label>
                <input
                  id="reg-student"
                  type="text"
                  placeholder="SAP-500092301"
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
                  type="email"
                  placeholder="you@student.upes.ac.in"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-pass">Password</label>
                <input
                  id="reg-pass"
                  type="password"
                  placeholder="••••••••"
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
                  type="text"
                  placeholder="github-username"
                  value={regGithubId}
                  onChange={(e) => setRegGithubId(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-leetcode">LeetCode Username</label>
                <input
                  id="reg-leetcode"
                  type="text"
                  placeholder="leetcode-username"
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
              <button
                type="button"
                className="auth-toggle-link"
                onClick={() => { setIsLogin(true); setErrorMsg(''); }}
              >
                Sign In
              </button>
            </p>
          </form>
        )}
      </TiltCard>
    </div>
  );
}
