import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function ContestGradingTab() {
  const { db, editParticipantContestData } = useApp();
  const [activeContestDay, setActiveContestDay] = useState(21);
  const [contestInputs, setContestInputs] = useState({});
  const [msg, setMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const CONTEST_DAYS = [21, 51, 99, 100];

  const handleScoreChange = (userId, value) => {
    setContestInputs((prev) => ({
      ...prev,
      [userId]: value
    }));
  };

  const handleSave = async (userId) => {
    let score = contestInputs[userId];
    const p = db.users.find(u => u.id === userId);
    
    if (score === undefined || score === '') {
      // Use existing score if they didn't input anything
      score = p[`contestScore_${activeContestDay}`] ?? 0;
    } else {
      score = Number(score);
    }
    
    if (score < 0 || score > 10) {
      setMsg('Score must be between 0 and 10.');
      return;
    }

    const updates = {
      [`contestScore_${activeContestDay}`]: score
    };

    const res = await editParticipantContestData(userId, updates);
    setMsg(res.message);
    if (res.success) {
      setContestInputs((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const activeUserIds = new Set(
    db.users.filter((u) => u.isActive !== false && !u.isAdminAccount).map((u) => u.id)
  );
  
  let visibleParticipants = db.users
    .filter((u) => activeUserIds.has(u.id))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    visibleParticipants = visibleParticipants.filter(p => 
      (p.name || '').toLowerCase().includes(q) || 
      (p.studentId || '').toLowerCase().includes(q)
    );
  }

  return (
    <div className="coord-panel admin-grading-panel">
      <h3>Contest Scores - Grade &amp; Edit</h3>
      <p className="panel-desc">
        Select a contest and assign a score (0-10). Changes sync to the Leaderboard immediately.
      </p>
      {msg && (
        <div className="feedback-alert info" role="status" aria-live="polite">
          {msg}
        </div>
      )}

      <div className="select-challenge-row" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="contest-day-select">Select Contest:</label>
          <select
            id="contest-day-select"
            value={activeContestDay}
            onChange={(e) => {
              setActiveContestDay(Number(e.target.value));
              setContestInputs({}); // Clear inputs when switching tabs
            }}
          >
            {CONTEST_DAYS.map((day) => (
              <option key={day} value={day}>
                Contest (Day {day})
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search participants by name or SAP ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', width: '100%', maxWidth: '400px' }}
          />
        </div>
      </div>

      <div className="grading-queue-list">
        {visibleParticipants.map((p) => {
          const inputVal = contestInputs[p.id];
          const currentScore = inputVal !== undefined ? inputVal : (p[`contestScore_${activeContestDay}`] ?? 0);

          return (
            <div key={p.id} className="grading-item-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="item-meta-info" style={{ marginBottom: '10px' }}>
                <div className="student-profile">
                  <span className="student-name">{p.name || 'Unknown User'}</span>
                  <span className="sap-id">{p.studentId}</span>
                </div>
                <div className="submission-day-badge">
                  <span>Day {activeContestDay}</span>
                  <span className={`badge-status ${p[`contestScore_${activeContestDay}`] != null ? 'submitted' : 'missed'}`}>
                    {p[`contestScore_${activeContestDay}`] != null ? 'Graded' : 'Pending'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Score (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={currentScore}
                    onChange={(e) => handleScoreChange(p.id, e.target.value)}
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #444', background: '#1c1c1c', color: '#fff', width: '100px' }}
                  />
                </div>
                <button
                  className="small-action-btn green"
                  onClick={() => handleSave(p.id)}
                  style={{ padding: '6px 12px', height: '32px' }}
                >
                  Save Score
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
