import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Tabs } from '../../components/ui/Tabs';
import CoordinatorStats from './CoordinatorStats';
import OverviewTab from './tabs/OverviewTab';
import ChallengesTab from './tabs/ChallengesTab';
import GradingTab from './tabs/GradingTab';
import DebuggingGradingTab from './tabs/DebuggingGradingTab';
import DebuggingQuestionsTab from './tabs/DebuggingQuestionsTab';
import WeeksTab from './tabs/WeeksTab';
import SubmissionsTab from './tabs/SubmissionsTab';
import MagicBento from '../../components/MagicBento';
import { updateSystemConfig } from '../../services/completionService';

export default function CoordinatorDashboard() {
  const { db } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const participants = useMemo(
    () => db.users.filter((u) => u.role === 'participant'),
    [db.users]
  );

  const currentDay = db.currentDay;

  const handleAdvanceDay = async () => {
    if (!window.confirm(`Advance day from Day ${currentDay} to Day ${currentDay + 1}?`)) {
      return;
    }
    setIsAdvancing(true);
    try {
      await updateSystemConfig({
        currentDay: currentDay + 1,
        simulatedTime: db.simulatedTime,
        completedWeeks: db.completedWeeks,
      });
    } catch (error) {
      console.error('Failed to advance day:', error);
      alert('Failed to advance day. Please try again.');
    } finally {
      setIsAdvancing(false);
    }
  };

  const stats = useMemo(() => {
    const todaySubs = db.submissions.filter(
      (s) => s.day === currentDay && (s.status === 'Submitted' || s.status === 'Late')
    );
    const uniqueTodaySubmitters = new Set(todaySubs.map((s) => s.userId)).size;

    const activeToday = participants.filter((p) => {
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

    const topPerformer = [...participants].sort(
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
  }, [db, currentDay, participants]);

  const bentoCardData = [
  {
    color: '#120F17',
    title: 'Active Today',
    description: `${stats.activeToday} participants`,
    label: 'Live'
  },
  {
    color: '#120F17',
    title: 'Submissions',
    description: `${stats.uniqueTodaySubmitters} today`,
    label: 'Today'
  },
  {
    color: '#120F17',
    title: 'Debug Subs',
    description: `${stats.debugSubsToday} this week`,
    label: 'Debug'
  },
  {
    color: '#120F17',
    title: 'Pending Grades',
    description: `${stats.pendingGradeCount} submissions`,
    label: 'Review'
  },
  {
    color: '#120F17',
    title: 'Top Performer',
    description: stats.topPerformer ? stats.topPerformer.name : 'N/A',
    label: 'Leader'
  },
  {
    color: '#120F17',
    title: 'Total Participants',
    description: `${participants.length} enrolled`,
    label: 'Users'
  }
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
            <button
              className="advance-day-btn"
              onClick={handleAdvanceDay}
              disabled={isAdvancing}
            >
              {isAdvancing ? 'Advancing...' : `Advance to Day ${currentDay + 1}`}
            </button>
          </div>
          <p className="subtitle">Manage participants, schedule challenges, and track weekly completion.</p>
        </div>

      <BentoStatsGrid cards={bentoCardData} />

      <Tabs value={activeTab} onChange={setActiveTab} listClassName="coordinator-tabs" aria-label="Coordinator sections">
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
          <Tabs.Trigger value="weeks" className="coord-tab" activeClassName="active">
            Week Completion
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
          <Tabs.Panel value="weeks">
            <WeeksTab />
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
