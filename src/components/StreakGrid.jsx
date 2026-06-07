import React, { useState, useRef } from 'react';

function StreakCell({ dayNum, status, isCurrent, onMouseEnter, onMouseLeave, children }) {
  const cellRef = useRef(null);
  const [cellStyle, setCellStyle] = useState({});

  const handleMouseMove = (e) => {
    const cell = cellRef.current;
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const cx = nx - 0.5;
    const cy = ny - 0.5;

    const maxTilt = 8; // 8 degrees maximum tilt
    const rotateX = -(cy * maxTilt).toFixed(1);
    const rotateY = (cx * maxTilt).toFixed(1);

    setCellStyle({
      transform: `perspective(100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.08)`,
      zIndex: 10,
    });
  };

  const handleMouseLeave = () => {
    setCellStyle({});
    onMouseLeave();
  };

  return (
    <div
      ref={cellRef}
      className={`grid-cell ${status.class} ${isCurrent ? 'current-day-cell' : ''}`}
      style={cellStyle}
      onMouseEnter={onMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

export default function StreakGrid({ currentDay, submissions, questions, tiltProps = {} }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const getDayStatus = (dayNum) => {
    if (dayNum > currentDay) {
      return { class: 'future', text: 'Locked (Future)' };
    }

    const daySubs = submissions.filter(s => s.day === dayNum);
    const dayQs = questions.filter(q => q.day === dayNum);

    // If day is currentDay, check if pending or submitted
    if (dayNum === currentDay) {
      if (daySubs.length === 0) {
        return { class: 'pending', text: 'Pending Submission' };
      }
      const hasLate = daySubs.some(s => s.status === 'Late');
      const allSubmitted = daySubs.length === 2; // lc + custom
      if (allSubmitted) {
        return hasLate ? { class: 'late', text: 'Submitted (Late)' } : { class: 'solved', text: 'Solved' };
      }
      return { class: 'partial', text: 'Partially Submitted' };
    }

    // Past day
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
          dayNum={d}
          status={status}
          isCurrent={isCurrent}
          onMouseEnter={() => setHoveredDay({ day: d, status, q, subs: daySubs })}
          onMouseLeave={() => setHoveredDay(null)}
        >
          <span className="cell-number">{d}</span>
          {isCurrent && <div className="cell-pulse"></div>}
        </StreakCell>
      );
    }
    return cells;
  };

  return (
    <div className="streak-grid-wrapper" {...tiltProps}>
      <div className="grid-header">
        <h3 className="section-title-small">100 Days Progress Board</h3>
        <div className="grid-legend">
          <span className="legend-item"><span className="legend-box solved"></span> Solved</span>
          <span className="legend-item"><span className="legend-box late"></span> Late</span>
          <span className="legend-item"><span className="legend-box missed"></span> Missed</span>
          <span className="legend-item"><span className="legend-box pending"></span> Active</span>
          <span className="legend-item"><span className="legend-box future"></span> Future</span>
        </div>
      </div>

      <div className="grid-container">
        {renderCells()}
      </div>

      {hoveredDay && (
        <div className="grid-tooltip-container">
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
              {hoveredDay.subs.length > 0 && (
                <div className="tooltip-subs-summary">
                  <p className="tooltip-sub-title">Submissions:</p>
                  {hoveredDay.subs.map((sub, idx) => (
                    <div key={idx} className="tooltip-sub-line">
                      <span>{sub.type.toUpperCase()}: </span>
                      <span className={sub.status.toLowerCase()}>{sub.status}</span>
                      {sub.marks !== null && <span> ({sub.marks} pts)</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="tooltip-body">
              <p className="tooltip-locked-text">Locked. This challenge will unlock on Day {hoveredDay.day}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
