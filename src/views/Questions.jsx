import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

import { parseChallengeContent } from '../utils/challengeContent';

export default function Questions() {
  const { db, submitCommitUrl } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [manualSelection, setManualSelection] = useState(null);
  const [smoothScrollValue, setSmoothScrollValue] = useState(0);

  const [commitUrl, setCommitUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const isDragging = useRef(false);
  const touchStartX = useRef(0);
  const dragStartScroll = useRef(0);

  const handleTouchStart = (e) => {
    isDragging.current = true;
    touchStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartScroll.current = smoothScrollValue;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const diff = touchStartX.current - currentX;
    // 1 card width ~ 100px of drag
    const newScroll = Math.max(0, Math.min(archivedQuestions.length - 1, dragStartScroll.current + diff / 100));
    setSmoothScrollValue(newScroll);
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const newIndex = Math.round(smoothScrollValue);
    setManualSelection(archivedQuestions[newIndex]);
    setSmoothScrollValue(newIndex);
  };

  const currentDay = db.currentDay;
  const questions = db.questions;

  const archivedQuestions = useMemo(
    () =>
      questions.filter((q) => {
        if (q.day > currentDay) return false;
        return !searchQuery.trim() || q.day.toString() === searchQuery.trim();
      }),
    [questions, currentDay, searchQuery]
  );

  const defaultSelection = useMemo(() => {
    if (archivedQuestions.length === 0) return null;
    const stillExists =
      manualSelection && archivedQuestions.some((q) => q.id === manualSelection.id);
    if (stillExists) return manualSelection;
    return (
      archivedQuestions.find((q) => q.day === currentDay) ||
      archivedQuestions[archivedQuestions.length - 1]
    );
  }, [archivedQuestions, currentDay, manualSelection]);

  const selectedQuestion = defaultSelection;

  useEffect(() => {
    if (isDragging.current) return;
    const idx = archivedQuestions.findIndex((q) => q.id === selectedQuestion?.id);
    setSmoothScrollValue(idx === -1 ? 0 : idx);
  }, [selectedQuestion, archivedQuestions]);

  const handleCommitSubmit = async (e) => {
    e.preventDefault();
    if (!commitUrl.trim() || !selectedQuestion) {
      setSubmitMsg('Please enter a GitHub commit URL');
      return;
    }
    const commitUrlPattern = /^https?:\/\/github\.com\/[\w-]+\/[\w-]+\/commit\/[a-f0-9]{7,40}(\?.*)?$/i;
    if (!commitUrlPattern.test(commitUrl.trim())) {
      setSubmitMsg('Please enter a valid GitHub commit URL');
      return;
    }

    setIsSubmitting(true);
    setSubmitMsg('');

    try {
      const result = await submitCommitUrl(currentDay, commitUrl.trim());
      if (result.success) {
        setCommitUrl('');
        setSubmitMsg('Submitted successfully!');
      } else {
        setSubmitMsg(result.message || 'Failed to submit. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting commit:', error);
      setSubmitMsg('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (db.challengesLocked) {
    return (
      <div className="questions-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F2AA4C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.5rem' }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#F3F3F3' }}>Challenges are Locked</h2>
        <p style={{ fontSize: '1.1rem', color: 'rgba(243, 243, 243, 0.7)', maxWidth: '500px', lineHeight: 1.6 }}>
          Challenges are currently locked by the coordinator. Please navigate to the <strong>Debugging tab</strong> if it is available!
        </p>
      </div>
    );
  }

  return (
    <div className="questions-container">
      <div className="page-header">
        <h1>Daily Challenges</h1>
      </div>

      <div className="archive-vertical-layout">
        <div className="archive-top-gallery-panel">
          <div className="filter-controls-card-compact">
            <label htmlFor="day-search" className="sr-only">
              Search by day number
            </label>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="search-icon-svg"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              id="day-search"
              type="search"
              inputMode="numeric"
              placeholder="Search by day…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-compact"
            />
          </div>

          <div
            className="days-horizontal-gallery"
            onWheel={(e) => {
              if (archivedQuestions.length === 0) return;
              const currentIndex = archivedQuestions.findIndex(
                (q) => q.id === selectedQuestion?.id
              );
              if (currentIndex === -1) return;
              if (e.deltaY > 0) {
                if (currentIndex < archivedQuestions.length - 1)
                  setManualSelection(archivedQuestions[currentIndex + 1]);
              } else {
                if (currentIndex > 0) setManualSelection(archivedQuestions[currentIndex - 1]);
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            {archivedQuestions.length === 0 ? (
              <div className="no-results-compact">No days match your filter criteria.</div>
            ) : (
              <div className="circular-gallery-wrapper">
                <div className="circular-gallery-container">
                  {archivedQuestions.map((q, index) => {
                    const isToday = q.day === currentDay;
                    const isMaster = q.isMaster || q.day >= 99;
                    const isSelected = selectedQuestion?.id === q.id;
                    const activeIndex = archivedQuestions.findIndex(
                      (item) => item.id === selectedQuestion?.id
                    );
                    // Use smoothScrollValue for fluid rotation if dragging, else use activeIndex
                    const safeActiveIndex = isDragging.current ? smoothScrollValue : (activeIndex === -1 ? 0 : activeIndex);
                    const offset = index - safeActiveIndex;

                    return (
                      <button
                        type="button"
                        key={q.id}
                        className={`gallery-day-card circular-item ${isSelected ? 'active' : ''} ${isToday ? 'today' : ''} ${isMaster ? 'master-card' : ''}`}
                        onClick={() => {
                          setManualSelection(q);
                          document.getElementById('question-details-panel')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        aria-pressed={isSelected}
                        aria-label={`Day ${q.day}, ${q.titleLc}, ${q.titleCustom}${isToday ? ', today' : ''}`}
                        style={{
                          transform: `translateX(${offset * 115}%) translateZ(${Math.abs(offset) * -100}px) rotateY(${offset * -18}deg)`,
                          zIndex: 100 - Math.abs(offset),
                          opacity: Math.abs(offset) > 4 ? 0 : 1,
                          pointerEvents: Math.abs(offset) > 4 ? 'none' : 'auto',
                          visibility: Math.abs(offset) > 4 ? 'hidden' : 'visible',
                        }}
                      >
                        <div className="day-card-header">
                          <span className="day-card-number">Day {q.day}</span>
                          {isToday && <span className="day-card-today-badge">TODAY</span>}
                          {isMaster && <span className="day-card-master-badge">★</span>}
                        </div>
                        <div className="day-card-body">
                          <div className="day-card-titles">
                            <span className="day-card-title-lc">{q.titleLc}</span>
                            <span className="day-card-title-custom">{q.titleCustom}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {archivedQuestions.length > 0 && (
            <div className="gallery-scrollbar-container">
              <input
                type="range"
                className="gallery-custom-scrollbar"
                min="0"
                max={archivedQuestions.length - 1}
                step="0.01"
                value={smoothScrollValue}
                onChange={(e) => {
                  const rawVal = parseFloat(e.target.value);
                  setSmoothScrollValue(rawVal);
                  const newIndex = Math.round(rawVal);
                  if (newIndex >= 0 && newIndex < archivedQuestions.length) {
                    setManualSelection(archivedQuestions[newIndex]);
                  }
                }}
                aria-label="Scroll through daily challenges"
              />
            </div>
          )}
        </div>

        <div id="question-details-panel" className="archive-bottom-details-panel">
          {selectedQuestion ? (
            <div
              className={`question-detailed-view-vertical ${selectedQuestion.isMaster ? 'master-styled' : ''}`}
            >
              <div className="detailed-header">
                <div className="header-meta">
                  <span className="day-large">DAY {selectedQuestion.day}</span>
                  {selectedQuestion.isMaster && (
                    <span className="master-challenge-tag">Master Challenge</span>
                  )}
                </div>
                <h2>
                  {selectedQuestion.titleLc} &amp; {selectedQuestion.titleCustom}
                </h2>
              </div>

              {selectedQuestion.isMaster && (
                <div className="master-banner-alert">
                  <span className="icon">Master</span>
                  <div className="banner-content">
                    <h4>Grand Finale Master Challenge</h4>
                    <p>
                      Submissions for Day 99 and 100 weigh double in the overall standing and
                      determine the final standings for the Top 10 Grand Finale.
                    </p>
                  </div>
                </div>
              )}

              <div className="detailed-body-vertical-scroll">
                <div className="problem-section-card-stack">
                  <div className="section-header-tag custom-tag">Part A: LeetCode Problem</div>
                  <h3 className="section-card-title">{selectedQuestion.titleLc}</h3>
                  <div className="problem-section-body">
                    <h4 className="section-subtitle">Explanation</h4>
                    <p className="problem-text">{selectedQuestion.descLc}</p>
                    <h4 className="section-subtitle">Example</h4>
                    <p className="example-text">
                      Click the button below to view examples, constraints, and submit on LeetCode.
                    </p>
                  </div>
                  <div className="section-card-footer" style={{ marginTop: '1.5rem' }}>
                    <a href={selectedQuestion.linkLc} target="_blank" rel="noopener noreferrer" className="solve-button-new">
                      Solve on LeetCode →
                    </a>
                  </div>
                </div>

                <div className="problem-section-card-stack">
                  <div className="section-header-tag custom-tag">
                    Part B: Custom ACM DSA Problem
                  </div>
                  <h3 className="section-card-title">{selectedQuestion.titleCustom}</h3>
                  <div className="problem-section-body">
                    {(() => {
                      const { explanation, example } = parseChallengeContent(
                        selectedQuestion.descCustom
                      );
                      return (
                        <>
                          <h4 className="section-subtitle">Explanation</h4>
                          <p className="problem-text">{explanation}</p>
                          <h4 className="section-subtitle">Example</h4>
                          <p className="example-text">{example}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Part C: Final Submission */}
                <div className="problem-section-card-stack full-width-card">

                  <h3 className="section-card-title">Submit Your Code</h3>

                  <div className="problem-section-body" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ background: 'rgba(242, 170, 76, 0.1)', borderLeft: '4px solid #f2aa4c', padding: '1rem', borderRadius: '4px' }}>
                      <h4 className="section-subtitle" style={{ color: '#f2aa4c', marginTop: 0, marginBottom: '0.5rem' }}>Important Submission Instructions</h4>
                      <p className="problem-text" style={{ marginBottom: 0 }}>
                        Your GitHub commit <strong>must</strong> contain a folder named exactly after your own name and SapID (i.e. name_SapID). Inside this folder, you must include the solutions to <strong>BOTH</strong> the LeetCode problem (Part A) and the Custom Challenge (Part B). Marks will be given exclusively on the basis of both problem solutions being present in this single commit.
                      </p>
                    </div>
                  </div>

                  <div className="section-card-footer github-submission-section" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem' }}>
                    <form onSubmit={handleCommitSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="url"
                        placeholder="https://github.com/user/repo/commit/..."
                        value={commitUrl}
                        onChange={(e) => setCommitUrl(e.target.value)}
                        required
                        style={{ flex: 1, minWidth: '200px', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.2)', color: '#F3F3F3', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                      <div style={{ flex: '0 0 auto', width: '200px' }}>
                        <button type="submit" disabled={isSubmitting} className="solve-button-new">
                          {isSubmitting ? 'Submitting...' : 'Submit Commit ↗'}
                        </button>
                      </div>
                    </form>
                    {submitMsg && (
                      <p style={{ marginTop: '0.75rem', color: submitMsg.includes('successfully') ? '#4caf50' : '#f44336', fontSize: '0.875rem', fontWeight: '500' }}>
                        {submitMsg}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection-placeholder">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="placeholder-icon"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <h3>{currentDay === 0 ? "Event hasn't started yet" : "Select a challenge from the archive"}</h3>
              <p>
                {currentDay === 0
                  ? "Challenges will appear here once Day 1 begins. Stay tuned!"
                  : `Choose any day from Day 1 to Day ${currentDay} to inspect problem statements.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
