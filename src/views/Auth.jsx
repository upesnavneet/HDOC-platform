import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';


export default function Auth({ setActiveView }) {
  const { login, register, resetPassword, db } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Sync isLogin with url pathname
  useEffect(() => {
    if (location.pathname === '/register') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [location.pathname]);

  // ── Pressed-in effect ────────────────────────────────────────────────
  const cardRef = useRef(null);
  const [pressStyle, setPressStyle] = useState({});

  const handleCardMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    // Normalised coords: 0 = left/top, 1 = right/bottom
    const nx = (e.clientX - rect.left)  / rect.width;   // 0–1
    const ny = (e.clientY - rect.top)   / rect.height;  // 0–1
    // Offset from centre: -0.5 to +0.5
    const cx = nx - 0.5;
    const cy = ny - 0.5;
    // Inset shadow shifts opposite to cursor (shadow "follows" the depression)
    const sx = (cx * 28).toFixed(1);   // px  left/right
    const sy = (cy * 18).toFixed(1);   // px  up/down
    const depth = 32;

    const maxTilt = 6; // maximum tilt in degrees
    const rotateX = -(cy * maxTilt).toFixed(1);
    const rotateY = (cx * maxTilt).toFixed(1);

    setPressStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      background: `
        radial-gradient(
          ellipse 55% 40% at ${(nx*100).toFixed(1)}% ${(ny*100).toFixed(1)}%,
          rgba(0,0,0,0.38) 0%,
          rgba(0,0,0,0.10) 55%,
          transparent     100%
        ),
        rgba(35, 47, 114, 0.72)
      `,
      boxShadow: [
        `0 0 0 1px rgba(54, 173, 163, 0.08)`,
        `0 8px 32px rgba(0,0,0,0.55)`,
        `inset ${sx}px ${sy}px ${depth}px rgba(0,0,0,0.45)`,
        `inset ${(-cx*12).toFixed(1)}px ${(-cy*8).toFixed(1)}px 12px rgba(255,255,255,0.03)`,
      ].join(', '),
    });
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    setPressStyle({});
  }, []);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regGithubId, setRegGithubId] = useState('');
  const [regLeetcodeId, setRegLeetcodeId] = useState('');

  // Reset fields
  const [resetEmail, setResetEmail] = useState('');

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail || !loginPass) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    const res = await login(loginEmail, loginPass);
    if (res.success) {
      setSuccessMsg('Logged in successfully!');
      setTimeout(() => {
        if (res.user.role === 'admin') {
          setActiveView('admin');
        } else {
          setActiveView('dashboard');
        }
      }, 800);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName || !regEmail || !regPass || !regStudentId || !regGithubId || !regLeetcodeId) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    const res = await register(regName, regEmail, regPass, regStudentId, regGithubId, regLeetcodeId);
    if (res.success) {
      setSuccessMsg('Registration completed! Logged in.');
      setTimeout(() => {
        setActiveView('dashboard');
      }, 800);
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

    const res = await resetPassword(resetEmail);
    if (res.success) {
      setSuccessMsg('Password reset instructions sent to ' + resetEmail + '.');
      setTimeout(() => {
        setIsReset(false);
        setIsLogin(true);
        setResetEmail('');
        setSuccessMsg('');
      }, 2500);
    } else {
      setErrorMsg(res.message);
    }
  };



  return (
    <div className="auth-view-container">
      <div
        className="auth-card-wrapper"
        ref={cardRef}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        style={pressStyle}
      >
        <div className="auth-header-logo">
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
            <button type="button" className="auth-toggle-link" onClick={() => { setIsReset(false); navigate('/login'); setErrorMsg(''); }}>
              Back to Login
            </button>
          </form>
        ) : isLogin ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <h2 className="form-title">Welcome!</h2>
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
                <button type="button" className="forgot-btn" onClick={() => { setIsReset(true); setErrorMsg(''); }}>Forgot Password?</button>
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
            <button type="submit" className="auth-action-btn">Sign In</button>
            <p className="form-footer">
              New participant?{' '}
              <button type="button" className="auth-toggle-link" onClick={() => { navigate('/register'); setErrorMsg(''); }}>
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
                  placeholder="User"
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
                  placeholder="user@gmail.com"
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

            <button type="submit" className="auth-action-btn">Register</button>
            <p className="form-footer">
              Already registered?{' '}
              <button type="button" className="auth-toggle-link" onClick={() => { navigate('/login'); setErrorMsg(''); }}>
                Sign In
              </button>
            </p>
          </form>
        )}


      </div>
    </div>
  );
}
