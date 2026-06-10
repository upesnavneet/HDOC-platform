import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function DebuggingGradingTab() {
  const { db, gradeDebuggingSubmission } = useApp();
  const [activeDebugGradeWeek, setActiveDebugGradeWeek] = useState(1);
  const [debugGradesInput, setDebugGradesInput] = useState({});
  const [debugGradeMsg, setDebugGradeMsg] = useState('');

  const handleDebugGradeSubmit = async (challengeId, userId) => {
    const score = debugGradesInput[userId];
    if (score === undefined || score === '' || Number(score) < 0 || Number(score) > 20) {
      setDebugGradeMsg('Please enter a valid score between 0 and 20.');
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

  const selectedChallenge = db.debuggingChallenges.find((c) => c.week === activeDebugGradeWeek);

  return (
    <div className="coord-panel admin-grading-panel">
      <h3>Sunday Debugging - Grade &amp; Edit Scores</h3>
      <p className="panel-desc">Score debugging submissions out of 20. Changes sync to the leaderboard immediately.</p>
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
      </div>

      {!selectedChallenge ? (
        <div className="no-items-alert">No debugging challenge found for this week.</div>
      ) : (selectedChallenge.submissions || []).length === 0 ? (
        <div className="no-items-alert">No submissions for Week {selectedChallenge.week} yet.</div>
      ) : (
        <div className="grading-queue-list">
          {selectedChallenge.submissions.map((sub) => {
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
                    <a href={sub.link} target="_blank" rel="noopener noreferrer" className="repo-link">
                      View GitHub Submission
                    </a>
                    {hasScore && (
                      <div className="grade-result" style={{ marginTop: '0.5rem' }}>
                        <strong>Current Score:</strong> {sub.score} / 20
                      </div>
                    )}
                  </div>
                  <div className="grading-inputs-card">
                    <div className="form-group-inline">
                      <label htmlFor={`score-${sub.userId}`}>Score (0-20):</label>
                      <input
                        id={`score-${sub.userId}`}
                        name="score"
                        type="number"
                        min="0"
                        max="20"
                        placeholder={hasScore ? String(sub.score) : 'Score'}
                        value={debugGradesInput[sub.userId] !== undefined ? debugGradesInput[sub.userId] : ''}
                        onChange={(e) => setDebugGradesInput((prev) => ({ ...prev, [sub.userId]: e.target.value }))}
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
