import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { formatDateTime } from '../../../utils/dateFormat';

export default function GradingTab() {
  const { db, currentUser, gradeSubmission } = useApp();
  const [gradingFilter, setGradingFilter] = useState('pending');
  const [gradesInput, setGradesInput] = useState({});
  const [commentsInput, setCommentsInput] = useState({});
  const [gradeMsg, setGradeMsg] = useState('');

  const filteredSubs = db.submissions.filter((sub) => {
    const isPending = sub.marks === null || sub.marks === undefined;
    const isGraded = !isPending;
    const matchesFilter =
      gradingFilter === 'all' ||
      (gradingFilter === 'pending' && isPending) ||
      (gradingFilter === 'graded' && isGraded);
    const isRealSub = sub.status === 'Submitted' || sub.status === 'Late';
    return matchesFilter && isRealSub;
  });

  const handleGradeSubmit = async (subId) => {
    const marks = gradesInput[subId];
    const comment = commentsInput[subId] || '';
    const existingSub = db.submissions.find((s) => s.id === subId);
    const isEdit = existingSub?.marks !== null && existingSub?.marks !== undefined;

    if (marks === undefined || marks === '') {
      setGradeMsg('Please enter a grade score.');
      return;
    }

    if (Number(marks) < 0 || Number(marks) > 10) {
      setGradeMsg('Grade score must be between 0 and 10.');
      return;
    }

    const res = await gradeSubmission(subId, marks, comment, currentUser?.id || 'admin');
    if (res.success) {
      setGradeMsg(isEdit ? 'Score updated successfully.' : 'Submission graded successfully.');
      setGradesInput((prev) => {
        const copy = { ...prev };
        delete copy[subId];
        return copy;
      });
      setCommentsInput((prev) => {
        const copy = { ...prev };
        delete copy[subId];
        return copy;
      });
    } else {
      setGradeMsg(res.message);
    }
  };

  return (
    <div className="coord-panel admin-grading-panel">
      <div className="panel-header-row">
        <h3>Submission Marking</h3>
        <div className="toggle-filter-buttons">
          {['pending', 'all', 'graded'].map((filter) => (
            <button
              key={filter}
              type="button"
              className={`filter-btn ${gradingFilter === filter ? 'active' : ''}`}
              aria-pressed={gradingFilter === filter}
              onClick={() => setGradingFilter(filter)}
            >
              {filter === 'pending' && 'Pending Review Only'}
              {filter === 'all' && 'View All Submissions'}
              {filter === 'graded' && 'Edit Graded Scores'}
            </button>
          ))}
        </div>
      </div>

      {gradeMsg && (
        <div className="feedback-alert info" role="status" aria-live="polite">
          {gradeMsg}
        </div>
      )}

      {filteredSubs.length === 0 ? (
        <div className="no-items-alert">No submissions found matching the selected filter.</div>
      ) : (
        <div className="grading-queue-list">
          {filteredSubs.map((sub) => {
            const student = db.users.find((u) => u.id === sub.userId);
            const q = db.questions.find((question) => question.id === sub.questionId);
            const titleText = q
              ? sub.type === 'leetcode'
                ? `Part A (LeetCode): ${q.titleLc}`
                : `Part B (Custom): ${q.titleCustom}`
              : `Day ${sub.day} Challenge`;

            return (
              <div key={sub.id} className="grading-item-card">
                <div className="item-meta-info">
                  <div className="student-profile">
                    <span className="student-name">{student?.name || 'Unknown User'}</span>
                    <span className="sap-id">{student?.studentId}</span>
                  </div>
                  <div className="submission-day-badge">
                    <span>Day {sub.day}</span>
                    <span className={`badge-status ${sub.status.toLowerCase()}`}>{sub.status}</span>
                  </div>
                </div>

                <div className="sub-body">
                  <div className="problem-details" style={{ flex: 1 }}>
                    <h4>{titleText}</h4>
                    {sub.code ? (
                      <div className="submitted-code-block" style={{ marginTop: '0.75rem' }}>
                        <div
                          className="editor-tab"
                          style={{ fontSize: '0.7rem', width: 'fit-content' }}
                        >
                          Language: {sub.language ? sub.language.toUpperCase() : 'CPP'}
                        </div>
                        <pre
                          className="editor-block"
                          style={{
                            maxHeight: '200px',
                            fontSize: '0.75rem',
                            padding: '0.75rem',
                            margin: 0,
                          }}
                        >
                          <code>{sub.code}</code>
                        </pre>
                      </div>
                    ) : (
                      <p className="no-items-alert" style={{ marginTop: '0.75rem' }}>
                        No code submitted.
                      </p>
                    )}
                    <span className="sub-time" style={{ display: 'block', marginTop: '0.5rem' }}>
                      Submitted: {formatDateTime(sub.timestamp)}
                    </span>
                    {sub.marks !== null && (
                      <div className="grade-result" style={{ marginTop: '0.5rem' }}>
                        <span>
                          <strong>Current Score:</strong> {sub.marks} / 10
                        </span>
                        {sub.comments && <p className="comment">&ldquo;{sub.comments}&rdquo;</p>}
                      </div>
                    )}
                  </div>

                  <div className="grading-inputs-card">
                    <div className="form-group-inline">
                      <label htmlFor={`marks-${sub.id}`}>Marks (0-10):</label>
                      <input
                        id={`marks-${sub.id}`}
                        name="marks"
                        type="number"
                        min="0"
                        max="10"
                        placeholder={sub.marks !== null ? String(sub.marks) : 'Grade'}
                        value={gradesInput[sub.id] !== undefined ? gradesInput[sub.id] : ''}
                        onChange={(e) =>
                          setGradesInput((prev) => ({ ...prev, [sub.id]: e.target.value }))
                        }
                        className="score-input"
                        autoComplete="off"
                      />
                    </div>
                    <div className="form-group-inline">
                      <label htmlFor={`feedback-${sub.id}`}>Feedback Notes:</label>
                      <input
                        id={`feedback-${sub.id}`}
                        name="feedback"
                        type="text"
                        placeholder={
                          sub.comments ? sub.comments : 'Write brief evaluation remarks…'
                        }
                        value={commentsInput[sub.id] !== undefined ? commentsInput[sub.id] : ''}
                        onChange={(e) =>
                          setCommentsInput((prev) => ({ ...prev, [sub.id]: e.target.value }))
                        }
                        className="comment-input"
                        autoComplete="off"
                      />
                    </div>
                    <button
                      type="button"
                      className="grade-submit-btn"
                      onClick={() => handleGradeSubmit(sub.id)}
                    >
                      {sub.marks !== null ? 'Update Score' : 'Save Score'}
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
