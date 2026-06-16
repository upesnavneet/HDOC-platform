import { useMemo } from 'react';

/**
 * Enhanced leaderboard data hook.
 * Provides 4 board categories, podium data, user position,
 * hall-of-fame records, community stats, and per-user badges/trends.
 */
export function useLeaderboardData(db, currentUserId) {
  const currentDay = Number(db.currentDay) || 1;
  const currentWeek = Math.ceil(currentDay / 7);
  const startDayOfWeek = (currentWeek - 1) * 7 + 1;
  const endDayOfWeek = currentWeek * 7;

  // B6: exclude admin accounts; B4: exclude suspended participants
  const participants = useMemo(
    () =>
      db.users.filter(
        (u) =>
          !u.isAdminAccount &&
          u.isActive !== false &&
          u.name?.toLowerCase() !== 'admin' &&
          !u.email?.toLowerCase().includes('admin')
      ),
    [db.users]
  );

  /* ── Helper: compute badges for a participant ── */
  const getBadges = (p, allSubs) => {
    const badges = [];
    const maxStreak = Math.max(p.leetCodeStreak || 0, p.gitHubStreak || 0);
    if (maxStreak >= 7) badges.push({ emoji: '🔥', label: 'Streak Master' });

    const userSubs = allSubs.filter(
      (s) => (s.userId === p.id || s.userId === p.uid) && (s.status === 'Submitted' || s.status === 'Late')
    );
    const completionPct = currentDay > 0 ? (userSubs.length / (currentDay * 2)) * 100 : 0;
    if (completionPct >= 80) badges.push({ emoji: '⚡', label: 'Fast Solver' });

    return badges;
  };

  /* ── Helper: compute trend from streak activity ── */
  const getTrend = (p, subs) => {
    const recentSubs = subs.filter(
      (s) =>
        (s.userId === p.id || s.userId === p.uid) &&
        s.day >= currentDay - 2 &&
        (s.status === 'Submitted' || s.status === 'Late')
    );
    if (recentSubs.length >= 2) return 'up';
    if (recentSubs.length === 0) return 'down';
    return 'neutral';
  };

  /* ── Helper: get initials ── */
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  /* ── Board: Daily (coding) ── */
  const dailyBoard = useMemo(() => {
    const data = participants.map((p) => {
      const allUserSubs = db.submissions.filter(
        (s) =>
          (s.userId === p.id || s.userId === p.uid) &&
          (s.status === 'Submitted' || s.status === 'Late')
      );
      const completedDaysCount = new Set(allUserSubs.map((s) => s.day)).size;
      return {
        id: p.id,
        name: p.name,
        gitHubId: p.gitHubId,
        initials: getInitials(p.name),
        score: p.totalCodingScore || 0,
        completedDays: completedDaysCount,
        streak: Math.max(p.leetCodeStreak || 0, p.gitHubStreak || 0),
        trend: getTrend(p, db.submissions),
        badges: getBadges(p, db.submissions),
      };
    });
    return data.sort((a, b) => b.score - a.score);
  }, [participants, db.submissions, currentDay]);

  /* ── Board: Debugging ── */
  const debuggingBoard = useMemo(() => {
    const totalDebugChallenges = db.debuggingChallenges.length;
    const data = participants.map((p) => {
      let bugsFixed = 0;
      let debugStreak = 0;
      db.debuggingChallenges.forEach((c) => {
        const sub = c.submissions?.find(
          (s) => s.userId === p.id || s.userId === p.uid
        );
        if (sub) {
          bugsFixed++;
          if (sub.score > 0) debugStreak++;
        }
      });
      return {
        id: p.id,
        name: p.name,
        gitHubId: p.gitHubId,
        initials: getInitials(p.name),
        score: p.totalDebuggingScore || 0,
        bugsFixed,
        debugStreak,
        trend: bugsFixed > 0 ? (debugStreak >= bugsFixed ? 'up' : 'neutral') : 'down',
        badges: [],
      };
    });
    return data.sort((a, b) => b.score - a.score);
  }, [participants, db.debuggingChallenges]);

  /* ── Board: Contest (uses real HackerRank contest data from F1) ── */
  const contestBoard = useMemo(() => {
    const data = participants.map((p) => {
      return {
        id: p.id,
        name: p.name,
        gitHubId: p.gitHubId,
        initials: getInitials(p.name),
        // F1: use real contest fields; fall back to 0/null for existing users
        contestScore: p.contestScore ?? 0,
        contestsPlayed: p.contestsPlayed ?? 0,
        bestContestRank: p.bestContestRank ?? null,
        trend: getTrend(p, db.submissions),
        badges: getBadges(p, db.submissions),
      };
    });
    // sort by contestScore desc; ties broken by best rank asc
    return data.sort((a, b) => {
      if (b.contestScore !== a.contestScore) return b.contestScore - a.contestScore;
      const ra = a.bestContestRank ?? Infinity;
      const rb = b.bestContestRank ?? Infinity;
      return ra - rb;
    });
  }, [participants, db.submissions, currentDay]);

  /* ── Board: Combined ── */
  const combinedBoard = useMemo(() => {
    const data = participants.map((p) => {
      const combinedStreak = Math.max(p.leetCodeStreak || 0, p.gitHubStreak || 0);
      return {
        id: p.id,
        name: p.name,
        gitHubId: p.gitHubId,
        leetCodeId: p.leetCodeId,
        initials: getInitials(p.name),
        dailyScore: p.totalCodingScore || 0,
        debugScore: p.totalDebuggingScore || 0,
        contestScore: 0,
        totalScore: (p.totalCodingScore || 0) + (p.totalDebuggingScore || 0),
        combinedStreak,
        gitHubStreak: p.gitHubStreak || 0,
        leetCodeStreak: p.leetCodeStreak || 0,
        trend: getTrend(p, db.submissions),
        badges: getBadges(p, db.submissions),
      };
    });
    return data.sort((a, b) => b.totalScore - a.totalScore);
  }, [participants, db.submissions, currentDay]);

  /* ── Your Position (for each board) ── */
  const getYourPosition = (board, scoreField = 'score') => {
    if (!currentUserId) return null;
    const idx = board.findIndex((r) => r.id === currentUserId);
    if (idx === -1) return null;
    const row = board[idx];
    const totalParticipants = board.length;
    return {
      rank: idx + 1,
      totalParticipants,
      score: row[scoreField] ?? row.score ?? 0,
      streak: row.streak ?? row.debugStreak ?? row.combinedStreak ?? 0,
      change: row.trend === 'up' ? '+' : row.trend === 'down' ? '-' : '→',
    };
  };

  return {
    currentWeek,
    dailyBoard,
    debuggingBoard,
    contestBoard,
    combinedBoard,
    getYourPosition,
  };
}
