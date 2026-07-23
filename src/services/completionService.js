// @ts-che
import { db } from '../firebaseConfig';
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { log, error as logError } from '../utils/logger';

/**
 * @typedef {Object} Submission
 * @property {string} id
 * @property {string} userId
 * @property {string} questionId
 * @property {number} day
 * @property {string} type - 'leetcode' | 'custom' | 'commit'
 * @property {string} [code]
 * @property {string} [link]
 * @property {string} [language]
 * @property {string} timestamp
 * @property {string} status - 'Submitted' | 'Late'
 * @property {number|null} marks
 * @property {string} gradedBy
 * @property {string} comments
 */

/**
 * @typedef {Object} DebuggingChallenge
 * @property {string} id
 * @property {number} week
 * @property {string} title
 * @property {string} description
 * @property {string} publishedDate
 * @property {Array<{userId: string, link: string, timestamp: string, score: number|null}>} submissions
 */

/**
 * @typedef {Object} SystemConfig
 * @property {number} currentDay
 * @property {string} simulatedTime
 * @property {number[]} completedWeeks
 * @property {Date} [lastDayAdvanceTime]
 */

const SUBMISSIONS_COLLECTION = 'submissions';
const DEBUGGING_CHALLENGES_COLLECTION = 'debuggingChallenges';
const DEBUGGING_SUBMISSIONS_COLLECTION = 'debuggingSubmissions';
const SYSTEM_COLLECTION = 'system';
const CONFIG_DOC = 'config';

// --- Daily Challenges Submissions ---
export const addOrUpdateSubmission = async (subId, subData) => {
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, subId);
    const fullData = { id: subId, ...subData };
    await setDoc(docRef, fullData, { merge: true });
    return fullData;
  } catch (error) {
    logError('Error adding/updating submission:', error);
    throw error;
  }
};

export const subscribeToSubmissions = (callback, onError) => {
  const colRef = collection(db, SUBMISSIONS_COLLECTION);
  return onSnapshot(
    colRef,
    (querySnapshot) => {
      const subs = [];
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() });
      });
      callback(subs);
    },
    (error) => {
      logError('Error subscribing to submissions:', error);
      onError?.(error);
    }
  );
};

// H3: User-scoped subscription — reads only this user's submissions.
export const subscribeToUserSubmissions = (userId, callback, onError) => {
  const q = query(collection(db, SUBMISSIONS_COLLECTION), where('userId', '==', userId));
  return onSnapshot(
    q,
    (querySnapshot) => {
      const subs = [];
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() });
      });
      callback(subs);
    },
    (error) => {
      logError('Error subscribing to user submissions:', error);
      onError?.(error);
    }
  );
};

// --- Sunday Debugging Challenges ---
export const getDebuggingChallenges = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, DEBUGGING_CHALLENGES_COLLECTION));
    const challenges = [];
    querySnapshot.forEach((doc) => {
      challenges.push({ id: doc.id, ...doc.data() });
    });
    return challenges.sort((a, b) => a.week - b.week);
  } catch (error) {
    logError('Error fetching debugging challenges:', error);
    throw error;
  }
};

export const addOrUpdateDebuggingChallenge = async (weekNum, challengeData) => {
  try {
    const docId = `week-${weekNum}`;
    const docRef = doc(db, DEBUGGING_CHALLENGES_COLLECTION, docId);
    const fullData = {
      id: docId,
      week: Number(weekNum),
      ...challengeData,
    };
    await setDoc(docRef, fullData, { merge: true });
    return fullData;
  } catch (error) {
    logError('Error adding/updating debugging challenge:', error);
    throw error;
  }
};

export const subscribeToDebuggingChallenges = (callback, onError) => {
  const colRef = collection(db, DEBUGGING_CHALLENGES_COLLECTION);
  return onSnapshot(
    colRef,
    (querySnapshot) => {
      const challenges = [];
      querySnapshot.forEach((doc) => {
        challenges.push({ id: doc.id, ...doc.data() });
      });
      challenges.sort((a, b) => a.week - b.week);
      callback(challenges);
    },
    (error) => {
      logError('Error subscribing to debugging challenges:', error);
      onError?.(error);
    }
  );
};

// --- Sunday Debugging Submissions ---
export const submitDebuggingSolution = async (challengeId, userId, link, timestamp) => {
  try {
    const docId = `debug-sub-${challengeId}-${userId}`;
    const docRef = doc(db, DEBUGGING_SUBMISSIONS_COLLECTION, docId);
    const fullData = {
      id: docId,
      challengeId,
      userId,
      link,
      timestamp,
      score: null, // Initial score pending
    };
    await setDoc(docRef, fullData, { merge: true });
    return fullData;
  } catch (error) {
    logError('Error submitting debugging solution:', error);
    throw error;
  }
};

export const gradeDebuggingSolution = async (challengeId, userId, score, gradedAt) => {
  try {
    const docId = `debug-sub-${challengeId}-${userId}`;
    const docRef = doc(db, DEBUGGING_SUBMISSIONS_COLLECTION, docId);
    await updateDoc(docRef, {
      score: Number(score),
      gradedAt: gradedAt || new Date().toISOString(),
    });
  } catch (error) {
    logError('Error grading debugging solution:', error);
    throw error;
  }
};

export const subscribeToDebuggingSubmissions = (callback, onError) => {
  const colRef = collection(db, DEBUGGING_SUBMISSIONS_COLLECTION);
  return onSnapshot(
    colRef,
    (querySnapshot) => {
      const subs = [];
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() });
      });
      callback(subs);
    },
    (error) => {
      logError('Error subscribing to debugging submissions:', error);
      onError?.(error);
    }
  );
};

export const subscribeToUserDebuggingSubmissions = (userId, callback, onError) => {
  const q = query(collection(db, DEBUGGING_SUBMISSIONS_COLLECTION), where('userId', '==', userId));
  return onSnapshot(
    q,
    (querySnapshot) => {
      const subs = [];
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() });
      });
      callback(subs);
    },
    (error) => {
      logError('Error subscribing to user debugging submissions:', error);
      onError?.(error);
    }
  );
};

// --- System Configuration (Time Travel Clock) ---
export const getSystemConfig = async () => {
  try {
    const docRef = doc(db, SYSTEM_COLLECTION, CONFIG_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    logError('Error fetching system config:', error);
    throw error;
  }
};

export const updateSystemConfig = async (configData) => {
  try {
    const docRef = doc(db, SYSTEM_COLLECTION, CONFIG_DOC);
    await setDoc(docRef, configData, { merge: true });
  } catch (error) {
    logError('Error updating system config:', error);
    throw error;
  }
};


export const subscribeToSystemConfig = (callback, onError) => {
  const docRef = doc(db, SYSTEM_COLLECTION, CONFIG_DOC);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        callback(null);
      }
    },
    (error) => {
      logError('Error subscribing to system config:', error);
      onError?.(error);
    }
  );
};
