import { useState } from 'react';
import { formatRating } from '../utils/ratingHelper';
import { useApp } from '../context/AppContext';

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
  const { db } = useApp();
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
    <div className="streak-grid-wrapper redesigned-journey">
      <h3 className="redesigned-section-header">
        <span className="section-heading-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13" /><path d="M9 4v13" /><path d="M15 7v13" /></svg>
        </span>
        Your Journey (Heatmap)
      </h3>

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
              onFocus={() => {
                const isSunday = d % 7 === 0;
                const weekNum = d / 7;
                const debugChallenge = isSunday ? db.debuggingChallenges.find(c => c.week === weekNum) : null;
                setFocusedDay({ day: d, status, q, debugChallenge });
              }}
              onBlur={() => setFocusedDay(null)}
            />
          );
        })}
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-cells">
          <div className="legend-cell lvl-0" title="Future / Empty" />
          <div className="legend-cell lvl-1" title="Missed / Pending" />
          <div className="legend-cell lvl-2" title="Partially Solved" />
          <div className="legend-cell lvl-3" title="Solved Late" />
          <div className="legend-cell lvl-4" title="Solved on Time" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
