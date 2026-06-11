import { useMemo } from 'react';

export function useLeaderboardData(db) {
  const currentDay = Number(db.currentDay) || 1;
  const currentWeek = Math.ceil(currentDay / 7);
  const startDayOfWeek = (currentWeek - 1) * 7 + 1;
  const endDayOfWeek = currentWeek * 7;

  const participants = useMemo(() => db.users.filter((u) => u.role !== 'admin'), [db.users]);

  const codingBoard = useMemo(() => {
    const data = participants.map((p) => {
      const weeklySubs = db.submissions.filter(
        (s) =>
          (s.userId === p.id || s.userId === p.uid) &&
          s.day >= startDayOfWeek &&
          s.day <= endDayOfWeek &&
          (s.status === 'Submitted' || s.status === 'Late')
      );
      return {
        id: p.id,
        name: p.name,
        gitHubId: p.gitHubId,
        leetCodeId: p.leetCodeId,
        score: weeklySubs.reduce((acc, curr) => acc + (curr.marks || 0), 0),
        solvedCount: weeklySubs.length,
      };
    });
    return data.sort((a, b) => b.score - a.score);
  }, [participants, db.submissions, startDayOfWeek, endDayOfWeek]);

  const debuggingBoard = useMemo(() => {
    const currentWeekChallenge = db.debuggingChallenges.find((c) => c.week === currentWeek);
    const data = participants.map((p) => {
      let score = 0;
      let submitted = false;
      if (currentWeekChallenge?.submissions) {
        const sub = currentWeekChallenge.submissions.find(
          (s) => s.userId === p.id || s.userId === p.uid
        );
        if (sub) {
          score = sub.score || 0;
          submitted = true;
        }
      }
      return {
        id: p.id,
        name: p.name,
        gitHubId: p.gitHubId,
        score,
        status: submitted ? 'Submitted' : 'Missed',
      };
    });
    return data.sort((a, b) => b.score - a.score);
  }, [participants, db.debuggingChallenges, currentWeek]);

  const combinedBoard = useMemo(() => {
    const data = participants.map((p) => ({
      id: p.id,
      name: p.name,
      gitHubId: p.gitHubId,
      leetCodeId: p.leetCodeId,
      codingScore: p.totalCodingScore,
      debugScore: p.totalDebuggingScore,
      totalScore: p.totalCodingScore + p.totalDebuggingScore,
      gitHubStreak: p.gitHubStreak,
      leetCodeStreak: p.leetCodeStreak,
      rank: p.overallRank,
    }));
    return data.sort((a, b) => b.totalScore - a.totalScore);
  }, [participants]);

  return { currentWeek, codingBoard, debuggingBoard, combinedBoard };
}
