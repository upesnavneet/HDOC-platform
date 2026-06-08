import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatEventDate } from '../utils/dateFormat';
import { useTiltCard } from '../hooks/useTiltCard';

function TiltCard({ className, style: extraStyle, children, maxTilt = 7, ...rest }) {
  const { ref, style, onMouseMove, onMouseLeave } = useTiltCard(maxTilt);
  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, ...extraStyle }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      {...rest}
    >
      {children}
    </div>
  );
}

const getCurrentWeek = (currentDay) => {
  const day = Number(currentDay);
  if (!Number.isFinite(day) || day < 1) return 1;
  return Math.ceil(day / 7);
};

export default function Debugging() {
  const { db, currentUser, submitDebuggingChallenge } = useApp();
  const [gitLink, setGitLink] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');
  const [countdown, setCountdown] = useState('');
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [timeStatus, setTimeStatus] = useState('closed');
  const [activeChallenge, setActiveChallenge] = useState(null);

  const userId = currentUser?.uid || currentUser?.id;
  const currentWeek = getCurrentWeek(db.currentDay);

  useEffect(() => {
    const checkChallengeWindow = () => {
      const now = new Date(db.simulatedTime);
      const match = db.debuggingChallenges.find((c) => c.week === currentWeek);

      if (match) {
        setActiveChallenge(match);
        const pubTime = new Date(match.publishedDate);

        if (now >= pubTime) {
          setIsChallengeOpen(true);
          setTimeStatus('open');
          setCountdown('Challenge Active');
        } else {
          setIsChallengeOpen(false);
          setTimeStatus('upcoming');
          const diff = pubTime - now;
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setCountdown(`Starts in ${h}h ${m}m`);
        }
      } else {
        setActiveChallenge(null);
        setIsChallengeOpen(false);
        setTimeStatus('closed');

        const nextWeek = currentWeek + 1;
        const nextChallenge = db.debuggingChallenges.find((c) => c.week === nextWeek);
        if (nextChallenge) {
          const pubTime = new Date(nextChallenge.publishedDate);
          const diff = pubTime - now;
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          setCountdown(`Week ${nextWeek} challenge in ${d} days, ${h} hours (Sunday 21:00)`);
        } else {
          setCountdown('No upcoming debugging challenge scheduled.');
        }
      }
    };

    checkChallengeWindow();
    const interval = setInterval(checkChallengeWindow, 1000);
    return () => clearInterval(interval);
  }, [db.simulatedTime, db.debuggingChallenges, currentWeek]);

  const pastChallenges = db.debuggingChallenges.filter((c) => c.week < currentWeek);

  const handleSub = async (e) => {
    e.preventDefault();
    setSubmitMsg('');
    if (!gitLink) {
      setSubmitMsg('GitHub Repository Push link is required.');
      return;
    }
    if (!activeChallenge) {
      setSubmitMsg('No active debugging challenge for this week.');
      return;
    }
    const res = await submitDebuggingChallenge(activeChallenge.id, gitLink);
    if (res.success) {
      setSubmitMsg(res.message);
    } else {
      setSubmitMsg(`Error: ${res.message}`);
    }
  };

  const activeChallengeSub = activeChallenge?.submissions?.find((s) => s.userId === userId);

  useEffect(() => {
    if (activeChallengeSub) {
      setGitLink(activeChallengeSub.link || '');
    } else {
      setGitLink('');
    }
  }, [activeChallengeSub, activeChallenge]);

  return (
    <div className="debugging-container">
      <div className="event-time-bar">
        <span>Event Date: <strong>{formatEventDate(db.simulatedTime)}</strong></span>
        <span>Challenge Day: <strong>Day {db.currentDay} / 100</strong></span>
      </div>

      <div className="page-header">
        <h1>Weekly Debugging Challenges</h1>
        <p className="subtitle">Every Sunday 21:00 hrs. Debug on-the-fly under a timed window.</p>
      </div>

      <TiltCard
        className={`active-debug-card ${isChallengeOpen ? 'open-challenge' : ''}`}
        maxTilt={6}
      >
        <div className="card-top-tag">
          {timeStatus === 'open' && <span className="pulse-dot"></span>}
          {timeStatus === 'open' ? 'Challenge Active Now' : timeStatus === 'upcoming' ? 'Challenge Starting Tonight' : 'Weekly Live Debugging'}
        </div>

        {timeStatus === 'open' && activeChallenge ? (
          <div className="challenge-open-workspace">
            <div className="workspace-header">
              <div className="theme-info">
                <span className="week-label">Week {activeChallenge.week} Sunday Special</span>
                <h2>Theme: {activeChallenge.theme}</h2>
              </div>
              <div className="timer-badge">{countdown}</div>
            </div>

            <div className="workspace-body">
              <div className="instructions-col">
                <h3>Problem Description</h3>
                <p>{activeChallenge.description}</p>
                <div className="alert-notice">
                  <strong>Requirements:</strong> Copy the starter code, fix all logical/index/memory bugs, push it to your designated GitHub repository, and submit the link below.
                </div>

                <form className="debugging-sub-form" onSubmit={handleSub}>
                  <div className="input-group">
                    <label htmlFor="git-debug-link">Your Fixed Code GitHub Link</label>
                    <input
                      id="git-debug-link"
                      type="url"
                      placeholder="https://github.com/username/repo/blob/..."
                      value={gitLink}
                      onChange={(e) => setGitLink(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-challenge-btn">
                    {activeChallengeSub ? 'Update Debug Submission' : 'Submit Debug Code'}
                  </button>
                  {submitMsg && <div className="sub-msg-alert">{submitMsg}</div>}
                </form>

                {activeChallengeSub && (
                  <div className="grading-feedback-box">
                    <span className="label">Submission Status: </span>
                    <span className="badge-status submitted">Submitted</span>
                    {activeChallengeSub.score !== null && activeChallengeSub.score !== undefined ? (
                      <div className="grade-result">
                        <strong>Score Awarded:</strong> {activeChallengeSub.score} / 20
                      </div>
                    ) : (
                      <div className="grade-result pending">Pending manual grading evaluation by Technical Head</div>
                    )}
                  </div>
                )}
              </div>

              <div className="code-editor-col">
                <div className="editor-tab">starter_code.cpp (Read-Only)</div>
                <pre className="editor-block">
                  <code>{activeChallenge.starterCode}</code>
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="challenge-closed-state">
            <div className="lock-illustration" style={{ fontSize: '1.5rem', fontWeight: 'bold', border: '1px solid var(--border-subtle)', padding: '0.5rem 1rem', borderRadius: '4px', background: 'var(--bg-panel)' }}>Locked</div>
            {timeStatus === 'upcoming' && activeChallenge ? (
              <>
                <h2 style={{ marginTop: '1rem' }}>Week {activeChallenge.week} Challenge: {activeChallenge.theme}</h2>
                <p className="upcoming-note">The Sunday Debugging challenge is scheduled to publish at 21:00 hrs tonight.</p>
                <div className="timer-badge large">{countdown}</div>
              </>
            ) : (
              <>
                <h2 style={{ marginTop: '1rem' }}>Debugging Challenge is Offline</h2>
                <p className="timer-text">{countdown}</p>
                <div className="info-rules-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <TiltCard className="rule-card" maxTilt={9}>
                    <span className="number">01</span>
                    <h4>Sundays Release</h4>
                    <p>Held weekly. Starts at 21:00 every Sunday. Requires fast reasoning and syntax diagnostic skills.</p>
                  </TiltCard>
                  <TiltCard className="rule-card" maxTilt={9}>
                    <span className="number">02</span>
                    <h4>GitHub Submissions</h4>
                    <p>Submit your bug-fixed repo link. Graded manually out of 20 points.</p>
                  </TiltCard>
                </div>
              </>
            )}
          </div>
        )}
      </TiltCard>

      <div className="past-debugs-section">
        <h2>Past Debugging Challenges History</h2>
        <div className="past-challenges-list">
          {pastChallenges.length === 0 ? (
            <div className="no-past-challenges">No past debugging challenges have concluded yet.</div>
          ) : (
            pastChallenges.map((c) => {
              const mySub = c.submissions?.find((s) => s.userId === userId);
              return (
                <TiltCard key={c.id} className="past-challenge-row" maxTilt={5}>
                  <div className="info">
                    <span className="week-tag">Week {c.week}</span>
                    <div className="details">
                      <h4>Theme: {c.theme}</h4>
                      <span className="date">Concluded on: {new Date(c.publishedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="submission-outcome">
                    {mySub ? (
                      <div className="outcome-success">
                        <span className="label">Sub Link: </span>
                        <a href={mySub.link} target="_blank" rel="noreferrer" className="repo-link">View Repo</a>
                        <span className="score-tag">
                          {mySub.score !== null && mySub.score !== undefined ? `Score: ${mySub.score}/20` : 'Pending Score'}
                        </span>
                      </div>
                    ) : (
                      <span className="outcome-missed">No submission (Missed)</span>
                    )}
                  </div>
                </TiltCard>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
