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
import AdvanceTimer from '../components/AdvanceTimer';
import { error as logError } from '../utils/logger';

export default function Dashboard() {
  const navigate = useNavigate();
  const { db, currentUser, submitCommitUrl } = useApp();
  const [timeLeft, setTimeLeft] = useState('');

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
  let userSubs = userId ? submissions.filter((s) => s.userId === userId) : [];

  if (userId && db.debuggingChallenges) {
    db.debuggingChallenges.forEach((challenge) => {
      const sub = challenge.submissions?.find((s) => s.userId === userId);
      if (sub) {
        userSubs.push({
          ...sub,
          day: challenge.week * 7,
          status: 'Submitted',
        });
      }
    });
  }

  // Today's questions
  const todayQs = questions.filter((q) => q.day === currentDay);
  const todayLcQ = todayQs.find((q) => q.linkLc && q.titleLc);
  const todayCustomQ = todayQs.find((q) => q.titleCustom && q.descCustom);

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
        setTimeLeft(
          `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
        );
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [db.simulatedTime, currentDay]);

  // Find rank preview
  const codingRank = userId
    ? db.users
      .filter((u) => u.role !== 'admin')
      .sort((a, b) => b.totalCodingScore - a.totalCodingScore)
      .findIndex((u) => u.id === userId) + 1
    : 0;

  const debugRank = userId
    ? db.users
      .filter((u) => u.role !== 'admin')
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
    const commitUrlPattern =
      /^https?:\/\/github\.com\/[\w-]+\/[\w-]+\/commit\/[a-f0-9]{7,40}(\?.*)?$/i;
    if (!commitUrlPattern.test(commitUrl.trim())) {
      setSubmitMsg('Please enter a valid GitHub commit URL (github.com/user/repo/commit/abc123)');
      return;
    }

    setIsSubmitting(true);
    setSubmitMsg('');

    try {
      const result = await submitCommitUrl(currentDay, commitUrl.trim());
      if (result.success) {
        setCommitUrl('');
        setSubmitMsg('Submitted successfully!');
      } else {
        setSubmitMsg(result.message || 'Failed to submit. Please try again.');
      }
    } catch (error) {
      logError('Error submitting commit:', error);
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
  const fadeEnd = 400; // fully visible at 400px of scrolling
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
          <h1
            className="hero-main-title"
            style={{
              fontSize: 'clamp(2rem, 8vw, 4rem)',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: 'var(--color-white)',
              marginBottom: '0.5rem',
              fontWeight: 800,
              lineHeight: 1.1,
              textShadow: '0 0 40px rgba(255,255,255,0.2)'
            }}
          >
            100 Days of Code.
          </h1>
          <h2
            className="hero-headline"
            style={{
              fontSize: 'clamp(1.25rem, 5vw, 2.2rem)',
              fontWeight: 500,
              letterSpacing: '0.02em',
              marginTop: 0,
              opacity: 0.95
            }}
          >
            <span className="hero-white">
              <ScrambledText text="From" triggerOnHover={false} />
            </span>{' '}
            <span className="hero-blue">
              <ScrambledText text="Bugs" triggerOnHover={false} />
            </span>{' '}
            <span className="hero-accent">
              <ScrambledText text="to" triggerOnHover={false} />
            </span>{' '}
            <span className="hero-blue">
              <ScrambledText text="Brilliance." triggerOnHover={false} />
            </span>
          </h2>
          <p
            className="hero-desc"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}
          >
            One commit. Every day. 100 days straight. UPES ACM&apos;s flagship coding challenge.
            Build your streak, sharpen your skills, and rise through the ranks with fellow coders.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="hero-btn primary"
              onClick={() =>
                document.getElementById('todays-challenges')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Go to Day {currentDay}'s Challenges →
            </button>
          </div>
          <div className="hero-stats-row">
            <div className="hero-stat">
              <span className="hero-stat-num">
                {db.users.filter((u) => u.role !== 'admin').length}
              </span>
              <span className="hero-stat-label">Total participants</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">{Math.min(currentDay, 100)}/100</span>
              <span className="hero-stat-label">Day Counter</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">
                <AdvanceTimer hideIcon />
              </span>
              <span className="hero-stat-label">Next Advance In</span>
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


        {/* ── Two Column Layout ── */}
        <div className="dashboard-grid-layout">
          {/* Left Column (Main Area) */}
          <div className="dashboard-main-col">
            {/* ── Today's Coding Challenges Section ── */}
            <section id="todays-challenges" className="redesigned-challenge-card-unified">
              <h3 className="redesigned-section-header">Today's Challenges - Day {currentDay}</h3>

              <div className="unified-challenge-content">
                {/* Challenge 1: LeetCode */}
                <div className="challenge-question-block">
                  <div className="challenge-card-header">
                    <span className="challenge-type-tag">LeetCode Challenge</span>
                  </div>
                  {todayLcQ ? (
                    <>
                      <h4 className="challenge-title-new">{todayLcQ.titleLc}</h4>
                      <p className="challenge-desc-new">{todayLcQ.descLc}</p>
                    </>
                  ) : (
                    <p className="challenge-desc-new">
                      Today's LeetCode challenge hasn't been posted yet. Check back soon.
                    </p>
                  )}
                  {todayLcQ && (
                    <a
                      href={todayLcQ.linkLc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="solve-button-new"
                    >
                      Solve on LeetCode &rarr;
                    </a>
                  )}
                </div>


                {/* Challenge 2: Custom DSA */}
                <div className="challenge-question-block">
                  <div className="challenge-card-header">
                    <span className="challenge-type-tag">Custom DSA Challenge</span>
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
                    <p className="challenge-desc-new">
                      Today's custom DSA challenge hasn't been posted yet. Check back soon.
                    </p>
                  )}
                  {todayCustomQ && (
                    <button
                      type="button"
                      onClick={() => navigate('/questions')}
                      className="solve-button-new"
                    >
                      Solve Challenge &rarr;
                    </button>
                  )}
                </div>
              </div>


            </section>

            {/* Heatmap Section */}
            <StreakGrid currentDay={currentDay} submissions={userSubs} questions={questions} />

            {/* GitHub Activity Graph */}
            {currentUser?.gitHubId && (
              <div className="github-activity-graph-panel" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(48, 56, 65, 0.6)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(16px)' }}>
                <h3 className="redesigned-section-header" style={{ marginBottom: '1.5rem' }}>
                  <span className="section-heading-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0 -.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" /></svg>
                  </span>
                  GitHub Activity
                </h3>
                <div className="github-graph-container" style={{ width: '100%', overflow: 'hidden', borderRadius: '4px' }}>
                  <img
                    src={`https://github-readme-activity-graph.vercel.app/graph?username=${currentUser.gitHubId}&bg_color=303841&color=F3F3F3&line=2185D5&point=F3F3F3&area=true&hide_border=true&title_color=F3F3F3`}
                    alt={`${currentUser.gitHubId}'s GitHub Activity Graph`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Side Area) */}
          <div className="dashboard-side-col">
            {/* Recent Activity Timeline Widget */}
            <div className="redesigned-timeline-panel">
              <h3 className="redesigned-section-header">
                <span className="section-heading-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12h4l3 8l4 -16l3 8h4" />
                  </svg>
                </span>
                Recent Activity
              </h3>
              <div className="timeline-container">
                <div className="timeline-rail" />
                {Array.from({ length: Math.min(currentDay, 4) }, (_, i) => {
                  const d = currentDay - i;
                  const isToday = d === currentDay;
                  const daySubs = userSubs.filter((s) => s.dayNumber === d);
                  const isCompleted = daySubs.length > 0;

                  let dotClass = 'missed';
                  if (isToday) {
                    dotClass = 'today';
                  } else if (isCompleted) {
                    dotClass = 'completed';
                  }

                  const q = questions.find((q) => q.day === d);
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
                                : 'No submissions found'}
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="9" r="6" />
                    <path d="M9 14.2l-1.5 5.8l4.5 -3l4.5 3l-1.5 -5.8" />
                    <path d="M7 9a5 5 0 0 0 10 0" />
                  </svg>
                </span>
                Leaderboard Standings
              </h3>

              <div className="leaderboard-list">
                {(() => {
                  const participants = db.users
                    .filter((u) => u.role !== 'admin')
                    .sort((a, b) => b.totalCodingScore - a.totalCodingScore);

                  const top10 = participants.slice(0, 10);
                  const maxVal = top10[0]?.totalCodingScore || 100;

                  return top10.map((user, index) => {
                    const isSelf = user.id === userId;
                    const initials = user.name
                      ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                      : 'CD';

                    return (
                      <div
                        key={user.id}
                        className={`leaderboard-row ${isSelf ? 'current-user' : ''}`}
                      >
                        <span className="leaderboard-rank">#{index + 1}</span>
                        <div className="leaderboard-avatar">{initials}</div>
                        <div className="leaderboard-info">
                          <span className="leaderboard-name">{user.name}</span>
                          <div className="leaderboard-bar-wrapper">
                            <div
                              className="leaderboard-bar"
                              style={{
                                width: `${Math.max((user.totalCodingScore / maxVal) * 100, 5)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <button
                type="button"
                className="view-all-link"
                onClick={() => navigate('/leaderboards')}
              >
                View Full Leaderboard &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
