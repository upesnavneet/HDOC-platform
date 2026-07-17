import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { formatDateTime } from '../../../utils/dateFormat';

export default function GradingTab() {
  const { db, currentUser, gradeSubmission } = useApp();
  const maxCodingScore = db.maxCodingScore ?? 10; // D1: from Firestore system/config
  const [gradingFilter, setGradingFilter] = useState('pending');
  const [dayFilter, setDayFilter] = useState(''); // F6: filter by day number
  const [searchTerm, setSearchTerm] = useState('');
  const [gradesInput, setGradesInput] = useState({});
  const [commentsInput, setCommentsInput] = useState({});
  const [gradeMsg, setGradeMsg] = useState('');

  // B4: only show submissions from active participants
  const activeUserIds = new Set(
    db.users.filter((u) => u.isActive !== false && !u.isAdminAccount).map((u) => u.id)
  );

  const filteredSubs = db.submissions.filter((sub) => {
    const isPending = sub.marks === null || sub.marks === undefined;
    const isGraded = !isPending;
    const matchesFilter =
      gradingFilter === 'all' ||
      (gradingFilter === 'pending' && isPending) ||
      (gradingFilter === 'graded' && isGraded);
    const isRealSub = sub.status === 'Submitted' || sub.status === 'Late';
    // F6: day filter — show all if blank, otherwise filter by specific day
    const matchesDay = !dayFilter || sub.day === Number(dayFilter);
    const student = db.users.find(u => u.id === sub.userId);
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || (student?.name?.toLowerCase().includes(term) || student?.studentId?.toLowerCase().includes(term));
    return matchesFilter && isRealSub && matchesDay && matchesSearch && activeUserIds.has(sub.userId);
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

    // D1: validate against coordinator-configurable max score
    if (Number(marks) < 0 || Number(marks) > maxCodingScore) {
      setGradeMsg(`Grade score must be between 0 and ${maxCodingScore}.`);
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
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by name or SAP ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '220px', padding: '0.3rem 0.5rem', borderRadius: '6px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
          {/* F6: Day filter */}
          <label htmlFor="day-filter" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Day:
          </label>
          <input
            id="day-filter"
            type="number"
            min="1"
            max="100"
            placeholder="All"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            style={{ width: '70px', padding: '0.3rem 0.5rem', borderRadius: '6px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            aria-label="Filter by day number"
          />
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
                    {/* F7: show when the submission was graded */}
                    {sub.gradedAt && (
                      <span className="sub-time" style={{ display: 'block', marginTop: '0.25rem', opacity: 0.7 }}>
                        Graded: {formatDateTime(sub.gradedAt)}
                      </span>
                    )}
                    {sub.marks !== null && (
                      <div className="grade-result" style={{ marginTop: '0.5rem' }}>
                        <span>
                          <strong>Current Score:</strong> {sub.marks} / {maxCodingScore}
                        </span>
                        {sub.comments && <p className="comment">&ldquo;{sub.comments}&rdquo;</p>}
                      </div>
                    )}
                  </div>

                  <div className="grading-inputs-card">
                    <div className="form-group-inline">
                      <label htmlFor={`marks-${sub.id}`}>Marks (0-{maxCodingScore}):</label>
                      <input
                        id={`marks-${sub.id}`}
                        name="marks"
                        type="number"
                        min="0"
                        max={maxCodingScore}
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
