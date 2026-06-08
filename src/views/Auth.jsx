import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';

export default function Auth({ setActiveView }) {
  const { login, register } = useApp();
  const [authRole, setAuthRole] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);

  const cardRef = useRef(null);
  const [pressStyle, setPressStyle] = useState({});

  const handleCardMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const cx = nx - 0.5;
    const cy = ny - 0.5;
    const sx = (cx * 28).toFixed(1);
    const sy = (cy * 18).toFixed(1);
    const depth = 32;
    const maxTilt = 15;
    const rotateX = -(cy * maxTilt).toFixed(1);
    const rotateY = (cx * maxTilt).toFixed(1);

    setPressStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      background: `
        radial-gradient(
          ellipse 55% 40% at ${(nx * 100).toFixed(1)}% ${(ny * 100).toFixed(1)}%,
          rgba(0,0,0,0.38) 0%,
          rgba(0,0,0,0.10) 55%,
          transparent     100%
        ),
        rgba(18, 19, 88, 0.72)
      `,
      boxShadow: [
        `0 0 0 1px rgba(0, 133, 202, 0.08)`,
        `0 8px 32px rgba(0,0,0,0.55)`,
        `inset ${sx}px ${sy}px ${depth}px rgba(0,0,0,0.45)`,
        `inset ${(-cx * 12).toFixed(1)}px ${(-cy * 8).toFixed(1)}px 12px rgba(255,255,255,0.03)`,
      ].join(', '),
    });
  }, []);

  const handleCardMouseLeave = useCallback(() => setPressStyle({}), []);

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

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail || !loginPass) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    const res = login(loginEmail, loginPass);
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    if (authRole === 'coordinator' && res.user.role !== 'admin') {
      setErrorMsg('Coordinator access only. Please use a coordinator account.');
      return;
    }
    if (authRole === 'participant' && res.user.role === 'admin') {
      setErrorMsg('Please use Login as Coordinator for admin accounts.');
      return;
    }

    setSuccessMsg('Logged in successfully!');
    redirectAfterLogin(res.user);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName || !regEmail || !regPass || !regStudentId || !regGithubId || !regLeetcodeId) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    const res = register(regName, regEmail, regPass, regStudentId, regGithubId, regLeetcodeId);
    if (res.success) {
      setSuccessMsg('Registration completed! Logged in.');
      setTimeout(() => setActiveView('dashboard'), 800);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!resetEmail) {
      setErrorMsg('Please enter your email.');
      return;
    }

    setSuccessMsg('Password reset instructions sent to ' + resetEmail + ' (Simulated).');
    setTimeout(() => {
      setIsReset(false);
      setIsLogin(true);
      setResetEmail('');
      setSuccessMsg('');
    }, 2500);
  };

  const handleQuickLogin = (email, pass, role) => {
    setLoginEmail(email);
    setLoginPass(pass);
    const res = login(email, pass);
    if (res.success) {
      if (role === 'coordinator' && res.user.role !== 'admin') return;
      if (role === 'participant' && res.user.role === 'admin') return;
      setSuccessMsg('Logged in as ' + res.user.name);
      setTimeout(() => {
        setActiveView(res.user.role === 'admin' ? 'coordinator' : 'dashboard');
      }, 500);
    }
  };

  const resetFormState = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsReset(false);
    setIsLogin(true);
  };

  if (!authRole) {
    return (
      <div className="auth-view-container">
        <div className="auth-role-picker">
          <div className="auth-role-header">
            <h1>100 Days of Code</h1>
            <p>Choose how you want to sign in</p>
          </div>
          <div className="auth-role-cards">
            <button
              type="button"
              className="auth-role-card glow-card participant"
              onClick={() => { setAuthRole('participant'); resetFormState(); }}
            >
              <span className="auth-role-icon">👤</span>
              <h2>Login as Participant</h2>
              <p>Join the challenge, submit solutions, and track your streak.</p>
            </button>
            <button
              type="button"
              className="auth-role-card glow-card coordinator"
              onClick={() => { setAuthRole('coordinator'); resetFormState(); setIsLogin(true); }}
            >
              <span className="auth-role-icon">🛡️</span>
              <h2>Login as Coordinator</h2>
              <p>Manage challenges, participants, and weekly progress.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-view-container">
      <div
        className="auth-card-wrapper glow-card"
        ref={cardRef}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        style={pressStyle}
      >
        <button
          type="button"
          className="auth-back-btn"
          onClick={() => { setAuthRole(null); resetFormState(); }}
        >
          ← Back to role selection
        </button>

        <div className="auth-header-logo">
          <span className={`auth-role-badge ${authRole}`}>
            {authRole === 'coordinator' ? 'Coordinator Access' : 'Participant Access'}
          </span>
        </div>

        {errorMsg && <div className="feedback-alert error">{errorMsg}</div>}
        {successMsg && <div className="feedback-alert success">{successMsg}</div>}

        {isReset ? (
          <form className="auth-form" onSubmit={handleResetSubmit}>
            <h2 className="form-title">Reset Password</h2>
            <p className="form-description">Enter your registered email address to receive password reset instructions.</p>
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
            <button type="submit" className="auth-action-btn">Send Reset Link</button>
            <button type="button" className="auth-toggle-link" onClick={() => { setIsReset(false); setIsLogin(true); setErrorMsg(''); }}>
              Back to Login
            </button>
          </form>
        ) : isLogin ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <h2 className="form-title">
              {authRole === 'coordinator' ? 'Coordinator Sign In' : 'Welcome!'}
            </h2>
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                placeholder={authRole === 'coordinator' ? 'admin@acm.org' : 'you@student.upes.ac.in'}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="login-pass">Password</label>
                {authRole === 'participant' && (
                  <button type="button" className="forgot-btn" onClick={() => { setIsReset(true); setErrorMsg(''); }}>
                    Forgot Password?
                  </button>
                )}
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
            <button type="submit" className="auth-action-btn">
              {authRole === 'coordinator' ? 'Enter Coordinator Dashboard' : 'Sign In'}
            </button>
            {authRole === 'participant' && (
              <p className="form-footer">
                New participant?{' '}
                <button type="button" className="auth-toggle-link" onClick={() => { setIsLogin(false); setErrorMsg(''); }}>
                  Create Account
                </button>
              </p>
            )}
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <h2 className="form-title">Join the Challenge</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="reg-name">Full Name</label>
                <input id="reg-name" type="text" placeholder="User" value={regName} onChange={(e) => setRegName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="reg-student">Student SAP ID</label>
                <input id="reg-student" type="text" placeholder="SAP-500092301" value={regStudentId} onChange={(e) => setRegStudentId(e.target.value)} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="reg-email">Email Address</label>
                <input id="reg-email" type="email" placeholder="user@gmail.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="reg-pass">Password</label>
                <input id="reg-pass" type="password" placeholder="••••••••" value={regPass} onChange={(e) => setRegPass(e.target.value)} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="reg-github">GitHub Username</label>
                <input id="reg-github" type="text" placeholder="github-username" value={regGithubId} onChange={(e) => setRegGithubId(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="reg-leetcode">LeetCode Username</label>
                <input id="reg-leetcode" type="text" placeholder="leetcode-username" value={regLeetcodeId} onChange={(e) => setRegLeetcodeId(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="auth-action-btn">Register</button>
            <p className="form-footer">
              Already registered?{' '}
              <button type="button" className="auth-toggle-link" onClick={() => { setIsLogin(true); setErrorMsg(''); }}>
                Sign In
              </button>
            </p>
          </form>
        )}

        <div className="demo-accounts-panel">
          <div className="demo-panel-title">Demo Simulation</div>
          <div className="demo-buttons-row">
            {authRole === 'participant' ? (
              <>
                <button className="demo-btn student" onClick={() => handleQuickLogin('alice@gmail.com', 'password', 'participant')}>Alice</button>
                <button className="demo-btn student" onClick={() => handleQuickLogin('user@gmail.com', 'password', 'participant')}>User</button>
              </>
            ) : (
              <button className="demo-btn admin" onClick={() => handleQuickLogin('admin@acm.org', 'admin', 'coordinator')}>
                Tech Head
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
