import { updateUserProfile } from '../services/userService';

export function computeCodingScore(submissions, userId) {
  return submissions
    .filter((s) => s.userId === userId && (s.status === 'Submitted' || s.status === 'Late'))
    .reduce((acc, curr) => acc + (curr.marks || 0), 0);
}

export function computeDebugScore(debuggingChallenges, userId) {
  return debuggingChallenges.reduce((acc, challenge) => {
    const sub = challenge.submissions?.find((s) => s.userId === userId);
    return acc + (sub?.score ?? 0);
  }, 0);
}

export function computeCodingStreak(submissions, userId, currentDay) {
  let streak = 0;
  for (let d = currentDay - 1; d >= 1; d--) {
    const daySubs = submissions.filter((s) => s.userId === userId && s.day === d);
    const hasLeetcode = daySubs.some((s) => s.type === 'leetcode' && s.status === 'Submitted');
    const hasCustom = daySubs.some((s) => s.type === 'custom' && s.status === 'Submitted');
    if (hasLeetcode && hasCustom) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function syncParticipantProfile(db, userId, overrides = {}) {
  const codingScore = overrides.codingScore ?? computeCodingScore(db.submissions, userId);
  const debugScore = overrides.debugScore ?? computeDebugScore(db.debuggingChallenges, userId);
  const gitHubStreak =
    overrides.gitHubStreak ?? computeCodingStreak(db.submissions, userId, db.currentDay);

  await updateUserProfile(userId, {
    totalCodingScore: codingScore,
    totalDebuggingScore: debugScore,
    gitHubStreak,
    ...overrides.profilePatch,
  });
}

export function computeCodingScoreWithOverride(submissions, userId, codingSubId, codingMarks) {
  return submissions
    .filter((s) => s.userId === userId && (s.status === 'Submitted' || s.status === 'Late'))
    .reduce((acc, curr) => {
      if (codingSubId && curr.id === codingSubId) {
        return acc + (Number(codingMarks) || 0);
      }
      return acc + (Number(curr.marks) || 0);
    }, 0);
}

export function computeDebugScoreWithOverride(
  debuggingChallenges,
  userId,
  debugChallengeId,
  debugScore
) {
  return debuggingChallenges.reduce((acc, challenge) => {
    const sub = challenge.submissions?.find((s) => s.userId === userId);
    if (debugChallengeId && challenge.id === debugChallengeId) {
      return acc + (Number(debugScore) || 0);
    }
    return acc + (sub?.score != null ? Number(sub.score) : 0);
  }, 0);
}
