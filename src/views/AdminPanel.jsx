import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatSimulatedDate } from '../context/db';

export default function AdminPanel() {
  const { 
    db, 
    currentUser, 
    gradeSubmission, 
    gradeDebuggingSubmission, 
    updateParticipantStreaks, 
    toggleUserStatus, 
    uploadQuestion, 
    uploadHandout, 
    setSimulatedTimeAndDay, 
    uploadDebuggingChallenge 
  } = useApp();

  const [adminTab, setAdminTab] = useState('grading'); // 'grading', 'questions', 'debugging', 'participants', 'time'

  // Time Travel states
  const [targetDay, setTargetDay] = useState(db.currentDay);
  const [targetTime, setTargetTime] = useState(db.simulatedTime.substring(0, 16)); // YYYY-MM-DDTHH:MM
  const [timeTravelMsg, setTimeTravelMsg] = useState('');

  // Daily Question Form states
  const [qDay, setQDay] = useState(db.currentDay + 1);
  const [qTitleLc, setQTitleLc] = useState('');
  const [qLinkLc, setQLinkLc] = useState('');
  const [qDescLc, setQDescLc] = useState('');
  const [qTitleCustom, setQTitleCustom] = useState('');
  const [qDescCustom, setQDescCustom] = useState('');
  const [qRating, setQRating] = useState('800');
  const [qHandout, setQHandout] = useState('');
  const [qSolution, setQSolution] = useState('');
  const [questionMsg, setQuestionMsg] = useState('');

  // Sunday Debug Challenge Form states
  const [dWeek, setDWeek] = useState(4);
  const [dTheme, setDTheme] = useState('');
  const [dDesc, setDDesc] = useState('');
  const [dCode, setDCode] = useState('');
  const [dPubDate, setDPubDate] = useState('');
  const [debugMsg, setDebugMsg] = useState('');

  // Selected Debug challenge to grade
  const [activeDebugGradeWeek, setActiveDebugGradeWeek] = useState(1);

  // Search/Filter states
  const [gradingFilter, setGradingFilter] = useState('pending'); // 'pending', 'all'
  const [participantSearch, setParticipantSearch] = useState('');

  // Individual Grading states (stores inputs dynamically per submission ID)
  const [gradesInput, setGradesInput] = useState({});
  const [commentsInput, setCommentsInput] = useState({});

  // Individual Streak states per user ID
  const [editStreakUid, setEditStreakUid] = useState(null);
  const [editGcStreak, setEditGcStreak] = useState('');
  const [editLcStreak, setEditLcStreak] = useState('');

  const participants = db.users.filter(u => u.role === 'participant');

  // Handle Time Travel Submission
  const handleTimeTravelSubmit = (e) => {
    e.preventDefault();
    setTimeTravelMsg('');
    try {
      const isoStr = new Date(targetTime).toISOString();
      const res = setSimulatedTimeAndDay(isoStr, targetDay);
      if (res.success) {
        setTimeTravelMsg('Warped successfully! Leaderboards and missed challenges updated.');
      }
    } catch (err) {
      setTimeTravelMsg('Error: Invalid date/time format.');
    }
  };

  // Handle Upload Question
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
      handout: qHandout,
      solutionCode: qSolution
    });

    if (res.success) {
      setQuestionMsg(res.message);
      // Reset fields
      setQTitleLc('');
      setQLinkLc('');
      setQDescLc('');
      setQTitleCustom('');
      setQDescCustom('');
      setQHandout('');
      setQSolution('');
      setQDay(db.currentDay + 1);
    }
  };

  // Handle Upload Debug Challenge
  const handleDebugSubmit = (e) => {
    e.preventDefault();
    setDebugMsg('');
    if (!dTheme || !dDesc || !dCode || !dPubDate) {
      setDebugMsg('Please fill in all required fields.');
      return;
    }
    try {
      const pubIso = new Date(dPubDate).toISOString();
      const res = uploadDebuggingChallenge({
        week: dWeek,
        theme: dTheme,
        description: dDesc,
        starterCode: dCode,
        publishedDate: pubIso
      });
      if (res.success) {
        setDebugMsg(res.message);
        setDTheme('');
        setDDesc('');
        setDCode('');
        setDPubDate('');
        setDWeek(dWeek + 1);
      }
    } catch (err) {
      setDebugMsg('Error scheduling challenge: Invalid date.');
    }
  };

  // Handle Submission Grading
  const handleGradeSubmit = (subId) => {
    const marks = gradesInput[subId];
    const comment = commentsInput[subId] || '';

    if (marks === undefined || marks === '') {
      alert('Please enter a grade score.');
      return;
    }

    if (Number(marks) < 0 || Number(marks) > 10) {
      alert('Grade score must be between 0 and 10.');
      return;
    }

    const res = gradeSubmission(subId, marks, comment, currentUser.id);
    if (res.success) {
      // Clear specific submission input cache
      setGradesInput(prev => {
        const copy = { ...prev };
        delete copy[subId];
        return copy;
      });
    }
  };

  // Handle Sunday Debug Challenge Grading
  const handleDebugGradeSubmit = (challengeId, userId, score) => {
    if (score === undefined || score === '' || Number(score) < 0 || Number(score) > 20) {
      alert('Please enter a valid score between 0 and 20.');
      return;
    }
    const res = gradeDebuggingSubmission(challengeId, userId, score);
    if (res.success) {
      alert('Graded Sunday Debug submission.');
    }
  };

  // Save manual streaks
  const handleSaveStreaks = (userId) => {
    if (editGcStreak === '' || editLcStreak === '') {
      alert('Streaks cannot be blank.');
      return;
    }
    const res = updateParticipantStreaks(userId, editGcStreak, editLcStreak);
    if (res.success) {
      setEditStreakUid(null);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    // Generate Overall Standings CSV
    const headers = ['Rank', 'Name', 'Student SAP ID', 'Email', 'GitHub ID', 'LeetCode ID', 'Coding Points', 'Debugging Points', 'Total Score', 'LeetCode Streak', 'GitHub Streak', 'Account Active'];
    
    const rows = participants.map(p => [
      p.overallRank,
      p.name,
      p.studentId,
      p.email,
      p.gitHubId,
      p.leetCodeId,
      p.totalCodingScore,
      p.totalDebuggingScore,
      p.totalCodingScore + p.totalDebuggingScore,
      p.leetCodeStreak,
      p.gitHubStreak,
      p.isActive ? 'Yes' : 'No'
    ]);

    const csvContent = 
      'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `acm_100_days_scoreboard_day${db.currentDay}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered submissions for grading
  const filteredSubs = db.submissions.filter(sub => {
    const isPending = sub.marks === null;
    const matchesFilter = gradingFilter === 'all' || (gradingFilter === 'pending' && isPending);
    // Ignore missed placeholder items
    const isRealSub = sub.status === 'Submitted' || sub.status === 'Late';

    return matchesFilter && isRealSub;
  });

  return (
    <div className="admin-panel-container">
      {/* Simulation Info */}
      <div className="simulation-time-bar">
        <span>Active Simulated Time: <strong>{formatSimulatedDate(db.simulatedTime)}</strong></span>
        <span>Challenge Day: <strong>Day {db.currentDay} / 100</strong></span>
      </div>

      <div className="page-header">
        <h1>Technical Chapter Console</h1>
        <p className="subtitle">Manual submission reviews, score uploads, schedule timers, streak managers, and CSV exporters.</p>
      </div>

      {/* Admin Sub Navigation */}
      <div className="admin-sub-navbar">
        <button className={`sub-nav-btn ${adminTab === 'grading' ? 'active' : ''}`} onClick={() => setAdminTab('grading')}>
          Submission Grading Queue ({filteredSubs.length})
        </button>
        <button className={`sub-nav-btn ${adminTab === 'questions' ? 'active' : ''}`} onClick={() => setAdminTab('questions')}>
          Create Daily Challenges
        </button>
        <button className={`sub-nav-btn ${adminTab === 'debugging' ? 'active' : ''}`} onClick={() => setAdminTab('debugging')}>
          Sunday Debug Challenges
        </button>
        <button className={`sub-nav-btn ${adminTab === 'participants' ? 'active' : ''}`} onClick={() => setAdminTab('participants')}>
          Participant Streaks & Exports
        </button>
        <button className={`sub-nav-btn time-traveler ${adminTab === 'time' ? 'active' : ''}`} onClick={() => setAdminTab('time')}>
          Time-Travel Dashboard
        </button>
      </div>

      {/* Panels rendering */}
      <div className="admin-workspace-card">

        {/* 1. GRADING QUEUE */}
        {adminTab === 'grading' && (
          <div className="admin-grading-panel">
            <div className="panel-header-row">
              <h3>DSA Evaluation Dashboard</h3>
              <div className="toggle-filter-buttons">
                <button 
                  className={`filter-btn ${gradingFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setGradingFilter('pending')}
                >
                  Pending Review Only
                </button>
                <button 
                  className={`filter-btn ${gradingFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setGradingFilter('all')}
                >
                  View All Submissions
                </button>
              </div>
            </div>

            {filteredSubs.length === 0 ? (
              <div className="no-items-alert">No submissions found matching the selected filter. Good job!</div>
            ) : (
              <div className="grading-queue-list">
                {filteredSubs.map(sub => {
                  const student = db.users.find(u => u.id === sub.userId);
                  const q = db.questions.find(question => question.id === sub.questionId);
                  const titleText = q 
                    ? (sub.type === 'leetcode' ? `Part A (LeetCode): ${q.titleLc}` : `Part B (Custom): ${q.titleCustom}`)
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
                              <div className="editor-tab" style={{ fontSize: '0.7rem', width: 'fit-content' }}>
                                Language: {sub.language ? sub.language.toUpperCase() : 'CPP'}
                              </div>
                              <pre className="editor-block" style={{ maxHeight: '200px', fontSize: '0.75rem', padding: '0.75rem', margin: 0 }}>
                                <code>{sub.code}</code>
                              </pre>
                            </div>
                          ) : (
                            <div className="submitted-links">
                              {sub.link && (
                                <a href={sub.link} target="_blank" rel="noreferrer" className="repo-link">
                                  GitHub Push URL &nearr;
                                </a>
                              )}
                              {sub.type === 'leetcode' && sub.lcLink && (
                                <a href={sub.lcLink} target="_blank" rel="noreferrer" className="repo-link leetcode">
                                  LeetCode Submission Detail &nearr;
                                </a>
                              )}
                            </div>
                          )}
                          <span className="sub-time" style={{ display: 'block', marginTop: '0.5rem' }}>Submitted Date: {new Date(sub.timestamp).toLocaleString()}</span>
                        </div>

                        <div className="grading-inputs-card">
                          <div className="form-group-inline">
                            <label>Marks (0-10):</label>
                            <input 
                              type="number" 
                              min="0" 
                              max="10" 
                              placeholder={sub.marks !== null ? sub.marks : "Grade"}
                              value={gradesInput[sub.id] !== undefined ? gradesInput[sub.id] : ''}
                              onChange={(e) => setGradesInput(prev => ({ ...prev, [sub.id]: e.target.value }))}
                              className="score-input"
                            />
                          </div>
                          <div className="form-group-inline">
                            <label>Feedback Review Notes:</label>
                            <input 
                              type="text" 
                              placeholder={sub.comments ? sub.comments : "Write brief evaluation remarks..."}
                              value={commentsInput[sub.id] !== undefined ? commentsInput[sub.id] : ''}
                              onChange={(e) => setCommentsInput(prev => ({ ...prev, [sub.id]: e.target.value }))}
                              className="comment-input"
                            />
                          </div>
                          <button 
                            className="grade-submit-btn" 
                            onClick={() => handleGradeSubmit(sub.id)}
                          >
                            Save Score
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. CREATE DAILY QUESTIONS */}
        {adminTab === 'questions' && (
          <div className="admin-questions-panel">
            <h3>Publish Coding Challenge</h3>
            <p className="panel-desc">Schedule DSA and LeetCode problems. They automatically open for participants at 00:00 hrs on the designated Day.</p>

            {questionMsg && <div className="feedback-alert info">{questionMsg}</div>}

            <form className="admin-form" onSubmit={handleQuestionSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Challenge Day Number (1 - 100)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={qDay}
                    onChange={(e) => setQDay(e.target.value)}
                    required 
                  />
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

              <h4 className="sub-title-form">Part A: LeetCode Question Details</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>LeetCode Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Subsets" 
                    value={qTitleLc}
                    onChange={(e) => setQTitleLc(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>LeetCode Original URL</label>
                  <input 
                    type="url" 
                    placeholder="https://leetcode.com/problems/..." 
                    value={qLinkLc}
                    onChange={(e) => setQLinkLc(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>LeetCode Problem Summary Description</label>
                <textarea 
                  placeholder="Short explanation of problem requirements and inputs/outputs."
                  value={qDescLc}
                  onChange={(e) => setQDescLc(e.target.value)}
                  rows="3"
                ></textarea>
              </div>

              <h4 className="sub-title-form">Part B: Custom ACM DSA Problem Details</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Custom DSA Challenge Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Permutations with Duplicates" 
                    value={qTitleCustom}
                    onChange={(e) => setQTitleCustom(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Custom Challenge Description & Constraints</label>
                <textarea 
                  placeholder="Enter clear logical descriptions, constraints, examples."
                  value={qDescCustom}
                  onChange={(e) => setQDescCustom(e.target.value)}
                  rows="4"
                  required
                ></textarea>
              </div>

              <h4 className="sub-title-form">Handouts & Reference Solutions (Optional)</h4>
              <div className="form-group">
                <label>Study Handout Notes (Visible after day ends)</label>
                <textarea 
                  placeholder="Enter concepts description, links to reference PDFs, cheat-sheets..."
                  value={qHandout}
                  onChange={(e) => setQHandout(e.target.value)}
                  rows="3"
                ></textarea>
              </div>
              <div className="form-group">
                <label>Reference Code Solution snippet (C++/Java/Python)</label>
                <textarea 
                  placeholder="Write clear, optimized code solution..."
                  value={qSolution}
                  onChange={(e) => setQSolution(e.target.value)}
                  className="code-textarea"
                  rows="5"
                ></textarea>
              </div>

              <button type="submit" className="auth-action-btn admin-submit">Publish Daily Challenge</button>
            </form>
          </div>
        )}

        {/* 3. SUNDAY DEBUGGING CHALLENGES */}
        {adminTab === 'debugging' && (
          <div className="admin-debugging-panel">
            <div className="panel-grid">
              {/* Left Column: Create Sunday Challenge */}
              <div className="create-challenge-col">
                <h3>Schedule Sunday Battle</h3>
                {debugMsg && <div className="feedback-alert info">{debugMsg}</div>}
                
                <form className="admin-form" onSubmit={handleDebugSubmit}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Week Number</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={dWeek}
                        onChange={(e) => setDWeek(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Publish Date & Time (Sunday 21:00)</label>
                      <input 
                        type="datetime-local" 
                        value={dPubDate}
                        onChange={(e) => setDPubDate(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Unique Challenge Theme</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Graph Cycle and Heap Index Offsets" 
                      value={dTheme}
                      onChange={(e) => setDTheme(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Logical bugs explanation</label>
                    <textarea 
                      placeholder="Describe what the logical errors are, time bounds, expected output..."
                      value={dDesc}
                      onChange={(e) => setDDesc(e.target.value)}
                      rows="3"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Buggy Starter Code Snippet</label>
                    <textarea 
                      placeholder="Write code containing logical errors..."
                      value={dCode}
                      onChange={(e) => setDCode(e.target.value)}
                      className="code-textarea"
                      rows="6"
                      required 
                    />
                  </div>

                  <button type="submit" className="auth-action-btn admin-submit">Save Debug Challenge</button>
                </form>
              </div>

              {/* Right Column: Grade Sunday Challenge submissions */}
              <div className="grade-challenge-col">
                <h3>Grade Debug Solutions</h3>
                <div className="select-challenge-row">
                  <label>Select Week Challenge:</label>
                  <select 
                    value={activeDebugGradeWeek} 
                    onChange={(e) => setActiveDebugGradeWeek(Number(e.target.value))}
                  >
                    {db.debuggingChallenges.map(c => (
                      <option key={c.id} value={c.week}>Week {c.week} - {c.theme.slice(0, 25)}...</option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const selectedChallenge = db.debuggingChallenges.find(c => c.week === activeDebugGradeWeek);
                  if (!selectedChallenge) {
                    return <div className="no-items-alert">Select a week to review submissions.</div>;
                  }

                  const subs = selectedChallenge.submissions;
                  if (subs.length === 0) {
                    return <div className="no-items-alert">No submissions logged for Week {selectedChallenge.week} Sunday Debug.</div>;
                  }

                  return (
                    <div className="debug-grades-scroll">
                      {subs.map(sub => {
                        const student = db.users.find(u => u.id === sub.userId);
                        return (
                          <div key={sub.userId} className="debug-grade-row-card">
                            <div className="meta">
                              <span className="name">{student?.name}</span>
                              <span className="sap-id">{student?.studentId}</span>
                              <a href={sub.link} target="_blank" rel="noreferrer" className="repo-link font-small">GitHub Fixed Code &nearr;</a>
                            </div>

                            <div className="input-row">
                              <label>Score (0-20):</label>
                              <input 
                                type="number" 
                                min="0" 
                                max="20" 
                                placeholder={sub.score !== null ? sub.score : "Score"}
                                onBlur={(e) => handleDebugGradeSubmit(selectedChallenge.id, sub.userId, e.target.value)}
                                className="debug-score-box"
                              />
                              <span className="small-text">(Hit enter/focus out to save)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 4. PARTICIPANT STREAKS & EXPORTS */}
        {adminTab === 'participants' && (
          <div className="admin-participants-panel">
            <div className="panel-header-row">
              <h3>Participant Accounts Index</h3>
              <button className="export-csv-btn" onClick={handleExportCSV}>
                Export scoreboard data (CSV)
              </button>
            </div>

            <div className="search-bar-wrapper">
              <input 
                type="text" 
                placeholder="Search students by name, SAP ID, GitHub..." 
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="participants-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>SAP ID</th>
                    <th>GitHub / LeetCode</th>
                    <th>Daily Coding pts</th>
                    <th>Sunday Debug pts</th>
                    <th>Streaks (LC / GitHub)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.filter(p => {
                    const term = participantSearch.toLowerCase();
                    return p.name.toLowerCase().includes(term) ||
                      p.studentId.toLowerCase().includes(term) ||
                      p.gitHubId.toLowerCase().includes(term) ||
                      p.leetCodeId.toLowerCase().includes(term);
                  }).map(p => {
                    const isEditing = editStreakUid === p.id;
                    return (
                      <tr key={p.id}>
                        <td><strong className="name-bold">{p.name}</strong></td>
                        <td>{p.studentId}</td>
                        <td>
                          <div className="small-handles">
                            <span>gh: @{p.gitHubId}</span>
                            <span>lc: @{p.leetCodeId}</span>
                          </div>
                        </td>
                        <td>{p.totalCodingScore} pts</td>
                        <td>{p.totalDebuggingScore} pts</td>
                        <td>
                          {isEditing ? (
                            <div className="inline-streak-inputs">
                              <input 
                                type="number" 
                                placeholder="LC Streak"
                                value={editLcStreak}
                                onChange={(e) => setEditLcStreak(e.target.value)}
                                className="small-num-input"
                              />
                              <input 
                                type="number" 
                                placeholder="Git Streak"
                                value={editGcStreak}
                                onChange={(e) => setEditGcStreak(e.target.value)}
                                className="small-num-input"
                              />
                            </div>
                          ) : (
                            <span className="small-handles">
                              <span>LC: {p.leetCodeStreak}d</span>
                              <span>GH: {p.gitHubStreak}d</span>
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge-status ${p.isActive ? 'submitted' : 'missed'}`}>
                            {p.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            {isEditing ? (
                              <>
                                <button className="small-action-btn green" onClick={() => handleSaveStreaks(p.id)}>Save</button>
                                <button className="small-action-btn red" onClick={() => setEditStreakUid(null)}>Cancel</button>
                              </>
                            ) : (
                              <button 
                                className="small-action-btn grey" 
                                onClick={() => {
                                  setEditStreakUid(p.id);
                                  setEditLcStreak(p.leetCodeStreak);
                                  setEditGcStreak(p.gitHubStreak);
                                }}
                              >
                                Edit Streak
                              </button>
                            )}
                            <button 
                              className={`small-action-btn ${p.isActive ? 'red' : 'green'}`}
                              onClick={() => toggleUserStatus(p.id)}
                            >
                              {p.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. TIME-TRAVEL DATE WARPER */}
        {adminTab === 'time' && (
          <div className="admin-time-travel-panel">
            <div className="time-travel-warning-box">
              <span className="warning-icon">Alert</span>
              <div className="warning-body">
                <h3>Temporal Simulation Engine</h3>
                <p>This is a custom debugging tool built to simulate progression through the 100 days event. Adjusting the day and time will immediately update active question states, expire submission deadlines, mark incomplete tasks as "Missed", and recalculate streaks.</p>
              </div>
            </div>

            {timeTravelMsg && <div className="feedback-alert info">{timeTravelMsg}</div>}

            <form className="time-travel-form" onSubmit={handleTimeTravelSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="time-travel-day">Set Event Day (Day 1 - Day 100)</label>
                  <input 
                    id="time-travel-day"
                    type="number" 
                    min="1" 
                    max="100" 
                    value={targetDay}
                    onChange={(e) => setTargetDay(Number(e.target.value))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="time-travel-datetime">Set Simulation Date & Time</label>
                  <input 
                    id="time-travel-datetime"
                    type="datetime-local" 
                    value={targetTime}
                    onChange={(e) => setTargetTime(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="time-travel-go-btn">Warp System Clock</button>
            </form>

            <div className="time-travel-hints-panel">
              <h4>Quick Warp Shortcuts:</h4>
              <div className="shortcuts-row">
                <button 
                  type="button" 
                  className="shortcut-btn"
                  onClick={() => {
                    setTargetDay(12);
                    setTargetTime('2026-06-05T15:47');
                  }}
                >
                  Day 12 - Friday Midday (Default Start State)
                </button>
                <button 
                  type="button" 
                  className="shortcut-btn"
                  onClick={() => {
                    setTargetDay(14);
                    setTargetTime('2026-06-07T21:15');
                  }}
                >
                  Day 14 - Sunday 21:15 (Activate Debug Challenge 3)
                </button>
                <button 
                  type="button" 
                  className="shortcut-btn"
                  onClick={() => {
                    setTargetDay(15);
                    setTargetTime('2026-06-08T09:00');
                  }}
                >
                  Day 15 - Monday Morning (Lock Debug Challenge 3)
                </button>
                <button 
                  type="button" 
                  className="shortcut-btn"
                  onClick={() => {
                    setTargetDay(99);
                    setTargetTime('2026-08-31T09:00');
                  }}
                >
                  Day 99 - Final Countdown (Master Challenges Unlock)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
