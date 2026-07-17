import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function DebuggingGradingTab() {
  const { db, gradeDebuggingSubmission } = useApp();
  const maxDebugScore = db.maxDebugScore ?? 20; // D1: from Firestore system/config
  const [activeDebugGradeWeek, setActiveDebugGradeWeek] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debugGradesInput, setDebugGradesInput] = useState({});
  const [debugGradeMsg, setDebugGradeMsg] = useState('');

  const handleDebugGradeSubmit = async (challengeId, userId) => {
    const score = debugGradesInput[userId];
    if (score === undefined || score === '' || Number(score) < 0 || Number(score) > maxDebugScore) {
      setDebugGradeMsg(`Please enter a valid score between 0 and ${maxDebugScore}.`);
      return;
    }
    const res = await gradeDebuggingSubmission(challengeId, userId, score);
    setDebugGradeMsg(res.message);
    if (res.success) {
      setDebugGradesInput((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    }
  };

  // B4: only show submissions from active participants
  const activeUserIds = new Set(
    db.users.filter((u) => u.isActive !== false && !u.isAdminAccount).map((u) => u.id)
  );

  const selectedChallenge = db.debuggingChallenges.find((c) => c.week === activeDebugGradeWeek);
  // B4: filter out inactive participant submissions
  const visibleSubmissions = (selectedChallenge?.submissions || []).filter((s) => {
    if (!activeUserIds.has(s.userId)) return false;
    const student = db.users.find(u => u.id === s.userId);
    const term = searchTerm.toLowerCase();
    return !term || (student?.name?.toLowerCase().includes(term) || student?.studentId?.toLowerCase().includes(term));
  });

  return (
    <div className="coord-panel admin-grading-panel">
      <h3>Sunday Debugging - Grade &amp; Edit Scores</h3>
      <p className="panel-desc">
        Score debugging submissions out of {maxDebugScore}. Changes sync to the leaderboard immediately.
      </p>
      {debugGradeMsg && (
        <div className="feedback-alert info" role="status" aria-live="polite">
          {debugGradeMsg}
        </div>
      )}

      <div className="select-challenge-row" style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="debug-grade-week">Select Week Challenge:</label>
        <select
          id="debug-grade-week"
          value={activeDebugGradeWeek}
          onChange={(e) => setActiveDebugGradeWeek(Number(e.target.value))}
        >
          {db.debuggingChallenges.map((c) => (
            <option key={c.id} value={c.week}>
              Week {c.week} - {c.theme}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by name or SAP ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '220px', padding: '0.3rem 0.5rem', borderRadius: '6px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', marginLeft: '1rem' }}
        />
      </div>

      {!selectedChallenge ? (
        <div className="no-items-alert">No debugging challenge found for this week.</div>
      ) : visibleSubmissions.length === 0 ? (
        <div className="no-items-alert">No active participant submissions for Week {selectedChallenge.week} yet.</div>
      ) : (
        <div className="grading-queue-list">
          {visibleSubmissions.map((sub) => {
            const student = db.users.find((u) => u.id === sub.userId || u.uid === sub.userId);
            const hasScore = sub.score !== null && sub.score !== undefined;
            return (
              <div key={sub.userId} className="grading-item-card">
                <div className="item-meta-info">
                  <div className="student-profile">
                    <span className="student-name">{student?.name || 'Unknown User'}</span>
                    <span className="sap-id">{student?.studentId}</span>
                  </div>
                  <div className="submission-day-badge">
                    <span>Week {selectedChallenge.week}</span>
                    <span className={`badge-status ${hasScore ? 'submitted' : 'missed'}`}>
                      {hasScore ? 'Graded' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="sub-body">
                  <div className="problem-details" style={{ flex: 1 }}>
                    <h4>{selectedChallenge.theme}</h4>
                    <a
                      href={sub.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="repo-link"
                    >
                      View GitHub Submission
                    </a>
                    {/* F7: show graded timestamp */}
                    {sub.gradedAt && (
                      <span className="sub-time" style={{ display: 'block', marginTop: '0.25rem', opacity: 0.7 }}>
                        Graded: {new Date(sub.gradedAt).toLocaleString()}
                      </span>
                    )}
                    {hasScore && (
                      <div className="grade-result" style={{ marginTop: '0.5rem' }}>
                        <strong>Current Score:</strong> {sub.score} / {maxDebugScore}
                      </div>
                    )}
                  </div>
                  <div className="grading-inputs-card">
                    <div className="form-group-inline">
                      <label htmlFor={`score-${sub.userId}`}>Score (0-{maxDebugScore}):</label>
                      <input
                        id={`score-${sub.userId}`}
                        name="score"
                        type="number"
                        min="0"
                        max={maxDebugScore}
                        placeholder={hasScore ? String(sub.score) : 'Score'}
                        value={
                          debugGradesInput[sub.userId] !== undefined
                            ? debugGradesInput[sub.userId]
                            : ''
                        }
                        onChange={(e) =>
                          setDebugGradesInput((prev) => ({ ...prev, [sub.userId]: e.target.value }))
                        }
                        className="score-input"
                        autoComplete="off"
                      />
                    </div>
                    <button
                      type="button"
                      className="grade-submit-btn"
                      onClick={() => handleDebugGradeSubmit(selectedChallenge.id, sub.userId)}
                    >
                      {hasScore ? 'Update Score' : 'Save Score'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
