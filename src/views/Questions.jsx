import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatEventDate } from '../utils/dateFormat';

export default function Questions() {
  const { db } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const currentDay = db.currentDay;
  const questions = db.questions;

  // Filter archived questions (days <= currentDay)
  const archivedQuestions = questions.filter(q => {
    // Must be published (day <= currentDay)
    if (q.day > currentDay) return false;

    const matchesSearch = !searchQuery.trim() || q.day.toString() === searchQuery.trim();

    return matchesSearch;
  });

  return (
    <div className="questions-container">
      <div className="page-header">
        <h1>Challenge Archive</h1>

      </div>

      {/* Main Area: Split layout (List on left, details on right) */}
      <div className="archive-split-layout">
        <div className="archive-list-panel">
          <div className="filter-controls-card">
            <input 
              type="text" 
              placeholder="Search by day..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="question-list-scroll">
            {archivedQuestions.length === 0 ? (
              <div className="no-results">No questions match your filter criteria.</div>
            ) : (
              archivedQuestions.map(q => {
                const isToday = q.day === currentDay;
                const isMaster = q.isMaster || q.day >= 99;
                return (
                  <div 
                    key={q.id}
                    className={`archive-item-card ${selectedQuestion?.id === q.id ? 'active' : ''} ${isToday ? 'today' : ''} ${isMaster ? 'master-card' : ''}`}
                    onClick={() => setSelectedQuestion(q)}
                  >
                    <div className="item-left">
                      <span className={`day-badge ${isToday ? 'today' : ''}`}>Day {q.day}</span>
                      <div className="custom-titles" style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="title" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-title)' }}>{q.titleLc}</span>
                        <span className="subtitle-custom" style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>{q.titleCustom}</span>
                      </div>
                    </div>
                    <div className="item-right">
                      {isMaster && <span className="master-badge-flame">Master</span>}
                      <span className="rating-indicator">{q.rating || q.difficulty}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="archive-details-panel">
          {selectedQuestion ? (
            <div className={`question-detailed-view ${selectedQuestion.isMaster ? 'master-styled' : ''}`}>
              <div className="detailed-header">
                <div className="header-meta">
                  <span className="day-large">DAY {selectedQuestion.day}</span>
                  <span className="rating-tag">
                    Rating {selectedQuestion.rating || selectedQuestion.difficulty}
                  </span>
                  {selectedQuestion.isMaster && (
                    <span className="master-challenge-tag">Master Challenge</span>
                  )}
                </div>
                <h2>{selectedQuestion.titleLc} & {selectedQuestion.titleCustom}</h2>
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

              <div className="detailed-body-scroll">
                {/* Part 1: LeetCode Question */}
                <div className="problem-section-card">
                  <div className="section-title">Part A: LeetCode Problem</div>
                  <h3>{selectedQuestion.titleLc}</h3>
                  <p className="problem-text">{selectedQuestion.descLc}</p>
                  <a href={selectedQuestion.linkLc} target="_blank" rel="noreferrer" className="open-problem-btn">
                    Solve on LeetCode
                  </a>
                </div>

                {/* Part 2: Custom Question */}
                <div className="problem-section-card">
                  <div className="section-title">Part B: Custom ACM DSA Problem</div>
                  <h3>{selectedQuestion.titleCustom}</h3>
                  <p className="problem-text">{selectedQuestion.descCustom}</p>
                </div>

                {/* Part 3: Reference Solution */}
                {selectedQuestion.day < currentDay ? (
                  <div className="solutions-section-card">
                    <div className="section-title solutions">Reference Solution</div>
                    {selectedQuestion.solutionCode ? (
                      <div className="solution-code-box">
                        <h5>Reference Code Solution</h5>
                        <pre className="code-block">
                          <code>{selectedQuestion.solutionCode}</code>
                        </pre>
                      </div>
                    ) : (
                      <p className="no-handout-text">Reference code solution not uploaded by Technical Head yet.</p>
                    )}
                  </div>
                ) : (
                  <div className="solutions-locked-card">
                    <span className="lock-icon">[Locked]</span>
                    <p>Reference solutions unlock after the submission period ends (next day at 00:00 hrs).</p>
                  </div>
                )}
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
              <p>Choose any day from Day 1 to Day {currentDay} to inspect problem statements, rating, and reference solutions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
