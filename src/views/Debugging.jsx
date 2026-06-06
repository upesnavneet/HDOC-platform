import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatSimulatedDate } from '../context/db';
import { useTiltCard } from '../hooks/useTiltCard';

// ── Reusable tilt wrapper ──────────────────────────────────────────────────
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

export default function Debugging() {
  const { db, currentUser, submitDebuggingChallenge } = useApp();
  const [gitLink, setGitLink] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');
  const [countdown, setCountdown] = useState('');

  // Status variables
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [timeStatus, setTimeStatus] = useState('closed'); // 'upcoming', 'open', 'ended'
  const [activeChallenge, setActiveChallenge] = useState(null);

  const simTime = new Date(db.simulatedTime);
  const isSunday = simTime.getDay() === 0;
  const currentHour = simTime.getHours();
  const currentMinute = simTime.getMinutes();

  // Find the challenge for the current simulated week or the closest upcoming/current Sunday
  // Week 1 was 24th May, Week 2 was 31st May, Week 3 is 7th June.
  // We can match based on the date of the challenge
  useEffect(() => {
    const checkChallengeWindow = () => {
      const now = new Date(db.simulatedTime);
      
      // Find the Sunday of the current simulated week
      const currentSundayDateStr = getSundayOfDate(now).toISOString().split('T')[0];
      
      const match = db.debuggingChallenges.find(c => {
        const cDateStr = new Date(c.publishedDate).toISOString().split('T')[0];
        return cDateStr === currentSundayDateStr;
      });

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
        // No challenge found for this Sunday, or it's a weekday
        setIsChallengeOpen(false);
        setTimeStatus('closed');
        
        // Find next Sunday
        const nextSun = getNextSunday(now);
        nextSun.setHours(21, 0, 0, 0);
        const diff = nextSun - now;
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setCountdown(`Next challenge in ${d} days, ${h} hours (Sunday 21:00)`);
      }
    };

    checkChallengeWindow();
    const interval = setInterval(checkChallengeWindow, 1000);
    return () => clearInterval(interval);
  }, [db.simulatedTime, db.debuggingChallenges]);

  // Find Sunday of the current date's week
  const getSundayOfDate = (date) => {
    const copy = new Date(date);
    const day = copy.getDay();
    const diff = copy.getDate() - day; // adjust back to Sunday
    return new Date(copy.setDate(diff));
  };

  const getNextSunday = (date) => {
    const copy = new Date(date);
    const resultDate = new Date(copy.setDate(copy.getDate() + (7 - copy.getDay()) % 7));
    if (resultDate.toDateString() === date.toDateString() && date.getHours() >= 21) {
      resultDate.setDate(resultDate.getDate() + 7);
    }
    return resultDate;
  };

  // Past challenges
  const pastChallenges = db.debuggingChallenges.filter(c => {
    const pubDate = new Date(c.publishedDate);
    const now = new Date(db.simulatedTime);
    const currentSunday = getSundayOfDate(now);
    currentSunday.setHours(0, 0, 0, 0);
    const pubSunday = getSundayOfDate(pubDate);
    pubSunday.setHours(0, 0, 0, 0);
    return pubSunday < currentSunday;
  });

  const handleSub = (e) => {
    e.preventDefault();
    setSubmitMsg('');
    if (!gitLink) {
      setSubmitMsg('GitHub Repository Push link is required.');
      return;
    }
    const res = submitDebuggingChallenge(activeChallenge.id, gitLink);
    if (res.success) {
      setSubmitMsg(res.message);
    } else {
      setSubmitMsg(`Error: ${res.message}`);
    }
  };

  // Find current user's submission on active challenge if any
  const activeChallengeSub = activeChallenge?.submissions.find(s => s.userId === currentUser?.id);

  // Prepopulate form if already submitted
  useEffect(() => {
    if (activeChallengeSub) {
      setGitLink(activeChallengeSub.link || '');
    } else {
      setGitLink('');
    }
  }, [activeChallengeSub, activeChallenge]);

  return (
    <div className="debugging-container">
      {/* Simulation Info */}
      <div className="simulation-time-bar">
        <span>Simulated Time: <strong>{formatSimulatedDate(db.simulatedTime)}</strong></span>
        <span>Challenge Day: <strong>Day {db.currentDay} / 100</strong></span>
      </div>

      <div className="page-header">
        <h1>Weekly Debugging Challenges</h1>
        <p className="subtitle">Every Sunday 21:00 hrs. Debug on-the-fly under a timed window.</p>
      </div>

      {/* Active Sunday Debug Card — tilt effect */}
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
                    {activeChallengeSub.score !== null ? (
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
                  {/* Rule cards — individual tilt per card */}
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

      {/* History of Sunday Challenges */}
      <div className="past-debugs-section">
        <h2>Past Debugging Challenges History</h2>
        <div className="past-challenges-list">
          {pastChallenges.length === 0 ? (
            <div className="no-past-challenges">No past debugging challenges have concluded yet.</div>
          ) : (
            pastChallenges.map(c => {
              const mySub = c.submissions.find(s => s.userId === currentUser?.id);
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
                          {mySub.score !== null ? `Score: ${mySub.score}/20` : 'Pending Score'}
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
