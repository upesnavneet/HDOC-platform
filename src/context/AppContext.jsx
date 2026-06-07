import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { loadDB, saveDB, updateLeaderboardsAndStreaks } from './db';
import { subscribeToUsers, updateUserProfile } from '../services/userService';
import { subscribeToQuestions, addOrUpdateQuestion } from '../services/questionService';
import {
  subscribeToSubmissions,
  subscribeToDebuggingChallenges,
  subscribeToDebuggingSubmissions,
  subscribeToSystemConfig,
  updateSystemConfig,
  addOrUpdateSubmission,
  submitDebuggingSolution,
  gradeDebuggingSolution,
  addOrUpdateDebuggingChallenge
} from '../services/completionService';
import { seedFirestoreIfEmpty } from '../utils/seedFirestore';

const AppContext = createContext();

const isMock = !import.meta.env.VITE_FIREBASE_API_KEY || 
               import.meta.env.VITE_FIREBASE_API_KEY.includes('mock');

export const AppProvider = ({ children }) => {
  const { currentUser, login, logout, register, resetPassword } = useAuth();
  
  const [db, setDb] = useState(() => {
    if (isMock) {
      return loadDB();
    }
    return {
      users: [],
      questions: [],
      submissions: [],
      debuggingChallenges: [],
      currentDay: 12,
      simulatedTime: new Date('2026-06-05T15:47:39+05:30').toISOString()
    };
  });

  const [dbError, setDbError] = useState(null);

  // Sync state to local storage when database changes (Mock Mode only)
  useEffect(() => {
    if (isMock) {
      saveDB(db);
    }
  }, [db]);

  // Setup Firestore Subscribers (Firebase Mode only)
  useEffect(() => {
    if (isMock) return;

    setDbError(null);
    const unsubs = [];

    // Auto-seed Firestore on first launch (if collections are empty)
    seedFirestoreIfEmpty().catch(err => console.warn('[Seed] Seeding skipped:', err));

    try {
      // 1. Subscribe to system config
      unsubs.push(subscribeToSystemConfig((config) => {
        if (config) {
          setDb(prev => ({
            ...prev,
            currentDay: Number(config.currentDay),
            simulatedTime: config.simulatedTime
          }));
        }
      }));

      // 2. Subscribe to questions
      unsubs.push(subscribeToQuestions((qs) => {
        setDb(prev => ({
          ...prev,
          questions: qs
        }));
      }));

      // 3. Subscribe to submissions
      unsubs.push(subscribeToSubmissions((subs) => {
        setDb(prev => ({
          ...prev,
          submissions: subs
        }));
      }));

      // 4. Subscribe to users
      unsubs.push(subscribeToUsers((us) => {
        setDb(prev => ({
          ...prev,
          users: us
        }));
      }));

      // 5. Subscribe to debugging challenges & submissions
      let currentChallenges = [];
      let currentDebugSubs = [];

      const updateDebugChallenges = () => {
        const merged = currentChallenges.map(c => ({
          ...c,
          submissions: currentDebugSubs.filter(s => s.challengeId === c.id)
        }));
        setDb(prev => ({
          ...prev,
          debuggingChallenges: merged
        }));
      };

      unsubs.push(subscribeToDebuggingChallenges((challenges) => {
        currentChallenges = challenges;
        updateDebugChallenges();
      }));

      unsubs.push(subscribeToDebuggingSubmissions((subs) => {
        currentDebugSubs = subs;
        updateDebugChallenges();
      }));

    } catch (error) {
      console.error('Firestore subscription failed:', error);
      setDbError('Failed to load questions. Please try again later.');
    }

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  // Recalculating rank function
  const getOverallRank = (userId, allUsers) => {
    const participants = allUsers
      .filter(u => u.role === 'participant')
      .sort((a, b) => {
        const scoreA = (a.totalCodingScore || 0) + (a.totalDebuggingScore || 0);
        const scoreB = (b.totalCodingScore || 0) + (b.totalDebuggingScore || 0);
        return scoreB - scoreA;
      });
    const index = participants.findIndex(u => (u.uid || u.id) === userId);
    return index !== -1 ? index + 1 : '-';
  };

  const currentUserWithRank = currentUser ? {
    ...currentUser,
    overallRank: getOverallRank(currentUser.uid || currentUser.id, db.users)
  } : null;

  // Streak & Score Auto-updater (Firebase Mode only)
  useEffect(() => {
    if (isMock) return;
    if (!currentUser || currentUser.role !== 'participant') return;

    const myUid = currentUser.uid || currentUser.id;
    const userSubs = db.submissions.filter(s => s.userId === myUid);
    
    const codingScore = userSubs
      .filter(s => s.status === 'Submitted' || s.status === 'Late')
      .reduce((acc, curr) => acc + (curr.marks || 0), 0);

    const debugScore = db.debuggingChallenges.reduce((acc, challenge) => {
      const sub = challenge.submissions?.find(s => s.userId === myUid);
      return acc + ((sub && sub.score) || 0);
    }, 0);

    let currentCodingStreak = 0;
    for (let d = db.currentDay - 1; d >= 1; d--) {
      const daySubs = db.submissions.filter(s => s.userId === myUid && s.day === d);
      const hasLeetcode = daySubs.some(s => s.type === 'leetcode' && s.status === 'Submitted');
      const hasCustom = daySubs.some(s => s.type === 'custom' && s.status === 'Submitted');
      const allSubmittedOnTime = hasLeetcode && hasCustom;
      if (allSubmittedOnTime) {
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
        gitHubStreak: currentCodingStreak
      }).catch(err => console.error('Failed to auto-update scores/streaks:', err));
    }
  }, [db.submissions, db.debuggingChallenges, currentUser, db.currentDay]);

  // Actions
  const submitQuestionCode = async (dayNum, type, code, language) => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const myUid = currentUser.uid || currentUser.id;

    if (isMock) {
      const q = db.questions.find(question => question.day === dayNum);
      if (!q) return { success: false, message: 'Question not found.' };

      const currentSimulatedTime = new Date(db.simulatedTime);
      const eventStartDate = new Date('2026-05-25T00:00:00');
      const publishTime = new Date(eventStartDate.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000);
      const deadlineTime = new Date(publishTime.getTime() + 24 * 60 * 60 * 1000);

      let status = 'Submitted';
      if (currentSimulatedTime > deadlineTime) {
        status = 'Late';
      }

      const existingIndex = db.submissions.findIndex(
        s => s.userId === myUid && s.day === dayNum && s.type === type
      );

      const subDetails = {
        id: existingIndex !== -1 ? db.submissions[existingIndex].id : `sub-${myUid}-${dayNum}-${type}-${Date.now()}`,
        userId: myUid,
        questionId: q.id,
        day: dayNum,
        type,
        code,
        language,
        timestamp: currentSimulatedTime.toISOString(),
        status,
        marks: existingIndex !== -1 ? db.submissions[existingIndex].marks : null,
        gradedBy: existingIndex !== -1 ? db.submissions[existingIndex].gradedBy : '',
        comments: existingIndex !== -1 ? db.submissions[existingIndex].comments : ''
      };

      let updatedSubmissions = [...db.submissions];
      if (existingIndex !== -1) {
        updatedSubmissions[existingIndex] = subDetails;
      } else {
        updatedSubmissions.push(subDetails);
      }

      let updatedDB = { ...db, submissions: updatedSubmissions };
      updatedDB = updateLeaderboardsAndStreaks(updatedDB);
      setDb(updatedDB);

      return { success: true, status, message: `Solution for Day ${dayNum} (${type}) submitted successfully.` };
    }

    // Live Firebase mode
    const q = db.questions.find(question => question.day === dayNum);
    if (!q) return { success: false, message: 'Question not found.' };

    const currentSimulatedTime = new Date(db.simulatedTime);
    const eventStartDate = new Date('2026-05-25T00:00:00+05:30');
    const publishTime = new Date(eventStartDate.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000);
    const deadlineTime = new Date(publishTime.getTime() + 24 * 60 * 60 * 1000);

    let status = 'Submitted';
    if (currentSimulatedTime > deadlineTime) {
      status = 'Late';
    }

    const existing = db.submissions.find(
      s => s.userId === myUid && s.day === dayNum && s.type === type
    );

    const subDetails = {
      userId: myUid,
      questionId: q.id,
      day: dayNum,
      type,
      code,
      language,
      timestamp: currentSimulatedTime.toISOString(),
      status,
      marks: existing ? existing.marks : null,
      gradedBy: existing ? existing.gradedBy : '',
      comments: existing ? existing.comments : ''
    };

    const subId = existing ? existing.id : `sub-${myUid}-${dayNum}-${type}`;
    try {
      await addOrUpdateSubmission(subId, subDetails);
      return { success: true, status, message: `Solution for Day ${dayNum} (${type}) submitted successfully.` };
    } catch (err) {
      return { success: false, message: 'Failed to submit solution.' };
    }
  };

  const submitDebuggingChallenge = async (challengeId, link) => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const myUid = currentUser.uid || currentUser.id;

    if (isMock) {
      const challengeIndex = db.debuggingChallenges.findIndex(c => c.id === challengeId);
      if (challengeIndex === -1) return { success: false, message: 'Challenge not found.' };

      const challenge = db.debuggingChallenges[challengeIndex];
      const currentSimulatedTime = new Date(db.simulatedTime);
      const publishedTime = new Date(challenge.publishedDate);

      if (currentSimulatedTime < publishedTime) {
        return { success: false, message: 'Challenge has not started yet.' };
      }

      const updatedChallenges = [...db.debuggingChallenges];
      const existingSubIndex = challenge.submissions.findIndex(s => s.userId === myUid);

      const submissionObj = {
        userId: myUid,
        link,
        timestamp: currentSimulatedTime.toISOString(),
        score: existingSubIndex !== -1 ? challenge.submissions[existingSubIndex].score : null
      };

      const updatedSubmissions = [...challenge.submissions];
      if (existingSubIndex !== -1) {
        updatedSubmissions[existingSubIndex] = submissionObj;
      } else {
        updatedSubmissions.push(submissionObj);
      }

      updatedChallenges[challengeIndex] = {
        ...challenge,
        submissions: updatedSubmissions
      };

      let updatedDB = { ...db, debuggingChallenges: updatedChallenges };
      updatedDB = updateLeaderboardsAndStreaks(updatedDB);
      setDb(updatedDB);

      return { success: true, message: 'Debugging solution submitted successfully.' };
    }

    // Live Firebase mode
    const challenge = db.debuggingChallenges.find(c => c.id === challengeId);
    if (!challenge) return { success: false, message: 'Challenge not found.' };

    const currentSimulatedTime = new Date(db.simulatedTime);
    const publishedTime = new Date(challenge.publishedDate);

    if (currentSimulatedTime < publishedTime) {
      return { success: false, message: 'Challenge has not started yet.' };
    }

    try {
      await submitDebuggingSolution(challengeId, myUid, link, currentSimulatedTime.toISOString());
      return { success: true, message: 'Debugging solution submitted successfully.' };
    } catch (err) {
      return { success: false, message: 'Failed to submit debugging solution.' };
    }
  };

  const gradeSubmission = async (subId, marks, comments, adminId) => {
    if (isMock) {
      const subIndex = db.submissions.findIndex(s => s.id === subId);
      if (subIndex === -1) return { success: false, message: 'Submission not found.' };

      const updatedSubmissions = [...db.submissions];
      updatedSubmissions[subIndex] = {
        ...updatedSubmissions[subIndex],
        marks: Number(marks),
        comments,
        gradedBy: adminId
      };

      let updatedDB = { ...db, submissions: updatedSubmissions };
      updatedDB = updateLeaderboardsAndStreaks(updatedDB);
      setDb(updatedDB);
      return { success: true, message: 'Submission graded successfully.' };
    }

    try {
      await addOrUpdateSubmission(subId, {
        marks: Number(marks),
        comments,
        gradedBy: adminId
      });
      return { success: true, message: 'Submission graded successfully.' };
    } catch (err) {
      return { success: false, message: 'Failed to grade submission.' };
    }
  };

  const gradeDebuggingSubmission = async (challengeId, userId, score) => {
    if (isMock) {
      const challengeIndex = db.debuggingChallenges.findIndex(c => c.id === challengeId);
      if (challengeIndex === -1) return { success: false, message: 'Challenge not found.' };

      const challenge = db.debuggingChallenges[challengeIndex];
      const updatedChallenges = [...db.debuggingChallenges];
      
      const subIndex = challenge.submissions.findIndex(s => s.userId === userId);
      if (subIndex === -1) return { success: false, message: 'Submission not found.' };

      const updatedSubmissions = [...challenge.submissions];
      updatedSubmissions[subIndex] = {
        ...updatedSubmissions[subIndex],
        score: Number(score)
      };

      updatedChallenges[challengeIndex] = {
        ...challenge,
        submissions: updatedSubmissions
      };

      let updatedDB = { ...db, debuggingChallenges: updatedChallenges };
      updatedDB = updateLeaderboardsAndStreaks(updatedDB);
      setDb(updatedDB);
      return { success: true, message: 'Debugging challenge graded.' };
    }

    try {
      await gradeDebuggingSolution(challengeId, userId, score);
      return { success: true, message: 'Debugging challenge graded.' };
    } catch (err) {
      return { success: false, message: 'Failed to grade debugging challenge.' };
    }
  };

  const updateParticipantStreaks = async (userId, gitHubStreak, leetCodeStreak) => {
    if (isMock) {
      const updatedUsers = db.users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            gitHubStreak: Number(gitHubStreak),
            leetCodeStreak: Number(leetCodeStreak)
          };
         }
         return u;
      });

      let updatedDB = { ...db, users: updatedUsers };
      updatedDB = updateLeaderboardsAndStreaks(updatedDB);
      setDb(updatedDB);
      return { success: true, message: 'Streaks updated successfully.' };
    }

    try {
      await updateUserProfile(userId, {
        gitHubStreak: Number(gitHubStreak),
        leetCodeStreak: Number(leetCodeStreak)
      });
      return { success: true, message: 'Streaks updated successfully.' };
    } catch (err) {
      return { success: false, message: 'Failed to update streaks.' };
    }
  };

  const toggleUserStatus = async (userId) => {
    if (isMock) {
      const updatedUsers = db.users.map(u => {
        if (u.id === userId) {
          return { ...u, isActive: !u.isActive };
        }
        return u;
      });

      let updatedDB = { ...db, users: updatedUsers };
      setDb(updatedDB);
      return { success: true, message: 'Participant active status toggled.' };
    }

    const user = db.users.find(u => (u.uid || u.id) === userId);
    if (!user) return { success: false, message: 'User not found.' };
    try {
      await updateUserProfile(userId, {
        isActive: !user.isActive
      });
      return { success: true, message: 'Participant active status toggled.' };
    } catch (err) {
      return { success: false, message: 'Failed to toggle status.' };
    }
  };

  const uploadQuestion = async (questionData) => {
    if (isMock) {
      const newQ = {
        id: `q-${Date.now()}`,
        day: Number(questionData.day),
        titleLc: questionData.titleLc,
        linkLc: questionData.linkLc,
        descLc: questionData.descLc,
        titleCustom: questionData.titleCustom,
        descCustom: questionData.descCustom,
        difficulty: questionData.difficulty || 'Medium',
        isMaster: Number(questionData.day) >= 99,
        handout: questionData.handout || '',
        solutionCode: questionData.solutionCode || ''
      };

      let updatedQuestions = db.questions.filter(q => q.day !== newQ.day);
      updatedQuestions.push(newQ);
      updatedQuestions.sort((a, b) => a.day - b.day);

      const updatedDB = { ...db, questions: updatedQuestions };
      setDb(updatedDB);
      return { success: true, message: `Question for Day ${newQ.day} uploaded successfully.` };
    }

    try {
      await addOrUpdateQuestion(questionData.day, {
        titleLc: questionData.titleLc,
        linkLc: questionData.linkLc,
        descLc: questionData.descLc,
        titleCustom: questionData.titleCustom,
        descCustom: questionData.descCustom,
        difficulty: questionData.difficulty || 'Medium',
        isMaster: Number(questionData.day) >= 99,
        handout: questionData.handout || '',
        solutionCode: questionData.solutionCode || ''
      });
      return { success: true, message: `Question for Day ${questionData.day} uploaded successfully.` };
    } catch (err) {
      return { success: false, message: 'Failed to upload question.' };
    }
  };

  const uploadHandout = async (dayNum, handoutText) => {
    if (isMock) {
      const qIndex = db.questions.findIndex(q => q.day === Number(dayNum));
      if (qIndex === -1) return { success: false, message: 'Day question not found. Upload question first.' };

      const updatedQuestions = [...db.questions];
      updatedQuestions[qIndex] = {
        ...updatedQuestions[qIndex],
        handout: handoutText
      };

      const updatedDB = { ...db, questions: updatedQuestions };
      setDb(updatedDB);
      return { success: true, message: `Handout for Day ${dayNum} added successfully.` };
    }

    try {
      await addOrUpdateQuestion(dayNum, {
        handout: handoutText
      });
      return { success: true, message: `Handout for Day ${dayNum} added successfully.` };
    } catch (err) {
      return { success: false, message: 'Failed to upload handout.' };
    }
  };

  const setSimulatedTimeAndDay = async (newTimeIso, newDayNum) => {
    if (isMock) {
      let updatedDB = {
        ...db,
        simulatedTime: newTimeIso,
        currentDay: Number(newDayNum)
      };

      const participants = updatedDB.users.filter(u => u.role === 'participant');
      const updatedSubmissions = [...updatedDB.submissions];

      participants.forEach(p => {
        for (let d = 1; d < Number(newDayNum); d++) {
          const q = updatedDB.questions.find(question => question.day === d);
          if (!q) continue;

          const lcSub = updatedSubmissions.find(s => s.userId === p.id && s.day === d && s.type === 'leetcode');
          const customSub = updatedSubmissions.find(s => s.userId === p.id && s.day === d && s.type === 'custom');

          if (!lcSub) {
            updatedSubmissions.push({
              id: `sub-${p.id}-${d}-lc-${Date.now()}`,
              userId: p.id,
              questionId: q.id,
              day: d,
              type: 'leetcode',
               link: '',
               timestamp: '',
               status: 'Missed',
               marks: 0,
               gradedBy: '',
               comments: ''
             });
           }
           if (!customSub) {
             updatedSubmissions.push({
               id: `sub-${p.id}-${d}-custom-${Date.now()}`,
               userId: p.id,
               questionId: q.id,
               day: d,
               type: 'custom',
               link: '',
               timestamp: '',
               status: 'Missed',
               marks: 0,
               gradedBy: '',
               comments: ''
             });
           }
         }
       });

       updatedDB.submissions = updatedSubmissions;
       updatedDB = updateLeaderboardsAndStreaks(updatedDB);
       setDb(updatedDB);
       return { success: true, message: 'Simulated time-travel completed!' };
    }

    try {
      await updateSystemConfig({
        simulatedTime: newTimeIso,
        currentDay: Number(newDayNum)
      });
      return { success: true, message: 'Simulated time-travel completed!' };
    } catch (err) {
      return { success: false, message: 'Failed to warp simulated time.' };
    }
  };

  const uploadDebuggingChallenge = async (challengeData) => {
    if (isMock) {
      const newC = {
        id: `debug-${Date.now()}`,
        week: Number(challengeData.week),
        theme: challengeData.theme,
        description: challengeData.description,
        starterCode: challengeData.starterCode,
        publishedDate: challengeData.publishedDate,
        submissions: []
      };

      let updatedChallenges = db.debuggingChallenges.filter(c => c.week !== newC.week);
      updatedChallenges.push(newC);
      updatedChallenges.sort((a, b) => a.week - b.week);

      const updatedDB = { ...db, debuggingChallenges: updatedChallenges };
      setDb(updatedDB);
      return { success: true, message: `Week ${newC.week} Debugging Challenge scheduled.` };
    }

    try {
      await addOrUpdateDebuggingChallenge(challengeData.week, {
        theme: challengeData.theme,
        description: challengeData.description,
        starterCode: challengeData.starterCode,
        publishedDate: challengeData.publishedDate
      });
      return { success: true, message: `Week ${challengeData.week} Debugging Challenge scheduled.` };
    } catch (err) {
      return { success: false, message: 'Failed to schedule debugging challenge.' };
    }
  };

  return (
    <AppContext.Provider value={{
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
      uploadHandout,
      setSimulatedTimeAndDay,
      uploadDebuggingChallenge
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
