import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { formatDate } from '../../../utils/dateFormat';

export default function DebuggingQuestionsTab() {
  const { db, uploadDebuggingChallenge } = useApp();

  const [mode, setMode] = useState('add'); // 'add' | 'edit'
  const [weekNum, setWeekNum] = useState('');
  const [theme, setTheme] = useState('');
  const [description, setDescription] = useState('');
  const [starterCode, setStarterCode] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [formMsg, setFormMsg] = useState('');

  const existingChallenges = db.debuggingChallenges || [];

  const loadChallengeForEdit = (week) => {
    const challenge = existingChallenges.find((c) => c.week === Number(week));
    if (!challenge) {
      setFormMsg(`No challenge found for Week ${week}.`);
      return;
    }
    setWeekNum(String(challenge.week));
    setTheme(challenge.theme || '');
    setDescription(challenge.description || '');
    setStarterCode(challenge.starterCode || '');
    // Convert ISO date to datetime-local format
    if (challenge.publishedDate) {
      const d = new Date(challenge.publishedDate);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setPublishedDate(local);
    } else {
      setPublishedDate('');
    }
    setFormMsg(`Loaded Week ${challenge.week} for editing.`);
  };

  const resetForm = () => {
    setWeekNum('');
    setTheme('');
    setDescription('');
    setStarterCode('');
    setPublishedDate('');
    setFormMsg('');
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setFormMsg('');
    if (newMode === 'add') {
      resetForm();
    }
    if (newMode === 'edit' && existingChallenges.length > 0) {
      loadChallengeForEdit(existingChallenges[0].week);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMsg('');

    if (!weekNum || !theme || !description || !starterCode || !publishedDate) {
      setFormMsg('Please fill in all required fields.');
      return;
    }

    const pubDate = new Date(publishedDate);
    if (isNaN(pubDate.getTime())) {
      setFormMsg('Invalid published date.');
      return;
    }

    const res = await uploadDebuggingChallenge({
      week: Number(weekNum),
      theme,
      description,
      starterCode,
      publishedDate: pubDate.toISOString(),
    });

    setFormMsg(res.message);
    if (res.success && mode === 'add') {
      resetForm();
    }
  };

  return (
    <div className="coord-panel">
      <h3>Sunday Debugging Question Management</h3>
      <p className="panel-desc">
        Add or edit weekly debugging challenges. These appear on participants' Sunday Debugging page.
      </p>

      {formMsg && (
        <div className="feedback-alert info" role="status" aria-live="polite">
          {formMsg}
        </div>
      )}

      {/* Mode Switcher */}
      <div className="coord-action-strip" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <button
          type="button"
          className={`coord-action-btn press-card ${mode === 'add' ? 'active' : ''}`}
          aria-pressed={mode === 'add'}
          onClick={() => handleModeSwitch('add')}
        >
          Add New Challenge
        </button>
        <button
          type="button"
          className={`coord-action-btn press-card ${mode === 'edit' ? 'active' : ''}`}
          aria-pressed={mode === 'edit'}
          onClick={() => handleModeSwitch('edit')}
        >
          Edit Existing Challenge
        </button>
      </div>

      {/* Edit mode week selector */}
      {mode === 'edit' && (
        <div className="coord-challenge-toolbar">
          <label htmlFor="debug-edit-week-select">Load week to edit:</label>
          <select
            id="debug-edit-week-select"
            value={weekNum}
            onChange={(e) => loadChallengeForEdit(e.target.value)}
          >
            {existingChallenges.length === 0 ? (
              <option value="">No challenges available</option>
            ) : (
              existingChallenges.map((c) => (
                <option key={c.id} value={c.week}>
                  Week {c.week} — {c.theme}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {/* Form */}
      <form className="admin-form press-card coord-form-panel" onSubmit={handleSubmit}>
        <h4 className="coord-form-title">
          {mode === 'add' ? 'Add New Debugging Challenge' : 'Edit Debugging Challenge'}
        </h4>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="debug-week-num">Week Number</label>
            <input
              id="debug-week-num"
              name="weekNum"
              type="number"
              min="1"
              max="15"
              value={weekNum}
              onChange={(e) => setWeekNum(e.target.value)}
              required
              autoComplete="off"
              placeholder="e.g. 4"
              readOnly={mode === 'edit'}
            />
          </div>
          <div className="form-group">
            <label htmlFor="debug-publish-date">Published Date &amp; Time</label>
            <input
              id="debug-publish-date"
              name="publishedDate"
              type="datetime-local"
              value={publishedDate}
              onChange={(e) => setPublishedDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="debug-theme">Theme / Title</label>
          <input
            id="debug-theme"
            name="theme"
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            required
            autoComplete="off"
            placeholder="e.g. Memory Leak and BFS Traversal"
          />
        </div>

        <div className="form-group">
          <label htmlFor="debug-description">Problem Description</label>
          <textarea
            id="debug-description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            required
            autoComplete="off"
            placeholder="Describe the debugging task participants need to solve..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="debug-starter-code">Starter Code (Buggy)</label>
          <textarea
            id="debug-starter-code"
            name="starterCode"
            value={starterCode}
            onChange={(e) => setStarterCode(e.target.value)}
            className="code-textarea"
            rows="8"
            required
            autoComplete="off"
            placeholder="Paste the buggy starter code here..."
          />
        </div>

        <div className="coord-action-buttons">
          <button type="submit" className="auth-action-btn admin-submit">
            {mode === 'add' ? 'Add Debugging Challenge' : 'Save Changes'}
          </button>
          {mode === 'edit' && (
            <button
              type="button"
              className="small-action-btn"
              onClick={resetForm}
            >
              Clear Form
            </button>
          )}
        </div>
      </form>

      {/* Existing Challenges Preview */}
      <div className="debug-challenges-preview">
        <h4 className="debug-preview-heading">Existing Debugging Challenges</h4>
        {existingChallenges.length === 0 ? (
          <div className="no-items-alert">No debugging challenges scheduled yet.</div>
        ) : (
          <div className="debug-challenges-list">
            {existingChallenges.map((c) => {
              const subCount = (c.submissions || []).length;
              return (
                <div key={c.id} className="debug-challenge-preview-card">
                  <div className="debug-preview-left">
                    <span className="debug-week-badge">Week {c.week}</span>
                    <div className="debug-preview-info">
                      <h5>{c.theme}</h5>
                      <span className="debug-preview-date">
                        Publishes: {formatDate(c.publishedDate)}
                      </span>
                    </div>
                  </div>
                  <div className="debug-preview-right">
                    <span className="debug-sub-count">
                      {subCount} submission{subCount !== 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      className="small-action-btn"
                      onClick={() => {
                        setMode('edit');
                        loadChallengeForEdit(c.week);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
