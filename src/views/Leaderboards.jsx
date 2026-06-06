import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Leaderboards() {
  const { db } = useApp();
  const [activeTab, setActiveTab] = useState('overall'); // 'coding', 'debugging', 'overall'

  const currentDay = db.currentDay;
  const currentWeek = Math.ceil(currentDay / 7);
  const participants = db.users.filter(u => u.role === 'participant');

  // Helper: Get range of days for the current week
  const startDayOfWeek = (currentWeek - 1) * 7 + 1;
  const endDayOfWeek = currentWeek * 7;

  // 1. Calculate Weekly Coding Leaderboard Data
  const getWeeklyCodingData = () => {
    const data = participants.map(p => {
      // Sum marks for user submissions in the current week range
      const weeklySubs = db.submissions.filter(
        s => s.userId === p.id && s.day >= startDayOfWeek && s.day <= endDayOfWeek && (s.status === 'Submitted' || s.status === 'Late')
      );
      const score = weeklySubs.reduce((acc, curr) => acc + (curr.marks || 0), 0);
      const solvedCount = weeklySubs.length;

      return {
        id: p.id,
        name: p.name,
        gitHubId: p.gitHubId,
        leetCodeId: p.leetCodeId,
        score,
        solvedCount
      };
    });

    return data.sort((a, b) => b.score - a.score);
  };

  // 2. Calculate Weekly Debugging Leaderboard Data
  const getWeeklyDebuggingData = () => {
    // Current week debugging challenge
    const currentWeekChallenge = db.debuggingChallenges.find(c => c.week === currentWeek);
    
    const data = participants.map(p => {
      let score = 0;
      let submitted = false;

      if (currentWeekChallenge) {
        const sub = currentWeekChallenge.submissions.find(s => s.userId === p.id);
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
        status: submitted ? 'Submitted' : 'Missed'
      };
    });

    return data.sort((a, b) => b.score - a.score);
  };

  // 3. Get Combined Overall Leaderboard Data
  // Presorted in db.users update logic, but let's map it clearly here
  const getCombinedData = () => {
    const data = participants.map(p => ({
      id: p.id,
      name: p.name,
      gitHubId: p.gitHubId,
      leetCodeId: p.leetCodeId,
      codingScore: p.totalCodingScore,
      debugScore: p.totalDebuggingScore,
      totalScore: p.totalCodingScore + p.totalDebuggingScore,
      gitHubStreak: p.gitHubStreak,
      leetCodeStreak: p.leetCodeStreak,
      rank: p.overallRank
    }));

    return data.sort((a, b) => b.totalScore - a.totalScore);
  };

  const codingBoard = getWeeklyCodingData();
  const debuggingBoard = getWeeklyDebuggingData();
  const combinedBoard = getCombinedData();

  return (
    <div className="leaderboards-container">
      <div className="page-header">
        <h1>ACM 100 Days of Code Standings</h1>
        <p className="subtitle">Real-time standings for ACM Chapter coding participants. Top 10 from the overall board enter the Grand Finale.</p>
      </div>

      {/* Leaderboard Tabs */}
      <div className="leaderboard-tabs-bar">
        <button 
          className={`tab-btn ${activeTab === 'overall' ? 'active' : ''}`}
          onClick={() => setActiveTab('overall')}
        >
          Combined Overall Leaderboard (100 Days)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'coding' ? 'active' : ''}`}
          onClick={() => setActiveTab('coding')}
        >
          Weekly Coding Leaderboard (Week {currentWeek})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'debugging' ? 'active' : ''}`}
          onClick={() => setActiveTab('debugging')}
        >
          Weekly Debugging Leaderboard (Week {currentWeek})
        </button>
      </div>

      {/* Info panel explaining current week scope */}
      <div className="week-scope-info">
        {activeTab === 'overall' && (
          <span>Showing cumulative points across all 100 days of Coding Challenges and Sunday Debugging events.</span>
        )}
        {activeTab === 'coding' && (
          <span>Currently tracking Week {currentWeek} (Days {startDayOfWeek} to {endDayOfWeek}). Resets at the start of next week.</span>
        )}
        {activeTab === 'debugging' && (
          <span>Score listings for the Sunday Debugging timed event in Week {currentWeek}.</span>
        )}
      </div>

      {/* Table Container */}
      <div className="table-responsive-container">
        {activeTab === 'overall' && (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Participant</th>
                <th>GitHub / LeetCode</th>
                <th>Coding Pts</th>
                <th>Debugging Pts</th>
                <th>Combined Streaks</th>
                <th className="align-right">Total Score</th>
              </tr>
            </thead>
            <tbody>
              {combinedBoard.map((row, idx) => {
                const rankNum = idx + 1;
                const isTop10 = rankNum <= 10;
                return (
                  <tr key={row.id} className={`${isTop10 ? 'top10-highlight' : ''} ${rankNum === 1 ? 'gold-medalist' : ''}`}>
                    <td className="rank-col">
                      <span className={`rank-badge rank-${rankNum}`}>#{rankNum}</span>
                    </td>
                    <td className="participant-col">
                      <div className="details">
                        <span className="name">{row.name}</span>
                        {isTop10 && <span className="finale-tag">Grand Finale Qualifier</span>}
                      </div>
                    </td>
                    <td className="handle-col">
                      <div className="handles-subrow">
                        <span className="h-tag git">gh: {row.gitHubId}</span>
                        <span className="h-tag lc">lc: {row.leetCodeId}</span>
                      </div>
                    </td>
                    <td>{row.codingScore} pts</td>
                    <td>{row.debugScore} pts</td>
                    <td className="streaks-col">
                      <span className="streak-badge lc" title="LeetCode Streak">LC: {row.leetCodeStreak}d</span>
                      <span className="streak-badge git" title="GitHub Streak">Git: {row.gitHubStreak}d</span>
                    </td>
                    <td className="score-col align-right">{row.totalScore} pts</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === 'coding' && (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Participant</th>
                <th>GitHub Handle</th>
                <th>Solved Submissions</th>
                <th className="align-right">Weekly Points</th>
              </tr>
            </thead>
            <tbody>
              {codingBoard.map((row, idx) => {
                const rankNum = idx + 1;
                return (
                  <tr key={row.id}>
                    <td className="rank-col">
                      <span className={`rank-badge rank-${rankNum}`}>#{rankNum}</span>
                    </td>
                    <td><span className="name">{row.name}</span></td>
                    <td><span className="h-tag git">@{row.gitHubId}</span></td>
                    <td>{row.solvedCount} / 14 questions</td>
                    <td className="score-col align-right">{row.score} pts</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === 'debugging' && (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Participant</th>
                <th>GitHub Link</th>
                <th>Challenge Status</th>
                <th className="align-right">Debugging Score</th>
              </tr>
            </thead>
            <tbody>
              {debuggingBoard.map((row, idx) => {
                const rankNum = idx + 1;
                return (
                  <tr key={row.id}>
                    <td className="rank-col">
                      <span className={`rank-badge rank-${rankNum}`}>#{rankNum}</span>
                    </td>
                    <td><span className="name">{row.name}</span></td>
                    <td><span className="h-tag git">@{row.gitHubId}</span></td>
                    <td>
                      <span className={`badge-status ${row.status.toLowerCase()}`}>{row.status}</span>
                    </td>
                    <td className="score-col align-right">{row.score} pts</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
