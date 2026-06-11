import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Tabs } from '../components/ui/Tabs';
import { useLeaderboardData } from '../hooks/useLeaderboard';

const PAGE_SIZE = 25;

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination-controls">
      <button
        className="pagination-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ← Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="pagination-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next →
      </button>
      <span className="pagination-info">
        {(currentPage - 1) * PAGE_SIZE + 1}–
        {Math.min(currentPage * PAGE_SIZE, totalPages * PAGE_SIZE)} of entries
      </span>
    </div>
  );
}

export default function Leaderboards() {
  const { db } = useApp();
  const [activeTab, setActiveTab] = useState('overall');
  const { currentWeek, codingBoard, debuggingBoard, combinedBoard } = useLeaderboardData(db);

  // M7: Pagination state per tab
  const [overallPage, setOverallPage] = useState(1);
  const [codingPage, setCodingPage] = useState(1);
  const [debugPage, setDebugPage] = useState(1);

  const overallTotalPages = Math.max(1, Math.ceil(combinedBoard.length / PAGE_SIZE));
  const codingTotalPages = Math.max(1, Math.ceil(codingBoard.length / PAGE_SIZE));
  const debugTotalPages = Math.max(1, Math.ceil(debuggingBoard.length / PAGE_SIZE));

  const pagedOverall = useMemo(
    () => combinedBoard.slice((overallPage - 1) * PAGE_SIZE, overallPage * PAGE_SIZE),
    [combinedBoard, overallPage]
  );
  const pagedCoding = useMemo(
    () => codingBoard.slice((codingPage - 1) * PAGE_SIZE, codingPage * PAGE_SIZE),
    [codingBoard, codingPage]
  );
  const pagedDebug = useMemo(
    () => debuggingBoard.slice((debugPage - 1) * PAGE_SIZE, debugPage * PAGE_SIZE),
    [debuggingBoard, debugPage]
  );

  return (
    <div className="leaderboards-container">
      <div className="page-header">
        <h1>ACM 100 Days of Code Standings</h1>
      </div>

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        listClassName="leaderboard-tabs-bar"
        aria-label="Leaderboard views"
      >
        <Tabs.List>
          <Tabs.Trigger value="overall" className="tab-btn" activeClassName="active">
            Overall Standings (100 Days)
          </Tabs.Trigger>
          <Tabs.Trigger value="coding" className="tab-btn" activeClassName="active">
            Coding - Week {currentWeek}
          </Tabs.Trigger>
          <Tabs.Trigger value="debugging" className="tab-btn" activeClassName="active">
            Debugging - Week {currentWeek}
          </Tabs.Trigger>
        </Tabs.List>

        <div className="table-responsive-container">
          <Tabs.Panel value="overall">
            <table className="leaderboard-table">
              <caption className="sr-only">Combined overall leaderboard for all 100 days</caption>
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Participant</th>
                  <th scope="col">GitHub / LeetCode</th>
                  <th scope="col">Coding Pts</th>
                  <th scope="col">Debugging Pts</th>
                  <th scope="col">Combined Streaks</th>
                  <th scope="col" className="align-right">
                    Total Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {combinedBoard.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      No rankings yet - scores will appear once challenges are graded.
                    </td>
                  </tr>
                ) : (
                  pagedOverall.map((row, idx) => {
                    const rankNum = (overallPage - 1) * PAGE_SIZE + idx + 1;
                    const isTop10 = rankNum <= 10;
                    return (
                      <tr
                        key={row.id}
                        className={`${isTop10 ? 'top10-highlight' : ''} ${rankNum === 1 ? 'gold-medalist' : ''}`}
                      >
                        <td className="rank-col">
                          <span className={`rank-badge rank-${rankNum}`}>#{rankNum}</span>
                        </td>
                        <td className="participant-col">
                          <div className="details">
                            <span className="name">{row.name}</span>
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
                          <div className="streaks-subrow">
                            <span className="streak-badge lc" title="LeetCode Streak">
                              LC: {row.leetCodeStreak}d
                            </span>
                            <span className="streak-badge git" title="GitHub Streak">
                              Git: {row.gitHubStreak}d
                            </span>
                          </div>
                        </td>
                        <td className="score-col align-right">{row.totalScore} pts</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <Pagination
              currentPage={overallPage}
              totalPages={overallTotalPages}
              onPageChange={setOverallPage}
            />
          </Tabs.Panel>

          <Tabs.Panel value="coding">
            <table className="leaderboard-table">
              <caption className="sr-only">Weekly coding leaderboard</caption>
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Participant</th>
                  <th scope="col">GitHub Handle</th>
                  <th scope="col">Solved Submissions</th>
                  <th scope="col" className="align-right">
                    Weekly Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedCoding.map((row, idx) => {
                  const rankNum = (codingPage - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <tr key={row.id}>
                      <td className="rank-col">
                        <span className={`rank-badge rank-${rankNum}`}>#{rankNum}</span>
                      </td>
                      <td>
                        <span className="name">{row.name}</span>
                      </td>
                      <td>
                        <span className="h-tag git">@{row.gitHubId}</span>
                      </td>
                      <td>{row.solvedCount} / 14 questions</td>
                      <td className="score-col align-right">{row.score} pts</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              currentPage={codingPage}
              totalPages={codingTotalPages}
              onPageChange={setCodingPage}
            />
          </Tabs.Panel>

          <Tabs.Panel value="debugging">
            <table className="leaderboard-table">
              <caption className="sr-only">Weekly debugging leaderboard</caption>
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Participant</th>
                  <th scope="col">GitHub Link</th>
                  <th scope="col">Challenge Status</th>
                  <th scope="col" className="align-right">
                    Debugging Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedDebug.map((row, idx) => {
                  const rankNum = (debugPage - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <tr key={row.id}>
                      <td className="rank-col">
                        <span className={`rank-badge rank-${rankNum}`}>#{rankNum}</span>
                      </td>
                      <td>
                        <span className="name">{row.name}</span>
                      </td>
                      <td>
                        <span className="h-tag git">@{row.gitHubId}</span>
                      </td>
                      <td>
                        <span className={`badge-status ${row.status.toLowerCase()}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="score-col align-right">{row.score} pts</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              currentPage={debugPage}
              totalPages={debugTotalPages}
              onPageChange={setDebugPage}
            />
          </Tabs.Panel>
        </div>
      </Tabs>
    </div>
  );
}
