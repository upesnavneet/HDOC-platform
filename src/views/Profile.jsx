import React from 'react';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { db, currentUser } = useApp();

  if (!currentUser) {
    return (
      <div className="profile-container error-state">
        <h2>Please Sign In</h2>
        <p>You must be signed in to view your profile details.</p>
      </div>
    );
  }

  // Filter submissions by current user
  const userSubs = db.submissions
    .filter(s => s.userId === currentUser.id)
    .sort((a, b) => b.day - a.day || a.type.localeCompare(b.type)); // Sorted by day descending, then type

  // Calculate stats
  const totalSubmissionsCount = userSubs.filter(s => s.status === 'Submitted' || s.status === 'Late').length;
  const gradedSubmissions = userSubs.filter(s => s.marks !== null);
  const averageCodingScore = gradedSubmissions.length > 0 
    ? (gradedSubmissions.reduce((acc, curr) => acc + curr.marks, 0) / gradedSubmissions.length).toFixed(1)
    : '0.0';

  // Find debugging contributions
  const debugParticipationsCount = db.debuggingChallenges.filter(challenge => {
    return challenge.submissions.some(sub => sub.userId === currentUser.id);
  }).length;

  return (
    <div className="profile-container">
      <div className="profile-hero-card">
        <div className="profile-identity">
          <div className="profile-avatar">
            {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div className="profile-details">
            <h1>{currentUser.name}</h1>
            <span className="student-sap">SAP ID: {currentUser.studentId}</span>
            <div className="profile-handles">
              <span className="handle-tag git">GitHub: @{currentUser.gitHubId}</span>
              <span className="handle-tag lc">LeetCode: @{currentUser.leetCodeId}</span>
            </div>
          </div>
        </div>

        <div className="profile-standings-highlights">
          <div className="highlight-metric">
            <span className="label">Overall Rank</span>
            <span className="val">#{currentUser.overallRank}</span>
          </div>
          <div className="highlight-metric">
            <span className="label">Total Score</span>
            <span className="val">{currentUser.totalCodingScore + currentUser.totalDebuggingScore} pts</span>
          </div>
          <div className="highlight-metric">
            <span className="label">Active Streaks</span>
            <span className="val font-small">
              LC: {currentUser.leetCodeStreak}d <br />
              Git: {currentUser.gitHubStreak}d
            </span>
          </div>
        </div>
      </div>

      {/* Profile Metrics Grid */}
      <section className="profile-metrics-summary">
        <div className="metric-box">
          <h3>{totalSubmissionsCount}</h3>
          <p>Daily Solutions Solved</p>
        </div>
        <div className="metric-box">
          <h3>{averageCodingScore} / 10</h3>
          <p>Average Coding Grade</p>
        </div>
        <div className="metric-box">
          <h3>{debugParticipationsCount}</h3>
          <p>Debugging Sunday Battles</p>
        </div>
        <div className="metric-box">
          <h3>{currentUser.totalDebuggingScore} pts</h3>
          <p>Cumulative Debug Score</p>
        </div>
      </section>

      {/* History of Solutions Table */}
      <section className="profile-history-section">
        <h2>My Solution Submission History</h2>
        
        <div className="table-responsive-container">
          {userSubs.length === 0 ? (
            <div className="no-history">You have not submitted any solutions yet. Active questions are available on the dashboard.</div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Challenge Type</th>
                  <th>Solution URL</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Admin Evaluation Notes</th>
                </tr>
              </thead>
              <tbody>
                {userSubs.map(sub => {
                  const q = db.questions.find(question => question.id === sub.questionId);
                  const titleStr = q 
                    ? (sub.type === 'leetcode' ? q.titleLc : q.titleCustom)
                    : `Day ${sub.day} Problem`;

                  return (
                    <tr key={sub.id}>
                      <td className="day-col">Day {sub.day}</td>
                      <td>
                        <span className={`challenge-type-tag ${sub.type}`}>
                          {sub.type === 'leetcode' ? 'LeetCode' : 'Custom DSA'}
                        </span>
                      </td>
                      <td className="url-col" style={{ maxWidth: '300px' }}>
                        {sub.code ? (
                          <details style={{ cursor: 'pointer' }}>
                            <summary style={{ color: 'var(--color-primary)', fontWeight: '600', outline: 'none' }}>
                              Show Code ({sub.language ? sub.language.toUpperCase() : 'CPP'})
                            </summary>
                            <pre className="editor-block" style={{ maxHeight: '150px', maxWidth: '280px', overflow: 'auto', fontSize: '0.75rem', padding: '0.5rem', marginTop: '0.25rem', textAlign: 'left', margin: 0 }}>
                              <code>{sub.code}</code>
                            </pre>
                          </details>
                        ) : sub.link ? (
                          <div className="solution-links">
                            <a href={sub.link} target="_blank" rel="noreferrer" className="repo-link">GitHub File &nearr;</a>
                            {sub.type === 'leetcode' && sub.lcLink && (
                              <a href={sub.lcLink} target="_blank" rel="noreferrer" className="repo-link leetcode">LeetCode &nearr;</a>
                            )}
                          </div>
                        ) : (
                          <span className="no-link">-</span>
                        )}
                      </td>
                      <td className="date-col">
                        {sub.timestamp ? new Date(sub.timestamp).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        <span className={`badge-status ${sub.status.toLowerCase()}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="score-col">
                        {sub.marks !== null ? <strong>{sub.marks} / 10</strong> : <span className="pending">Pending</span>}
                      </td>
                      <td className="comments-col">
                        {sub.comments ? <span className="comment">"{sub.comments}"</span> : <span className="no-comment">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
