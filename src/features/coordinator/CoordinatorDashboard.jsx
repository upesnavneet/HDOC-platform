import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Tabs } from '../../components/ui/Tabs';
import CoordinatorStats from './CoordinatorStats';
import OverviewTab from './tabs/OverviewTab';
import ChallengesTab from './tabs/ChallengesTab';
import GradingTab from './tabs/GradingTab';
import DebuggingGradingTab from './tabs/DebuggingGradingTab';
import DebuggingQuestionsTab from './tabs/DebuggingQuestionsTab';
import ContestGradingTab from './tabs/ContestGradingTab';
import SubmissionsTab from './tabs/SubmissionsTab';
import MagicBento from '../../components/MagicBento';
import AdvanceTimer from '../../components/AdvanceTimer';
import { updateSystemConfig } from '../../services/completionService';
import { error as logError } from '../../utils/logger';
import { syncParticipantProfile } from '../../context/scoreSync';

export default function CoordinatorDashboard() {
  const { db } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // B6: exclude admin accounts; B4: exclude inactive from stats counts but keep them in table
  const participants = useMemo(
    () => db.users.filter((u) => !u.isAdminAccount),
    [db.users]
  );

  // B4: active-only slice used in stats
  const activeParticipants = useMemo(
    () => participants.filter((p) => p.isActive !== false),
    [participants]
  );

  const currentDay = db.currentDay;

  // F4: disable Advance Day button once Day 100 is reached
  const challengeEnded = currentDay >= 100;

  const handleAdvanceDay = async () => {
    if (challengeEnded) return;
    if (!window.confirm(`Advance day from Day ${currentDay} to Day ${currentDay + 1}?`)) {
      return;
    }
    setIsAdvancing(true);
    try {
      await updateSystemConfig({
        currentDay: currentDay + 1,
        simulatedTime: db.simulatedTime,
        completedWeeks: db.completedWeeks,
        lastDayAdvanceTime: new Date(),
      });
    } catch (error) {
      logError('Failed to advance day:', error);
      alert('Failed to advance day. Please try again.');
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleFixStreaks = async () => {
    if (!window.confirm('Recalculate all streaks based on submissions? This may take a moment.')) return;
    try {
      for (const p of participants) {
        await syncParticipantProfile(db, p.id || p.uid);
      }
      alert('All streaks and scores recalculated successfully!');
    } catch (err) {
      logError('Failed to recalculate streaks:', err);
      alert('Error recalculating streaks');
    }
  };

  const handleToggleLock = async (type) => {
    setIsLocking(true);
    try {
      const updates = {};
      if (type === 'challenges') {
        updates.challengesLocked = !db.challengesLocked;
      } else if (type === 'debugging') {
        updates.debuggingLocked = !db.debuggingLocked;
      }
      await updateSystemConfig(updates);
    } catch (error) {
      logError(`Failed to toggle ${type} lock:`, error);
      alert(`Failed to toggle ${type} lock. Please try again.`);
    } finally {
      setIsLocking(false);
    }
  };

  const stats = useMemo(() => {
    const todaySubs = db.submissions.filter(
      (s) => s.day === currentDay && (s.status === 'Submitted' || s.status === 'Late')
    );
    const uniqueTodaySubmitters = new Set(todaySubs.map((s) => s.userId)).size;

    const activeToday = activeParticipants.filter((p) => {
      const subs = db.submissions.filter((s) => s.userId === p.id && s.day === currentDay);
      return subs.some((s) => s.status === 'Submitted' || s.status === 'Late');
    }).length;

    const currentWeekDebug = db.debuggingChallenges.find((c) => {
      const pub = new Date(c.publishedDate);
      const sim = new Date(db.simulatedTime);
      const weekStart = new Date(pub);
      weekStart.setDate(weekStart.getDate() - 6);
      return sim >= weekStart && sim <= new Date(pub.getTime() + 7 * 24 * 60 * 60 * 1000);
    });

    const debugSubsToday = currentWeekDebug
      ? currentWeekDebug.submissions.filter((s) => {
          const subDate = new Date(s.timestamp).toDateString();
          return subDate === new Date(db.simulatedTime).toDateString();
        }).length
      : 0;

    const topPerformer = [...activeParticipants].sort(
      (a, b) =>
        b.totalCodingScore + b.totalDebuggingScore - (a.totalCodingScore + a.totalDebuggingScore)
    )[0];

    const pendingGradeCount = db.submissions.filter(
      (sub) => sub.marks === null && (sub.status === 'Submitted' || sub.status === 'Late')
    ).length;

    return {
      activeToday,
      uniqueTodaySubmitters,
      debugSubsToday,
      topPerformer,
      pendingGradeCount,
    };
  }, [db, currentDay, activeParticipants]);

  const bentoCardData = [
    {
      color: '#120F17',
      title: 'Active Today',
      description: `${stats.activeToday} participants`,
      label: 'Live',
    },
    {
      color: '#120F17',
      title: 'Submissions',
      description: `${stats.uniqueTodaySubmitters} today`,
      label: 'Today',
    },
    {
      color: '#120F17',
      title: 'Debug Subs',
      description: `${stats.debugSubsToday} this week`,
      label: 'Debug',
    },
    {
      color: '#120F17',
      title: 'Pending Grades',
      description: `${stats.pendingGradeCount} submissions`,
      label: 'Review',
    },
    {
      color: '#120F17',
      title: 'Top Performer',
      description: stats.topPerformer ? stats.topPerformer.name : 'N/A',
      label: 'Leader',
    },
    {
      color: '#120F17',
      title: 'Total Participants',
      description: `${participants.length} enrolled`,
      label: 'Users',
    },
  ];

  const BentoStatsGrid = ({ cards }) => {
    return (
      <MagicBento
        cards={cards}
        textAutoHide={true}
        enableStars={true}
        enableSpotlight={true}
        enableBorderGlow={true}
        enableTilt={false}
        enableMagnetism={true}
        clickEffect={true}
        spotlightRadius={400}
        particleCount={8}
        glowColor="66, 165, 252"
      />
    );
  };

  return (
    <>
      {/* Glass overlay that appears when scrolling */}
      <div className={`glass-scroll-overlay ${isScrolled ? 'visible' : ''}`} />

      <div className="coordinator-dashboard-container">
        <div className="page-header">
          <div className="header-top">
            <h1>Coordinator Dashboard</h1>
            {challengeEnded ? (
              <span className="advance-day-btn" style={{ opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }}>
                Challenge Complete (Day 100)
              </span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <AdvanceTimer />
                <button
                  className="advance-day-btn"
                  onClick={handleAdvanceDay}
                  disabled={isAdvancing}
                >
                  {isAdvancing ? 'Advancing...' : `Advance to Day ${currentDay + 1}`}
                </button>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="small-action-btn grey"
                onClick={async () => {
                  if (window.confirm("Are you sure you want to reset the event to Day 0?")) {
                    setIsAdvancing(true);
                    try {
                      await updateSystemConfig({ currentDay: 0, lastDayAdvanceTime: new Date() });
                    } catch (error) {
                      console.error("Failed to reset:", error);
                      alert("Failed to reset to Day 0");
                    } finally {
                      setIsAdvancing(false);
                    }
                  }
                }}
                disabled={isAdvancing || isLocking}
              >
                Reset to Day 0
              </button>
              <button
                className="small-action-btn grey"
                onClick={handleFixStreaks}
              >
                Recalculate All Streaks
              </button>
              <button
                className={`small-action-btn ${db.challengesLocked ? 'red' : 'green'}`}
                onClick={() => handleToggleLock('challenges')}
                disabled={isLocking}
              >
                {db.challengesLocked ? 'Unlock Challenges' : 'Lock Challenges'}
              </button>
              <button
                className={`small-action-btn ${db.debuggingLocked ? 'red' : 'green'}`}
                onClick={() => handleToggleLock('debugging')}
                disabled={isLocking}
              >
                {db.debuggingLocked ? 'Unlock Debugging' : 'Lock Debugging'}
              </button>
            </div>
          </div>
          <p className="subtitle">
            Manage participants, schedule challenges, and track weekly completion.
          </p>
        </div>

        <BentoStatsGrid cards={bentoCardData} />

        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          listClassName="coordinator-tabs"
          aria-label="Coordinator sections"
        >
          <Tabs.List>
            <Tabs.Trigger value="overview" className="coord-tab" activeClassName="active">
              Participants
            </Tabs.Trigger>
            <Tabs.Trigger value="challenges" className="coord-tab" activeClassName="active">
              Questions &amp; Challenges
            </Tabs.Trigger>
            <Tabs.Trigger value="debugQuestions" className="coord-tab" activeClassName="active">
              Sunday Debug Questions
            </Tabs.Trigger>
            <Tabs.Trigger value="grading" className="coord-tab" activeClassName="active">
              Mark Submissions ({stats.pendingGradeCount})
            </Tabs.Trigger>
            <Tabs.Trigger value="debugging" className="coord-tab" activeClassName="active">
              Sunday Debug Grading
            </Tabs.Trigger>
            <Tabs.Trigger value="contest" className="coord-tab" activeClassName="active">
              Contest Grading
            </Tabs.Trigger>
            <Tabs.Trigger value="submissions" className="coord-tab" activeClassName="active">
              GitHub Submissions
            </Tabs.Trigger>
          </Tabs.List>

          <div className="coordinator-workspace">
            <Tabs.Panel value="overview">
              <OverviewTab participants={participants} />
            </Tabs.Panel>
            <Tabs.Panel value="challenges">
              <ChallengesTab />
            </Tabs.Panel>
            <Tabs.Panel value="debugQuestions">
              <DebuggingQuestionsTab />
            </Tabs.Panel>
            <Tabs.Panel value="grading">
              <GradingTab />
            </Tabs.Panel>
            <Tabs.Panel value="debugging">
              <DebuggingGradingTab />
            </Tabs.Panel>
            <Tabs.Panel value="contest">
              <ContestGradingTab />
            </Tabs.Panel>
            <Tabs.Panel value="submissions">
              <SubmissionsTab />
            </Tabs.Panel>
          </div>
        </Tabs>
      </div>
    </>
  );
}
