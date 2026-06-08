import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToUsers, updateUserProfile } from '../services/userService';
import { subscribeToQuestions, addOrUpdateQuestion, deleteQuestion as removeQuestion } from '../services/questionService';
import {
  subscribeToSubmissions,
  subscribeToDebuggingChallenges,
  subscribeToDebuggingSubmissions,
  subscribeToSystemConfig,
  updateSystemConfig,
  addOrUpdateSubmission,
  submitDebuggingSolution,
  gradeDebuggingSolution,
  addOrUpdateDebuggingChallenge,
} from '../services/completionService';
import { seedFirestoreIfEmpty } from '../utils/seedFirestore';
import { getDefaultSystemConfig, normalizeSystemConfig } from '../utils/eventConfig';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { currentUser, login, logout, register, resetPassword } = useAuth();

  const defaultConfig = getDefaultSystemConfig();
  const [db, setDb] = useState({
    users: [],
    questions: [],
    submissions: [],
    debuggingChallenges: [],
    currentDay: defaultConfig.currentDay,
    simulatedTime: defaultConfig.simulatedTime,
    completedWeeks: defaultConfig.completedWeeks,
  });

  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    setDbError(null);
    const unsubs = [];

    seedFirestoreIfEmpty().catch((err) => console.warn('[Seed] Seeding skipped:', err));

    try {
      unsubs.push(
        subscribeToSystemConfig((config) => {
          const normalized = normalizeSystemConfig(config);

          if (normalized.needsRepair) {
            updateSystemConfig({
              currentDay: normalized.currentDay,
              simulatedTime: normalized.simulatedTime,
              completedWeeks: normalized.completedWeeks,
            }).catch((err) => console.error('Failed to repair system config:', err));
          }

          setDb((prev) => ({
            ...prev,
            currentDay: normalized.currentDay,
            simulatedTime: normalized.simulatedTime,
            completedWeeks: normalized.completedWeeks,
          }));
        })
      );

      unsubs.push(
        subscribeToQuestions((qs) => {
          setDb((prev) => ({ ...prev, questions: qs }));
        })
      );

      unsubs.push(
        subscribeToSubmissions((subs) => {
          setDb((prev) => ({ ...prev, submissions: subs }));
        })
      );

      unsubs.push(
        subscribeToUsers((us) => {
          setDb((prev) => ({ ...prev, users: us }));
        })
      );

      let currentChallenges = [];
      let currentDebugSubs = [];

      const updateDebugChallenges = () => {
        const merged = currentChallenges.map((c) => ({
          ...c,
          submissions: currentDebugSubs.filter((s) => s.challengeId === c.id),
        }));
        setDb((prev) => ({ ...prev, debuggingChallenges: merged }));
      };

      unsubs.push(
        subscribeToDebuggingChallenges((challenges) => {
          currentChallenges = challenges;
          updateDebugChallenges();
        })
      );

      unsubs.push(
        subscribeToDebuggingSubmissions((subs) => {
          currentDebugSubs = subs;
          updateDebugChallenges();
        })
      );
    } catch (error) {
      console.error('Firestore subscription failed:', error);
      setDbError('Failed to load data. Please try again later.');
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const getOverallRank = (userId, allUsers) => {
    const participants = allUsers
      .filter((u) => u.role === 'participant')
      .sort((a, b) => {
        const scoreA = (a.totalCodingScore || 0) + (a.totalDebuggingScore || 0);
        const scoreB = (b.totalCodingScore || 0) + (b.totalDebuggingScore || 0);
        return scoreB - scoreA;
      });
    const index = participants.findIndex((u) => (u.uid || u.id) === userId);
    return index !== -1 ? index + 1 : '-';
  };

  const currentUserWithRank = currentUser
    ? {
        ...currentUser,
        overallRank: getOverallRank(currentUser.uid || currentUser.id, db.users),
      }
    : null;

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'participant') return;

    const myUid = currentUser.uid || currentUser.id;
    const userSubs = db.submissions.filter((s) => s.userId === myUid);

    const codingScore = userSubs
      .filter((s) => s.status === 'Submitted' || s.status === 'Late')
      .reduce((acc, curr) => acc + (curr.marks || 0), 0);

    const debugScore = db.debuggingChallenges.reduce((acc, challenge) => {
      const sub = challenge.submissions?.find((s) => s.userId === myUid);
      return acc + ((sub && sub.score) || 0);
    }, 0);

    let currentCodingStreak = 0;
    for (let d = db.currentDay - 1; d >= 1; d--) {
      const daySubs = db.submissions.filter((s) => s.userId === myUid && s.day === d);
      const hasLeetcode = daySubs.some((s) => s.type === 'leetcode' && s.status === 'Submitted');
      const hasCustom = daySubs.some((s) => s.type === 'custom' && s.status === 'Submitted');
      if (hasLeetcode && hasCustom) {
        currentCodingStreak++;
      } else {
        break;
      }
    }

    if (
      currentUser.totalCodingScore !== codingScore ||
      currentUser.totalDebuggingScore !== debugScore ||
      currentUser.gitHubStreak !== currentCodingStreak
    ) {
      updateUserProfile(myUid, {
        totalCodingScore: codingScore,
        totalDebuggingScore: debugScore,
        gitHubStreak: currentCodingStreak,
      }).catch((err) => console.error('Failed to auto-update scores/streaks:', err));
    }
  }, [db.submissions, db.debuggingChallenges, currentUser, db.currentDay]);

  const submitQuestionCode = async (dayNum, type, code, language) => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const myUid = currentUser.uid || currentUser.id;
    const q = db.questions.find((question) => question.day === dayNum);
    if (!q) return { success: false, message: 'Question not found.' };

    const eventTime = new Date(db.simulatedTime);
    const eventStartDate = new Date('2026-05-25T00:00:00+05:30');
    const publishTime = new Date(eventStartDate.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000);
    const deadlineTime = new Date(publishTime.getTime() + 24 * 60 * 60 * 1000);

    let status = 'Submitted';
    if (eventTime > deadlineTime) {
      status = 'Late';
    }

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
      return { success: true, status, message: `Solution for Day ${dayNum} (${type}) submitted successfully.` };
    } catch {
      return { success: false, message: 'Failed to submit solution.' };
    }
  };

  const submitDebuggingChallenge = async (challengeId, link) => {
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
  };

  const syncParticipantScores = async (userId, { codingSubId, codingMarks, debugChallengeId, debugScore } = {}) => {
    const userSubs = db.submissions.filter((s) => s.userId === userId);
    const codingScore = userSubs
      .filter((s) => s.status === 'Submitted' || s.status === 'Late')
      .reduce((acc, curr) => {
        if (codingSubId && curr.id === codingSubId) {
          return acc + (Number(codingMarks) || 0);
        }
        return acc + (Number(curr.marks) || 0);
      }, 0);

    const totalDebugScore = db.debuggingChallenges.reduce((acc, challenge) => {
      const sub = challenge.submissions?.find((s) => s.userId === userId);
      if (debugChallengeId && challenge.id === debugChallengeId) {
        return acc + (Number(debugScore) || 0);
      }
      return acc + (sub?.score != null ? Number(sub.score) : 0);
    }, 0);

    await updateUserProfile(userId, {
      totalCodingScore: codingScore,
      totalDebuggingScore: totalDebugScore,
    });
  };

  const gradeSubmission = async (subId, marks, comments, adminId) => {
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
  };

  const gradeDebuggingSubmission = async (challengeId, userId, score) => {
    try {
      await gradeDebuggingSolution(challengeId, userId, score);
      await syncParticipantScores(userId, { debugChallengeId: challengeId, debugScore: score });
      return { success: true, message: 'Debugging challenge graded.' };
    } catch {
      return { success: false, message: 'Failed to grade debugging challenge.' };
    }
  };

  const updateParticipantStreaks = async (userId, gitHubStreak, leetCodeStreak) => {
    try {
      await updateUserProfile(userId, {
        gitHubStreak: Number(gitHubStreak),
        leetCodeStreak: Number(leetCodeStreak),
      });
      return { success: true, message: 'Streaks updated successfully.' };
    } catch {
      return { success: false, message: 'Failed to update streaks.' };
    }
  };

  const toggleUserStatus = async (userId) => {
    const user = db.users.find((u) => (u.uid || u.id) === userId);
    if (!user) return { success: false, message: 'User not found.' };
    try {
      await updateUserProfile(userId, { isActive: !user.isActive });
      return { success: true, message: 'Participant active status toggled.' };
    } catch {
      return { success: false, message: 'Failed to toggle status.' };
    }
  };

  const uploadQuestion = async (questionData) => {
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
  };

  const deleteQuestion = async (dayNum) => {
    try {
      await removeQuestion(dayNum);
      return { success: true, message: `Challenge for Day ${dayNum} removed successfully.` };
    } catch {
      return { success: false, message: 'Failed to remove challenge.' };
    }
  };

  const editParticipantProgress = async (userId, codingScore, debugScore) => {
    try {
      await updateUserProfile(userId, {
        totalCodingScore: Number(codingScore),
        totalDebuggingScore: Number(debugScore),
      });
      return { success: true, message: 'Participant progress updated.' };
    } catch {
      return { success: false, message: 'Failed to update progress.' };
    }
  };

  const resetParticipantStreak = async (userId) => {
    try {
      await updateUserProfile(userId, { gitHubStreak: 0, leetCodeStreak: 0 });
      return { success: true, message: 'Participant streaks reset.' };
    } catch {
      return { success: false, message: 'Failed to reset streaks.' };
    }
  };

  const buildConfigPayload = (patch) => {
    const { needsRepair, ...base } = normalizeSystemConfig({
      currentDay: db.currentDay,
      simulatedTime: db.simulatedTime,
      completedWeeks: db.completedWeeks,
    });
    return { ...base, ...patch };
  };

  const completeWeek = async (weekNum) => {
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
  };

  const revertWeek = async (weekNum) => {
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
  };

  const uploadHandout = async (dayNum, handoutText) => {
    try {
      await addOrUpdateQuestion(dayNum, { handout: handoutText });
      return { success: true, message: `Handout for Day ${dayNum} added successfully.` };
    } catch {
      return { success: false, message: 'Failed to upload handout.' };
    }
  };

  const setSimulatedTimeAndDay = async (newTimeIso, newDayNum) => {
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
  };

  const uploadDebuggingChallenge = async (challengeData) => {
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
  };

  return (
    <AppContext.Provider
      value={{
        db,
        dbError,
        currentUser: currentUserWithRank,
        login,
        logout,
        register,
        resetPassword,
        submitQuestionCode,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
