import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import StreakGrid from '../components/StreakGrid';
import { formatSimulatedDate } from '../context/db';
import { useTiltCard } from '../hooks/useTiltCard';

// ── Tiltable card wrapper ──────────────────────────────────────────────────
function TiltCard({ className, children, maxTilt = 8 }) {
  const { ref, style, onMouseMove, onMouseLeave } = useTiltCard(maxTilt);
  return (
    <div
      ref={ref}
      className={className}
      style={style}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

export default function Dashboard({ setActiveView }) {
  const { db, currentUser, submitQuestionCode } = useApp();
  if (!currentUser) {
    return <div className="loading">Loading...</div>;
  }
  const [timeLeft, setTimeLeft] = useState('');

  // Form states
  const [lcLanguage, setLcLanguage] = useState('cpp');
  const [lcCode, setLcCode] = useState('');
  const [customLanguage, setCustomLanguage] = useState('cpp');
  const [customCode, setCustomCode] = useState('');

  // Submit feedback
  const [msgLc, setMsgLc] = useState('');
  const [msgCustom, setMsgCustom] = useState('');

  const currentDay = db.currentDay;
  const questions = db.questions;
  const submissions = db.submissions;

  // Filter user submissions
  const userSubs = submissions.filter(s => s.userId === currentUser.id);

  // Today's questions
  const todayQs = questions.filter(q => q.day === currentDay);
  const todayLcQ = todayQs.find(q => q.linkLc && q.titleLc);
  const todayCustomQ = todayQs.find(q => q.titleCustom && q.descCustom);

  // Check if today's questions are submitted
  const todayLcSub = userSubs.find(s => s.day === currentDay && s.type === 'leetcode');
  const todayCustomSub = userSubs.find(s => s.day === currentDay && s.type === 'custom');

  // Pre-populate forms if edit/already submitted
  useEffect(() => {
    if (todayLcSub) {
      setLcLanguage(todayLcSub.language || 'cpp');
      setLcCode(todayLcSub.code || '');
    } else {
      setLcLanguage('cpp');
      setLcCode('');
    }
    if (todayCustomSub) {
      setCustomLanguage(todayCustomSub.language || 'cpp');
      setCustomCode(todayCustomSub.code || '');
    } else {
      setCustomLanguage('cpp');
      setCustomCode('');
    }
  }, [todayLcSub, todayCustomSub, currentDay]);

  // Compute deadline countdown based on simulated system date
  useEffect(() => {
    const updateCountdown = () => {
      const simTime = new Date(db.simulatedTime);
      
      // Midnight of the current day in simulated time (deadline)
      const startDate = new Date('2026-05-25T00:00:00');
      const deadline = new Date(startDate.getTime() + currentDay * 24 * 60 * 60 * 1000);
      
      const diff = deadline - simTime;
      if (diff <= 0) {
        setTimeLeft('Deadline Passed');
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [db.simulatedTime, currentDay]);

  const handleLcSubmit = (e) => {
    e.preventDefault();
    setMsgLc('');
    if (!lcCode.trim()) {
      setMsgLc('Solution code is required.');
      return;
    }
    const res = submitQuestionCode(currentDay, 'leetcode', lcCode, lcLanguage);
    if (res.success) {
      setMsgLc(`Successfully submitted (${res.status})!`);
    } else {
      setMsgLc(`Error: ${res.message}`);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    setMsgCustom('');
    if (!customCode.trim()) {
      setMsgCustom('Solution code is required.');
      return;
    }
    const res = submitQuestionCode(currentDay, 'custom', customCode, customLanguage);
    if (res.success) {
      setMsgCustom(`Successfully submitted (${res.status})!`);
    } else {
      setMsgCustom(`Error: ${res.message}`);
    }
  };

  // Find rank preview
  const codingRank = db.users
    .filter(u => u.role === 'participant')
    .sort((a, b) => b.totalCodingScore - a.totalCodingScore)
    .findIndex(u => u.id === currentUser.id) + 1;

  const debugRank = db.users
    .filter(u => u.role === 'participant')
    .sort((a, b) => b.totalDebuggingScore - a.totalDebuggingScore)
    .findIndex(u => u.id === currentUser.id) + 1;

  const overallRank = currentUser.overallRank;

  // Tilt for the streak grid wrapper
  const streakTilt = useTiltCard(5);

  return (
    <div className="dashboard-container">
      {/* Simulation Info Bar */}
      <div className="simulation-time-bar">
        <span>Simulated System Date: <strong>{formatSimulatedDate(db.simulatedTime)}</strong></span>
        <span>Challenge Day: <strong>Day {currentDay} / 100</strong></span>
      </div>

      {/* Overview stats panel */}
      <section className="overview-stats-section">
        <TiltCard className="stat-card primary" maxTilt={7}>
          <div className="stat-label">Event Progress</div>
          <div className="stat-value">Day {currentDay} <span className="stat-total">/ 100</span></div>
          <div className="stat-progress-bar-wrapper">
            <div className="stat-progress-bar" style={{ width: `${currentDay}%` }}></div>
          </div>
          <span className="stat-footnote">June 2026 Season</span>
        </TiltCard>

        <TiltCard className="stat-card" maxTilt={7}>
          <div className="stat-label">LeetCode Streak</div>
          <div className="stat-value-row">
            <span className="stat-value">{currentUser.leetCodeStreak}</span>
            <span className="stat-icon-flame">Days</span>
          </div>
          {currentUser.leetCodeStreak === 0 && (
            <span className="stat-status-alert error">Streak Broken! Solve today's question.</span>
          )}
          {currentUser.leetCodeStreak > 0 && (
            <span className="stat-status-alert success">Active LeetCode Streak</span>
          )}
          <span className="stat-footnote">Manually updated by admin</span>
        </TiltCard>

        <TiltCard className="stat-card" maxTilt={7}>
          <div className="stat-label">GitHub Push Streak</div>
          <div className="stat-value-row">
            <span className="stat-value">{currentUser.gitHubStreak}</span>
            <span className="stat-icon-github">Days</span>
          </div>
          {currentUser.gitHubStreak === 0 && (
            <span className="stat-status-alert error">No active pushes tracked!</span>
          )}
          {currentUser.gitHubStreak > 0 && (
            <span className="stat-status-alert success">Contributions matching daily submissions</span>
          )}
          <span className="stat-footnote">Calculated from solutions</span>
        </TiltCard>

        <TiltCard className="stat-card ranking" maxTilt={7}>
          <div className="stat-label">Overall Standing</div>
          <div className="stat-value">#{overallRank}</div>
          <div className="ranks-sub-row">
            <span>Coding: #{codingRank}</span>
            <span>•</span>
            <span>Debug: #{debugRank}</span>
          </div>
          <span className="stat-link" onClick={() => setActiveView('leaderboards')}>View Leaderboards &rarr;</span>
        </TiltCard>
      </section>

      {/* Main 100 Days calendar board */}
      <section className="calendar-grid-section">
        <StreakGrid
          currentDay={currentDay}
          submissions={userSubs}
          questions={questions}
          tiltProps={{
            ref: streakTilt.ref,
            style: streakTilt.style,
            onMouseMove: streakTilt.onMouseMove,
            onMouseLeave: streakTilt.onMouseLeave,
          }}
        />
      </section>

      {/* Today's Coding Challenges Section */}
      <section className="todays-challenges-section">
        <div className="section-header-row">
          <h2>Today's Challenges — Day {currentDay}</h2>
          <div className={`countdown-timer ${timeLeft === 'Deadline Passed' ? 'expired' : ''}`}>
            Submission Window closes in: <strong>{timeLeft}</strong>
          </div>
        </div>

        <div className="challenge-cards-grid">
          {/* Challenge 1: LeetCode */}
          <TiltCard className="challenge-card" maxTilt={6}>
            <div className="card-top-tag leetcode">LeetCode Challenge</div>
            {todayLcQ ? (
              <div className="challenge-details">
                <h3 className="challenge-title">{todayLcQ.titleLc}</h3>
                <p className="challenge-desc">{todayLcQ.descLc}</p>
                <div className="challenge-meta">
                  <span className="difficulty-tag easy">{todayLcQ.difficulty}</span>
                  <a href={todayLcQ.linkLc} target="_blank" rel="noreferrer" className="external-problem-link">
                    Open LeetCode Page &nearr;
                  </a>
                </div>

                <form className="submission-sub-form" onSubmit={handleLcSubmit}>
                  <div className="input-group">
                    <label htmlFor="lc-lang">Select Programming Language</label>
                    <select
                      id="lc-lang"
                      className="language-select"
                      value={lcLanguage}
                      onChange={(e) => setLcLanguage(e.target.value)}
                    >
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label htmlFor="lc-code">Write your code here</label>
                    <textarea 
                      id="lc-code"
                      className="code-editor-textarea"
                      placeholder="// Write or paste your LeetCode solution here..." 
                      value={lcCode}
                      onChange={(e) => setLcCode(e.target.value)}
                      required 
                      rows="8"
                    />
                  </div>
                  <button type="submit" className="submit-challenge-btn">
                    {todayLcSub ? 'Update Submission' : 'Submit Solution'}
                  </button>
                  {msgLc && <div className="sub-msg-alert">{msgLc}</div>}
                </form>

                {todayLcSub && (
                  <div className="grading-feedback-box">
                    <span className="label">Submission Status:</span>
                    <span className={`badge-status ${todayLcSub.status.toLowerCase()}`}>{todayLcSub.status}</span>
                    {todayLcSub.marks !== null ? (
                      <div className="grade-result">
                        <span><strong>Score:</strong> {todayLcSub.marks} / 10</span>
                        {todayLcSub.comments && <p className="comment">"{todayLcSub.comments}"</p>}
                      </div>
                    ) : (
                      <div className="grade-result pending">Pending admin manual grading</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-challenge-placeholder">No LeetCode challenge uploaded for today yet.</div>
            )}
          </TiltCard>

          {/* Challenge 2: Custom DSA */}
          <TiltCard className="challenge-card" maxTilt={6}>
            <div className="card-top-tag custom-dsa">Custom DSA Challenge</div>
            {todayCustomQ ? (
              <div className="challenge-details">
                <h3 className="challenge-title">{todayCustomQ.titleCustom}</h3>
                <p className="challenge-desc">{todayCustomQ.descCustom}</p>
                <div className="challenge-meta">
                  <span className="difficulty-tag medium">Medium</span>
                  <span className="author-tag">By Technical Head</span>
                </div>

                <form className="submission-sub-form" onSubmit={handleCustomSubmit}>
                  <div className="input-group">
                    <label htmlFor="custom-lang">Select Programming Language</label>
                    <select
                      id="custom-lang"
                      className="language-select"
                      value={customLanguage}
                      onChange={(e) => setCustomLanguage(e.target.value)}
                    >
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label htmlFor="custom-code">Write your code here</label>
                    <textarea 
                      id="custom-code"
                      className="code-editor-textarea"
                      placeholder="// Write or paste your Custom DSA solution here..." 
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      required 
                      rows="8"
                    />
                  </div>
                  <button type="submit" className="submit-challenge-btn">
                    {todayCustomSub ? 'Update Submission' : 'Submit Solution'}
                  </button>
                  {msgCustom && <div className="sub-msg-alert">{msgCustom}</div>}
                </form>

                {todayCustomSub && (
                  <div className="grading-feedback-box">
                    <span className="label">Submission Status:</span>
                    <span className={`badge-status ${todayCustomSub.status.toLowerCase()}`}>{todayCustomSub.status}</span>
                    {todayCustomSub.marks !== null ? (
                      <div className="grade-result">
                        <span><strong>Score:</strong> {todayCustomSub.marks} / 10</span>
                        {todayCustomSub.comments && <p className="comment">"{todayCustomSub.comments}"</p>}
                      </div>
                    ) : (
                      <div className="grade-result pending">Pending admin manual grading</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-challenge-placeholder">No custom challenge uploaded for today yet.</div>
            )}
          </TiltCard>
        </div>
      </section>
    </div>
  );
}
