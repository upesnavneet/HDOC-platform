import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function ChallengesTab() {
  const { db, uploadQuestion, deleteQuestion } = useApp();

  const [qDay, setQDay] = useState(db.currentDay + 1);
  const [qTitleLc, setQTitleLc] = useState('');
  const [qLinkLc, setQLinkLc] = useState('');
  const [qDescLc, setQDescLc] = useState('');
  const [qTitleCustom, setQTitleCustom] = useState('');
  const [qDescCustom, setQDescCustom] = useState('');
  const [qSolution, setQSolution] = useState('');
  const [questionMsg, setQuestionMsg] = useState('');
  const [msgType, setMsgType] = useState('info'); // 'info' | 'success' | 'error'
  const [editMode, setEditMode] = useState(false);
  const [challengeAction, setChallengeAction] = useState('add');



  const loadQuestionForEdit = (day) => {
    const q = db.questions.find((question) => question.day === Number(day));
    if (!q) {
      setQuestionMsg(`No challenge found for Day ${day}.`);
      setMsgType('error');
      return;
    }
    setQDay(q.day);
    setQTitleLc(q.titleLc);
    setQLinkLc(q.linkLc);
    setQDescLc(q.descLc || '');
    setQTitleCustom(q.titleCustom);
    setQDescCustom(q.descCustom);
    setQSolution(q.solutionCode || '');
    setEditMode(true);
    setQuestionMsg(`Loaded Day ${day} for editing.`);
    setMsgType('info');
  };

  const resetQuestionForm = () => {
    setQDay(db.currentDay + 1);
    setQTitleLc('');
    setQLinkLc('');
    setQDescLc('');
    setQTitleCustom('');
    setQDescCustom('');
    setQSolution('');
    setEditMode(false);
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

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    try {
      setQuestionMsg('Submitting...');
      setMsgType('info');
      if (!qTitleLc || !qLinkLc || !qTitleCustom || !qDescCustom) {
        setQuestionMsg('Please fill in all required fields.');
        setMsgType('error');
        return;
      }
      
      const res = await uploadQuestion({
        day: qDay,
        titleLc: qTitleLc,
        linkLc: qLinkLc,
        descLc: qDescLc,
        titleCustom: qTitleCustom,
        descCustom: qDescCustom,
        solutionCode: qSolution,
      });

      if (res?.success && challengeAction === 'schedule') {
        setQuestionMsg(`Challenge for Day ${qDay} scheduled. It will be released when you advance to Day ${qDay}.`);
      } else {
        setQuestionMsg(res?.message || 'Operation completed.');
      }
      setMsgType(res?.success ? 'success' : 'error');
      if (res?.success && !editMode) {
        setQDay(db.currentDay + 1);
        setQTitleLc('');
        setQLinkLc('');
        setQDescLc('');
        setQTitleCustom('');
        setQDescCustom('');
        setQSolution('');
      }
    } catch (err) {
      console.error('Error submitting question:', err);
      setQuestionMsg(`Error: ${err.message}`);
      setMsgType('error');
    }
  };

  const handleDeleteChallenge = async () => {
    if (!window.confirm(`Delete challenge for Day ${qDay}?`)) return;
    const res = await deleteQuestion(qDay);
    setQuestionMsg(res.message);
    setMsgType(res.success ? 'success' : 'error');
    if (res.success) resetQuestionForm();
  };

  return (
    <div className="coord-panel">
      <h3>Question &amp; Challenge Management</h3>
      <p className="panel-desc">
        Add, edit, remove, or schedule daily questions and coding challenges.
      </p>
      {questionMsg && <div className={`feedback-alert ${msgType}`}>{questionMsg}</div>}

      <div className="coord-action-strip">
        {['add', 'edit', 'remove', 'schedule'].map((action) => (
          <button
            key={action}
            type="button"
            className={`coord-action-btn press-card ${challengeAction === action ? 'active' : ''}`}
            aria-pressed={challengeAction === action}
            onClick={() => handleChallengeAction(action)}
          >
            {action === 'add' && 'Add Question'}
            {action === 'edit' && 'Edit Question'}
            {action === 'remove' && 'Remove Question'}
            {action === 'schedule' && 'Schedule Challenge'}
          </button>
        ))}
      </div>

      {challengeAction === 'remove' ? (
        <div className="coord-remove-panel press-card">
          <h4>Remove Question / Challenge</h4>
          <div className="coord-challenge-toolbar">
            <label htmlFor="remove-day-select">Select day to remove:</label>
            <select
              id="remove-day-select"
              name="removeDay"
              value={qDay}
              onChange={(e) => setQDay(Number(e.target.value))}
            >
              {db.questions.map((q) => (
                <option key={q.id} value={q.day}>
                  Day {q.day} - {q.titleLc}
                </option>
              ))}
            </select>
            <button type="button" className="small-action-btn red" onClick={handleDeleteChallenge}>
              Remove Challenge
            </button>
          </div>
        </div>
      ) : (
        <>
          {challengeAction === 'edit' && (
            <div className="coord-challenge-toolbar">
              <label htmlFor="edit-day-select">Load day to edit:</label>
              <select
                id="edit-day-select"
                name="editDay"
                value={qDay}
                onChange={(e) => loadQuestionForEdit(e.target.value)}
              >
                {db.questions.map((q) => (
                  <option key={q.id} value={q.day}>
                    Day {q.day} - {q.titleLc}
                  </option>
                ))}
              </select>
            </div>
          )}

          <form className="admin-form press-card coord-form-panel" onSubmit={handleQuestionSubmit}>
            <h4 className="coord-form-title">
              {challengeAction === 'add' && 'Add New Question'}
              {challengeAction === 'edit' && 'Edit Question'}
              {challengeAction === 'schedule' && 'Schedule Question & Challenge'}
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="challenge-day">
                  {challengeAction === 'schedule' ? 'Schedule Day (1-100)' : 'Day Number (1-100)'}
                </label>
                <input
                  id="challenge-day"
                  name="day"
                  type="number"
                  min="1"
                  max="100"
                  value={qDay}
                  onChange={(e) => setQDay(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="leetcode-title">LeetCode Title</label>
                <input
                  id="leetcode-title"
                  name="leetcodeTitle"
                  type="text"
                  value={qTitleLc}
                  onChange={(e) => setQTitleLc(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <label htmlFor="leetcode-url">LeetCode URL</label>
                <input
                  id="leetcode-url"
                  name="leetcodeUrl"
                  type="url"
                  value={qLinkLc}
                  onChange={(e) => setQLinkLc(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="leetcode-desc">LeetCode Description</label>
              <textarea
                id="leetcode-desc"
                name="leetcodeDesc"
                value={qDescLc}
                onChange={(e) => setQDescLc(e.target.value)}
                rows="2"
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="custom-title">Custom DSA Title</label>
              <input
                id="custom-title"
                name="customTitle"
                type="text"
                value={qTitleCustom}
                onChange={(e) => setQTitleCustom(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="custom-desc">Custom DSA Description</label>
              <textarea
                id="custom-desc"
                name="customDesc"
                value={qDescCustom}
                onChange={(e) => setQDescCustom(e.target.value)}
                rows="3"
                required
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ref-solution">Reference Solution (optional)</label>
              <textarea
                id="ref-solution"
                name="refSolution"
                value={qSolution}
                onChange={(e) => setQSolution(e.target.value)}
                className="code-textarea"
                rows="4"
                autoComplete="off"
              />
            </div>
            <div className="coord-action-buttons">
              <button type="submit" className="auth-action-btn admin-submit">
                {challengeAction === 'add' && 'Add Question'}
                {challengeAction === 'edit' && 'Save Changes'}
                {challengeAction === 'schedule' && 'Schedule Challenge'}
              </button>
              {editMode && challengeAction === 'edit' && (
                <button
                  type="button"
                  className="small-action-btn red"
                  onClick={handleDeleteChallenge}
                >
                  Remove Question
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
}
