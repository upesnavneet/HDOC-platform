import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { formatDate } from '../../../utils/dateFormat';

export default function DebuggingQuestionsTab() {
  const { db, uploadDebuggingChallenge } = useApp();

  const [mode, setMode] = useState('add'); // 'add' | 'edit'
  const [weekNum, setWeekNum] = useState('');
  const [title, setTitle] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  
  // New Structured Fields
  const [timeLimit, setTimeLimit] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [buggyCode, setBuggyCode] = useState('');
  const [challengeBrief, setChallengeBrief] = useState('');
  const [requirements, setRequirements] = useState(['']);
  const [expectedOutputs, setExpectedOutputs] = useState(['']);
  const [constraints, setConstraints] = useState(['']);
  
  const [formMsg, setFormMsg] = useState('');

  const existingChallenges = db.debuggingChallenges || [];

  const loadChallengeForEdit = (week) => {
    const challenge = existingChallenges.find((c) => c.week === Number(week));
    if (!challenge) {
      setFormMsg(`No challenge found for Week ${week}.`);
      return;
    }
    setWeekNum(String(challenge.week));
    setTitle(challenge.title || challenge.theme || '');
    setBuggyCode(challenge.buggyCode || challenge.starterCode || '');
    
    setTimeLimit(challenge.timeLimit || '');
    setDifficulty(challenge.difficulty || 'Medium');
    setChallengeBrief(challenge.challengeBrief || challenge.description || '');
    setRequirements(challenge.requirements?.length ? challenge.requirements : ['']);
    setExpectedOutputs(challenge.expectedOutputs?.length ? challenge.expectedOutputs : ['']);
    setConstraints(Array.isArray(challenge.constraints) && challenge.constraints.length ? challenge.constraints : ['']);

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
    setTitle('');
    setBuggyCode('');
    setPublishedDate('');
    setTimeLimit('');
    setDifficulty('Medium');
    setChallengeBrief('');
    setRequirements(['']);
    setExpectedOutputs(['']);
    setConstraints(['']);
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

  const handleListChange = (setter, list, index, value) => {
    const newList = [...list];
    newList[index] = value;
    setter(newList);
  };

  const addListItem = (setter, list) => {
    setter([...list, '']);
  };

  const removeListItem = (setter, list, index) => {
    if (list.length > 1) {
      setter(list.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMsg('');

    if (!weekNum || !title || !publishedDate || !buggyCode) {
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
      title,
      theme: title, // backward compatibility
      buggyCode,
      starterCode: buggyCode, // backward compatibility
      publishedDate: pubDate.toISOString(),
      timeLimit,
      difficulty,
      challengeBrief,
      requirements: requirements.filter(Boolean),
      expectedOutputs: expectedOutputs.filter(Boolean),
      constraints: constraints.filter(Boolean),
      // Pass old fields as empty to prevent lingering values
      description: challengeBrief,
      symptoms: [],
      hints: [],
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
        Add or edit weekly debugging challenges. These appear on participants' Sunday Debugging
        page.
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
                  Week {c.week} - {c.title || c.theme}
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

        {/* Basic Information */}
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="debug-title">Challenge Title</label>
            <input
              id="debug-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoComplete="off"
              placeholder="e.g. Memory Leak and BFS Traversal"
            />
          </div>
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
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="debug-difficulty">Difficulty</label>
            <select
              id="debug-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="debug-buggy-code">Buggy Code Editor</label>
          <textarea
            id="debug-buggy-code"
            name="buggyCode"
            value={buggyCode}
            onChange={(e) => setBuggyCode(e.target.value)}
            className="code-textarea"
            rows="8"
            required
            autoComplete="off"
            placeholder="Paste the buggy code here (indentation is preserved)..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="debug-challenge-brief">Challenge Brief</label>
          <textarea
            id="debug-challenge-brief"
            name="challengeBrief"
            value={challengeBrief}
            onChange={(e) => setChallengeBrief(e.target.value)}
            rows="4"
            autoComplete="off"
            placeholder="Provide the story, background, and context of the challenge..."
          />
        </div>

        {/* Dynamic Lists */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ margin: 0 }}>What the Code Must Do</label>
            <button type="button" className="small-action-btn" onClick={() => addListItem(setRequirements, requirements)}>+ Add Requirement</button>
          </div>
          {requirements.map((req, index) => (
            <div key={`req-${index}`} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={req}
                onChange={(e) => handleListChange(setRequirements, requirements, index, e.target.value)}
                placeholder={`Requirement ${index + 1}`}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="small-action-btn red"
                onClick={() => removeListItem(setRequirements, requirements, index)}
                disabled={requirements.length === 1}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ margin: 0 }}>Expected Output</label>
            <button type="button" className="small-action-btn" onClick={() => addListItem(setExpectedOutputs, expectedOutputs)}>+ Add Output</button>
          </div>
          {expectedOutputs.map((out, index) => (
            <div key={`out-${index}`} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={out}
                onChange={(e) => handleListChange(setExpectedOutputs, expectedOutputs, index, e.target.value)}
                placeholder={`Expected Output ${index + 1}`}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="small-action-btn red"
                onClick={() => removeListItem(setExpectedOutputs, expectedOutputs, index)}
                disabled={expectedOutputs.length === 1}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ margin: 0 }}>Constraints</label>
            <button type="button" className="small-action-btn" onClick={() => addListItem(setConstraints, constraints)}>+ Add Constraint</button>
          </div>
          {constraints.map((con, index) => (
            <div key={`con-${index}`} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={con}
                onChange={(e) => handleListChange(setConstraints, constraints, index, e.target.value)}
                placeholder={`Constraint ${index + 1}`}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="small-action-btn red"
                onClick={() => removeListItem(setConstraints, constraints, index)}
                disabled={constraints.length === 1}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        <div className="coord-action-buttons">
          <button type="submit" className="auth-action-btn admin-submit">
            {mode === 'add' ? 'Add Debugging Challenge' : 'Save Changes'}
          </button>
          {mode === 'edit' && (
            <button type="button" className="small-action-btn" onClick={resetForm}>
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
                      <h5>{c.title || c.theme}</h5>
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
                        handleModeSwitch('edit');
                        loadChallengeForEdit(c.week);
                        document.querySelector('.coord-form-panel')?.scrollIntoView({ behavior: 'smooth' });
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
