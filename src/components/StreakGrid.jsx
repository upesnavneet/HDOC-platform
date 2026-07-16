import { useState } from 'react';

import { useApp } from '../context/AppContext';

import { computeCodingStreak } from '../context/scoreSync';

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
  const { db, currentUser } = useApp();
  const [focusedDay, setFocusedDay] = useState(null);

  const userId = currentUser?.id || currentUser?.uid;
  const currentStreak = computeCodingStreak(submissions, userId, currentDay, db.debuggingChallenges);

  const getDayStatus = (dayNum) => {
    const daySubs = submissions.filter((s) => s.day === dayNum);

    // If the user has made the required submissions for the day (now just 1 commit)
    if (daySubs.length >= 1) {
      return { class: 'level-4', text: 'Solved' };
    }

    // Otherwise, box remains unlit
    return { class: 'level-0', text: 'Unsolved' };
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 className="redesigned-section-header">
          <span className="section-heading-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13" />
              <path d="M9 4v13" />
              <path d="M15 7v13" />
            </svg>
          </span>
          Your Journey
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff9800', fontWeight: 'bold', fontSize: '1rem' }} title="Your Current Active Streak">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff9800" stroke="#ff9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path>
          </svg>
          {currentStreak} Day Streak
        </div>
      </div>

      <div
        className="grid-container grid-container-compact"
        role="group"
        aria-label="100 day coding streak grid"
      >
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
                const debugChallenge = isSunday
                  ? db.debuggingChallenges.find((c) => c.week === weekNum)
                  : null;
                setFocusedDay({ day: d, status, q, debugChallenge });
              }}
              onBlur={() => setFocusedDay(null)}
            />
          );
        })}
      </div>
    </div>
  );
}
