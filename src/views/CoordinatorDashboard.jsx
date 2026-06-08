import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatSimulatedDate } from '../context/db';

export default function CoordinatorDashboard() {
  const {
    db,
    uploadQuestion,
    deleteQuestion,
    toggleUserStatus,
    resetParticipantStreak,
    updateParticipantStreaks,
    editParticipantProgress,
    completeWeek,
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [participantSearch, setParticipantSearch] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [editProgressUid, setEditProgressUid] = useState(null);
  const [editCodingScore, setEditCodingScore] = useState('');
  const [editDebugScore, setEditDebugScore] = useState('');
  const [editStreakUid, setEditStreakUid] = useState(null);
  const [editLcStreak, setEditLcStreak] = useState('');
  const [editGcStreak, setEditGcStreak] = useState('');
  const [weekToComplete, setWeekToComplete] = useState(1);
  const [weekMsg, setWeekMsg] = useState('');

  const [qDay, setQDay] = useState(db.currentDay + 1);
  const [qTitleLc, setQTitleLc] = useState('');
  const [qLinkLc, setQLinkLc] = useState('');
  const [qDescLc, setQDescLc] = useState('');
  const [qTitleCustom, setQTitleCustom] = useState('');
  const [qDescCustom, setQDescCustom] = useState('');
  const [qRating, setQRating] = useState('800');
  const [qSolution, setQSolution] = useState('');
  const [questionMsg, setQuestionMsg] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [challengeAction, setChallengeAction] = useState('add'); // add | edit | remove | schedule

  const participants = db.users.filter(u => u.role === 'participant');
  const currentDay = db.currentDay;
  const completedWeeks = db.completedWeeks || [];

  const todaySubs = db.submissions.filter(
    s => s.day === currentDay && (s.status === 'Submitted' || s.status === 'Late')
  );
  const uniqueTodaySubmitters = new Set(todaySubs.map(s => s.userId)).size;

  const activeToday = participants.filter(p => {
    const subs = db.submissions.filter(s => s.userId === p.id && s.day === currentDay);
    return subs.some(s => s.status === 'Submitted' || s.status === 'Late');
  }).length;

  const currentWeekDebug = db.debuggingChallenges.find(c => {
    const pub = new Date(c.publishedDate);
    const sim = new Date(db.simulatedTime);
    const weekStart = new Date(pub);
    weekStart.setDate(weekStart.getDate() - 6);
    return sim >= weekStart && sim <= new Date(pub.getTime() + 7 * 24 * 60 * 60 * 1000);
  });
  const debugSubsToday = currentWeekDebug
    ? currentWeekDebug.submissions.filter(s => {
        const subDate = new Date(s.timestamp).toDateString();
        return subDate === new Date(db.simulatedTime).toDateString();
      }).length
    : 0;

  const topPerformer = [...participants].sort(
    (a, b) => (b.totalCodingScore + b.totalDebuggingScore) - (a.totalCodingScore + a.totalDebuggingScore)
  )[0];

  const loadQuestionForEdit = (day) => {
    const q = db.questions.find(question => question.day === Number(day));
    if (!q) {
      setQuestionMsg(`No challenge found for Day ${day}.`);
      return;
    }
    setQDay(q.day);
    setQTitleLc(q.titleLc);
    setQLinkLc(q.linkLc);
    setQDescLc(q.descLc || '');
    setQTitleCustom(q.titleCustom);
    setQDescCustom(q.descCustom);
    setQRating(String(q.rating || q.difficulty || '800'));
    setQSolution(q.solutionCode || '');
    setEditMode(true);
    setQuestionMsg(`Loaded Day ${day} for editing.`);
  };

  const resetQuestionForm = () => {
    setQDay(db.currentDay + 1);
    setQTitleLc('');
    setQLinkLc('');
    setQDescLc('');
    setQTitleCustom('');
    setQDescCustom('');
    setQRating('800');
    setQSolution('');
    setEditMode(false);
    setQuestionMsg('');
  };

  const handleChallengeAction = (action) => {
    setChallengeAction(action);
    setQuestionMsg('');
    if (action === 'add' || action === 'schedule') {
      resetQuestionForm();
      setChallengeAction(action);
    }
    if (action === 'edit' && db.questions.length > 0) {
      loadQuestionForEdit(db.questions[0].day);
      setChallengeAction('edit');
    }
    if (action === 'remove' && db.questions.length > 0) {
      setQDay(db.questions[0].day);
    }
  };

  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    setQuestionMsg('');
    if (!qTitleLc || !qLinkLc || !qTitleCustom || !qDescCustom) {
      setQuestionMsg('Please fill in all required fields.');
      return;
    }
    const res = uploadQuestion({
      day: qDay,
      titleLc: qTitleLc,
      linkLc: qLinkLc,
      descLc: qDescLc,
      titleCustom: qTitleCustom,
      descCustom: qDescCustom,
      rating: qRating,
      solutionCode: qSolution,
    });
    if (res.success) {
      setQuestionMsg(res.message);
      if (!editMode) resetQuestionForm();
    }
  };

  const handleDeleteChallenge = () => {
    if (!window.confirm(`Delete challenge for Day ${qDay}?`)) return;
    const res = deleteQuestion(qDay);
    setQuestionMsg(res.message);
    if (res.success) resetQuestionForm();
  };

  const handleCompleteWeek = () => {
    const res = completeWeek(weekToComplete);
    setWeekMsg(res.message);
  };

  const filteredParticipants = participants.filter(p => {
    const term = participantSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.studentId.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="coordinator-dashboard-container">
      <div className="simulation-time-bar">
        <span>Simulated System Date: <strong>{formatSimulatedDate(db.simulatedTime)}</strong></span>
        <span>Challenge Day: <strong>Day {currentDay} / 100</strong></span>
      </div>

      <div className="page-header">
        <h1>Coordinator Dashboard</h1>
        <p className="subtitle">Manage participants, schedule challenges, and track weekly completion.</p>
      </div>

      <section className="coordinator-overview-cards">
        <div className="coord-stat-card glow-card">
          <div className="coord-stat-label">Total Participants</div>
          <div className="coord-stat-value">{participants.length}</div>
        </div>
        <div className="coord-stat-card glow-card">
          <div className="coord-stat-label">Active Today</div>
          <div className="coord-stat-value">{activeToday}</div>
        </div>
        <div className="coord-stat-card glow-card">
          <div className="coord-stat-label">Challenge Submissions Today</div>
          <div className="coord-stat-value">{uniqueTodaySubmitters}</div>
        </div>
        <div className="coord-stat-card glow-card">
          <div className="coord-stat-label">Sunday Debug Submissions</div>
          <div className="coord-stat-value">{debugSubsToday}</div>
        </div>
        <div className="coord-stat-card glow-card highlight">
          <div className="coord-stat-label">Top Performer</div>
          <div className="coord-stat-value coord-stat-name">
            {topPerformer ? topPerformer.name.split(' ')[0] : '—'}
          </div>
          {topPerformer && (
            <div className="coord-stat-footnote">
              {topPerformer.totalCodingScore + topPerformer.totalDebuggingScore} pts
            </div>
          )}
        </div>
      </section>

      <div className="coordinator-tabs">
        <button className={`coord-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Participants
        </button>
        <button className={`coord-tab ${activeTab === 'challenges' ? 'active' : ''}`} onClick={() => setActiveTab('challenges')}>
          Questions &amp; Challenges
        </button>
        <button className={`coord-tab ${activeTab === 'weeks' ? 'active' : ''}`} onClick={() => setActiveTab('weeks')}>
          Week Completion
        </button>
      </div>

      <div className="coordinator-workspace">
        {activeTab === 'overview' && (
          <div className="coord-panel">
            <div className="panel-header-row">
              <h3>Participant Management</h3>
              <input
                type="text"
                placeholder="Search participants..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="participants-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SAP ID</th>
                    <th>Scores</th>
                    <th>Streaks</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.studentId}</td>
                      <td>{p.totalCodingScore} / {p.totalDebuggingScore}</td>
                      <td>LC {p.leetCodeStreak} · GH {p.gitHubStreak}</td>
                      <td>
                        <span className={`badge-status ${p.isActive ? 'submitted' : 'missed'}`}>
                          {p.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td>
                        <div className="coord-action-buttons">
                          <button className="small-action-btn grey" onClick={() => setSelectedParticipant(p)}>
                            View Profile
                          </button>
                          <button className="small-action-btn grey" onClick={() => {
                            setEditStreakUid(p.id);
                            setEditLcStreak(p.leetCodeStreak);
                            setEditGcStreak(p.gitHubStreak);
                          }}>
                            Edit Streak
                          </button>
                          <button className="small-action-btn grey" onClick={() => {
                            setEditProgressUid(p.id);
                            setEditCodingScore(p.totalCodingScore);
                            setEditDebugScore(p.totalDebuggingScore);
                          }}>
                            Edit Progress
                          </button>
                          <button className="small-action-btn grey" onClick={() => resetParticipantStreak(p.id)}>
                            Reset Streak
                          </button>
                          <button
                            className={`small-action-btn ${p.isActive ? 'red' : 'green'}`}
                            onClick={() => toggleUserStatus(p.id)}
                          >
                            {p.isActive ? 'Suspend' : 'Reactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedParticipant && (
              <div className="coord-profile-modal">
                <div className="coord-profile-card">
                  <button className="coord-close-btn" onClick={() => setSelectedParticipant(null)}>×</button>
                  <h3>{selectedParticipant.name}</h3>
                  <p><strong>Email:</strong> {selectedParticipant.email}</p>
                  <p><strong>SAP ID:</strong> {selectedParticipant.studentId}</p>
                  <p><strong>GitHub:</strong> @{selectedParticipant.gitHubId}</p>
                  <p><strong>LeetCode:</strong> @{selectedParticipant.leetCodeId}</p>
                  <p><strong>Overall Rank:</strong> #{selectedParticipant.overallRank}</p>
                  <p><strong>Coding Score:</strong> {selectedParticipant.totalCodingScore} pts</p>
                  <p><strong>Debug Score:</strong> {selectedParticipant.totalDebuggingScore} pts</p>
                </div>
              </div>
            )}

            {editProgressUid && (
              <div className="coord-profile-modal">
                <div className="coord-profile-card">
                  <h3>Edit Progress</h3>
                  <div className="form-group">
                    <label>Coding Score</label>
                    <input type="number" value={editCodingScore} onChange={(e) => setEditCodingScore(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Debug Score</label>
                    <input type="number" value={editDebugScore} onChange={(e) => setEditDebugScore(e.target.value)} />
                  </div>
                  <div className="coord-action-buttons">
                    <button className="small-action-btn green" onClick={() => {
                      editParticipantProgress(editProgressUid, editCodingScore, editDebugScore);
                      setEditProgressUid(null);
                    }}>Save</button>
                    <button className="small-action-btn red" onClick={() => setEditProgressUid(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {editStreakUid && (
              <div className="coord-profile-modal">
                <div className="coord-profile-card">
                  <h3>Edit Streak</h3>
                  <div className="form-group">
                    <label>LeetCode Streak</label>
                    <input type="number" value={editLcStreak} onChange={(e) => setEditLcStreak(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>GitHub Streak</label>
                    <input type="number" value={editGcStreak} onChange={(e) => setEditGcStreak(e.target.value)} />
                  </div>
                  <div className="coord-action-buttons">
                    <button className="small-action-btn green" onClick={() => {
                      updateParticipantStreaks(editStreakUid, editGcStreak, editLcStreak);
                      setEditStreakUid(null);
                    }}>Save</button>
                    <button className="small-action-btn red" onClick={() => setEditStreakUid(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="coord-panel">
            <h3>Question &amp; Challenge Management</h3>
            <p className="panel-desc">Add, edit, remove, or schedule daily questions and coding challenges.</p>
            {questionMsg && <div className="feedback-alert info">{questionMsg}</div>}

            <div className="coord-action-strip">
              <button
                type="button"
                className={`coord-action-btn glow-card ${challengeAction === 'add' ? 'active' : ''}`}
                onClick={() => handleChallengeAction('add')}
              >
                Add Question
              </button>
              <button
                type="button"
                className={`coord-action-btn glow-card ${challengeAction === 'edit' ? 'active' : ''}`}
                onClick={() => handleChallengeAction('edit')}
              >
                Edit Question
              </button>
              <button
                type="button"
                className={`coord-action-btn glow-card ${challengeAction === 'remove' ? 'active' : ''}`}
                onClick={() => handleChallengeAction('remove')}
              >
                Remove Question
              </button>
              <button
                type="button"
                className={`coord-action-btn glow-card ${challengeAction === 'schedule' ? 'active' : ''}`}
                onClick={() => handleChallengeAction('schedule')}
              >
                Schedule Challenge
              </button>
            </div>

            {challengeAction === 'remove' ? (
              <div className="coord-remove-panel glow-card">
                <h4>Remove Question / Challenge</h4>
                <div className="coord-challenge-toolbar">
                  <label>Select day to remove:</label>
                  <select
                    value={qDay}
                    onChange={(e) => setQDay(Number(e.target.value))}
                  >
                    {db.questions.map(q => (
                      <option key={q.id} value={q.day}>Day {q.day} — {q.titleLc}</option>
                    ))}
                  </select>
                  <button type="button" className="small-action-btn red" onClick={handleDeleteChallenge}>
                    Remove Challenge
                  </button>
                </div>
              </div>
            ) : (
              <>
                {(challengeAction === 'edit') && (
                  <div className="coord-challenge-toolbar">
                    <label>Load day to edit:</label>
                    <select
                      value={qDay}
                      onChange={(e) => loadQuestionForEdit(e.target.value)}
                    >
                      {db.questions.map(q => (
                        <option key={q.id} value={q.day}>Day {q.day} — {q.titleLc}</option>
                      ))}
                    </select>
                  </div>
                )}

                <form className="admin-form glow-card coord-form-panel" onSubmit={handleQuestionSubmit}>
                  <h4 className="coord-form-title">
                    {challengeAction === 'add' && 'Add New Question'}
                    {challengeAction === 'edit' && 'Edit Question'}
                    {challengeAction === 'schedule' && 'Schedule Question & Challenge'}
                  </h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>{challengeAction === 'schedule' ? 'Schedule Day (1–100)' : 'Day Number (1–100)'}</label>
                      <input type="number" min="1" max="100" value={qDay} onChange={(e) => setQDay(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Rating</label>
                      <select value={qRating} onChange={(e) => setQRating(e.target.value)}>
                        <option value="800">800</option>
                        <option value="850">850</option>
                        <option value="900">900</option>
                        <option value="1000">1000</option>
                        <option value="1100">1100</option>
                        <option value="1200">1200</option>
                        <option value="1300">1300</option>
                        <option value="1400">1400</option>
                        <option value="1500">1500</option>
                        <option value="1600">1600</option>
                        <option value="1700">1700</option>
                        <option value="1800">1800</option>
                        <option value="1900">1900</option>
                        <option value="2000">2000</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>LeetCode Title</label>
                      <input type="text" value={qTitleLc} onChange={(e) => setQTitleLc(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>LeetCode URL</label>
                      <input type="url" value={qLinkLc} onChange={(e) => setQLinkLc(e.target.value)} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>LeetCode Description</label>
                    <textarea value={qDescLc} onChange={(e) => setQDescLc(e.target.value)} rows="2" />
                  </div>
                  <div className="form-group">
                    <label>Custom DSA Title</label>
                    <input type="text" value={qTitleCustom} onChange={(e) => setQTitleCustom(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Custom DSA Description</label>
                    <textarea value={qDescCustom} onChange={(e) => setQDescCustom(e.target.value)} rows="3" required />
                  </div>
                  <div className="form-group">
                    <label>Reference Solution (optional)</label>
                    <textarea value={qSolution} onChange={(e) => setQSolution(e.target.value)} className="code-textarea" rows="4" />
                  </div>
                  <div className="coord-action-buttons">
                    <button type="submit" className="auth-action-btn admin-submit">
                      {challengeAction === 'add' && 'Add Question'}
                      {challengeAction === 'edit' && 'Save Changes'}
                      {challengeAction === 'schedule' && 'Schedule Challenge'}
                    </button>
                    {editMode && challengeAction === 'edit' && (
                      <button type="button" className="small-action-btn red" onClick={handleDeleteChallenge}>
                        Remove Question
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {activeTab === 'weeks' && (
          <div className="coord-panel">
            <h3>Week Completion</h3>
            <p className="panel-desc">Mark a week as complete once all daily challenges and Sunday debug for that week are finished.</p>
            {weekMsg && <div className="feedback-alert info">{weekMsg}</div>}

            <div className="week-completion-row glow-card coord-week-panel">
              <select value={weekToComplete} onChange={(e) => setWeekToComplete(Number(e.target.value))}>
                {Array.from({ length: 14 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
              <button className="auth-action-btn admin-submit" onClick={handleCompleteWeek}>
                Mark Week Complete
              </button>
            </div>

            <div className="completed-weeks-list">
              <h4>Completed Weeks</h4>
              {completedWeeks.length === 0 ? (
                <p className="no-items-alert">No weeks marked complete yet.</p>
              ) : (
                <div className="week-badges-row">
                  {completedWeeks.map(w => (
                    <span key={w} className="week-complete-badge">Week {w} Complete</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
