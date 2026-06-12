import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatRating } from '../utils/ratingHelper';
import { parseChallengeContent } from '../utils/challengeContent';

export default function Questions() {
  const { db } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [manualSelection, setManualSelection] = useState(null);
  const [smoothScrollValue, setSmoothScrollValue] = useState(0);

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
    const idx = archivedQuestions.findIndex(q => q.id === selectedQuestion?.id);
    setSmoothScrollValue(idx === -1 ? 0 : idx);
  }, [selectedQuestion, archivedQuestions]);

  return (
    <div className="questions-container">
      <div className="page-header">
        <h1>Daily Challenges</h1>
      </div>

      <div className="archive-vertical-layout">
        <div className="archive-top-gallery-panel">
          <div className="filter-controls-card-compact">
            <label htmlFor="day-search" className="sr-only">Search by day number</label>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon-svg" aria-hidden="true" focusable="false">
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
              const currentIndex = archivedQuestions.findIndex(q => q.id === selectedQuestion?.id);
              if (currentIndex === -1) return;
              if (e.deltaY > 0) {
                if (currentIndex < archivedQuestions.length - 1) setManualSelection(archivedQuestions[currentIndex + 1]);
              } else {
                if (currentIndex > 0) setManualSelection(archivedQuestions[currentIndex - 1]);
              }
            }}
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
                    const activeIndex = archivedQuestions.findIndex(item => item.id === selectedQuestion?.id);
                    const safeActiveIndex = activeIndex === -1 ? 0 : activeIndex;
                    const offset = index - safeActiveIndex;

                    return (
                      <button
                        type="button"
                        key={q.id}
                        className={`gallery-day-card circular-item ${isSelected ? 'active' : ''} ${isToday ? 'today' : ''} ${isMaster ? 'master-card' : ''}`}
                        onClick={() => setManualSelection(q)}
                        aria-pressed={isSelected}
                        aria-label={`Day ${q.day}, ${q.titleLc}, ${q.titleCustom}${isToday ? ', today' : ''}`}
                        style={{
                          transform: `translateX(${offset * 115}%) translateZ(${Math.abs(offset) * -100}px) rotateY(${offset * -18}deg)`,
                          zIndex: 100 - Math.abs(offset),
                          opacity: Math.abs(offset) > 4 ? 0 : 1,
                          pointerEvents: Math.abs(offset) > 2 ? 'none' : 'auto',
                          visibility: Math.abs(offset) > 4 ? 'hidden' : 'visible'
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
                          <div className="day-card-footer">
                            <span className="day-card-rating">Rating {formatRating(q)}</span>
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

        <div className="archive-bottom-details-panel">
          {selectedQuestion ? (
            <div className={`question-detailed-view-vertical ${selectedQuestion.isMaster ? 'master-styled' : ''}`}>
              <div className="detailed-header">
                <div className="header-meta">
                  <span className="day-large">DAY {selectedQuestion.day}</span>
                  <span className="rating-tag">RATING {formatRating(selectedQuestion)}</span>
                  {selectedQuestion.isMaster && (
                    <span className="master-challenge-tag">Master Challenge</span>
                  )}
                </div>
                <h2>{selectedQuestion.titleLc} &amp; {selectedQuestion.titleCustom}</h2>
              </div>

              {selectedQuestion.isMaster && (
                <div className="master-banner-alert">
                  <span className="icon">Master</span>
                  <div className="banner-content">
                    <h4>Grand Finale Master Challenge</h4>
                    <p>Submissions for Day 99 and 100 weigh double in the overall standing and determine the final standings for the Top 10 Grand Finale.</p>
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
                  <div className="section-card-footer">
                    <a href={selectedQuestion.linkLc} target="_blank" rel="noopener noreferrer" className="open-problem-btn">
                      Solve on LeetCode →
                    </a>
                  </div>
                </div>

                <div className="problem-section-card-stack">
                  <div className="section-header-tag custom-tag">Part B: Custom ACM DSA Problem</div>
                  <h3 className="section-card-title">{selectedQuestion.titleCustom}</h3>
                  <div className="problem-section-body">
                    {(() => {
                      const { explanation, example } = parseChallengeContent(selectedQuestion.descCustom);
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
              </div>
            </div>
          ) : (
            <div className="no-selection-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="placeholder-icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <h3>Select a challenge from the archive</h3>
              <p>Choose any day from Day 1 to Day {currentDay} to inspect problem statements and ratings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
