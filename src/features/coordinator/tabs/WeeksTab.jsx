import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function WeeksTab() {
  const { db, completeWeek, revertWeek } = useApp();
  const [weekToComplete, setWeekToComplete] = useState(1);
  const [weekMsg, setWeekMsg] = useState('');

  const completedWeeks = db.completedWeeks || [];

  const handleCompleteWeek = async () => {
    const res = await completeWeek(weekToComplete);
    setWeekMsg(res.message);
  };

  const handleRevertWeek = async (weekNum) => {
    if (!window.confirm(`Revert Week ${weekNum} back to incomplete?`)) return;
    const res = await revertWeek(weekNum);
    setWeekMsg(res.message);
  };

  return (
    <div className="coord-panel">
      <h3>Week Completion</h3>
      <p className="panel-desc">
        Mark a week as complete once all daily challenges and Sunday debug for that week are finished.
      </p>
      {weekMsg && <div className="feedback-alert info">{weekMsg}</div>}

      <div className="week-completion-row press-card coord-week-panel">
        <label htmlFor="week-complete-select" className="sr-only">Select week to mark complete</label>
        <select id="week-complete-select" value={weekToComplete} onChange={(e) => setWeekToComplete(Number(e.target.value))}>
          {Array.from({ length: 14 }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
        <button type="button" className="auth-action-btn admin-submit" onClick={handleCompleteWeek}>
          Mark Week Complete
        </button>
      </div>

      <div className="completed-weeks-list">
        <h4>Completed Weeks</h4>
        {completedWeeks.length === 0 ? (
          <p className="no-items-alert">No weeks marked complete yet.</p>
        ) : (
          <div className="week-badges-row">
            {completedWeeks.map((w) => (
              <span key={w} className="week-complete-badge">
                Week {w} Complete
                <button
                  type="button"
                  className="week-revert-btn"
                  onClick={() => handleRevertWeek(w)}
                  title={`Revert Week ${w}`}
                >
                  Undo
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
