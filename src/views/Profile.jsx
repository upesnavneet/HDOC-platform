import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/dateFormat';
import { updateUserProfile } from '../services/userService';
import StreakGrid from '../components/StreakGrid';
import './Profile.css';

const DAILY_QUOTES = [
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House" },
  { text: "Fix the cause, not the symptom.", author: "Steve Maguire" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Clean code always looks like it was written by someone who cares.", author: "Robert C. Martin" }
];

export default function Profile() {
  const { db, currentUser } = useApp();
  const [gitHubInput, setGitHubInput] = useState(currentUser?.gitHubId || '');
  const [isUpdatingGitHub, setIsUpdatingGitHub] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const currentDayIndex = (db.currentDay || 1) % DAILY_QUOTES.length;
  const dailyQuote = DAILY_QUOTES[currentDayIndex];

  const handleGitHubUpdate = async (e) => {
    e.preventDefault();
    if (!gitHubInput.trim() || !currentUser?.id) return;

    setIsUpdatingGitHub(true);
    try {
      await updateUserProfile(currentUser.id, { gitHubId: gitHubInput.trim() });
    } catch (error) {
      console.error('Failed to update GitHub ID:', error);
    }
    setIsUpdatingGitHub(false);
  };

  if (!currentUser) {
    return (
      <div className="new-profile-container error-state">
        <h1>Sign in to view your profile</h1>
        <p>Your stats, submission history, and rankings are waiting for you.</p>
      </div>
    );
  }

  // --- Data Computation ---
  const userSubs = useMemo(() => {
    const subs = (db.submissions || []).filter((s) => s?.userId === currentUser?.id);
    if (currentUser?.id && db.debuggingChallenges) {
      db.debuggingChallenges.forEach((challenge) => {
        const sub = challenge.submissions?.find((s) => s.userId === currentUser.id);
        if (sub) {
          subs.push({
            ...sub,
            day: challenge.week * 7,
            status: 'Submitted',
            type: 'debugging',
          });
        }
      });
    }
    return subs.sort(
      (a, b) =>
        (b.day || 0) - (a.day || 0) || String(a.type || '').localeCompare(String(b.type || ''))
    );
  }, [db.submissions, db.debuggingChallenges, currentUser?.id]);

  const totalSubmissionsCount = userSubs.filter(
    (s) => s.status === 'Submitted' || s.status === 'Late'
  ).length;
  const gradedSubmissions = userSubs.filter((s) => s.marks != null);
  const averageCodingScore =
    gradedSubmissions.length > 0
      ? (
          gradedSubmissions.reduce((acc, curr) => acc + Number(curr.marks || 0), 0) /
          gradedSubmissions.length
        ).toFixed(1)
      : '0.0';

  // Insights
  const bestScore =
    gradedSubmissions.length > 0
      ? Math.max(...gradedSubmissions.map((s) => Number(s.marks || 0))).toFixed(1)
      : '-';

  const typeCounts = userSubs.reduce((acc, sub) => {
    const typeLabel = sub.type === 'leetcode' ? 'Algorithms' : sub.type || 'Custom';
    acc[typeLabel] = (acc[typeLabel] || 0) + 1;
    return acc;
  }, {});
  let favoriteType = '-';
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      favoriteType = type;
    }
  }

  // Filtered Submissions for Table
  const filteredSubs = useMemo(() => {
    return userSubs.filter((sub) => {
      const q = (db.questions || []).find((question) => question.id === sub.questionId);
      const titleStr = q
        ? sub.type === 'leetcode'
          ? q.titleLc
          : q.titleCustom
        : `Day ${sub.day || '?'} Problem`;

      const safeTitleStr = titleStr || `Day ${sub.day || '?'} Problem`;
      const matchesSearch = String(safeTitleStr)
        .toLowerCase()
        .includes(String(searchQuery || '').toLowerCase());

      let matchesFilter = true;
      if (filter === 'Success') {
        matchesFilter = sub.marks != null && Number(sub.marks) > 0;
      } else if (filter === 'Pending') {
        matchesFilter = sub.marks == null;
      }

      return matchesSearch && matchesFilter;
    });
  }, [userSubs, db.questions, searchQuery, filter]);

  const gitHubHeatmapUrl = currentUser?.gitHubId
    ? `https://github-readme-activity-graph.vercel.app/graph?username=${currentUser.gitHubId}&bg_color=0d1117&color=58a6ff&line=58a6ff&point=58a6ff&area=true&hide_border=true&title_color=0d1117`
    : null;

  return (
    <div className="new-profile-container">
      {/* HEADER SECTION */}
      <div className="np-header-card">
        <div className="np-header-top">
          <div className="np-user-info">
            <div className="np-avatar-wrapper">
              {currentUser?.gitHubId ? (
                <img
                  src={`https://github.com/${currentUser.gitHubId}.png`}
                  alt="Profile"
                  className="np-avatar"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="np-avatar-fallback"
                style={{ display: currentUser?.gitHubId ? 'none' : 'flex' }}
              >
                {String(currentUser?.name || '?')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
            </div>
            <div className="np-user-details">
              <h1>{currentUser?.name || 'Unknown User'}</h1>
              <div className="np-user-meta">
                <span>SAP ID: {currentUser?.studentId || 'N/A'}</span>
                <span className="np-meta-dot">•</span>
                <span>@{currentUser?.gitHubId || currentUser?.studentId || 'user'}</span>
              </div>
            </div>
          </div>

          <div className="np-header-stats">
            <div className="np-stat-group">
              <span className="np-stat-label">CURRENT RANK</span>
              <span className="np-stat-value highlight">#{currentUser?.overallRank || '-'}</span>
            </div>
            <div className="np-stat-divider"></div>
            <div className="np-stat-group">
              <span className="np-stat-label">TOTAL SCORE</span>
              <span className="np-stat-value">
                {Number(currentUser?.totalCodingScore || 0) +
                  Number(currentUser?.totalDebuggingScore || 0)}{' '}
                <span className="np-stat-unit">pts</span>
              </span>
            </div>
            <div className="np-stat-divider"></div>
            <div className="np-stat-group">
              <span className="np-stat-label">CODING SCORE</span>
              <span className="np-stat-value">
                {averageCodingScore}
                <span className="np-stat-unit">/10</span>
              </span>
            </div>
          </div>
        </div>

        <div className="np-pills-row">
          <div className="np-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{totalSubmissionsCount} Solutions Submitted</span>
          </div>
          <div className="np-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>{averageCodingScore}/10 Avg Score</span>
          </div>

        </div>
      </div>

      {/* ACTIVITY & INSIGHTS */}
      <div className="np-activity-insights-layout">
        <div className="np-activity-card np-streak-override">
          <StreakGrid
            currentDay={db.currentDay || 1}
            submissions={userSubs}
            questions={db.questions || []}
          />
        </div>

        <div className="np-insights-card">
          <h3>DAILY QUOTE</h3>
          <div className="np-daily-quote-wrapper">
            <div className="np-daily-quote-text">
              <p>"{dailyQuote.text}"</p>
              <span>— {dailyQuote.author}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMISSION HISTORY */}
      <div className="np-history-card">
        <div className="np-history-header">
          <h2>SUBMISSION HISTORY</h2>
          <div className="np-history-controls">
            <div className="np-search-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="np-table-container">
          {filteredSubs.length === 0 ? (
            <div className="np-empty-state">No submissions match your filters.</div>
          ) : (
            <table className="np-history-table">
              <thead>
                <tr>
                  <th>DAY</th>
                  <th>PROBLEM</th>
                  <th>TYPE</th>
                  <th>STATUS</th>
                  <th>SCORE</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map((sub) => {
                  const q = (db.questions || []).find((question) => question.id === sub.questionId);
                  const titleStr = q
                    ? sub.type === 'leetcode'
                      ? q.titleLc
                      : q.titleCustom
                    : `Day ${sub.day || '?'} Problem`;

                  const isAccepted = sub.marks != null && Number(sub.marks) > 0;
                  const isPending = sub.marks == null;
                  const isWrong = sub.marks === 0 || sub.marks === '0';

                  return (
                    <tr key={sub.id}>
                      <td className="np-col-day">
                        Day
                        <br />
                        {sub.day || '?'}
                      </td>
                      <td className="np-col-problem">{titleStr}</td>
                      <td className="np-col-type">
                        <span className="np-type-badge">
                          {sub.type === 'leetcode' ? 'Algorithms' : sub.type || 'Custom'}
                        </span>
                      </td>
                      <td className="np-col-status">
                        {isAccepted ? (
                          <span className="np-status-badge success">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            Accepted
                          </span>
                        ) : isPending ? (
                          <span className="np-status-badge pending">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Pending
                          </span>
                        ) : (
                          <span className="np-status-badge error">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="15" y1="9" x2="9" y2="15"></line>
                              <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                            Wrong Answer
                          </span>
                        )}
                      </td>
                      <td className="np-col-score">
                        {sub.marks != null && !isNaN(Number(sub.marks))
                          ? Number(sub.marks).toFixed(1)
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
