import React, { useState, useEffect } from 'react';
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { db, currentUser } = useApp();
  const [timeLeft, setTimeLeft] = useState('');

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

  return (
    <div className="dashboard-container" ref={dashboardFocusRef}>
      {/* Hero + Journey — shown first so content stays visible */}
      <section className="dashboard-hero-split dashboard-focus-section" data-dashboard-focus>
        <TiltCard className="dashboard-hero-left press-card hero-panel-deep" maxTilt={6}>
          <span className="hero-batch-badge">BATCH 2026</span>
          <h1 className="hero-headline">
            <span className="hero-orange"><ScrambledText text="From" triggerOnHover={false} /></span>{' '}
            <span className="hero-green"><ScrambledText text="Bugs" triggerOnHover={false} /></span>{' '}
            <span className="hero-accent"><ScrambledText text="to" triggerOnHover={false} /></span>{' '}
            <span className="hero-orange"><ScrambledText text="Brilliance." triggerOnHover={false} /></span>
          </h1>
          <p className="hero-desc">
            One commit. Every day. 100 days straight — UPES ACM&apos;s flagship coding challenge.
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
        </TiltCard>

        <div className="dashboard-hero-right">
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
        </div>
      </section>

      <section className="overview-stats-section dashboard-focus-section" data-dashboard-focus>
        <TiltCard className="stat-card press-card" maxTilt={7}>
          <div className="stat-label">Event Progress</div>
          <div className="stat-value">Day {currentDay} <span className="stat-total">/ 100</span></div>
          <div className="stat-progress-bar-wrapper">
            <div className="stat-progress-bar progress-animate" style={{ width: `${currentDay}%` }}></div>
          </div>
        </TiltCard>

        <TiltCard className="stat-card press-card" maxTilt={7}>
          <div className="stat-label">LeetCode Streak</div>
          <div className="stat-value-row">
            <span className="stat-value">{currentUser.leetCodeStreak}</span>
            <span className="stat-icon-flame">Days</span>
          </div>
          {currentUser.leetCodeStreak === 0 && (
            <span className="stat-status-alert error">Streak broken — solve today&apos;s LeetCode to restart it.</span>
          )}
          {currentUser.leetCodeStreak > 0 && (
            <span className="stat-status-alert success">Streak is live — keep it going!</span>
          )}
        </TiltCard>

        <TiltCard className="stat-card press-card" maxTilt={7}>
          <div className="stat-label">GitHub Push Streak</div>
          <div className="stat-value-row">
            <span className="stat-value">{currentUser.gitHubStreak}</span>
            <span className="stat-icon-github">Days</span>
          </div>
          {currentUser.gitHubStreak === 0 && (
            <span className="stat-status-alert error">No pushes yet — commit today&apos;s solution to GitHub.</span>
          )}
          {currentUser.gitHubStreak > 0 && (
            <span className="stat-status-alert success">Daily pushes on track!</span>
          )}
        </TiltCard>

        <TiltCard className="stat-card press-card ranking" maxTilt={7}>
          <div className="stat-label">Overall Standing</div>
          <div className="stat-value">#{overallRank}</div>
          <div className="ranks-sub-row">
            <span>Coding: #{codingRank}</span>
            <span>•</span>
            <span>Debug: #{debugRank}</span>
          </div>
          <button type="button" className="stat-link" onClick={() => navigate('/leaderboards')}>
            View Leaderboards &rarr;
          </button>
        </TiltCard>
      </section>

      {/* Today's Coding Challenges Section */}
      <section id="todays-challenges" className="todays-challenges-section dashboard-focus-section" data-dashboard-focus>
        <div className="section-header-row">
          <h2>Today's Challenges — Day {currentDay}</h2>
          <div className={`countdown-timer ${timeLeft === 'Deadline Passed' ? 'expired' : ''}`}>
            {timeLeft === 'Deadline Passed' ? 'Submission window has closed.' : <>Window closes in <strong>{timeLeft}</strong></>}
          </div>
        </div>

        <p className="challenge-cards-scroll-hint">Scroll sideways to see both challenges</p>

        <div className="challenge-cards-scroll-stack" ref={challengeStackRef}>
          {/* Challenge 1: LeetCode */}
          <div className="challenge-card-shell">
          <TiltCard className="challenge-card press-card" maxTilt={6}>
            <div className="card-top-tag leetcode">LeetCode Challenge</div>
            {todayLcQ ? (
              <div className="challenge-details">
                <h3 className="challenge-title">{todayLcQ.titleLc}</h3>
                
                <div className="challenge-section">
                  <h4 className="section-subtitle">Explanation</h4>
                  <p className="challenge-desc">{todayLcQ.descLc}</p>
                </div>
                
                <div className="challenge-section">
                  <h4 className="section-subtitle">Example</h4>
                  <p className="challenge-example">
                    Click <strong>Open LeetCode Page</strong> to view example test cases, constraints, and submit your code.
                  </p>
                </div>

                <div className="challenge-meta">
                  <a href={todayLcQ.linkLc} target="_blank" rel="noopener noreferrer" className="external-problem-link">
                    Open LeetCode Page →
                  </a>
                </div>
              </div>
            ) : (
              <div className="no-challenge-placeholder">Today&apos;s LeetCode challenge hasn&apos;t been posted yet. Check back soon.</div>
            )}
          </TiltCard>
          </div>

          {/* Challenge 2: Custom DSA */}
          <div className="challenge-card-shell">
          <TiltCard className="challenge-card press-card" maxTilt={6}>
            <div className="card-top-tag custom-dsa">Custom DSA Challenge</div>
            {todayCustomQ ? (
              (() => {
                const { explanation, example } = parseChallengeContent(todayCustomQ.descCustom);
                return (
                  <div className="challenge-details">
                    <h3 className="challenge-title">{todayCustomQ.titleCustom}</h3>
                    
                    <div className="challenge-section">
                      <h4 className="section-subtitle">Explanation</h4>
                      <p className="challenge-desc">{explanation}</p>
                    </div>
                    
                    <div className="challenge-section">
                      <h4 className="section-subtitle">Example</h4>
                      <p className="challenge-example">{example}</p>
                    </div>

                    <div className="challenge-meta">
                      <span className="author-tag">By Technical Head</span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="no-challenge-placeholder">Today&apos;s custom DSA challenge hasn&apos;t been posted yet. Check back soon.</div>
            )}
          </TiltCard>
          </div>
        </div>
      </section>
    </div>
  );
}
