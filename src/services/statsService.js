const isDayComplete = (submissions, day) => {
  const daySubs = submissions.filter((s) => s.day === day);
  const hasLeetcode = daySubs.some(
    (s) => s.type === 'leetcode' && (s.status === 'Submitted' || s.status === 'Late')
  );
  const hasCustom = daySubs.some(
    (s) => s.type === 'custom' && (s.status === 'Submitted' || s.status === 'Late')
  );
  return hasLeetcode && hasCustom;
};

export const countLinesWritten = (submissions) => {
  return submissions.reduce((total, sub) => {
    if (!sub.code) return total;
    return total + sub.code.split('\n').filter((line) => line.trim().length > 0).length;
  }, 0);
};

export const calculateFinishRate = (submissions, currentDay) => {
  if (!currentDay || currentDay <= 0) return 0;

  let completed = 0;
  for (let day = 1; day <= currentDay; day++) {
    if (isDayComplete(submissions, day)) completed++;
  }

  return Math.round((completed / currentDay) * 100);
};

export const countCompletedWeeks = (submissions, currentDay) => {
  if (!currentDay || currentDay <= 0) return 0;

  const totalWeeks = Math.ceil(currentDay / 7);
  let completed = 0;

  for (let week = 1; week <= totalWeeks; week++) {
    const weekStart = (week - 1) * 7 + 1;
    const weekEnd = week * 7;
    const daysInWeek = Math.min(weekEnd, currentDay) - weekStart + 1;

    if (daysInWeek < 7) continue;

    let weekComplete = true;
    for (let day = weekStart; day <= weekEnd; day++) {
      if (!isDayComplete(submissions, day)) {
        weekComplete = false;
        break;
      }
    }

    if (weekComplete) completed++;
  }

  return completed;
};
