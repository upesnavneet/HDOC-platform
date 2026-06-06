import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadDB, saveDB, updateLeaderboardsAndStreaks } from './db';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [db, setDb] = useState(() => loadDB());
  const [currentUser, setCurrentUser] = useState(null);

  // Sync state to local storage when database changes
  useEffect(() => {
    saveDB(db);
  }, [db]);

  // Load user session on startup if present
  useEffect(() => {
    const sessionUser = sessionStorage.getItem('acm_100_days_session');
    if (sessionUser) {
      try {
        const parsed = JSON.parse(sessionUser);
        const freshUser = db.users.find(u => u.id === parsed.id);
        if (freshUser) {
          setCurrentUser(freshUser);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [db.users]);

  const login = (email, password) => {
    const foundUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!foundUser) {
      return { success: false, message: 'Invalid email or password.' };
    }
    if (foundUser.role === 'participant' && !foundUser.isActive) {
      return { success: false, message: 'Your account has been deactivated by the administrator.' };
    }
    setCurrentUser(foundUser);
    sessionStorage.setItem('acm_100_days_session', JSON.stringify(foundUser));
    return { success: true, user: foundUser };
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('acm_100_days_session');
  };

  const register = (name, email, password, studentId, gitHubId, leetCodeId) => {
    // Check duplicates
    const emailExists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return { success: false, message: 'Email already registered.' };
    }
    const studentIdExists = db.users.some(u => u.studentId.toUpperCase() === studentId.toUpperCase());
    if (studentIdExists) {
      return { success: false, message: 'Student ID already registered.' };
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      role: 'participant',
      studentId,
      gitHubId,
      leetCodeId,
      gitHubStreak: 0,
      leetCodeStreak: 0,
      totalCodingScore: 0,
      totalDebuggingScore: 0,
      overallRank: db.users.filter(u => u.role === 'participant').length + 1,
      isActive: true
    };

    const updatedUsers = [...db.users, newUser];
    let updatedDB = { ...db, users: updatedUsers };
    updatedDB = updateLeaderboardsAndStreaks(updatedDB);
    setDb(updatedDB);
    
    // Auto login
    setCurrentUser(newUser);
    sessionStorage.setItem('acm_100_days_session', JSON.stringify(newUser));
    return { success: true, user: newUser };
  };

  // Submit code solution for a daily question (LeetCode-style)
  const submitQuestionCode = (dayNum, type, code, language) => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const q = db.questions.find(question => question.day === dayNum);
    if (!q) return { success: false, message: 'Question not found.' };

    // Check deadlines (within 24 hours of scheduled publish date)
    // Seeding starts Day 12 at 2026-06-05T15:47:39
    // Simulated Time determines if we are late
    const currentSimulatedTime = new Date(db.simulatedTime);
    // Scheduled publication is 00:00 on the day of code
    const eventStartDate = new Date('2026-05-25T00:00:00');
    const publishTime = new Date(eventStartDate.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000);
    const deadlineTime = new Date(publishTime.getTime() + 24 * 60 * 60 * 1000);

    let status = 'Submitted';
    if (currentSimulatedTime > deadlineTime) {
      status = 'Late';
    }

    // Check if submission already exists
    const existingIndex = db.submissions.findIndex(
      s => s.userId === currentUser.id && s.day === dayNum && s.type === type
    );

    const subDetails = {
      id: existingIndex !== -1 ? db.submissions[existingIndex].id : `sub-${currentUser.id}-${dayNum}-${type}-${Date.now()}`,
      userId: currentUser.id,
      questionId: q.id,
      day: dayNum,
      type,
      code,
      language,
      timestamp: currentSimulatedTime.toISOString(),
      status,
      marks: existingIndex !== -1 ? db.submissions[existingIndex].marks : null, // keep original marks if editing
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
  };

  // Submit debugging challenge
  const submitDebuggingChallenge = (challengeId, link) => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const challengeIndex = db.debuggingChallenges.findIndex(c => c.id === challengeId);
    if (challengeIndex === -1) return { success: false, message: 'Challenge not found.' };

    const challenge = db.debuggingChallenges[challengeIndex];
    const currentSimulatedTime = new Date(db.simulatedTime);
    const publishedTime = new Date(challenge.publishedDate);

    if (currentSimulatedTime < publishedTime) {
      return { success: false, message: 'Challenge has not started yet.' };
    }

    // Add or update debugging submission
    const updatedChallenges = [...db.debuggingChallenges];
    const existingSubIndex = challenge.submissions.findIndex(s => s.userId === currentUser.id);

    const submissionObj = {
      userId: currentUser.id,
      link,
      timestamp: currentSimulatedTime.toISOString(),
      score: existingSubIndex !== -1 ? challenge.submissions[existingSubIndex].score : null // Keep score if edit
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
  };

  // Admin Actions
  const gradeSubmission = (subId, marks, comments, adminId) => {
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
  };

  const gradeDebuggingSubmission = (challengeId, userId, score) => {
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
  };

  const updateParticipantStreaks = (userId, gitHubStreak, leetCodeStreak) => {
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
  };

  const toggleUserStatus = (userId) => {
    const updatedUsers = db.users.map(u => {
      if (u.id === userId) {
        return { ...u, isActive: !u.isActive };
      }
      return u;
    });

    let updatedDB = { ...db, users: updatedUsers };
    setDb(updatedDB);
    return { success: true, message: 'Participant active status toggled.' };
  };

  const uploadQuestion = (questionData) => {
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

    // Replace if same day
    let updatedQuestions = db.questions.filter(q => q.day !== newQ.day);
    updatedQuestions.push(newQ);
    updatedQuestions.sort((a, b) => a.day - b.day);

    const updatedDB = { ...db, questions: updatedQuestions };
    setDb(updatedDB);
    return { success: true, message: `Question for Day ${newQ.day} uploaded successfully.` };
  };

  const uploadHandout = (dayNum, handoutText) => {
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
  };

  // Simulated Time & Day control (Date Traveler)
  const setSimulatedTimeAndDay = (newTimeIso, newDayNum) => {
    let updatedDB = {
      ...db,
      simulatedTime: newTimeIso,
      currentDay: Number(newDayNum)
    };

    // Calculate broken streaks based on new simulated day
    // A participant misses if day < currentDay and they don't have submissions.
    // If they missed, mark submissions as missed and update streaks.
    const participants = updatedDB.users.filter(u => u.role === 'participant');
    const updatedSubmissions = [...updatedDB.submissions];

    participants.forEach(p => {
      for (let d = 1; d < Number(newDayNum); d++) {
        const q = updatedDB.questions.find(question => question.day === d);
        if (!q) continue;

        // Check if submissions exist for this day
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
  };

  const uploadDebuggingChallenge = (challengeData) => {
    const newC = {
      id: `debug-${Date.now()}`,
      week: Number(challengeData.week),
      theme: challengeData.theme,
      description: challengeData.description,
      starterCode: challengeData.starterCode,
      publishedDate: challengeData.publishedDate, // ISO String
      submissions: []
    };

    let updatedChallenges = db.debuggingChallenges.filter(c => c.week !== newC.week);
    updatedChallenges.push(newC);
    updatedChallenges.sort((a, b) => a.week - b.week);

    const updatedDB = { ...db, debuggingChallenges: updatedChallenges };
    setDb(updatedDB);
    return { success: true, message: `Week ${newC.week} Debugging Challenge scheduled.` };
  };

  return (
    <AppContext.Provider value={{
      db,
      currentUser,
      login,
      logout,
      register,
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
