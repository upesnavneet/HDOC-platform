import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StreakGrid from '../components/StreakGrid';
import { useTiltCard } from '../hooks/useTiltCard';
import { useVerticalSectionFocus } from '../hooks/useScrollFocus';
import { useEqualCardHeights } from '../hooks/useEqualCardHeights';
import { calculateFinishRate } from '../services/statsService';
import { parseChallengeContent } from '../utils/challengeContent';
import TiltCard from '../components/TiltCard';
import ScrambledText from '../components/ScrambledText';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestoreDb } from '../firebaseConfig';

export default function Dashboard() {
  const navigate = useNavigate();
  const { db, currentUser } = useApp();
  const [timeLeft, setTimeLeft] = useState('');
  const [commitUrl, setCommitUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentDay = db.currentDay;
  const questions = db.questions;
  const submissions = db.submissions;

  const userId = currentUser?.id || currentUser?.uid;
  const userSubs = userId ? submissions.filter((s) => s.userId === userId) : [];

  // Today's questions
  const todayQs = questions.filter(q => q.day === currentDay);
  const todayLcQ = todayQs.find(q => q.linkLc && q.titleLc);
  const todayCustomQ = todayQs.find(q => q.titleCustom && q.descCustom);

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

  // Find rank preview
  const codingRank = userId
    ? db.users
      .filter((u) => u.role === 'participant')
      .sort((a, b) => b.totalCodingScore - a.totalCodingScore)
      .findIndex((u) => u.id === userId) + 1
    : 0;

  const debugRank = userId
    ? db.users
      .filter((u) => u.role === 'participant')
      .sort((a, b) => b.totalDebuggingScore - a.totalDebuggingScore)
      .findIndex((u) => u.id === userId) + 1
    : 0;

  const overallRank = currentUser?.overallRank ?? '-';

  const finishRate = calculateFinishRate(userSubs, currentDay);

  // Handle GitHub commit submission
  const handleCommitSubmit = async (e) => {
    e.preventDefault();
    if (!commitUrl.trim()) {
      setSubmitMsg('Please enter a GitHub commit URL');
      return;
    }
    // Validate GitHub commit URL format: github.com/user/repo/commit/abc123
    const commitUrlPattern = /^https?:\/\/github\.com\/[\w-]+\/[\w-]+\/commit\/[a-f0-9]{7,40}(\?.*)?$/i;
    if (!commitUrlPattern.test(commitUrl.trim())) {
      setSubmitMsg('Please enter a valid GitHub commit URL (github.com/user/repo/commit/abc123)');
      return;
    }

    setIsSubmitting(true);
    setSubmitMsg('');

    try {
      await addDoc(collection(firestoreDb, 'submissions'), {
        studentId: currentUser.id || currentUser.uid,
        studentName: currentUser.name || currentUser.displayName || '',
        studentEmail: currentUser.email || '',
        studentGitHubId: currentUser.gitHubId || '',
        dayNumber: currentDay,
        commitUrl: commitUrl.trim(),
        submittedAt: serverTimestamp(),
      });
      setCommitUrl('');
      setSubmitMsg('Submitted successfully!');
    } catch (error) {
      console.error('Error submitting commit:', error);
      setSubmitMsg('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const streakTilt = useTiltCard(5);
  const dashboardFocusRef = useVerticalSectionFocus();
  const challengeStackRef = useEqualCardHeights([currentDay, todayLcQ?.id, todayCustomQ?.id]);

  if (!currentUser) {
    return (
      <div className="loading" role="status" aria-live="polite">
        Loading…
      </div>
    );
  }

  // Calculate zoom out and fade out variables for the hero based on scroll position
  const fadeThreshold = 400;
  const progress = Math.min(scrollY / fadeThreshold, 1);
  const scale = 1 - progress * 0.15; // zooms out from 1.0 to 0.85
  const opacity = 1 - progress; // fades out from 1.0 to 0

  // Calculate fade in and slide up variables for the content below
  const fadeStart = 100; // starts fading in after 100px of scrolling
  const fadeEnd = 400;   // fully visible at 400px of scrolling
  const belowProgress = Math.min(Math.max((scrollY - fadeStart) / (fadeEnd - fadeStart), 0), 1);
  const belowOpacity = belowProgress;
  const belowTranslateY = 30 - belowProgress * 30; // slides up from 30px to 0px

  return (
    <div className="dashboard-container" ref={dashboardFocusRef}>
      {/* Hero - From Bugs to Brilliance */}
      <section 
        className="dashboard-hero-section" 
        style={{
          position: 'sticky',
          top: '100px',
          zIndex: 1,
          transform: `scale(${scale})`,
          opacity: opacity,
          pointerEvents: opacity <= 0.05 ? 'none' : 'auto',
          transformOrigin: 'center center',
          transition: 'transform 0.05s ease-out, opacity 0.05s ease-out',
          minHeight: 'calc(100vh - 180px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div className="dashboard-hero-left hero-panel-deep">
          <h1 className="hero-headline">
            <span className="hero-orange"><ScrambledText text="From" triggerOnHover={false} /></span>{' '}
            <span className="hero-green"><ScrambledText text="Bugs" triggerOnHover={false} /></span>{' '}
            <span className="hero-accent"><ScrambledText text="to" triggerOnHover={false} /></span>{' '}
            <span className="hero-orange"><ScrambledText text="Brilliance." triggerOnHover={false} /></span>
          </h1>
          <p className="hero-desc">
            One commit. Every day. 100 days straight - UPES ACM&apos;s flagship coding challenge.
            Build your streak, sharpen your skills, and rise through the ranks with fellow coders.
          </p>
          <div className="hero-actions">
            <button type="button" className="hero-btn primary" onClick={() => document.getElementById('todays-challenges')?.scrollIntoView({ behavior: 'smooth' })}>
              Go to Day {currentDay}'s Challenges →
            </button>
          </div>
          <div className="hero-stats-row">
            <div className="hero-stat">
              <span className="hero-stat-num">{db.users.filter(u => u.role === 'participant').length}</span>
              <span className="hero-stat-label">Active Now</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">{finishRate}%</span>
              <span className="hero-stat-label">Finish Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content wrapper that fades in as user scrolls */}
      <div 
        className="dashboard-scroll-content"
        style={{
          opacity: belowOpacity,
          transform: `translateY(${belowTranslateY}px)`,
          transition: 'transform 0.05s ease-out, opacity 0.05s ease-out',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* ── Progress Metrics Strip ── */}
        <div className="metrics-strip-unified">
          <div className="metric-item">
            <div className="metric-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21l8 0" /><path d="M12 17l0 4" /><path d="M7 4l10 0" /><path d="M17 4v8a5 5 0 0 1 -10 0v-8" /><path d="M5 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M19 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /></svg>
            </div>
            <div className="metric-card-content">
              <span className="metric-card-label">Global Standing</span>
              <span className="metric-card-value">#{overallRank}</span>
            </div>
          </div>

          <div className="metric-divider"></div>

          <div className="metric-item">
            <div className="metric-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c2 -2.96 0 -7 -1 -8c0 3 -3 4.5 -4.5 6c-1.5 1.5 -2.5 3.05 -2.5 5c0 4.418 3.582 8 8 8s8 -3.582 8 -8c0 -1.95 -1 -3.5 -2.5 -5c-1.5 -1.5 -4.5 -3 -4.5 -6c-1 1 -3 5.04 -1 8z" /></svg>
            </div>
            <div className="metric-card-content">
              <span className="metric-card-label">Current Streak</span>
              <span className="metric-card-value">
                <span className="highlight">{currentUser.leetCodeStreak}</span> Days
              </span>
            </div>
          </div>

          <div className="metric-divider"></div>

          <div className="metric-item">
            <div className="metric-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="18" r="2" /><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M6 8v8" /><path d="M6 12a4 4 0 0 0 4 4h6" /></svg>
            </div>
            <div className="metric-card-content">
              <span className="metric-card-label">GitHub Streak</span>
              <span className="metric-card-value">
                <span className="highlight">{currentUser.gitHubStreak}</span> Days
              </span>
            </div>
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="dashboard-grid-layout">
          {/* Left Column (Main Area) */}
          <div className="dashboard-main-col">
            {/* ── Today's Coding Challenges ── */}
            <div className="redesigned-challenge-card-unified" id="todays-challenges">
              <h3 className="redesigned-section-header">Today's Challenges - Day {currentDay}</h3>
              <div className="unified-challenge-content">
                {/* Challenge 1: LeetCode */}
                <div className="challenge-question-block">
                  <div className="challenge-card-header">
                    <span className="challenge-type-tag">LEETCODE CHALLENGE</span>
                    <span className="xp-badge">
                      {todayLcQ?.difficulty === 'Easy' ? '100 XP' : todayLcQ?.difficulty === 'Medium' ? '250 XP' : '500 XP'}
                    </span>
                  </div>
                  {todayLcQ ? (
                    <>
                      <h4 className="challenge-title-new">{todayLcQ.titleLc}</h4>
                      <p className="challenge-desc-new">{todayLcQ.descLc}</p>
                    </>
                  ) : (
                    <p className="challenge-desc-new">Today's LeetCode challenge hasn't been posted yet. Check back soon.</p>
                  )}
                  {todayLcQ && (
                    <a href={todayLcQ.linkLc} target="_blank" rel="noopener noreferrer" className="solve-button-new">
                      Solve on LeetCode &rarr;
                    </a>
                  )}
                </div>

                <div className="challenge-divider-horizontal"></div>

                {/* Challenge 2: Custom DSA */}
                <div className="challenge-question-block">
                  <div className="challenge-card-header">
                    <span className="challenge-type-tag">CUSTOM DSA CHALLENGE</span>
                    <span className="xp-badge">
                      {todayCustomQ?.difficulty === 'Easy' ? '100 XP' : todayCustomQ?.difficulty === 'Medium' ? '250 XP' : '500 XP'}
                    </span>
                  </div>
                  {todayCustomQ ? (
                    (() => {
                      const { explanation } = parseChallengeContent(todayCustomQ.descCustom);
                      return (
                        <>
                          <h4 className="challenge-title-new">{todayCustomQ.titleCustom}</h4>
                          <p className="challenge-desc-new">{explanation}</p>
                        </>
                      );
                    })()
                  ) : (
                    <p className="challenge-desc-new">Today's custom DSA challenge hasn't been posted yet. Check back soon.</p>
                  )}
                  {todayCustomQ && (
                    <button type="button" onClick={() => navigate('/questions')} className="solve-button-new">
                      Solve Challenge &rarr;
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Heatmap Section */}
            <StreakGrid
              currentDay={currentDay}
              submissions={userSubs}
              questions={questions}
            />
          </div>

          {/* Right Column (Side Area) */}
          <div className="dashboard-side-col">
            {/* Recent Activity Timeline Widget */}
            <div className="redesigned-timeline-panel">
              <h3 className="redesigned-section-header">
                <span className="section-heading-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l3 8l4 -16l3 8h4" /></svg>
                </span>
                Recent Activity
              </h3>
              <div className="timeline-container">
                <div className="timeline-rail" />
                {Array.from({ length: Math.min(currentDay, 4) }, (_, i) => {
                  const d = currentDay - i;
                  const isToday = d === currentDay;
                  const daySubs = userSubs.filter(s => s.dayNumber === d);
                  const isCompleted = daySubs.length > 0;
                  
                  let dotClass = 'missed';
                  if (isToday) {
                    dotClass = 'today';
                  } else if (isCompleted) {
                    dotClass = 'completed';
                  }

                  const q = questions.find(q => q.day === d);
                  const tag = q?.difficulty ? `${q.difficulty} · Coding` : 'Coding';

                  return (
                    <div key={d} className="timeline-item">
                      <div className={`timeline-dot ${dotClass}`} />
                      <div className="timeline-content">
                        <div className="timeline-info">
                          <span className={`timeline-day-label ${isToday ? 'today' : 'past'}`}>
                            {isToday ? `Today (Day ${d})` : `Day ${d}`}
                          </span>
                          <span className="timeline-details">
                            {isCompleted 
                              ? `Completed with ${daySubs.length} submission(s)` 
                              : isToday 
                                ? 'Pending submission for today' 
                                : 'No submissions found'
                            }
                          </span>
                        </div>
                        <span className="timeline-tag-pill">{tag}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leaderboard Widget */}
            <div className="redesigned-leaderboard-panel">
              <h3 className="redesigned-section-header">
                <span className="section-heading-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="6" /><path d="M9 14.2l-1.5 5.8l4.5 -3l4.5 3l-1.5 -5.8" /><path d="M7 9a5 5 0 0 0 10 0" /></svg>
                </span>
                Leaderboard Standings
              </h3>
              
              <div className="leaderboard-list">
                {(() => {
                  const participants = db.users
                    .filter(u => u.role === 'participant')
                    .sort((a, b) => b.totalCodingScore - a.totalCodingScore);
                  
                  const top10 = participants.slice(0, 10);
                  const maxVal = top10[0]?.totalCodingScore || 100;

                  return top10.map((user, index) => {
                    const isSelf = user.id === userId;
                    const initials = user.name
                      ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                      : 'CD';
                    
                    return (
                      <div key={user.id} className={`leaderboard-row ${isSelf ? 'current-user' : ''}`}>
                        <span className="leaderboard-rank">#{index + 1}</span>
                        <div className="leaderboard-avatar">{initials}</div>
                        <div className="leaderboard-info">
                          <span className="leaderboard-name">{user.name}</span>
                          <div className="leaderboard-bar-wrapper">
                            <div 
                              className="leaderboard-bar" 
                              style={{ width: `${Math.max((user.totalCodingScore / maxVal) * 100, 5)}%` }}
                            />
                          </div>
                        </div>
                        <span className="leaderboard-score">{user.totalCodingScore} XP</span>
                      </div>
                    );
                  });
                })()}
              </div>

              <button type="button" className="view-all-link" onClick={() => navigate('/leaderboards')}>
                View Full Leaderboard &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
