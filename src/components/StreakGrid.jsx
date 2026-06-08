import React, { useState } from 'react';

function StreakCell({ status, isCurrent, onMouseEnter, onMouseLeave }) {
  return (
    <div
      className={`grid-cell grid-cell-compact ${status.class} ${isCurrent ? 'current-day-cell' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}

export default function StreakGrid({ currentDay, submissions, questions, tiltProps = {} }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const getDayStatus = (dayNum) => {
    if (dayNum > currentDay) {
      return { class: 'future', text: 'Locked (Future)' };
    }

    const daySubs = submissions.filter(s => s.day === dayNum);

    if (dayNum === currentDay) {
      if (daySubs.length === 0) {
        return { class: 'pending', text: 'Pending Submission' };
      }
      const hasLate = daySubs.some(s => s.status === 'Late');
      const allSubmitted = daySubs.length === 2;
      if (allSubmitted) {
        return hasLate ? { class: 'late', text: 'Submitted (Late)' } : { class: 'solved', text: 'Solved' };
      }
      return { class: 'partial', text: 'Partially Submitted' };
    }

    if (daySubs.length === 0) {
      return { class: 'missed', text: 'Missed (No Submissions)' };
    }

    const hasMissed = daySubs.some(s => s.status === 'Missed');
    const hasLate = daySubs.some(s => s.status === 'Late');
    const allSubmitted = daySubs.length === 2 && daySubs.every(s => s.status === 'Submitted' || s.status === 'Late');

    if (hasMissed || daySubs.length < 2) {
      return { class: 'missed', text: 'Missed / Incomplete' };
    }

    if (hasLate) {
      return { class: 'late', text: 'Solved (Late)' };
    }

    return { class: 'solved', text: 'Solved on Time' };
  };

  const completedDays = Array.from({ length: currentDay }, (_, i) => i + 1).filter(
    (d) => {
      const status = getDayStatus(d);
      return status.class === 'solved' || status.class === 'late';
    }
  ).length;

  const prevDay = currentDay - 1;
  const prevQuestion = questions.find(q => q.day === prevDay);

  const renderCells = () => {
    const cells = [];
    for (let d = 1; d <= 100; d++) {
      const status = getDayStatus(d);
      const isCurrent = d === currentDay;
      const q = questions.find(question => question.day === d);
      const daySubs = submissions.filter(s => s.day === d);

      cells.push(
        <StreakCell
          key={d}
          status={status}
          isCurrent={isCurrent}
          onMouseEnter={() => setHoveredDay({ day: d, status, q, subs: daySubs })}
          onMouseLeave={() => setHoveredDay(null)}
        />
      );
    }
    return cells;
  };

  return (
    <div className="streak-grid-wrapper streak-grid-compact press-card" {...tiltProps}>
      <div className="journey-header">
        <span className="journey-label">Your Journey</span>
        <div className="journey-main">
          <div className="journey-progress-row">
            <span className="journey-count">{completedDays}</span>
            <span className="journey-of">of 100 days completed</span>
          </div>
          <div className="journey-progress-bar-wrapper">
            <div className="journey-progress-bar progress-animate" style={{ width: `${completedDays}%` }} />
          </div>
        </div>
        <div className="journey-progress-meta">
          <span>Day {currentDay} · {100 - currentDay} left</span>
        </div>
      </div>

      <div className="compact-map-label">100-Day Map</div>
      <div className="grid-container grid-container-compact">
        {renderCells()}
      </div>

      <div className="previous-day-section">
        {prevDay >= 1 && prevQuestion ? (
          <>
            <div className="previous-day-header">
              <span className="previous-day-tag">Previous Day · Day {prevDay}</span>
            </div>
            <h4 className="previous-day-title">{prevQuestion.titleLc}</h4>
            <p className="previous-day-subtitle">{prevQuestion.titleCustom}</p>
            <div className="previous-day-tags">
              <span className="rating-tag">
                Rating {prevQuestion.rating || prevQuestion.difficulty}
              </span>
            </div>
            <div className="previous-day-links">
              {prevQuestion.linkLc && (
                <a href={prevQuestion.linkLc} target="_blank" rel="noreferrer" className="previous-day-link">
                  LeetCode Problem
                </a>
              )}
            </div>
          </>
        ) : (
          <div className="previous-day-empty">
            <span className="previous-day-tag">Previous Day</span>
            <p>No previous day challenge yet.</p>
          </div>
        )}
      </div>

      {hoveredDay && (
        <div className="grid-tooltip-container grid-tooltip-compact">
          <div className="tooltip-header">
            <span className="tooltip-day-title">Day {hoveredDay.day}</span>
            <span className={`tooltip-status-badge ${hoveredDay.status.class}`}>
              {hoveredDay.status.text}
            </span>
          </div>
          {hoveredDay.day <= currentDay ? (
            <div className="tooltip-body">
              {hoveredDay.q ? (
                <>
                  <p className="tooltip-q-item"><strong>LeetCode:</strong> {hoveredDay.q.titleLc}</p>
                  <p className="tooltip-q-item"><strong>Custom:</strong> {hoveredDay.q.titleCustom}</p>
                </>
              ) : (
                <p className="tooltip-q-item">Questions scheduled for this day.</p>
              )}
            </div>
          ) : (
            <div className="tooltip-body">
              <p className="tooltip-locked-text">Locked. Unlocks on Day {hoveredDay.day}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
