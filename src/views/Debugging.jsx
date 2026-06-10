import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import TiltCard from '../components/TiltCard';
import { formatDate } from '../utils/dateFormat';

const getCurrentWeek = (currentDay) => {
  const day = Number(currentDay);
  if (!Number.isFinite(day) || day < 1) return 1;
  return Math.ceil(day / 7);
};

function getChallengeWindow(simulatedTime, debuggingChallenges, currentWeek) {
  const now = new Date(simulatedTime);
  const match = debuggingChallenges.find((c) => c.week === currentWeek);

  if (match) {
    const pubTime = new Date(match.publishedDate);
    if (now >= pubTime) {
      return {
        activeChallenge: match,
        timeStatus: 'open',
        isChallengeOpen: true,
        countdown: 'Challenge Active',
      };
    }
    const diff = pubTime - now;
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return {
      activeChallenge: match,
      timeStatus: 'upcoming',
      isChallengeOpen: false,
      countdown: `Starts in ${h}h ${m}m`,
    };
  }

  const nextWeek = currentWeek + 1;
  const nextChallenge = debuggingChallenges.find((c) => c.week === nextWeek);
  if (nextChallenge) {
    const pubTime = new Date(nextChallenge.publishedDate);
    const diff = pubTime - now;
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return {
      activeChallenge: null,
      timeStatus: 'closed',
      isChallengeOpen: false,
      countdown: `Week ${nextWeek} challenge in ${d} days, ${h} hours (Sunday 21:00)`,
    };
  }

  return {
    activeChallenge: null,
    timeStatus: 'closed',
    isChallengeOpen: false,
    countdown: 'No upcoming debugging challenge scheduled.',
  };
}

export default function Debugging() {
  const { db, currentUser, submitDebuggingChallenge } = useApp();
  const [submitMsg, setSubmitMsg] = useState('');
  const [tick, setTick] = useState(0);

  const userId = currentUser?.uid || currentUser?.id;
  const currentWeek = getCurrentWeek(db.currentDay);

  const windowState = useMemo(
    () => getChallengeWindow(db.simulatedTime, db.debuggingChallenges, currentWeek),
    // tick forces countdown refresh while challenge is upcoming
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.simulatedTime, db.debuggingChallenges, currentWeek, tick]
  );

  const { activeChallenge, timeStatus, isChallengeOpen, countdown } = windowState;

  useEffect(() => {
    if (timeStatus !== 'upcoming') return undefined;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timeStatus]);

  const pastChallenges = db.debuggingChallenges.filter((c) => c.week < currentWeek);
  const activeChallengeSub = activeChallenge?.submissions?.find((s) => s.userId === userId);
  const gitLinkDefault = activeChallengeSub?.link || '';

  const handleSub = async (e) => {
    e.preventDefault();
    setSubmitMsg('');
    const link = new FormData(e.currentTarget).get('git-debug-link')?.toString().trim();
    if (!link) {
      setSubmitMsg('GitHub Repository Push link is required.');
      return;
    }
    if (!activeChallenge) {
      setSubmitMsg('No active debugging challenge for this week.');
      return;
    }
    const res = await submitDebuggingChallenge(activeChallenge.id, link);
    setSubmitMsg(res.success ? res.message : `Error: ${res.message}`);
  };

  return (
    <div className="debugging-container">
      <div className="page-header">
        <h1>Sunday Debugging Challenges</h1>
      </div>

      <TiltCard
        className={`active-debug-card ${isChallengeOpen ? 'open-challenge' : ''}`}
        maxTilt={6}
      >
        <div className="card-top-tag">
          {timeStatus === 'open' && <span className="pulse-dot" aria-hidden="true" />}
          {timeStatus === 'open' ? (
            <>
              <span className="sr-only">Challenge active now</span>
              Challenge Active Now
            </>
          ) : timeStatus === 'upcoming' ? 'Challenge Starting Tonight' : 'Weekly Live Debugging'}
        </div>

        {timeStatus === 'open' && activeChallenge ? (
          <div className="challenge-open-workspace">
            <div className="workspace-header">
              <div className="theme-info">
                <span className="week-label">Week {activeChallenge.week} Sunday Special</span>
                <h2>Week {activeChallenge.week} — {activeChallenge.theme}</h2>
              </div>
              <div className="timer-badge">{countdown}</div>
            </div>

            <div className="workspace-body">
              <div className="instructions-col">
                <h3>Problem Description</h3>
                <p>{activeChallenge.description}</p>
                <div className="alert-notice">
                  <strong>How to submit:</strong> Copy the starter code, fix all logical, index, and memory bugs, push your solution to GitHub, then paste the link below.
                </div>

                <form className="debugging-sub-form" onSubmit={handleSub} key={activeChallengeSub?.timestamp || 'new'}>
                  <div className="input-group">
                    <label htmlFor="git-debug-link">GitHub link to your fixed code</label>
                    <input
                      id="git-debug-link"
                      name="git-debug-link"
                      type="url"
                      placeholder="e.g. https://github.com/username/repo/blob/…"
                      defaultValue={gitLinkDefault}
                      required
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </div>
                  <button type="submit" className="submit-challenge-btn">
                    {activeChallengeSub ? 'Update Submission' : 'Submit My Fix'}
                  </button>
                  {submitMsg && (
                    <div className="sub-msg-alert" role="alert">
                      {submitMsg}
                    </div>
                  )}
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
                      <div className="grade-result pending">Awaiting evaluation by the Technical Head.</div>
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
                <p className="upcoming-note">This week&apos;s debugging challenge goes live at 21:00 tonight. Come back then to start.</p>
                <div className="timer-badge large">{countdown}</div>
              </>
            ) : (
              <>
                <h2 style={{ marginTop: '1rem' }}>No active challenge right now</h2>
                <p className="timer-text">{countdown}</p>
                <div className="info-rules-grid">
                  <TiltCard className="rule-card" maxTilt={9}>
                    <span className="number">01</span>
                    <h4>Sundays Release</h4>
                  </TiltCard>
                  <TiltCard className="rule-card" maxTilt={9}>
                    <span className="number">02</span>
                    <h4>GitHub Submissions</h4>
                  </TiltCard>
                </div>
              </>
            )}
          </div>
        )}
      </TiltCard>

      <div className="past-debugs-section">
        <h2>Past Challenges</h2>
        <div className="past-challenges-list">
          {pastChallenges.length === 0 ? (
            <div className="no-past-challenges">No past challenges yet — completed ones will appear here.</div>
          ) : (
            pastChallenges.map((c) => {
              const mySub = c.submissions?.find((s) => s.userId === userId);
              return (
                <TiltCard key={c.id} className="past-challenge-row" maxTilt={5}>
                  <div className="info">
                    <span className="week-tag">Week {c.week}</span>
                    <div className="details">
                      <h4>Theme: {c.theme}</h4>
                      <span className="date">Concluded on: {formatDate(c.publishedDate)}</span>
                    </div>
                  </div>
                  <div className="submission-outcome">
                    {mySub ? (
                      <div className="outcome-success">
                        <span className="label">Sub Link: </span>
                        <a href={mySub.link} target="_blank" rel="noopener noreferrer" className="repo-link">View Repo</a>
                        <span className="score-tag">
                          {mySub.score !== null && mySub.score !== undefined ? `Score: ${mySub.score}/20` : 'Pending Score'}
                        </span>
                      </div>
                    ) : (
                      <span className="outcome-missed">Not submitted</span>
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
