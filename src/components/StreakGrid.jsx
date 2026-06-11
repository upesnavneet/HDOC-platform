import { useState } from 'react';
import { formatRating } from '../utils/ratingHelper';

function StreakCell({ dayNum, status, isCurrent, label, onFocus, onBlur }) {
  return (
    <button
      type="button"
      className={`grid-cell grid-cell-compact ${status.class} ${isCurrent ? 'current-day-cell' : ''}`}
      aria-label={label}
      aria-current={isCurrent ? 'date' : undefined}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

export default function StreakGrid({ currentDay, submissions, questions, tiltProps = {} }) {
  const [focusedDay, setFocusedDay] = useState(null);

  const getDayStatus = (dayNum) => {
    if (dayNum > currentDay) {
      return { class: 'future', text: 'Locked (Future)' };
    }

    const daySubs = submissions.filter((s) => s.day === dayNum);

    if (dayNum === currentDay) {
      if (daySubs.length === 0) {
        return { class: 'pending', text: 'Pending Submission' };
      }
      const hasLate = daySubs.some((s) => s.status === 'Late');
      const allSubmitted = daySubs.length === 2;
      if (allSubmitted) {
        return hasLate ? { class: 'late', text: 'Submitted (Late)' } : { class: 'solved', text: 'Solved' };
      }
      return { class: 'partial', text: 'Partially Submitted' };
    }

    if (daySubs.length === 0) {
      return { class: 'missed', text: 'Missed (No Submissions)' };
    }

    const hasMissed = daySubs.some((s) => s.status === 'Missed');
    const hasLate = daySubs.some((s) => s.status === 'Late');

    if (hasMissed || daySubs.length < 2) {
      return { class: 'missed', text: 'Missed / Incomplete' };
    }

    if (hasLate) {
      return { class: 'late', text: 'Solved (Late)' };
    }

    return { class: 'solved', text: 'Solved on Time' };
  };

  const buildDayLabel = (dayNum, status, q) => {
    const titles = q ? `${q.titleLc}, ${q.titleCustom}` : 'No questions scheduled';
    return `Day ${dayNum}, ${status.text}. ${titles}`;
  };

  const prevDay = currentDay - 1;
  const prevQuestion = questions.find((q) => q.day === prevDay);

  const activeDayInfo = focusedDay;

  return (
    <div className="streak-grid-wrapper streak-grid-compact press-card" {...tiltProps}>
      <div className="grid-container grid-container-compact" role="group" aria-label="100 day coding streak grid">
        {Array.from({ length: 100 }, (_, i) => {
          const d = i + 1;
          const status = getDayStatus(d);
          const isCurrent = d === currentDay;
          const q = questions.find((question) => question.day === d);
          return (
            <StreakCell
              key={d}
              dayNum={d}
              status={status}
              isCurrent={isCurrent}
              label={buildDayLabel(d, status, q)}
              onFocus={() => setFocusedDay({ day: d, status, q })}
              onBlur={() => setFocusedDay(null)}
            />
          );
        })}
      </div>

      <div className="previous-day-section" aria-live="polite">
        {activeDayInfo ? (
          (activeDayInfo.day === currentDay || activeDayInfo.day === currentDay - 1) ? (
            <div className="grid-tooltip-compact grid-tooltip-static">
              <div className="tooltip-header">
                <span className="tooltip-day-title">Day {activeDayInfo.day}</span>
                <span className={`tooltip-status-badge ${activeDayInfo.status.class}`}>
                  {activeDayInfo.status.text}
                </span>
              </div>
              <div className="tooltip-body">
                {activeDayInfo.q ? (
                  <>
                    <p className="tooltip-q-item"><strong>LeetCode:</strong> {activeDayInfo.q.titleLc}</p>
                    <p className="tooltip-q-item"><strong>Custom:</strong> {activeDayInfo.q.titleCustom}</p>
                  </>
                ) : (
                  <p className="tooltip-q-item">Questions scheduled for this day.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="previous-day-empty">
              <p>Locked - No questions available.</p>
            </div>
          )
        ) : prevDay >= 1 && prevQuestion ? (
          <>
            <div className="previous-day-header">
              <span className="previous-day-tag">Previous Day · Day {prevDay}</span>
            </div>
            <h4 className="previous-day-title">{prevQuestion.titleLc}</h4>
            <p className="previous-day-subtitle">{prevQuestion.titleCustom}</p>
            <div className="previous-day-tags">
              <span className="rating-tag">Rating {formatRating(prevQuestion)}</span>
            </div>
            <div className="previous-day-links">
              {prevQuestion.linkLc && (
                <a href={prevQuestion.linkLc} target="_blank" rel="noopener noreferrer" className="previous-day-link">
                  LeetCode Problem<span className="sr-only"> (opens in new tab)</span>
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
    </div>
  );
}
