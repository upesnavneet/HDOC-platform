import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Tabs } from '../../components/ui/Tabs';
import CoordinatorStats from './CoordinatorStats';
import OverviewTab from './tabs/OverviewTab';
import ChallengesTab from './tabs/ChallengesTab';
import GradingTab from './tabs/GradingTab';
import DebuggingGradingTab from './tabs/DebuggingGradingTab';
import WeeksTab from './tabs/WeeksTab';

export default function CoordinatorDashboard() {
  const { db } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  const participants = useMemo(
    () => db.users.filter((u) => u.role === 'participant'),
    [db.users]
  );

  const currentDay = db.currentDay;

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

  return (
    <div className="coordinator-dashboard-container">
      <div className="page-header">
        <h1>Coordinator Dashboard</h1>
        <p className="subtitle">Manage participants, schedule challenges, and track weekly completion.</p>
      </div>

      <CoordinatorStats
        participants={participants}
        activeToday={stats.activeToday}
        uniqueTodaySubmitters={stats.uniqueTodaySubmitters}
        debugSubsToday={stats.debugSubsToday}
        topPerformer={stats.topPerformer}
      />

      <Tabs value={activeTab} onChange={setActiveTab} listClassName="coordinator-tabs" aria-label="Coordinator sections">
        <Tabs.List>
          <Tabs.Trigger value="overview" className="coord-tab" activeClassName="active">
            Participants
          </Tabs.Trigger>
          <Tabs.Trigger value="challenges" className="coord-tab" activeClassName="active">
            Questions &amp; Challenges
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
        </Tabs.List>

        <div className="coordinator-workspace">
          <Tabs.Panel value="overview">
            <OverviewTab participants={participants} />
          </Tabs.Panel>
          <Tabs.Panel value="challenges">
            <ChallengesTab />
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
        </div>
      </Tabs>
    </div>
  );
}
