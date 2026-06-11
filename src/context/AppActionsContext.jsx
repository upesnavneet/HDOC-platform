import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { updateUserProfile } from '../services/userService';
import { addOrUpdateQuestion, deleteQuestion as removeQuestion } from '../services/questionService';
import {
  updateSystemConfig,
  addOrUpdateSubmission,
  submitDebuggingSolution,
  gradeDebuggingSolution,
  addOrUpdateDebuggingChallenge,
} from '../services/completionService';
import { normalizeSystemConfig } from '../utils/eventConfig';
import {
  syncParticipantProfile,
  computeCodingScoreWithOverride,
  computeDebugScoreWithOverride,
} from './scoreSync';

const AppActionsContext = createContext(null);

export function AppActionsProvider({ children }) {
  const { currentUser } = useAuth();
  const { db } = useData();

  const buildConfigPayload = useCallback(
    (patch) => {
      const { needsRepair: _needsRepair, ...base } = normalizeSystemConfig({
        currentDay: db.currentDay,
        simulatedTime: db.simulatedTime,
        completedWeeks: db.completedWeeks,
      });
      return { ...base, ...patch };
    },
    [db.currentDay, db.simulatedTime, db.completedWeeks]
  );

  const submitQuestionCode = useCallback(
    async (dayNum, type, code, language) => {
      if (!currentUser) return { success: false, message: 'Not logged in.' };

      const myUid = currentUser.uid || currentUser.id;
      const q = db.questions.find((question) => question.day === dayNum);
      if (!q) return { success: false, message: 'Question not found.' };

      const eventTime = new Date(db.simulatedTime);
      const eventStartDate = new Date('2026-05-25T00:00:00+05:30');
      const publishTime = new Date(eventStartDate.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000);
      const deadlineTime = new Date(publishTime.getTime() + 24 * 60 * 60 * 1000);

      let status = 'Submitted';
      if (eventTime > deadlineTime) status = 'Late';

      const existing = db.submissions.find(
        (s) => s.userId === myUid && s.day === dayNum && s.type === type
      );

      const subDetails = {
        userId: myUid,
        questionId: q.id,
        day: dayNum,
        type,
        code,
        language,
        timestamp: eventTime.toISOString(),
        status,
        marks: existing ? existing.marks : null,
        gradedBy: existing ? existing.gradedBy : '',
        comments: existing ? existing.comments : '',
      };

      const subId = existing ? existing.id : `sub-${myUid}-${dayNum}-${type}`;
      try {
        await addOrUpdateSubmission(subId, subDetails);
        await syncParticipantProfile(db, myUid).catch((err) =>
          console.error('Failed to sync scores/streaks after submit:', err)
        );
        return {
          success: true,
          status,
          message: `Solution for Day ${dayNum} (${type}) submitted successfully.`,
        };
      } catch {
        return { success: false, message: 'Failed to submit solution.' };
      }
    },
    [currentUser, db]
  );

  // H12: Commit URL submission — writes Schema B (same as submitQuestionCode)
  const submitCommitUrl = useCallback(
    async (dayNum, commitUrl) => {
      if (!currentUser) return { success: false, message: 'Not logged in.' };

      const myUid = currentUser.uid || currentUser.id;
      const eventTime = new Date(db.simulatedTime);
      const eventStartDate = new Date('2026-05-25T00:00:00+05:30');
      const publishTime = new Date(eventStartDate.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000);
      const deadlineTime = new Date(publishTime.getTime() + 24 * 60 * 60 * 1000);

      let status = 'Submitted';
      if (eventTime > deadlineTime) status = 'Late';

      const existing = db.submissions.find(
        (s) => s.userId === myUid && s.day === dayNum && s.type === 'commit'
      );

      const subDetails = {
        userId: myUid,
        questionId: '',
        day: dayNum,
        type: 'commit',
        code: commitUrl,
        language: '',
        link: commitUrl,
        timestamp: eventTime.toISOString(),
        status,
        marks: existing ? existing.marks : null,
        gradedBy: existing ? existing.gradedBy : '',
        comments: existing ? existing.comments : '',
      };

      const subId = existing ? existing.id : `sub-${myUid}-${dayNum}-commit`;
      try {
        await addOrUpdateSubmission(subId, subDetails);
        return { success: true, message: 'Commit submitted successfully.' };
      } catch {
        return { success: false, message: 'Failed to submit commit.' };
      }
    },
    [currentUser, db]
  );

  const submitDebuggingChallenge = useCallback(
    async (challengeId, link) => {
      if (!currentUser) return { success: false, message: 'Not logged in.' };

      const myUid = currentUser.uid || currentUser.id;
      const challenge = db.debuggingChallenges.find((c) => c.id === challengeId);
      if (!challenge) return { success: false, message: 'Challenge not found.' };

      const eventTime = new Date(db.simulatedTime);
      const publishedTime = new Date(challenge.publishedDate);
      if (eventTime < publishedTime) {
        return { success: false, message: 'Challenge has not started yet.' };
      }

      try {
        await submitDebuggingSolution(challengeId, myUid, link, eventTime.toISOString());
        return { success: true, message: 'Debugging solution submitted successfully.' };
      } catch {
        return { success: false, message: 'Failed to submit debugging solution.' };
      }
    },
    [currentUser, db]
  );

  const syncParticipantScores = useCallback(
    async (userId, { codingSubId, codingMarks, debugChallengeId, debugScore } = {}) => {
      const codingScore = computeCodingScoreWithOverride(
        db.submissions,
        userId,
        codingSubId,
        codingMarks
      );
      const totalDebugScore = computeDebugScoreWithOverride(
        db.debuggingChallenges,
        userId,
        debugChallengeId,
        debugScore
      );
      await updateUserProfile(userId, {
        totalCodingScore: codingScore,
        totalDebuggingScore: totalDebugScore,
      });
    },
    [db]
  );

  const gradeSubmission = useCallback(
    async (subId, marks, comments, adminId) => {
      try {
        const sub = db.submissions.find((s) => s.id === subId);
        await addOrUpdateSubmission(subId, {
          marks: Number(marks),
          comments,
          gradedBy: adminId,
        });
        if (sub?.userId) {
          await syncParticipantScores(sub.userId, { codingSubId: subId, codingMarks: marks });
        }
        return { success: true, message: 'Submission graded successfully.' };
      } catch {
        return { success: false, message: 'Failed to grade submission.' };
      }
    },
    [db, syncParticipantScores]
  );

  const gradeDebuggingSubmission = useCallback(
    async (challengeId, userId, score) => {
      try {
        await gradeDebuggingSolution(challengeId, userId, score);
        await syncParticipantScores(userId, { debugChallengeId: challengeId, debugScore: score });
        return { success: true, message: 'Debugging challenge graded.' };
      } catch {
        return { success: false, message: 'Failed to grade debugging challenge.' };
      }
    },
    [syncParticipantScores]
  );

  const updateParticipantStreaks = useCallback(async (userId, gitHubStreak, leetCodeStreak) => {
    try {
      await updateUserProfile(userId, {
        gitHubStreak: Number(gitHubStreak),
        leetCodeStreak: Number(leetCodeStreak),
      });
      return { success: true, message: 'Streaks updated successfully.' };
    } catch {
      return { success: false, message: 'Failed to update streaks.' };
    }
  }, []);

  const toggleUserStatus = useCallback(
    async (userId) => {
      const user = db.users.find((u) => (u.uid || u.id) === userId);
      if (!user) return { success: false, message: 'User not found.' };
      try {
        await updateUserProfile(userId, { isActive: !user.isActive });
        return { success: true, message: 'Participant active status toggled.' };
      } catch {
        return { success: false, message: 'Failed to toggle status.' };
      }
    },
    [db.users]
  );

  const uploadQuestion = useCallback(async (questionData) => {
    try {
      await addOrUpdateQuestion(questionData.day, {
        titleLc: questionData.titleLc,
        linkLc: questionData.linkLc,
        descLc: questionData.descLc,
        titleCustom: questionData.titleCustom,
        descCustom: questionData.descCustom,
        rating: questionData.rating || questionData.difficulty || '800',
        difficulty: questionData.difficulty || questionData.rating || 'Medium',
        isMaster: Number(questionData.day) >= 99,
        handout: questionData.handout || '',
        solutionCode: questionData.solutionCode || '',
      });
      return { success: true, message: `Question for Day ${questionData.day} uploaded successfully.` };
    } catch {
      return { success: false, message: 'Failed to upload question.' };
    }
  }, []);

  const deleteQuestion = useCallback(async (dayNum) => {
    try {
      await removeQuestion(dayNum);
      return { success: true, message: `Challenge for Day ${dayNum} removed successfully.` };
    } catch {
      return { success: false, message: 'Failed to remove challenge.' };
    }
  }, []);

  const editParticipantProgress = useCallback(async (userId, codingScore, debugScore) => {
    try {
      await updateUserProfile(userId, {
        totalCodingScore: Number(codingScore),
        totalDebuggingScore: Number(debugScore),
      });
      return { success: true, message: 'Participant progress updated.' };
    } catch {
      return { success: false, message: 'Failed to update progress.' };
    }
  }, []);

  const resetParticipantStreak = useCallback(async (userId) => {
    try {
      await updateUserProfile(userId, { gitHubStreak: 0, leetCodeStreak: 0 });
      return { success: true, message: 'Participant streaks reset.' };
    } catch {
      return { success: false, message: 'Failed to reset streaks.' };
    }
  }, []);

  const completeWeek = useCallback(
    async (weekNum) => {
      const completedWeeks = db.completedWeeks || [];
      if (completedWeeks.includes(Number(weekNum))) {
        return { success: false, message: `Week ${weekNum} is already marked complete.` };
      }
      try {
        await updateSystemConfig(
          buildConfigPayload({
            completedWeeks: [...completedWeeks, Number(weekNum)].sort((a, b) => a - b),
          })
        );
        return { success: true, message: `Week ${weekNum} marked complete.` };
      } catch {
        return { success: false, message: 'Failed to mark week complete.' };
      }
    },
    [db.completedWeeks, buildConfigPayload]
  );

  const revertWeek = useCallback(
    async (weekNum) => {
      const completedWeeks = db.completedWeeks || [];
      if (!completedWeeks.includes(Number(weekNum))) {
        return { success: false, message: `Week ${weekNum} is not marked complete.` };
      }
      try {
        await updateSystemConfig(
          buildConfigPayload({
            completedWeeks: completedWeeks.filter((w) => w !== Number(weekNum)),
          })
        );
        return { success: true, message: `Week ${weekNum} reverted to incomplete.` };
      } catch {
        return { success: false, message: 'Failed to revert week completion.' };
      }
    },
    [db.completedWeeks, buildConfigPayload]
  );

  const uploadHandout = useCallback(async (dayNum, handoutText) => {
    try {
      await addOrUpdateQuestion(dayNum, { handout: handoutText });
      return { success: true, message: `Handout for Day ${dayNum} added successfully.` };
    } catch {
      return { success: false, message: 'Failed to upload handout.' };
    }
  }, []);

  const setSimulatedTimeAndDay = useCallback(
    async (newTimeIso, newDayNum) => {
      try {
        await updateSystemConfig(
          buildConfigPayload({
            simulatedTime: newTimeIso,
            currentDay: Number(newDayNum),
          })
        );
        return { success: true, message: 'Event schedule updated.' };
      } catch {
        return { success: false, message: 'Failed to update event schedule.' };
      }
    },
    [buildConfigPayload]
  );

  const uploadDebuggingChallenge = useCallback(async (challengeData) => {
    try {
      await addOrUpdateDebuggingChallenge(challengeData.week, {
        theme: challengeData.theme,
        description: challengeData.description,
        starterCode: challengeData.starterCode,
        publishedDate: challengeData.publishedDate,
      });
      return { success: true, message: `Week ${challengeData.week} Debugging Challenge scheduled.` };
    } catch {
      return { success: false, message: 'Failed to schedule debugging challenge.' };
    }
  }, []);

  const value = useMemo(
    () => ({
      submitQuestionCode,
      submitCommitUrl,
      submitDebuggingChallenge,
      gradeSubmission,
      gradeDebuggingSubmission,
      updateParticipantStreaks,
      toggleUserStatus,
      uploadQuestion,
      deleteQuestion,
      editParticipantProgress,
      resetParticipantStreak,
      completeWeek,
      revertWeek,
      uploadHandout,
      setSimulatedTimeAndDay,
      uploadDebuggingChallenge,
    }),
    [
      submitQuestionCode,
      submitCommitUrl,
      submitDebuggingChallenge,
      gradeSubmission,
      gradeDebuggingSubmission,
      updateParticipantStreaks,
      toggleUserStatus,
      uploadQuestion,
      deleteQuestion,
      editParticipantProgress,
      resetParticipantStreak,
      completeWeek,
      revertWeek,
      uploadHandout,
      setSimulatedTimeAndDay,
      uploadDebuggingChallenge,
    ]
  );

  return <AppActionsContext.Provider value={value}>{children}</AppActionsContext.Provider>;
}

export function useAppActions() {
  const ctx = useContext(AppActionsContext);
  if (!ctx) throw new Error('useAppActions must be used within AppActionsProvider');
  return ctx;
}
