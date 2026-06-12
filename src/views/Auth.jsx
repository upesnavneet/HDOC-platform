import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AuthLayout from '../features/auth/AuthLayout';
import LoginForm from '../features/auth/LoginForm';
import RegisterForm from '../features/auth/RegisterForm';
import ResetForm from '../features/auth/ResetForm';

export default function Auth() {
  const { mode = 'login' } = useParams();
  const navigate = useNavigate();
  const { login, register, resetPassword } = useApp();
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
      navigate(user.isAdmin ? '/coordinator' : '/dashboard', { replace: true });
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
      setTimeout(() => navigate('/dashboard', { replace: true }), 800);
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
      navigate('/auth/login', { replace: true });
      setResetEmail('');
      setSuccessMsg('');
    }, 2500);
  };

  const alerts = (
    <>
      {errorMsg && (
        <div className="feedback-alert error" role="alert">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="feedback-alert success" role="status" aria-live="polite">
          {successMsg}
        </div>
      )}
    </>
  );

  return (
    <AuthLayout mode={mode} alerts={alerts}>
      {mode === 'reset' && (
        <ResetForm
          resetEmail={resetEmail}
          setResetEmail={setResetEmail}
          isSubmitting={isSubmitting}
          onSubmit={handleResetSubmit}
        />
      )}
      {mode === 'login' && (
        <LoginForm
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPass={loginPass}
          setLoginPass={setLoginPass}
          isSubmitting={isSubmitting}
          onSubmit={handleLoginSubmit}
        />
      )}
      {mode === 'register' && (
        <RegisterForm
          regName={regName}
          setRegName={setRegName}
          regEmail={regEmail}
          setRegEmail={setRegEmail}
          regPass={regPass}
          setRegPass={setRegPass}
          regStudentId={regStudentId}
          setRegStudentId={setRegStudentId}
          regGithubId={regGithubId}
          setRegGithubId={setRegGithubId}
          regLeetcodeId={regLeetcodeId}
          setRegLeetcodeId={setRegLeetcodeId}
          isSubmitting={isSubmitting}
          onSubmit={handleRegisterSubmit}
        />
      )}
      {mode !== 'login' && mode !== 'register' && mode !== 'reset' && (
        <LoginForm
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPass={loginPass}
          setLoginPass={setLoginPass}
          isSubmitting={isSubmitting}
          onSubmit={handleLoginSubmit}
        />
      )}
    </AuthLayout>
  );
}
