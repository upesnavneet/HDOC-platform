import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useLeaderboardData } from '../hooks/useLeaderboard';

const PAGE_SIZE = 25;


/* ── Tiny SVG icons ── */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <span className="lb-trend up" title="Trending Up">↑</span>;
  if (trend === 'down') return <span className="lb-trend down" title="Trending Down">↓</span>;
  return <span className="lb-trend neutral" title="No Change">→</span>;
};

const CrownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" /><path d="M5 19h14v2H5z" opacity=".5" /></svg>
);

/* ── Tab config ── */
const TABS = [
  { id: 'daily', label: 'Daily' },
  { id: 'debugging', label: 'Debugging' },
  { id: 'contest', label: 'Contest' },
  { id: 'combined', label: 'Combined' },
];

/* ── Column config per tab — F8: rank + participant only in table ── */
const COLUMNS = {
  daily: [
    { key: 'rank', label: '#', align: 'center', width: '60px' },
    { key: 'participant', label: 'Participant' },
  ],
  debugging: [
    { key: 'rank', label: '#', align: 'center', width: '60px' },
    { key: 'participant', label: 'Participant' },
  ],
  contest: [
    { key: 'rank', label: '#', align: 'center', width: '60px' },
    { key: 'participant', label: 'Participant' },
    { key: 'contestsPlayed', label: 'Played', align: 'center' },
    { key: 'bestContestRank', label: 'Best Rank', align: 'center' },
  ],
  combined: [
    { key: 'rank', label: '#', align: 'center', width: '60px' },
    { key: 'participant', label: 'Participant' },
    { key: 'combinedStreak', label: 'Streak', align: 'center' },
  ],
};




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




  return (
    <div className="lb-page">
      {/* ═══ Header ═══ */}
      <header className="lb-header">
        <h1 className="lb-title">Leaderboard</h1>
        <p className="lb-subtitle">ACM 100 Days of Code Week {currentWeek} Standings</p>
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-orange)', fontWeight: 500, opacity: 0.9 }}>
          *Note: The leaderboard will be updated once in a week.
        </div>
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
                            {col.key === 'combinedStreak'
                              ? `${row[col.key] ?? 0}d`
                              : col.key === 'bestContestRank'
                                ? (row[col.key] ?? '—')
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
