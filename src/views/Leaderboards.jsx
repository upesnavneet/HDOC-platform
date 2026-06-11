import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
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

/* ── Tiny SVG icons ── */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <span className="lb-trend up" title="Trending Up">↑</span>;
  if (trend === 'down') return <span className="lb-trend down" title="Trending Down">↓</span>;
  return <span className="lb-trend neutral" title="No Change">→</span>;
};

const CrownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/><path d="M5 19h14v2H5z" opacity=".5"/></svg>
);

/* ── Tab config ── */
const TABS = [
  { id: 'daily', label: 'Daily' },
  { id: 'debugging', label: 'Debugging' },
  { id: 'contest', label: 'Contest' },
  { id: 'combined', label: 'Combined' },
];

/* ── Column config per tab ── */
const COLUMNS = {
  daily: [
    { key: 'rank', label: '#', align: 'center', width: '60px' },
    { key: 'participant', label: 'Participant' },
    { key: 'score', label: 'Daily Score', align: 'right' },
    { key: 'completedDays', label: 'Completed', align: 'center' },
    { key: 'streak', label: 'Streak', align: 'center' },
    { key: 'trend', label: 'Trend', align: 'center', width: '70px' },
  ],
  debugging: [
    { key: 'rank', label: '#', align: 'center', width: '60px' },
    { key: 'participant', label: 'Participant' },
    { key: 'score', label: 'Debug Score', align: 'right' },
    { key: 'bugsFixed', label: 'Bugs Fixed', align: 'center' },
    { key: 'debugStreak', label: 'Debug Streak', align: 'center' },
    { key: 'trend', label: 'Trend', align: 'center', width: '70px' },
  ],
  contest: [
    { key: 'rank', label: '#', align: 'center', width: '60px' },
    { key: 'participant', label: 'Participant' },
    { key: 'score', label: 'Contest Points', align: 'right' },
    { key: 'contestsPlayed', label: 'Played', align: 'center' },
    { key: 'bestRank', label: 'Best Rank', align: 'center' },
    { key: 'trend', label: 'Trend', align: 'center', width: '70px' },
  ],
  combined: [
    { key: 'rank', label: '#', align: 'center', width: '60px' },
    { key: 'participant', label: 'Participant' },
    { key: 'dailyScore', label: 'Daily', align: 'right' },
    { key: 'debugScore', label: 'Debug', align: 'right' },
    { key: 'contestScore', label: 'Contest', align: 'right' },
    { key: 'totalScore', label: 'Total', align: 'right' },
    { key: 'combinedStreak', label: 'Streak', align: 'center' },
    { key: 'trend', label: 'Trend', align: 'center', width: '70px' },
  ],
};

const PAGE_SIZE = 20;

/* ── Sort helpers ── */
function getSortValue(row, key) {
  if (key === 'participant') return row.name?.toLowerCase() || '';
  return row[key] ?? 0;
}

/* ── Main Component ── */
export default function Leaderboards() {
  const { db, currentUser } = useApp();
  const userId = currentUser?.uid || currentUser?.id;
  const {
    currentWeek,
    dailyBoard,
    debuggingBoard,
    contestBoard,
    combinedBoard,
    getYourPosition,
  } = useLeaderboardData(db, userId);

  const [activeTab, setActiveTab] = useState('combined');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  /* ── Select board based on active tab ── */
  const boardMap = { daily: dailyBoard, debugging: debuggingBoard, contest: contestBoard, combined: combinedBoard };
  const activeBoard = boardMap[activeTab] || combinedBoard;
  const scoreField = activeTab === 'combined' ? 'totalScore' : 'score';
  const yourPosition = getYourPosition(activeBoard, scoreField);

  /* ── Filter & Sort ── */
  const filteredBoard = useMemo(() => {
    let rows = [...activeBoard];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.name?.toLowerCase().includes(q) || r.gitHubId?.toLowerCase().includes(q));
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const av = getSortValue(a, sortKey);
        const bv = getSortValue(b, sortKey);
        if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        return sortDir === 'asc' ? av - bv : bv - av;
      });
    }
    return rows;
  }, [activeBoard, search, sortKey, sortDir]);

  /* ── Paginated rows ── */
  const displayBoard = filteredBoard.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBoard.length;

  /* ── Podium: Top 3 from the active board (unfiltered) ── */
  const top3 = activeBoard.slice(0, 3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  const handleSort = (key) => {
    if (key === 'participant' || key === 'rank' || key === 'trend') return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearch('');
    setSortKey(null);
    setVisibleCount(PAGE_SIZE);
  };

  const columns = COLUMNS[activeTab] || COLUMNS.combined;

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
    <div className="lb-page">
      {/* ═══ Header ═══ */}
      <header className="lb-header">
        <h1 className="lb-title">Leaderboard</h1>
        <p className="lb-subtitle">ACM 100 Days of Code — Week {currentWeek} Standings</p>
      </header>

      {/* ═══ Segmented Tabs ═══ */}
      <nav className="lb-tabs" role="tablist" aria-label="Leaderboard categories">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`lb-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ═══ Podium ═══ */}
      {podiumOrder.length > 0 && (
        <section className="lb-podium" aria-label="Top 3 Participants">
          {podiumOrder.map((row) => {
            const actualRank = activeBoard.indexOf(row) + 1;
            const medalClass = actualRank === 1 ? 'gold' : actualRank === 2 ? 'silver' : 'bronze';
            const scoreVal = row[scoreField] ?? row.score ?? 0;
            const streakVal = row.streak ?? row.debugStreak ?? row.combinedStreak ?? 0;
            return (
              <div key={row.id} className={`lb-podium-card ${medalClass} ${actualRank === 1 ? 'champion' : ''}`}>
                {actualRank === 1 && <span className="lb-crown"><CrownIcon /></span>}
                <span className="lb-podium-rank">#{actualRank}</span>
                <div className="lb-podium-avatar">{row.initials}</div>
                <h3 className="lb-podium-name">{row.name}</h3>
                <span className="lb-podium-handle">@{row.gitHubId}</span>
                <div className="lb-podium-stats">
                  <div className="lb-podium-stat">
                    <span className="lb-podium-stat-val">{scoreVal}</span>
                    <span className="lb-podium-stat-lbl">Score</span>
                  </div>
                  <div className="lb-podium-divider" />
                  <div className="lb-podium-stat">
                    <span className="lb-podium-stat-val">{streakVal}d</span>
                    <span className="lb-podium-stat-lbl">Streak</span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ═══ Your Position ═══ */}
      {yourPosition && (
        <section className="lb-your-pos" aria-label="Your Position">
          <h3 className="lb-your-pos-title">Your Position</h3>
          <div className="lb-your-pos-grid">
            <div className="lb-pos-item">
              <span className="lb-pos-val">#{yourPosition.rank}</span>
              <span className="lb-pos-lbl">Rank</span>
            </div>
            <div className="lb-pos-item">
              <span className={`lb-pos-val ${yourPosition.change === '+' ? 'trend-up' : yourPosition.change === '-' ? 'trend-down' : ''}`}>
                {yourPosition.change === '+' ? '↑' : yourPosition.change === '-' ? '↓' : '→'}
              </span>
              <span className="lb-pos-lbl">Change</span>
            </div>
            <div className="lb-pos-item">
              <span className="lb-pos-val">{yourPosition.score}</span>
              <span className="lb-pos-lbl">Score</span>
            </div>
            <div className="lb-pos-item">
              <span className="lb-pos-val">{yourPosition.streak}d</span>
              <span className="lb-pos-lbl">Streak</span>
            </div>
            <div className="lb-pos-item">
              <span className="lb-pos-val">{yourPosition.completionPct}%</span>
              <span className="lb-pos-lbl">Top %</span>
            </div>
          </div>
        </section>
      )}

      {/* ═══ Search ═══ */}
      <div className="lb-search-wrap">
        <span className="lb-search-icon"><SearchIcon /></span>
        <input
          type="text"
          className="lb-search-input"
          placeholder="Search participants..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
          aria-label="Search leaderboard"
        />
        <span className="lb-result-count">{filteredBoard.length} participants</span>
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
      {/* ═══ Table ═══ */}
      <div className="lb-table-wrap">
        <table className="lb-table" aria-label={`${activeTab} leaderboard`}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${col.align === 'right' ? 'align-right' : col.align === 'center' ? 'align-center' : ''} ${sortKey === col.key ? 'sorted' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => handleSort(col.key)}
                  role={col.key !== 'participant' && col.key !== 'rank' && col.key !== 'trend' ? 'columnheader button' : 'columnheader'}
                >
                  {col.label}
                  {sortKey === col.key && <span className="lb-sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayBoard.length === 0 ? (
              <tr><td colSpan={columns.length} className="lb-empty">No participants found.</td></tr>
            ) : (
              displayBoard.map((row) => {
                const rank = activeBoard.indexOf(row) + 1;
                const isMe = row.id === userId;
                return (
                  <tr key={row.id} className={`${rank <= 3 ? `lb-top3-row rank-${rank}` : ''} ${isMe ? 'lb-me-row' : ''}`}>
                    {columns.map((col) => {
                      /* ── Rank cell ── */
                      if (col.key === 'rank') {
                        return (
                          <td key={col.key} className="align-center">
                            <span className={`lb-rank-badge ${rank <= 3 ? `medal-${rank}` : ''}`}>
                              {rank}
                            </span>
                          </td>
                        );
                      }
                      /* ── Participant cell ── */
                      if (col.key === 'participant') {
                        return (
                          <td key={col.key}>
                            <div className="lb-participant-cell">
                              <div className={`lb-avatar ${rank <= 3 ? `medal-${rank}` : ''}`}>
                                {row.initials}
                              </div>
                              <div className="lb-user-info">
                                <span className="lb-user-name">{row.name}</span>
                                <span className="lb-user-handle">@{row.gitHubId}</span>
                              </div>
                              {row.badges?.length > 0 && (
                                <div className="lb-badges">
                                  {row.badges.slice(0, 2).map((b, i) => (
                                    <span key={i} className="lb-badge" title={b.label}>
                                      {b.emoji}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      }
                      /* ── Trend cell ── */
                      if (col.key === 'trend') {
                        return (
                          <td key={col.key} className="align-center">
                            <TrendIcon trend={row.trend} />
                          </td>
                        );
                      }
                      /* ── Generic value cell ── */
                      return (
                        <td key={col.key} className={col.align === 'right' ? 'align-right' : col.align === 'center' ? 'align-center' : ''}>
                          <span className="lb-cell-val">
                            {col.key === 'streak' || col.key === 'debugStreak' || col.key === 'combinedStreak'
                              ? `${row[col.key] ?? 0}d`
                              : col.key === 'completedDays'
                                ? `${row[col.key] ?? 0} days`
                                : `${row[col.key] ?? 0}`
                            }
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* ── Load More ── */}
        {hasMore && (
          <div className="lb-load-more-wrap">
            <button
              className="lb-load-more-btn"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              Load More ({filteredBoard.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
